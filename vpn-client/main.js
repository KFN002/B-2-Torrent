const { app, BrowserWindow, ipcMain, Menu, Tray, session, safeStorage } = require("electron")
const path = require("path")
const fs = require("fs")
const os = require("os")
const tls = require("tls")
const { execFile, spawn } = require("child_process")
const http = require("http")
const net = require("net")
const socks = require("socks")

const LOCAL_PROXY_HOST = "127.0.0.1"
const SUPPORTED_TYPES = new Set(["vless", "vmess", "shadowsocks", "outline", "tor", "socks5", "http", "https"])
const PROXY_MODE_TYPES = new Set(["tor", "socks5", "http", "https"])
const ENCRYPTED_ENGINE_TYPES = new Set(["vless", "vmess", "shadowsocks", "outline"])
const PRIVATE_HOSTS = new Set(["localhost", "localhost.localdomain", "0.0.0.0"])
const SECRET_FIELDS_BY_TYPE = {
  vless: ["uuid"],
  vmess: ["uuid"],
  shadowsocks: ["password", "uuid", "method"],
  outline: ["password", "uuid", "method"],
  socks5: ["username", "password"],
  http: ["username", "password"],
  https: ["username", "password"],
  tor: ["username", "password"],
}
const SECRET_PARAM_KEYS = new Set(["password", "pass", "key", "secret", "token", "uuid", "id"])
const STRONG_SHADOWSOCKS_METHODS = new Set(["2022-blake3-aes-256-gcm", "2022-blake3-chacha20-poly1305", "aes-256-gcm", "chacha20-ietf-poly1305", "xchacha20-ietf-poly1305"])
const TLS_MIN_VERSIONS = new Set(["TLSv1.2", "TLSv1.3"])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_CLI_CONFIG_BYTES = 128 * 1024

for (const [name, value] of [
  ["disable-background-networking"],
  ["disable-breakpad"],
  ["disable-component-update"],
  ["disable-crash-reporter"],
  ["disable-domain-reliability"],
  ["disable-logging"],
  ["disable-sync"],
  ["log-level", "3"],
]) {
  if (value === undefined) app.commandLine.appendSwitch(name)
  else app.commandLine.appendSwitch(name, value)
}

const DEFAULT_SETTINGS = {
  connectionMode: "proxy",
  localPort: 8888,
  allowLan: false,
  networkService: "Wi-Fi",
  killSwitchMode: "system-proxy",
  dnsProtection: true,
  dnsServers: ["1.1.1.1", "1.0.0.1"],
  ipv6Mode: "privacy",
  autoReconnect: true,
  maxReconnectAttempts: 3,
  healthCheckInterval: 10,
  connectTimeout: 5,
  blockPrivateDestinations: true,
  allowInsecureTransport: false,
  tlsMinVersion: "TLSv1.3",
  saveSecrets: false,
  minimizeLogs: true,
  tun: {
    helper: "sing-box",
    helperPath: "",
    interfaceName: "b2tun0",
    address: "172.19.0.2/30",
    mtu: 9000,
    stack: "system",
    autoRoute: true,
    strictRoute: true,
    customArgs: "",
  },
}

let mainWindow
let tray
let proxyServer
let socksServer
let store
let settings = structuredClone(DEFAULT_SETTINGS)
let activeConfig = null
let connectionMonitor = null
let tunProcess = null
let tunConfigPath = null
let stoppingTun = false

let transferStats = createEmptyTransferStats()
let connectionStatus = createDisconnectedStatus()

function createEmptyTransferStats() {
  return {
    up: 0,
    down: 0,
    lastUp: 0,
    lastDown: 0,
    speedUp: 0,
    speedDown: 0,
    activeConnections: 0,
    startedAt: null,
    lastSampleAt: Date.now(),
  }
}

function createDisconnectedStatus(lastError = null) {
  return {
    connected: false,
    connecting: false,
    mode: settings.connectionMode,
    type: null,
    server: null,
    ip: "Not routed",
    localProxy: null,
    tun: { active: false, helper: settings.tun.helper, interfaceName: settings.tun.interfaceName },
    speed: { down: 0, up: 0 },
    bytesTransferred: { down: 0, up: 0 },
    activeConnections: 0,
    connectedAt: null,
    reconnectAttempts: 0,
    health: { reachable: false, latencyMs: null, lastCheckedAt: null },
    killSwitchActive: false,
    lastError,
  }
}

function deepMerge(base, incoming) {
  const output = { ...base }
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object") {
      output[key] = deepMerge(base[key], value)
    } else if (value !== undefined) {
      output[key] = value
    }
  }
  return output
}

async function initializeStorage() {
  if (store) return

  const { default: Store } = await import("electron-store")
  store = new Store({
    name: "b2-vpn-config",
    clearInvalidConfig: true,
    encryptionKey: process.env.B2_VPN_STORE_KEY || "b2-vpn-local-config-v1",
  })
  settings = normalizeSettings(store.get("settings", DEFAULT_SETTINGS))
  connectionStatus = createDisconnectedStatus()
}

function normalizePort(value, fallback) {
  const port = Number.parseInt(value ?? fallback, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid port")
  }
  return port
}

function sanitizeToken(value, fallback = "") {
  return String(value ?? fallback)
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, "")
}

function sanitizeNetworkService(value) {
  return sanitizeToken(value, "Wi-Fi").replace(/[^\w .-]/g, "") || "Wi-Fi"
}

function normalizeDnsServers(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[\n,]/)
  const normalized = list
    .map((server) => sanitizeToken(server))
    .filter(Boolean)
    .filter((server) => net.isIP(server) || /^[a-zA-Z0-9.-]{1,253}$/.test(server))
    .slice(0, 4)

  return normalized.length > 0 ? normalized : [...DEFAULT_SETTINGS.dnsServers]
}

function normalizeMode(value) {
  return value === "tun" ? "tun" : "proxy"
}

function normalizeTlsMinVersion(value) {
  return TLS_MIN_VERSIONS.has(value) ? value : DEFAULT_SETTINGS.tlsMinVersion
}

