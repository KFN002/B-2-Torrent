const state = {
  files: [],
  selectedPath: null,
}

const elements = {
  openFiles: document.getElementById("open-files"),
  revealFile: document.getElementById("reveal-file"),
  forgetFile: document.getElementById("forget-file"),
  copyHash: document.getElementById("copy-hash"),
  copyReport: document.getElementById("copy-report"),
  fileList: document.getElementById("file-list"),
  runtimeInfo: document.getElementById("runtime-info"),
  emptyState: document.getElementById("empty-state"),
  filePanel: document.getElementById("file-panel"),
  fileTitle: document.getElementById("file-title"),
  warningRow: document.getElementById("warning-row"),
  metaName: document.getElementById("meta-name"),
  metaSize: document.getElementById("meta-size"),
  metaSignature: document.getElementById("meta-signature"),
  metaEntropy: document.getElementById("meta-entropy"),
  metaRisk: document.getElementById("meta-risk"),
  metaDirectory: document.getElementById("meta-directory"),
  metaModified: document.getElementById("meta-modified"),
  metaMode: document.getElementById("meta-mode"),
  metaMime: document.getElementById("meta-mime"),
  metaSha: document.getElementById("meta-sha"),
  preview: document.getElementById("preview"),
  textSearch: document.getElementById("text-search"),
  searchResult: document.getElementById("search-result"),
  deleteMode: document.getElementById("delete-mode"),
  deletePasses: document.getElementById("delete-passes"),
  passesLabel: document.getElementById("passes-label"),
  deleteConfirm: document.getElementById("delete-confirm"),
  deleteFile: document.getElementById("delete-file"),
  toast: document.getElementById("toast"),
}

window.b2FileViewer.getAppInfo().then((info) => {
  elements.runtimeInfo.textContent = `${info.platform} ${info.arch} · Electron ${info.electron}`
})

elements.openFiles.addEventListener("click", async () => {
  try {
    const files = await window.b2FileViewer.openFiles()
    mergeFiles(files)
    if (files.length > 0) {
      selectFile(files[0].path)
      showToast(`${files.length} file${files.length === 1 ? "" : "s"} opened`)
    }
  } catch (error) {
    showToast(error.message || String(error), true)
  }
})

elements.revealFile.addEventListener("click", async () => {
  const file = selectedFile()
  if (!file) return
  try {
    await window.b2FileViewer.revealFile(file.path)
  } catch (error) {
    showToast(error.message || String(error), true)
  }
})

elements.forgetFile.addEventListener("click", async () => {
  const file = selectedFile()
  if (!file) return
  try {
    await window.b2FileViewer.forgetFile(file.path)
    state.files = state.files.filter((item) => item.path !== file.path)
    state.selectedPath = state.files[0]?.path || null
    render()
  } catch (error) {
    showToast(error.message || String(error), true)
  }
})

elements.copyHash.addEventListener("click", async () => {
  const file = selectedFile()
  if (!file?.sha256) return
  await navigator.clipboard.writeText(file.sha256)
  showToast("SHA-256 copied")
})

elements.copyReport.addEventListener("click", async () => {
  const file = selectedFile()
  if (!file) return
  await navigator.clipboard.writeText(createSafetyReport(file))
  showToast("Safety report copied")
})

elements.textSearch.addEventListener("input", renderPreview)
elements.deleteConfirm.addEventListener("input", updateDeleteState)
elements.deleteMode.addEventListener("change", updateDeleteState)
elements.deletePasses.addEventListener("input", () => {
  elements.passesLabel.textContent = elements.deletePasses.value
})

elements.deleteFile.addEventListener("click", async () => {
  const file = selectedFile()
  if (!file) return

  elements.deleteFile.disabled = true
  try {
    await window.b2FileViewer.deleteFile({
      filePath: file.path,
      mode: elements.deleteMode.value,
      passes: Number(elements.deletePasses.value),
      confirmation: elements.deleteConfirm.value,
    })
    state.files = state.files.filter((item) => item.path !== file.path)
    state.selectedPath = state.files[0]?.path || null
    elements.deleteConfirm.value = ""
    render()
    showToast("File deleted")
  } catch (error) {
    showToast(error.message || String(error), true)
  } finally {
    updateDeleteState()
  }
})

function mergeFiles(files) {
  const byPath = new Map(state.files.map((file) => [file.path, file]))
  for (const file of files) {
    byPath.set(file.path, file)
  }
  state.files = Array.from(byPath.values())
}

function selectFile(filePath) {
  state.selectedPath = filePath
  elements.deleteConfirm.value = ""
  elements.textSearch.value = ""
  render()
}

function selectedFile() {
  return state.files.find((file) => file.path === state.selectedPath) || null
}

