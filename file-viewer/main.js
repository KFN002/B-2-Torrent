const { app, BrowserWindow, Menu, dialog, ipcMain, session, shell, protocol } = require("electron")
const crypto = require("crypto")
const fs = require("fs")
const fsp = fs.promises
const os = require("os")
const path = require("path")

app.commandLine.appendSwitch("disable-http-cache")
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache")
app.commandLine.appendSwitch("disable-application-cache")
app.commandLine.appendSwitch("disk-cache-size", "0")
app.commandLine.appendSwitch("media-cache-size", "0")
app.commandLine.appendSwitch("disable-background-networking")
app.commandLine.appendSwitch("disable-breakpad")
app.commandLine.appendSwitch("disable-component-update")
app.commandLine.appendSwitch("disable-domain-reliability")
app.commandLine.appendSwitch("disable-sync")
app.commandLine.appendSwitch("no-pings")
app.commandLine.appendSwitch("no-referrers")
app.commandLine.appendSwitch("disable-logging")
app.commandLine.appendSwitch("log-level", "3")
app.commandLine.appendSwitch("disable-crashreporter")
app.commandLine.appendSwitch("autoplay-policy", "user-gesture-required")

const PREVIEW_BYTES = 128 * 1024
const HEX_BYTES = 1024
const DELETE_CONFIRMATION_MAX_PASSES = 35

protocol.registerSchemesAsPrivileged([
  {
    scheme: "b2safe-file",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
])

let mainWindow
const knownFiles = new Map()
const previewTokensByPath = new Map()
const previewFilesByToken = new Map()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    backgroundColor: "#090b0f",
    title: "B2 Safe File Viewer",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged,
    },
  })

  Menu.setApplicationMenu(null)
  mainWindow.loadFile("index.html")
}

async function configureSession() {
  const defaultSession = session.defaultSession
  defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Cache-Control": ["no-store"],
        "Content-Security-Policy": [
          "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' b2safe-file: data: blob:; media-src 'self' b2safe-file: data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        ],
        "Permissions-Policy": ["camera=(), microphone=(), geolocation=(), usb=(), payment=()"],
        "Referrer-Policy": ["no-referrer"],
        "X-Content-Type-Options": ["nosniff"],
        "X-Frame-Options": ["DENY"],
      },
    })
  })
  await defaultSession.clearStorageData()
  await defaultSession.clearCache()
}

function configurePreviewProtocol() {
  protocol.registerFileProtocol("b2safe-file", (request, callback) => {
    try {
      const parsed = new URL(request.url)
      const token = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))
      const safePath = previewFilesByToken.get(token)
      if (!safePath || !knownFiles.has(safePath)) {
        callback({ error: -6 })
        return
      }
      callback({ path: safePath })
    } catch {
      callback({ error: -2 })
    }
  })
}

app.whenReady().then(async () => {
  configurePreviewProtocol()
  await configureSession()
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", async () => {
  await session.defaultSession.clearStorageData().catch(() => {})
  await session.defaultSession.clearCache().catch(() => {})
  if (process.platform !== "darwin") {
    app.quit()
  }
})

ipcMain.handle("app:info", () => ({
  platform: process.platform,
  arch: process.arch,
  electron: process.versions.electron,
  node: process.versions.node,
  home: os.homedir(),
}))

ipcMain.handle("files:open", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Open files safely",
    properties: ["openFile", "multiSelections"],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  return analyzeFiles(result.filePaths)
})

ipcMain.handle("files:reveal", async (_event, filePath) => {
  const safePath = await resolveKnownFile(filePath)
  shell.showItemInFolder(safePath)
  return { ok: true }
})

ipcMain.handle("files:forget", async (_event, filePath) => {
  const safePath = await resolveKnownFile(filePath)
  forgetKnownFile(safePath)
  return { ok: true, path: safePath }
})