function normalizeSettings(input = {}) {
  const merged = deepMerge(DEFAULT_SETTINGS, input)
  const localPort = normalizePort(merged.localPort, DEFAULT_SETTINGS.localPort)
  const mtu = Number.parseInt(merged.tun.mtu, 10)

  return {
    ...merged,
    connectionMode: normalizeMode(merged.connectionMode),
    localPort,
    allowLan: merged.allowLan === true,
    networkService: sanitizeNetworkService(merged.networkService),
    killSwitchMode: ["off", "app", "system-proxy"].includes(merged.killSwitchMode) ? merged.killSwitchMode : "system-proxy",
    dnsProtection: merged.dnsProtection !== false,
    dnsServers: normalizeDnsServers(merged.dnsServers),
    ipv6Mode: ["unchanged", "privacy", "off"].includes(merged.ipv6Mode) ? merged.ipv6Mode : "privacy",
    autoReconnect: merged.autoReconnect !== false,
    maxReconnectAttempts: Math.min(Math.max(Number.parseInt(merged.maxReconnectAttempts, 10) || 0, 0), 10),
    healthCheckInterval: Math.min(Math.max(Number.parseInt(merged.healthCheckInterval, 10) || 10, 3), 120),
    connectTimeout: Math.min(Math.max(Number.parseInt(merged.connectTimeout, 10) || 5, 2), 60),
    blockPrivateDestinations: merged.blockPrivateDestinations !== false,
    allowInsecureTransport: merged.allowInsecureTransport === true,
    tlsMinVersion: normalizeTlsMinVersion(merged.tlsMinVersion),
    saveSecrets: merged.saveSecrets === true,
    minimizeLogs: merged.minimizeLogs !== false,
    tun: {
      helper: ["sing-box", "custom"].includes(merged.tun.helper) ? merged.tun.helper : "sing-box",
      helperPath: sanitizeToken(merged.tun.helperPath),
      interfaceName: sanitizeToken(merged.tun.interfaceName, "b2tun0").replace(/[^\w.-]/g, "") || "b2tun0",
      address: sanitizeToken(merged.tun.address, DEFAULT_SETTINGS.tun.address),
      mtu: Number.isInteger(mtu) && mtu >= 1280 && mtu <= 65535 ? mtu : DEFAULT_SETTINGS.tun.mtu,
      stack: ["system", "gvisor", "mixed"].includes(merged.tun.stack) ? merged.tun.stack : "system",
      autoRoute: merged.tun.autoRoute !== false,
      strictRoute: merged.tun.strictRoute !== false,
      customArgs: sanitizeToken(merged.tun.customArgs),
    },
  }
}

function normalizeConfig(config = {}) {
  const type = String(config.type || "").toLowerCase()
  if (!SUPPORTED_TYPES.has(type)) throw new Error("Unsupported VPN/proxy type")

  const hostFallback = type === "tor" ? LOCAL_PROXY_HOST : ""
  const host = sanitizeToken(config.host || hostFallback)
  if (!host || host.length > 253 || /[\s"'`;&|<>$\\]/.test(host)) {
    throw new Error("Invalid server host")
  }

  const mode = normalizeMode(config.mode || settings.connectionMode)
  if (mode === "proxy" && !PROXY_MODE_TYPES.has(type)) {
    throw new Error("Proxy mode supports SOCKS5, HTTP(S), and Tor proxy endpoints. Use TUN mode with a configured engine for VLESS, VMess, Shadowsocks, or Outline.")
  }

  const port = normalizePort(config.port, type === "tor" ? 9050 : 443)
  const localPort = normalizePort(config.localPort || settings.localPort, settings.localPort)

  if (localPort >= 65535) {
    throw new Error("Local port must leave room for SOCKS on the next port")
  }

  const normalized = {
    name: sanitizeToken(config.name || `${type.toUpperCase()} ${host}`),
    mode,
    type,
    host,
    port,
    localPort,
    allowLan: config.allowLan === true || settings.allowLan === true,
    uuid: sanitizeToken(config.uuid),
    username: sanitizeToken(config.username),
    password: sanitizeToken(config.password),
    method: sanitizeToken(config.method || "2022-blake3-aes-256-gcm"),
    sni: sanitizeToken(config.sni || config.params?.sni || config.params?.peer || host),
    tls: config.tls !== false && (config.tls === true || config.params?.security === "tls" || type === "vless"),
    params: config.params && typeof config.params === "object" ? config.params : {},
  }

  if ((type === "vless" || type === "vmess") && normalized.uuid && !UUID_PATTERN.test(normalized.uuid)) {
    throw new Error(`${type.toUpperCase()} requires a valid UUID`)
  }
  if (type === "vless" && !normalized.tls && !settings.allowInsecureTransport) {
    throw new Error("VLESS without TLS is blocked. Enable insecure transports only for controlled testing.")
  }
  if (type === "vmess" && String(normalized.params.security || "auto").toLowerCase() === "none" && !settings.allowInsecureTransport) {
    throw new Error("VMess security=none is blocked. Enable insecure transports only for controlled testing.")
  }
  if (type === "http" && !settings.allowInsecureTransport) {
    throw new Error("Plain HTTP proxy upstreams are blocked by default. Use HTTPS/SOCKS5/Tor or enable insecure transports for testing.")
  }
  if ((type === "shadowsocks" || type === "outline") && normalized.method && !STRONG_SHADOWSOCKS_METHODS.has(normalized.method.toLowerCase())) {
    throw new Error(`Weak Shadowsocks method blocked. Use one of: ${Array.from(STRONG_SHADOWSOCKS_METHODS).join(", ")}`)
  }

  return normalized
}

function sanitizeParamsForStorage(params = {}) {
  if (!params || typeof params !== "object") return {}
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key]) => !SECRET_PARAM_KEYS.has(String(key).toLowerCase()))
      .map(([key, value]) => [sanitizeToken(key).slice(0, 80), typeof value === "string" ? sanitizeToken(value).slice(0, 512) : value]),
  )
}

function ensureSecretStorageAvailable() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("OS secret storage is not available. Disable secret saving or unlock the OS keychain/keyring.")
  }
}

function encryptSecret(value) {
  ensureSecretStorageAvailable()
  return safeStorage.encryptString(value).toString("base64")
}

function decryptSecret(value) {
  ensureSecretStorageAvailable()
  return safeStorage.decryptString(Buffer.from(String(value), "base64"))
}

function hasInlineSecret(server) {
  const fields = SECRET_FIELDS_BY_TYPE[server?.type] || []
  return fields.some((field) => Boolean(server?.[field]))
}

function publicServerView(server) {
  const view = { ...server, params: sanitizeParamsForStorage(server.params) }
  for (const field of SECRET_FIELDS_BY_TYPE[server?.type] || []) {
    delete view[field]
  }
  delete view.secrets
  view.secretStorage = server?.secretStorage || (server?.secrets ? "os" : hasInlineSecret(server) ? "legacy" : null)
  view.secretStored = Boolean(view.secretStorage)
  view.secretRedacted = server?.secretRedacted === true || (!view.secretStored && hasInlineSecret(server))
  return view
}