function render() {
  renderFileList()
  const file = selectedFile()
  const hasFile = Boolean(file)

  elements.emptyState.classList.toggle("hidden", hasFile)
  elements.filePanel.classList.toggle("hidden", !hasFile)
  elements.revealFile.disabled = !hasFile
  elements.forgetFile.disabled = !hasFile
  elements.copyHash.disabled = !hasFile || !file?.sha256
  elements.copyReport.disabled = !hasFile || Boolean(file?.error)

  if (!file) {
    elements.fileTitle.textContent = "No file selected"
    updateDeleteState()
    return
  }

  elements.fileTitle.textContent = file.name
  elements.metaName.textContent = file.name
  elements.metaSize.textContent = formatBytes(file.size)
  elements.metaSignature.textContent = file.signature || "Unknown"
  elements.metaEntropy.textContent = `${file.entropy} bits/byte`
  elements.metaRisk.textContent = `${capitalize(file.riskLevel || "unknown")} (${Number(file.riskScore) || 0}/100)`
  elements.metaRisk.dataset.level = file.riskLevel || "unknown"
  elements.metaDirectory.textContent = file.directory
  elements.metaModified.textContent = new Date(file.modified).toLocaleString()
  elements.metaMode.textContent = file.mode
  elements.metaMime.textContent = file.mimeType || "application/octet-stream"
  elements.metaSha.textContent = file.sha256

  elements.warningRow.replaceChildren()
  if (file.error) {
    elements.warningRow.appendChild(createPill(file.error, true))
  } else if (file.warnings?.length) {
    for (const warning of file.warnings) {
      elements.warningRow.appendChild(createPill(warning, true))
    }
  } else {
    elements.warningRow.appendChild(createPill("No obvious local indicators"))
  }

  renderPreview()
  updateDeleteState()
}

function renderFileList() {
  elements.fileList.replaceChildren()
  for (const file of state.files) {
    const button = document.createElement("button")
    button.className = `file-item${file.path === state.selectedPath ? " active" : ""}`
    button.addEventListener("click", () => selectFile(file.path))

    const name = document.createElement("span")
    name.className = "file-name"
    name.textContent = file.name || file.path

    const meta = document.createElement("span")
    meta.className = "file-meta"
    const group = document.createElement("span")
    group.textContent = file.group || "file"
    const size = document.createElement("span")
    size.textContent = file.size ? formatBytes(file.size) : ""
    meta.append(group, size)

    button.append(name, meta)
    elements.fileList.appendChild(button)
  }
}

function renderPreview() {
  const file = selectedFile()
  elements.preview.replaceChildren()
  elements.searchResult.textContent = ""
  if (!file) return

  if (file.error) {
    const p = document.createElement("p")
    p.textContent = file.error
    elements.preview.appendChild(p)
    return
  }

  if (file.group === "image") {
    const img = document.createElement("img")
    img.alt = file.name
    img.src = file.previewUrl
    elements.preview.appendChild(img)
    return
  }

  if (file.group === "audio") {
    const audio = document.createElement("audio")
    audio.controls = true
    audio.src = file.previewUrl
    elements.preview.appendChild(audio)
    return
  }

  if (file.group === "video") {
    const video = document.createElement("video")
    video.controls = true
    video.src = file.previewUrl
    elements.preview.appendChild(video)
    return
  }

  const pre = document.createElement("pre")
  pre.className = "mono"

  if (file.group === "text") {
    const query = elements.textSearch.value.trim()
    pre.textContent = file.textPreview || ""
    if (query) {
      const count = countMatches(file.textPreview || "", query)
      elements.searchResult.textContent = `${count} match${count === 1 ? "" : "es"} in preview`
    }
  } else {
    pre.textContent = file.hexPreview || ""
    elements.searchResult.textContent =
      file.group === "document"
        ? "Document preview is disabled; inspect the signature, hash, and hex sample."
        : "Binary preview shows the first bytes only."
  }
  elements.preview.appendChild(pre)
}

function updateDeleteState() {
  const file = selectedFile()
  const confirmed = Boolean(file && elements.deleteConfirm.value === file.name)
  elements.deleteFile.disabled = !confirmed
  elements.deletePasses.disabled = elements.deleteMode.value !== "overwrite"
}

function createPill(text, warning = false) {
  const pill = document.createElement("span")
  pill.className = `pill${warning ? " warning" : ""}`
  pill.textContent = text
  return pill
}

function countMatches(text, query) {
  if (!query) return 0
  let count = 0
  let index = 0
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
    count += 1
    index += lowerQuery.length || 1
  }
  return count
}

function createSafetyReport(file) {
  return [
    `B2 Safe File Viewer report`,
    `Name: ${file.name}`,
    `Path: ${file.path}`,
    `Size: ${formatBytes(file.size)}`,
    `Signature: ${file.signature || "Unknown"}`,
    `MIME: ${file.mimeType || "application/octet-stream"}`,
    `Risk: ${capitalize(file.riskLevel || "unknown")} (${Number(file.riskScore) || 0}/100)`,
    `Entropy: ${file.entropy} bits/byte`,
    `SHA-256: ${file.sha256}`,
    `Warnings: ${file.warnings?.length ? file.warnings.join("; ") : "No obvious local indicators"}`,
  ].join("\n")
}

function capitalize(value) {
  const text = String(value || "")
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ""
}

function formatBytes(value) {
  const bytes = Number(value || 0)
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

function showToast(message, error = false) {
  elements.toast.textContent = message
  elements.toast.classList.toggle("error", error)
  elements.toast.classList.remove("hidden")
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => elements.toast.classList.add("hidden"), 3200)
}

render()