ipcMain.handle("files:delete", async (_event, payload) => {
  const safePath = await resolveKnownFile(payload?.filePath)
  const fileName = path.basename(safePath)
  const confirmation = String(payload?.confirmation || "")

  if (confirmation !== fileName) {
    throw new Error("Deletion confirmation must exactly match the file name")
  }

  const mode = payload?.mode === "overwrite" ? "overwrite" : "trash"
  const passes = clampInt(payload?.passes, 3, 1, DELETE_CONFIRMATION_MAX_PASSES)
  const stat = await fsp.stat(safePath)
  if (!stat.isFile()) {
    throw new Error("Only regular files can be deleted")
  }

  if (mode === "trash") {
    await shell.trashItem(safePath)
  } else {
    await overwriteAndUnlink(safePath, passes)
  }

  forgetKnownFile(safePath)
  return { ok: true, path: safePath, mode, passes }
})

async function analyzeFiles(filePaths) {
  const results = []
  for (const filePath of filePaths) {
    try {
      results.push(await analyzeFile(filePath))
    } catch (error) {
      results.push({
        path: filePath,
        name: path.basename(filePath),
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return results
}

async function analyzeFile(filePath) {
  const realPath = await fsp.realpath(filePath)
  const stat = await fsp.stat(realPath)
  if (!stat.isFile()) {
    throw new Error("Only regular files can be opened")
  }

  knownFiles.set(realPath, true)
  const sample = await readSample(realPath, PREVIEW_BYTES)
  const signature = detectSignature(sample)
  const extension = path.extname(realPath).toLowerCase()
  const group = classifyFile(signature, extension, sample)
  const mimeType = detectMimeType(signature, extension, group)
  const sha256 = await sha256File(realPath)
  const entropy = calculateEntropy(sample)
  const warnings = buildWarnings({ realPath, signature, extension, sample, entropy })
  const risk = scoreFileRisk({ signature, extension, group, warnings, entropy })

  return {
    path: realPath,
    name: path.basename(realPath),
    directory: path.dirname(realPath),
    extension: extension || "(none)",
    size: stat.size,
    modified: stat.mtime.toISOString(),
    mode: stat.mode.toString(8),
    sha256,
    signature,
    mimeType,
    group,
    entropy: Number(entropy.toFixed(3)),
    riskScore: risk.score,
    riskLevel: risk.level,
    warnings,
    previewUrl: previewUrlForPath(realPath),
    textPreview: group === "text" ? decodeTextPreview(sample) : "",
    hexPreview: toHexDump(sample.subarray(0, HEX_BYTES)),
  }
}

async function resolveKnownFile(filePath) {
  if (typeof filePath !== "string" || filePath.trim() === "") {
    throw new Error("File path is required")
  }
  const realPath = await fsp.realpath(filePath)
  if (!knownFiles.has(realPath)) {
    throw new Error("File must be opened in this session before file operations are allowed")
  }
  return realPath
}

function previewUrlForPath(realPath) {
  let token = previewTokensByPath.get(realPath)
  if (!token) {
    token = crypto.randomUUID()
    previewTokensByPath.set(realPath, token)
    previewFilesByToken.set(token, realPath)
  }
  return `b2safe-file://preview/${encodeURIComponent(token)}`
}

function forgetKnownFile(realPath) {
  knownFiles.delete(realPath)
  const token = previewTokensByPath.get(realPath)
  if (token) {
    previewFilesByToken.delete(token)
    previewTokensByPath.delete(realPath)
  }
}

async function readSample(filePath, maxBytes) {
  const handle = await fsp.open(filePath, "r")
  try {
    const stat = await handle.stat()
    const length = Math.min(stat.size, maxBytes)
    const buffer = Buffer.alloc(length)
    if (length > 0) {
      await handle.read(buffer, 0, length, 0)
    }
    return buffer
  } finally {
    await handle.close()
  }
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256")
    const stream = fs.createReadStream(filePath)
    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(hash.digest("hex")))
  })
}

function detectSignature(buffer) {
  const hex = buffer.subarray(0, 16).toString("hex")
  if (hex.startsWith("89504e470d0a1a0a")) return "PNG image"
  if (hex.startsWith("ffd8ff")) return "JPEG image"
  if (hex.startsWith("474946383761") || hex.startsWith("474946383961")) return "GIF image"
  if (hex.startsWith("25504446")) return "PDF document"
  if (hex.startsWith("504b0304")) return "ZIP archive"
  if (hex.startsWith("377abcaf271c")) return "7-Zip archive"
  if (hex.startsWith("526172211a0700")) return "RAR archive"
  if (hex.startsWith("1f8b08")) return "Gzip archive"
  if (hex.startsWith("4d5a")) return "Windows executable"
  if (hex.startsWith("7f454c46")) return "Linux ELF executable"
  if (hex.startsWith("cafebabe")) return "Java class or Mach-O universal binary"
  if (hex.startsWith("feedface") || hex.startsWith("feedfacf") || hex.startsWith("cffaedfe")) return "Mach-O binary"
  if (hex.startsWith("000001ba") || hex.startsWith("000001b3")) return "MPEG video"
  if (hex.startsWith("0000001866747970") || hex.startsWith("0000002066747970")) return "MP4 video"
  if (hex.startsWith("494433") || hex.startsWith("fff3") || hex.startsWith("fff2") || hex.startsWith("fffb")) return "MP3 audio"
  if (hex.startsWith("4f676753")) return "Ogg media"
  if (hex.startsWith("52494646") && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "WebP image"
  if (hex.startsWith("52494646") && buffer.subarray(8, 12).toString("ascii") === "WAVE") return "WAV audio"
  if (buffer.subarray(0, 15).toString("ascii") === "SQLite format 3") return "SQLite database"
  return "Unknown"
}

function classifyFile(signature, extension, sample) {
  if (signature.includes("image") && extension !== ".svg") return "image"
  if (signature.includes("video")) return "video"
  if (signature.includes("audio")) return "audio"
  if (signature.includes("PDF")) return "document"
  if (signature.includes("archive")) return "archive"
  if (signature.includes("executable") || signature.includes("ELF") || signature.includes("Mach-O")) return "executable"
  if (isLikelyText(sample, extension)) return "text"
  return "binary"
}

function detectMimeType(signature, extension, group) {
  const bySignature = {
    "PNG image": "image/png",
    "JPEG image": "image/jpeg",
    "GIF image": "image/gif",
    "PDF document": "application/pdf",
    "ZIP archive": "application/zip",
    "7-Zip archive": "application/x-7z-compressed",
    "RAR archive": "application/vnd.rar",
    "Gzip archive": "application/gzip",
    "MP4 video": "video/mp4",
    "MPEG video": "video/mpeg",
    "MP3 audio": "audio/mpeg",
    "Ogg media": "application/ogg",
    "WebP image": "image/webp",
    "WAV audio": "audio/wav",
    "SQLite database": "application/vnd.sqlite3",
  }
  if (bySignature[signature]) return bySignature[signature]
  if (extension === ".svg") return "image/svg+xml"
  if (extension === ".html" || extension === ".htm") return "text/html"
  if (extension === ".json") return "application/json"
  if (group === "text") return "text/plain"
  return "application/octet-stream"
}

function isLikelyText(buffer, extension) {
  const textExtensions = new Set([
    ".txt",
    ".md",
    ".json",
    ".csv",
    ".tsv",
    ".log",
    ".xml",
    ".html",
    ".css",
    ".js",
    ".mjs",
    ".ts",
    ".tsx",
    ".jsx",
    ".go",
    ".rs",
    ".py",
    ".sh",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".conf",
    ".service",
    ".desktop",
    ".svg",
  ])
  if (textExtensions.has(extension)) return true
  if (buffer.length === 0) return true

  let control = 0
  let nul = 0
  for (const byte of buffer) {
    if (byte === 0) nul += 1
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) control += 1
  }
  return nul === 0 && control / buffer.length < 0.02
}

function decodeTextPreview(buffer) {
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer).replace(/\u0000/g, "\uFFFD")
}