function hydrateStoredServer(server) {
  if (!server || typeof server !== "object") throw new Error("Saved server is invalid")
  const hydrated = { ...server, params: sanitizeParamsForStorage(server.params) }
  for (const [field, encrypted] of Object.entries(server.secrets || {})) {
    if ((SECRET_FIELDS_BY_TYPE[server.type] || []).includes(field)) {
      hydrated[field] = decryptSecret(encrypted)
    }
  }
  delete hydrated.secrets
  delete hydrated.secretStored
  delete hydrated.secretStorage
  delete hydrated.secretRedacted
  return hydrated
}

function getStoredConnection(key) {
  const storedConnection = store.get(key)
  if (!storedConnection) return null
  return hydrateStoredServer(storedConnection)
}

function prepareServerForStorage(server) {
  const stored = { ...server, params: sanitizeParamsForStorage(server.params) }
  const secretFields = SECRET_FIELDS_BY_TYPE[server.type] || []
  const secrets = {}

  for (const field of secretFields) {
    const value = sanitizeToken(stored[field])
    delete stored[field]
    if (!value) continue
    if (!settings.saveSecrets) {
      stored.secretRedacted = true
      continue
    }
    secrets[field] = encryptSecret(value)
  }

  if (Object.keys(secrets).length > 0) {
    stored.secrets = secrets
    stored.secretStored = true
    stored.secretStorage = "os"
  }

  if (!settings.saveSecrets && stored.secretRedacted !== true) {
    stored.secretRedacted = false
  }

  return stored
}

function checkServerReachable(config) {
  const started = Date.now()

  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: config.host, port: config.port, timeout: settings.connectTimeout * 1000 })
    socket.once("connect", () => {
      socket.destroy()
      resolve(Date.now() - started)
    })
    socket.once("timeout", () => {
      socket.destroy()
      reject(new Error("Server reachability check timed out"))
    })
    socket.once("error", reject)
  })
}

function runCommand(command, args = []) {
  execFile(command, args, { windowsHide: true }, (error) => {
    if (error) {
      console.warn(`[System] ${command} failed: ${error.message}`)
    }
  })
}

function getExistingIcon(name) {
  const iconPath = path.join(__dirname, "icons", name)
  return fs.existsSync(iconPath) ? iconPath : undefined
}

function createWindow() {
  const icon = getExistingIcon("icon.png")
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#0b0d10",
    ...(icon ? { icon } : {}),
    title: "B2 VPN Client",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      webviewTag: false,
      devTools: process.env.NODE_ENV === "development",
      navigateOnDragDrop: false,
      safeDialogs: true,
      v8CacheOptions: "none",
      spellcheck: false,
    },
  })

  Menu.setApplicationMenu(null)
  mainWindow.loadFile("index.html")
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }))
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    try {
      const parsed = new URL(navigationUrl)
      if (parsed.protocol !== "file:") event.preventDefault()
    } catch {
      event.preventDefault()
    }
  })

  mainWindow.once("ready-to-show", () => mainWindow.show())
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

function createTray() {
  const icon = getExistingIcon("tray-icon.png") || getExistingIcon("icon.png")
  if (!icon) return

  tray = new Tray(icon)
  const updateTrayMenu = () => {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: connectionStatus.connected ? `Connected: ${connectionStatus.mode}/${connectionStatus.type}` : "Disconnected",
          enabled: false,
        },
        { type: "separator" },
        {
          label: "Show Window",
          click: () => mainWindow?.show(),
        },
        {
          label: connectionStatus.connected ? "Disconnect" : "Quick Connect",
          click: () => {
            if (connectionStatus.connected) {
              disconnect({ manual: true })
            } else {
              const lastConfig = getStoredConnection("lastConnection")
              if (lastConfig) connectToVPN(lastConfig)
            }
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          click: () => {
            app.isQuitting = true
            app.quit()
          },
        },
      ]),
    )
  }

  updateTrayMenu()
  tray.setToolTip("B2 VPN Client")
  tray.on("click", () => mainWindow?.show())
  setInterval(updateTrayMenu, 5000)
}

function publishStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("status-updated", getStatusPayload())
  }
}

function addTransfer(direction, byteCount) {
  if (!Number.isFinite(byteCount) || byteCount <= 0) return
  transferStats[direction] += byteCount
}

function updateTransferSpeeds() {
  const now = Date.now()
  const elapsed = Math.max((now - transferStats.lastSampleAt) / 1000, 0.001)
  if (elapsed < 1) return

  transferStats.speedUp = Math.max(0, (transferStats.up - transferStats.lastUp) / elapsed)
  transferStats.speedDown = Math.max(0, (transferStats.down - transferStats.lastDown) / elapsed)
  transferStats.lastUp = transferStats.up
  transferStats.lastDown = transferStats.down
  transferStats.lastSampleAt = now
}

function trackSocketPair(upload, download) {
  let closed = false
  transferStats.activeConnections += 1

  const close = () => {
    if (closed) return
    closed = true
    transferStats.activeConnections = Math.max(0, transferStats.activeConnections - 1)
    publishStatus()
  }

  upload.on("data", (chunk) => addTransfer("up", chunk.length))
  download.on("data", (chunk) => addTransfer("down", chunk.length))
  upload.once("close", close)
  download.once("close", close)
  upload.once("error", close)
  download.once("error", close)
}

function isPrivateIp(host) {
  const ipVersion = net.isIP(host)
  if (ipVersion === 4) {
    const parts = host.split(".").map((part) => Number.parseInt(part, 10))
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    )
  }
  if (ipVersion === 6) {
    const lower = host.toLowerCase()
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:")
  }
  return PRIVATE_HOSTS.has(host.toLowerCase())
}

function assertDestinationAllowed(host) {
  if (settings.blockPrivateDestinations && isPrivateIp(host)) {
    throw new Error("Private or loopback destinations are blocked by leak protection")
  }
}

function openTunnelViaSocks(config, destination) {
  assertDestinationAllowed(destination.host)
  return socks.SocksClient.createConnection({
    proxy: {
      host: config.host,
      port: config.port,
      type: 5,
    },
    command: "connect",
    destination,
    timeout: settings.connectTimeout * 1000,
  }).then((info) => info.socket)
}