function calculateEntropy(buffer) {
  if (buffer.length === 0) return 0
  const counts = new Array(256).fill(0)
  for (const byte of buffer) counts[byte] += 1
  return counts.reduce((entropy, count) => {
    if (count === 0) return entropy
    const p = count / buffer.length
    return entropy - p * Math.log2(p)
  }, 0)
}

function buildWarnings({ realPath, signature, extension, sample, entropy }) {
  const warnings = []
  const name = path.basename(realPath)
  const lowerName = name.toLowerCase()
  const riskyExtensions = new Set([
    ".appimage",
    ".apk",
    ".bat",
    ".bin",
    ".cmd",
    ".com",
    ".deb",
    ".dll",
    ".dmg",
    ".elf",
    ".exe",
    ".jar",
    ".js",
    ".mjs",
    ".pkg",
    ".ps1",
    ".rpm",
    ".scr",
    ".sh",
    ".so",
    ".vbs",
  ])

  if (riskyExtensions.has(extension)) {
    warnings.push("Executable or installer-style extension")
  }
  if (/\.[a-z0-9]{2,5}\.[a-z0-9]{2,5}$/i.test(lowerName)) {
    warnings.push("Double extension")
  }
  if (signature.includes("executable") || signature.includes("ELF") || signature.includes("Mach-O")) {
    warnings.push(`Executable file signature: ${signature}`)
  }
  if (extension === ".svg" || extension === ".html" || extension === ".htm") {
    warnings.push("Active document type is shown as text only")
  }
  if (signature === "Unknown" && sample.length > 0) {
    warnings.push("Unknown file signature")
  }
  if (entropy > 7.5 && sample.length > 4096) {
    warnings.push("High entropy; file may be compressed, encrypted, or packed")
  }
  return warnings
}