function openTunnelViaHttpProxy(config, destination) {
  assertDestinationAllowed(destination.host)

  return new Promise((resolve, reject) => {
    const connect = config.type === "https" ? tls.connect : net.connect
    const connectionOptions = { host: config.host, port: config.port, timeout: settings.connectTimeout * 1000 }
    if (config.type === "https") {
      connectionOptions.servername = config.sni || config.host
      connectionOptions.minVersion = settings.tlsMinVersion
      connectionOptions.rejectUnauthorized = true
    }
    const upstream = connect(connectionOptions)
    let settled = false
    let buffered = Buffer.alloc(0)

    const fail = (error) => {
      if (settled) return
      settled = true
      upstream.destroy()
      reject(error)
    }

    upstream.once(config.type === "https" ? "secureConnect" : "connect", () => {
      upstream.write(`CONNECT ${destination.host}:${destination.port} HTTP/1.1\r\nHost: ${destination.host}:${destination.port}\r\nProxy-Connection: keep-alive\r\n\r\n`)
    })
    upstream.on("data", (chunk) => {
      if (settled) return
      buffered = Buffer.concat([buffered, chunk])
      const headerEnd = buffered.indexOf("\r\n\r\n")
      if (headerEnd === -1) return

      const header = buffered.slice(0, headerEnd).toString("latin1")
      if (!/^HTTP\/1\.[01] 2\d\d/i.test(header)) {
        fail(new Error("Upstream HTTP proxy refused the tunnel"))
        return
      }

      settled = true
      const remaining = buffered.slice(headerEnd + 4)
      if (remaining.length > 0) upstream.unshift(remaining)
      upstream.removeAllListeners("data")
      upstream.removeAllListeners("timeout")
      upstream.removeAllListeners("error")
      resolve(upstream)
    })
    upstream.once("timeout", () => fail(new Error("Upstream HTTP proxy timed out")))
    upstream.once("error", fail)
  })
}

function openUpstreamTunnel(config, destination) {
  if (config.type === "socks5" || config.type === "tor") return openTunnelViaSocks(config, destination)
  if (config.type === "http" || config.type === "https") return openTunnelViaHttpProxy(config, destination)
  throw new Error(`${config.type.toUpperCase()} requires TUN mode with an external engine`)
}

function parseSocks5Destination(buffer) {
  if (buffer.length < 7 || buffer[0] !== 0x05 || buffer[1] !== 0x01) return null

  const atyp = buffer[3]
  let offset = 4
  let host

  if (atyp === 0x01) {
    if (buffer.length < offset + 6) return null
    host = Array.from(buffer.slice(offset, offset + 4)).join(".")
    offset += 4
  } else if (atyp === 0x03) {
    const length = buffer[offset]
    offset += 1
    if (buffer.length < offset + length + 2) return null
    host = buffer.slice(offset, offset + length).toString("utf8")
    offset += length
  } else if (atyp === 0x04) {
    if (buffer.length < offset + 18) return null
    const chunks = []
    for (let index = 0; index < 16; index += 2) {
      chunks.push(buffer.readUInt16BE(offset + index).toString(16))
    }
    host = chunks.join(":")
    offset += 16
  } else {
    return null
  }

  const port = buffer.readUInt16BE(offset)
  return { host, port }
}