function scoreFileRisk({ signature, extension, group, warnings, entropy }) {
  let score = 0

  if (group === "executable") score += 85
  if (group === "archive") score += 25
  if (signature === "Unknown") score += 18
  if (entropy > 7.5) score += 15
  if (extension === ".svg" || extension === ".html" || extension === ".htm") score += 30

  for (const warning of warnings) {
    if (warning.includes("Executable")) score += 35
    else if (warning.includes("Double extension")) score += 25
    else if (warning.includes("High entropy")) score += 12
    else score += 8
  }

  score = Math.min(100, score)
  const level = score >= 75 ? "high" : score >= 40 ? "medium" : score >= 15 ? "low" : "minimal"
  return { score, level }
}

function toHexDump(buffer) {
  const rows = []
  for (let offset = 0; offset < buffer.length; offset += 16) {
    const row = buffer.subarray(offset, offset + 16)
    const address = offset.toString(16).padStart(8, "0")
    const hex = Array.from(row)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(47, " ")
    const ascii = Array.from(row)
      .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
      .join("")
    rows.push(`${address}  ${hex}  ${ascii}`)
  }
  return rows.join("\n")
}

async function overwriteAndUnlink(filePath, passes) {
  const stat = await fsp.stat(filePath)
  if (!stat.isFile()) {
    throw new Error("Only regular files can be overwritten")
  }

  const handle = await fsp.open(filePath, "r+")
  let closed = false

  try {
    const fileSize = stat.size
    const chunkSize = Math.max(1, Math.min(1024 * 1024, fileSize || 1))
    const buffer = Buffer.allocUnsafe(chunkSize)

    for (let pass = 0; pass < passes; pass += 1) {
      let written = 0
      while (written < fileSize) {
        const toWrite = Math.min(chunkSize, fileSize - written)
        crypto.randomFillSync(buffer, 0, toWrite)
        const result = await handle.write(buffer, 0, toWrite, written)
        if (result.bytesWritten === 0) {
          throw new Error("Overwrite stopped before all bytes were written")
        }
        written += result.bytesWritten
      }
      await handle.sync()
    }

    await handle.close()
    closed = true
    await fsp.unlink(filePath)
    await syncParentDirectory(filePath)
  } finally {
    if (!closed) {
      await handle.close().catch(() => {})
    }
  }
}

async function syncParentDirectory(filePath) {
  if (process.platform === "win32") return
  const dir = await fsp.open(path.dirname(filePath), "r")
  try {
    await dir.sync()
  } finally {
    await dir.close()
  }
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}