function startSOCKSProxy(config, bindHost, socksPort) {
  return new Promise((resolve, reject) => {
    socksServer = net.createServer((clientSocket) => {
      clientSocket.once("data", (hello) => {
        if (!hello || hello[0] !== 0x05) {
          clientSocket.end()
          return
        }

        clientSocket.write(Buffer.from([0x05, 0x00]))
        clientSocket.once("data", async (request) => {
          const destination = parseSocks5Destination(request)
          if (!destination) {
            clientSocket.end(Buffer.from([0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
            return
          }

          try {
            const upstream = await openUpstreamTunnel(config, destination)
            clientSocket.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
            trackSocketPair(clientSocket, upstream)
            clientSocket.pipe(upstream)
            upstream.pipe(clientSocket)
          } catch (error) {
            connectionStatus.lastError = error.message
            clientSocket.end(Buffer.from([0x05, 0x05, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
            publishStatus()
          }
        })
      })
    })

    socksServer.once("error", reject)
    socksServer.listen(socksPort, bindHost, () => {
      console.log(`[Proxy] SOCKS5 proxy listening on ${bindHost}:${socksPort}`)
      resolve()
    })
  })
}

async function handleHttpRequest(config, req, res) {
  try {
    const targetUrl = new URL(req.url)
    const destination = {
      host: targetUrl.hostname,
      port: normalizePort(targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80), 80),
    }
    const upstream = await openUpstreamTunnel(config, destination)
    const requestPath = `${targetUrl.pathname || "/"}${targetUrl.search || ""}`
    const headers = { ...req.headers, host: targetUrl.host, connection: "close" }
    delete headers["proxy-connection"]

    upstream.write(`${req.method} ${requestPath} HTTP/${req.httpVersion}\r\n`)
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) upstream.write(`${key}: ${value}\r\n`)
    }
    upstream.write("\r\n")

    trackSocketPair(req, upstream)
    req.pipe(upstream, { end: false })
    req.on("end", () => upstream.end())
    upstream.pipe(res.socket)
  } catch (error) {
    connectionStatus.lastError = error.message
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" })
    res.end("B2 VPN proxy failed closed")
    publishStatus()
  }
}

async function handleConnectRequest(config, req, clientSocket, head) {
  try {
    const [host, rawPort] = req.url.split(":")
    const destination = { host, port: normalizePort(rawPort, 443) }
    const upstream = await openUpstreamTunnel(config, destination)
    clientSocket.write("HTTP/1.1 200 Connection Established\r\nProxy-Agent: B2VPN\r\n\r\n")
    if (head && head.length > 0) upstream.write(head)

    trackSocketPair(clientSocket, upstream)
    clientSocket.pipe(upstream)
    upstream.pipe(clientSocket)
  } catch (error) {
    connectionStatus.lastError = error.message
    clientSocket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n")
    publishStatus()
  }
}

function startProxyServer(config) {
  return new Promise((resolve, reject) => {
    const httpPort = normalizePort(config.localPort, settings.localPort)
    const socksPort = httpPort + 1
    const bindHost = config.allowLan ? "0.0.0.0" : LOCAL_PROXY_HOST

    if (socksPort > 65535) {
      reject(new Error("Invalid SOCKS port"))
      return
    }

    proxyServer = http.createServer((req, res) => handleHttpRequest(config, req, res))
    proxyServer.on("connect", (req, clientSocket, head) => handleConnectRequest(config, req, clientSocket, head))
    proxyServer.once("error", reject)
    proxyServer.listen(httpPort, bindHost, async () => {
      try {
        await startSOCKSProxy(config, bindHost, socksPort)
        resolve({ bindHost, httpPort, socksPort })
      } catch (error) {
        reject(error)
      }
    })
  })
}

function setSystemProxy(httpPort, socksPort) {
  const platform = process.platform
  httpPort = normalizePort(httpPort, settings.localPort)
  socksPort = normalizePort(socksPort, settings.localPort + 1)

  if (platform === "win32") {
    runCommand("reg", ["add", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "1", "/f"])
    runCommand("reg", [
      "add",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
      "/v",
      "ProxyServer",
      "/t",
      "REG_SZ",
      "/d",
      `http=${LOCAL_PROXY_HOST}:${httpPort};https=${LOCAL_PROXY_HOST}:${httpPort};socks=${LOCAL_PROXY_HOST}:${socksPort}`,
      "/f",
    ])
  } else if (platform === "darwin") {
    runCommand("networksetup", ["-setwebproxy", settings.networkService, LOCAL_PROXY_HOST, String(httpPort)])
    runCommand("networksetup", ["-setsecurewebproxy", settings.networkService, LOCAL_PROXY_HOST, String(httpPort)])
    runCommand("networksetup", ["-setsocksfirewallproxy", settings.networkService, LOCAL_PROXY_HOST, String(socksPort)])
  } else if (platform === "linux") {
    process.env.http_proxy = `http://${LOCAL_PROXY_HOST}:${httpPort}`
    process.env.https_proxy = `http://${LOCAL_PROXY_HOST}:${httpPort}`
    process.env.socks_proxy = `socks5://${LOCAL_PROXY_HOST}:${socksPort}`
    runCommand("gsettings", ["set", "org.gnome.system.proxy", "mode", "manual"])
    runCommand("gsettings", ["set", "org.gnome.system.proxy.http", "host", LOCAL_PROXY_HOST])
    runCommand("gsettings", ["set", "org.gnome.system.proxy.http", "port", String(httpPort)])
    runCommand("gsettings", ["set", "org.gnome.system.proxy.https", "host", LOCAL_PROXY_HOST])
    runCommand("gsettings", ["set", "org.gnome.system.proxy.https", "port", String(httpPort)])
    runCommand("gsettings", ["set", "org.gnome.system.proxy.socks", "host", LOCAL_PROXY_HOST])
    runCommand("gsettings", ["set", "org.gnome.system.proxy.socks", "port", String(socksPort)])
  }
}

function setSystemProxyBlackhole() {
  setSystemProxy(9, 9)
  connectionStatus.killSwitchActive = true
}

function clearSystemProxy() {
  if (process.platform === "win32") {
    runCommand("reg", ["add", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "0", "/f"])
  } else if (process.platform === "darwin") {
    runCommand("networksetup", ["-setwebproxystate", settings.networkService, "off"])
    runCommand("networksetup", ["-setsecurewebproxystate", settings.networkService, "off"])
    runCommand("networksetup", ["-setsocksfirewallproxystate", settings.networkService, "off"])
  } else if (process.platform === "linux") {
    delete process.env.http_proxy
    delete process.env.https_proxy
    delete process.env.socks_proxy
    runCommand("gsettings", ["set", "org.gnome.system.proxy", "mode", "none"])
  }
}

function enableDNSProtection() {
  if (!settings.dnsProtection) return

  if (process.platform === "win32") {
    runCommand("netsh", ["interface", "ip", "set", "dns", "Ethernet", "static", settings.dnsServers[0], "primary"])
    settings.dnsServers.slice(1).forEach((server, index) => {
      runCommand("netsh", ["interface", "ip", "add", "dns", "Ethernet", server, `index=${index + 2}`])
    })
  } else if (process.platform === "darwin") {
    runCommand("networksetup", ["-setdnsservers", settings.networkService, ...settings.dnsServers])
  } else if (process.platform === "linux") {
    console.warn("[DNS] Automatic DNS changes are disabled on Linux to avoid overwriting resolver files")
  }
}

function applyIPv6Mode() {
  if (settings.ipv6Mode === "unchanged") return

  if (process.platform === "win32") {
    runCommand("netsh", ["interface", "ipv6", "set", "global", "randomizeidentifiers=enabled"])
    runCommand("netsh", ["interface", "ipv6", "set", "privacy", "state=enabled"])
  } else if (process.platform === "darwin" && settings.ipv6Mode === "off") {
    runCommand("networksetup", ["-setv6off", settings.networkService])
  } else if (process.platform === "linux") {
    console.warn("[IPv6] Automatic IPv6 changes are disabled on Linux to avoid changing global kernel settings")
  }
}

function buildSingBoxOutbound(config) {
  const base = {
    tag: "secure-out",
    type: config.type === "tor" ? "socks" : config.type,
    server: config.host,
    server_port: config.port,
  }

  if (config.type === "tor" || config.type === "socks5") {
    return { ...base, type: "socks", version: "5" }
  }
  if (config.type === "http" || config.type === "https") {
    return { ...base, type: "http", tls: { enabled: config.type === "https", server_name: config.sni || config.host, min_version: settings.tlsMinVersion } }
  }
  if (config.type === "vless") {
    if (!config.uuid) throw new Error("VLESS TUN mode requires a UUID")
    return {
      ...base,
      type: "vless",
      uuid: config.uuid,
      tls: { enabled: config.tls, server_name: config.sni || config.host, min_version: settings.tlsMinVersion },
    }
  }
  if (config.type === "vmess") {
    if (!config.uuid) throw new Error("VMess TUN mode requires a UUID")
    return { ...base, type: "vmess", uuid: config.uuid, security: config.params.security || "auto" }
  }
  if (config.type === "shadowsocks" || config.type === "outline") {
    if (!config.password && !config.uuid) throw new Error("Shadowsocks/Outline TUN mode requires a password or access key")
    return {
      ...base,
      type: "shadowsocks",
      method: config.method || "2022-blake3-aes-256-gcm",
      password: config.password || config.uuid,
    }
  }

  throw new Error(`No TUN outbound builder for ${config.type}`)
}

function buildPrivateBlockRules() {
  if (!settings.blockPrivateDestinations) return []
  return [
    {
      ip_cidr: ["0.0.0.0/8", "10.0.0.0/8", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12", "192.168.0.0/16", "::1/128", "fc00::/7", "fe80::/10"],
      outbound: "block",
    },
  ]
}

function buildSingBoxConfig(config) {
  return {
    log: { disabled: settings.minimizeLogs, level: "warn" },
    dns: {
      servers: settings.dnsServers.map((server, index) => ({ tag: `dns-${index}`, address: server })),
      final: "dns-0",
    },
    inbounds: [
      {
        type: "tun",
        tag: "tun-in",
        interface_name: settings.tun.interfaceName,
        address: [settings.tun.address],
        mtu: settings.tun.mtu,
        stack: settings.tun.stack,
        auto_route: settings.tun.autoRoute,
        strict_route: settings.tun.strictRoute,
      },
    ],
    outbounds: [buildSingBoxOutbound(config), { type: "block", tag: "block" }, { type: "direct", tag: "direct" }],
    route: {
      auto_detect_interface: true,
      rules: buildPrivateBlockRules(),
      final: "secure-out",
    },
  }
}

function resolveHelperCommand() {
  const helperPath = settings.tun.helperPath.trim()
  if (!helperPath) return settings.tun.helper === "sing-box" ? "sing-box" : null
  if (!path.isAbsolute(helperPath)) throw new Error("TUN helper path must be absolute")
  if (!fs.existsSync(helperPath)) throw new Error("TUN helper path does not exist")
  return helperPath
}

function parseCustomArgs(template, ports) {
  const replacements = {
    "{socksHost}": LOCAL_PROXY_HOST,
    "{socksPort}": String(ports.socksPort),
    "{httpPort}": String(ports.httpPort),
    "{tunName}": settings.tun.interfaceName,
    "{tunAddress}": settings.tun.address,
    "{tunMtu}": String(settings.tun.mtu),
    "{dns}": settings.dnsServers.join(","),
  }

  return String(template || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let arg = line
      for (const [key, value] of Object.entries(replacements)) {
        arg = arg.replaceAll(key, value)
      }
      if (/[\u0000;&|<>`$]/.test(arg)) throw new Error("Unsafe custom TUN argument")
      return arg
    })
}

function startTunProcess(command, args, label) {
  return new Promise((resolve, reject) => {
    stoppingTun = false
    let settled = false
    tunProcess = spawn(command, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })

    const fail = (error) => {
      if (settled) return
      settled = true
      tunProcess = null
      reject(error)
    }

    tunProcess.stdout.on("data", (chunk) => {
      if (!settings.minimizeLogs) console.log(`[TUN:${label}] ${chunk.toString().trim()}`)
    })
    tunProcess.stderr.on("data", (chunk) => {
      const message = chunk.toString().trim()
      if (message) connectionStatus.lastError = message.slice(0, 240)
      if (!settings.minimizeLogs) console.warn(`[TUN:${label}] ${message}`)
    })
    tunProcess.once("error", fail)
    tunProcess.once("exit", (code) => {
      const unexpected = !stoppingTun && connectionStatus.connected
      tunProcess = null
      connectionStatus.tun.active = false
      if (unexpected) {
        connectionStatus.lastError = `TUN helper exited with code ${code}`
        if (settings.killSwitchMode === "system-proxy") setSystemProxyBlackhole()
        disconnect({ manual: false, preserveKillSwitch: true, reason: connectionStatus.lastError })
      }
    })

    setTimeout(() => {
      if (settled) return
      settled = true
      resolve()
    }, 1200)
  })
}

async function startTunMode(config) {
  const command = resolveHelperCommand()
  if (!command) throw new Error("Custom TUN mode requires an absolute helper path")

  if (settings.tun.helper === "sing-box") {
    tunConfigPath = path.join(app.getPath("userData"), "b2-sing-box-tun.json")
    fs.writeFileSync(tunConfigPath, `${JSON.stringify(buildSingBoxConfig(config), null, 2)}\n`, { mode: 0o600 })
    await startTunProcess(command, ["run", "-c", tunConfigPath], "sing-box")
  } else {
    if (!PROXY_MODE_TYPES.has(config.type)) {
      throw new Error("Custom TUN helper mode uses the local SOCKS proxy and requires a SOCKS5, HTTP(S), or Tor upstream")
    }
    const ports = await startProxyServer(config)
    connectionStatus.localProxy = ports
    const args = parseCustomArgs(settings.tun.customArgs, ports)
    await startTunProcess(command, args, "custom")
  }

  connectionStatus.tun = {
    active: true,
    helper: settings.tun.helper,
    interfaceName: settings.tun.interfaceName,
    address: settings.tun.address,
    mtu: settings.tun.mtu,
  }
}

function stopTunMode() {
  stoppingTun = true
  if (tunProcess) {
    tunProcess.kill("SIGTERM")
    tunProcess = null
  }
  if (tunConfigPath) {
    fs.rm(tunConfigPath, { force: true }, () => {})
    tunConfigPath = null
  }
}

async function connectToVPN(inputConfig) {
  let normalized
  try {
    settings = normalizeSettings(store.get("settings", settings))
    normalized = normalizeConfig(inputConfig)

    if (connectionStatus.connected || connectionStatus.connecting) {
      disconnect({ manual: true })
    }

    connectionStatus = {
      ...createDisconnectedStatus(),
      connecting: true,
      mode: normalized.mode,
      type: normalized.type,
      server: `${normalized.host}:${normalized.port}`,
      lastError: null,
    }
    publishStatus()

    if (normalized.mode === "tun" && settings.tun.helper === "sing-box" && ENCRYPTED_ENGINE_TYPES.has(normalized.type) && !normalized.uuid && !normalized.password) {
      throw new Error(`${normalized.type.toUpperCase()} TUN mode needs its secret for this session`)
    }

    const latency = await checkServerReachable(normalized)
    connectionStatus.health = { reachable: true, latencyMs: latency, lastCheckedAt: new Date().toISOString() }

    enableDNSProtection()
    applyIPv6Mode()

    transferStats = createEmptyTransferStats()
    transferStats.startedAt = new Date().toISOString()
    activeConfig = normalized

    if (normalized.mode === "tun") {
      await startTunMode(normalized)
    } else {
      const ports = await startProxyServer(normalized)
      connectionStatus.localProxy = ports
      setSystemProxy(ports.httpPort, ports.socksPort)
    }

    connectionStatus.connected = true
    connectionStatus.connecting = false
    connectionStatus.ip = normalized.mode === "tun" ? "Routed by TUN" : "Routed by system proxy"
    connectionStatus.connectedAt = new Date().toISOString()
    connectionStatus.killSwitchActive = false
    connectionStatus.reconnectAttempts = 0

    try {
      store.set("lastConnection", prepareServerForStorage(normalized))
    } catch (error) {
      store.delete("lastConnection")
      connectionStatus.lastError = `Route is active, but last-connection secrets were not saved: ${error.message}`
    }

    if (settings.autoReconnect) startConnectionMonitor()
    publishStatus()
    return { success: true, status: getStatusPayload() }
  } catch (error) {
    console.error("[VPN] Connection failed:", error.message)
    disconnect({ manual: false, reason: error.message })
    return { success: false, error: error.message }
  }
}

function startConnectionMonitor() {
  if (connectionMonitor) clearInterval(connectionMonitor)

  connectionMonitor = setInterval(async () => {
    if (!connectionStatus.connected || !activeConfig) return

    try {
      const latency = await checkServerReachable(activeConfig)
      connectionStatus.health = { reachable: true, latencyMs: latency, lastCheckedAt: new Date().toISOString() }
    } catch (error) {
      connectionStatus.health = { reachable: false, latencyMs: null, lastCheckedAt: new Date().toISOString() }
      connectionStatus.lastError = error.message

      if (settings.autoReconnect && connectionStatus.reconnectAttempts < settings.maxReconnectAttempts) {
        connectionStatus.reconnectAttempts += 1
        publishStatus()
        await connectToVPN(activeConfig)
      } else {
        if (settings.killSwitchMode === "system-proxy") setSystemProxyBlackhole()
        disconnect({ manual: false, preserveKillSwitch: true, reason: error.message })
      }
    }

    publishStatus()
  }, settings.healthCheckInterval * 1000)
}

function disconnect(options = {}) {
  const { manual = true, preserveKillSwitch = false, reason = null } = options

  if (connectionMonitor) {
    clearInterval(connectionMonitor)
    connectionMonitor = null
  }

  if (proxyServer) {
    proxyServer.close()
    proxyServer = null
  }
  if (socksServer) {
    socksServer.close()
    socksServer = null
  }
  stopTunMode()

  if (manual || !preserveKillSwitch) {
    clearSystemProxy()
  } else if (settings.killSwitchMode === "system-proxy") {
    setSystemProxyBlackhole()
  }

  activeConfig = null
  const killSwitchActive = preserveKillSwitch && settings.killSwitchMode === "system-proxy"
  connectionStatus = createDisconnectedStatus(reason || connectionStatus.lastError)
  connectionStatus.killSwitchActive = killSwitchActive
  transferStats = createEmptyTransferStats()
  publishStatus()
}

function parseConnectionLink(link) {
  const trimmed = sanitizeToken(link)
  const parsed = new URL(trimmed)
  const type = parsed.protocol.replace(":", "").toLowerCase()

  if (type === "vless") {
    return {
      type,
      uuid: parsed.username,
      host: parsed.hostname,
      port: Number.parseInt(parsed.port, 10) || 443,
      sni: parsed.searchParams.get("sni") || parsed.searchParams.get("peer") || parsed.hostname,
      tls: parsed.searchParams.get("security") === "tls",
      params: Object.fromEntries(parsed.searchParams.entries()),
    }
  }

  if (["socks5", "http", "https"].includes(type)) {
    return {
      type,
      host: parsed.hostname,
      port: Number.parseInt(parsed.port, 10) || (type === "socks5" ? 1080 : type === "https" ? 443 : 8080),
      username: decodeURIComponent(parsed.username || ""),
      password: decodeURIComponent(parsed.password || ""),
    }
  }

  if (type === "ss") {
    let method = ""
    let password = ""
    if (parsed.username) {
      const decoded = Buffer.from(parsed.username, "base64url").toString("utf8")
      const index = decoded.indexOf(":")
      method = decoded.slice(0, index)
      password = decoded.slice(index + 1)
    }
    return {
      type: "shadowsocks",
      host: parsed.hostname,
      port: Number.parseInt(parsed.port, 10) || 8388,
      method,
      password,
    }
  }

  throw new Error("Unsupported connection link")
}

function getCliValue(name) {
  const prefix = `--${name}=`
  for (let index = 0; index < process.argv.length; index += 1) {
    const arg = process.argv[index]
    if (arg.startsWith(prefix)) return arg.slice(prefix.length)
    if (arg === `--${name}` && process.argv[index + 1] && !process.argv[index + 1].startsWith("--")) {
      return process.argv[index + 1]
    }
  }
  return null
}

function hasCliFlag(name) {
  return process.argv.includes(`--${name}`) || getCliValue(name) === "true"
}

function readCliConfig() {
  const configPath = getCliValue("config")
  if (!configPath) return null

  const resolvedPath = path.resolve(process.cwd(), sanitizeToken(configPath))
  const stats = fs.statSync(resolvedPath)
  if (!stats.isFile()) throw new Error("--config must point to a JSON file")
  if (stats.size > MAX_CLI_CONFIG_BYTES) throw new Error("--config file is too large")

  return JSON.parse(fs.readFileSync(resolvedPath, "utf8"))
}

async function runStartupCommands() {
  try {
    const cliConfig = readCliConfig()
    if (cliConfig) {
      await connectToVPN(cliConfig)
      return
    }

    if (hasCliFlag("connect-last")) {
      const lastConfig = getStoredConnection("lastConnection")
      if (lastConfig) await connectToVPN(lastConfig)
    }
  } catch (error) {
    connectionStatus.lastError = error.message
    publishStatus()
  }
}

function getRuntimeSpecs() {
  const memory = process.memoryUsage()
  const cpus = os.cpus()
  return {
    appVersion: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    cpu: cpus?.[0]?.model || "Unknown CPU",
    cores: cpus?.length || 0,
    systemMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    rssBytes: memory.rss,
    heapUsedBytes: memory.heapUsed,
    processUptimeSeconds: Math.round(process.uptime()),
  }
}

function getStatusPayload() {
  updateTransferSpeeds()
  return {
    ...connectionStatus,
    settingsSummary: {
      connectionMode: settings.connectionMode,
      killSwitchMode: settings.killSwitchMode,
      dnsProtection: settings.dnsProtection,
      ipv6Mode: settings.ipv6Mode,
      autoReconnect: settings.autoReconnect,
      blockPrivateDestinations: settings.blockPrivateDestinations,
      allowInsecureTransport: settings.allowInsecureTransport,
      tlsMinVersion: settings.tlsMinVersion,
      saveSecrets: settings.saveSecrets,
      secretStorageAvailable: safeStorage.isEncryptionAvailable(),
    },
    speed: { down: transferStats.speedDown, up: transferStats.speedUp },
    bytesTransferred: { down: transferStats.down, up: transferStats.up },
    activeConnections: transferStats.activeConnections,
    specs: getRuntimeSpecs(),
  }
}

function getSafetyReport() {
  const findings = []
  let score = 100

  const addFinding = (severity, title, detail, penalty) => {
    findings.push({ severity, title, detail })
    score -= penalty
  }

  if (settings.killSwitchMode === "off") {
    addFinding("high", "Kill switch is off", "Traffic may continue outside the protected route after failures.", 25)
  } else if (settings.killSwitchMode === "app") {
    addFinding("medium", "Kill switch is app-only", "System traffic outside this app will not be blocked during route loss.", 12)
  }

  if (settings.allowLan) {
    addFinding("high", "Local proxy accepts LAN clients", "Other devices on the network may use this proxy if they can reach the machine.", 20)
  }
  if (settings.allowInsecureTransport) {
    addFinding("high", "Weak/plain transports allowed", "Plain HTTP proxies and weak VMess or Shadowsocks settings can be used.", 25)
  }
  if (!settings.blockPrivateDestinations) {
    addFinding("medium", "Private destination blocking is off", "Proxy clients can request loopback or private network addresses.", 12)
  }
  if (!settings.dnsProtection) {
    addFinding("medium", "DNS protection is off", "DNS requests may use the system resolver outside the intended route.", 12)
  }
  if (settings.ipv6Mode === "unchanged") {
    addFinding("low", "IPv6 is unchanged", "IPv6 privacy depends on the host operating system configuration.", 6)
  }
  if (settings.saveSecrets && !safeStorage.isEncryptionAvailable()) {
    addFinding("high", "Secret storage unavailable", "Saved server secrets cannot be protected by the OS keychain/keyring.", 25)
  } else if (settings.saveSecrets) {
    addFinding("low", "Secrets can be saved", "Saved secrets use OS encryption, but disabling persistence still reduces local exposure.", 5)
  }
  if (activeConfig?.type === "http") {
    addFinding("high", "Active upstream is HTTP", "The upstream proxy control channel is not encrypted.", 20)
  }
  if (settings.connectionMode === "tun" && settings.tun.helper === "custom" && !settings.tun.helperPath) {
    addFinding("medium", "Custom TUN helper missing", "TUN mode will fail closed until an absolute helper path is configured.", 10)
  }
  if (!connectionStatus.connected) {
    findings.push({ severity: "info", title: "Route is inactive", detail: "Connect to a saved server or quick link before relying on this route." })
  }

  score = Math.max(0, Math.min(100, score))
  const level = score >= 85 ? "strong" : score >= 65 ? "good" : score >= 40 ? "caution" : "risky"

  return {
    score,
    level,
    generatedAt: new Date().toISOString(),
    summary:
      findings.filter((finding) => finding.severity !== "info").length === 0
        ? "No risky local settings detected."
        : "Review the highlighted settings before relying on this route.",
    findings,
  }
}

ipcMain.handle("connect-vpn", async (_event, config) => connectToVPN(config))
ipcMain.handle("disconnect-vpn", () => {
  disconnect({ manual: true })
  return { success: true }
})
ipcMain.handle("get-status", () => getStatusPayload())
ipcMain.handle("parse-vless-link", (_event, link) => {
  try {
    return { success: true, config: parseConnectionLink(link) }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
ipcMain.handle("get-servers", () => store.get("servers", []).map(publicServerView))
ipcMain.handle("connect-saved-server", async (_event, index, overrides = {}) => {
  try {
    const servers = store.get("servers", [])
    const safeIndex = Number.parseInt(index, 10)
    if (!Number.isInteger(safeIndex) || safeIndex < 0 || safeIndex >= servers.length) {
      throw new Error("Saved server not found")
    }
    const storedServer = hydrateStoredServer(servers[safeIndex])
    const normalizedOverrides = {
      mode: normalizeMode(overrides.mode || settings.connectionMode),
      localPort: normalizePort(overrides.localPort || settings.localPort, settings.localPort),
      allowLan: overrides.allowLan === true,
    }
    return connectToVPN({ ...storedServer, ...normalizedOverrides })
  } catch (error) {
    return { success: false, error: error.message }
  }
})
ipcMain.handle("save-server", (_event, server) => {
  try {
    const normalized = normalizeConfig(server)
    const servers = store.get("servers", [])
    servers.push(prepareServerForStorage(normalized))
    store.set("servers", servers)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
ipcMain.handle("delete-server", (_event, index) => {
  const servers = store.get("servers", [])
  const safeIndex = Number.parseInt(index, 10)
  if (Number.isInteger(safeIndex) && safeIndex >= 0 && safeIndex < servers.length) {
    servers.splice(safeIndex, 1)
    store.set("servers", servers)
  }
  return { success: true }
})
ipcMain.handle("get-settings", () => settings)
ipcMain.handle("save-settings", (_event, incomingSettings) => {
  try {
    settings = normalizeSettings(incomingSettings)
    store.set("settings", settings)
    return { success: true, settings }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
ipcMain.handle("get-safety-report", () => getSafetyReport())
ipcMain.handle("get-app-info", () => ({
  name: "B2 VPN Client",
  version: app.getVersion(),
  description: "Minimal local-first VPN and proxy client with explicit proxy and TUN modes.",
  author: "B2-Torrent Team",
  license: "Personal Use Only",
  features: [
    "Proxy mode for SOCKS5, HTTP(S), and Tor endpoints",
    "TUN mode through sing-box or a custom local helper",
    "System-proxy kill switch option",
    "DNS and IPv6 privacy controls",
    "Private destination blocking",
    "Strong transport defaults with weak cipher and plaintext upstream blocking",
    "OS keychain-backed saved secrets when enabled",
    "Command-line --config and --connect-last support",
    "Live transfer, latency, and runtime specs",
    "Local route safety audit",
    "No saved secrets unless enabled",
  ],
}))

app.on("ready", async () => {
  try {
    await initializeStorage()
  } catch (error) {
    console.error("[VPN] Failed to initialize storage:", error)
    app.quit()
    return
  }

  session.defaultSession.setSpellCheckerEnabled(false)
  session.defaultSession.setDevicePermissionHandler(() => false)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  session.defaultSession.setPermissionCheckHandler(() => false)
  session.defaultSession.clearCache().catch(() => {})
  session.defaultSession.clearStorageData({ storages: ["cookies", "filesystem", "indexdb", "localstorage", "shadercache", "websql", "serviceworkers", "cachestorage"] }).catch(() => {})
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    try {
      const protocol = new URL(details.url).protocol
      callback({ cancel: !["file:", "data:", "devtools:"].includes(protocol) })
    } catch {
      callback({ cancel: true })
    }
  })

  createWindow()
  createTray()
  setTimeout(runStartupCommands, 300)
})

app.on("window-all-closed", () => {})
app.on("before-quit", () => disconnect({ manual: true }))
app.on("activate", () => {
  if (mainWindow === null) createWindow()
  else mainWindow.show()
})
