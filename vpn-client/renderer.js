let currentStatus = { connected: false }
let currentSettings = null
let savedServers = []

const elements = {
  statusBadge: document.getElementById("statusBadge"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  connectionState: document.getElementById("connectionState"),
  routeMode: document.getElementById("routeMode"),
  activeServer: document.getElementById("activeServer"),
  activeProtocol: document.getElementById("activeProtocol"),
  uptimeValue: document.getElementById("uptimeValue"),
  latencyValue: document.getElementById("latencyValue"),
  helperValue: document.getElementById("helperValue"),
  downSpeed: document.getElementById("downSpeed"),
  upSpeed: document.getElementById("upSpeed"),
  downTotal: document.getElementById("downTotal"),
  upTotal: document.getElementById("upTotal"),
  activeConnections: document.getElementById("activeConnections"),
  killSwitchState: document.getElementById("killSwitchState"),
  platformValue: document.getElementById("platformValue"),
  cpuValue: document.getElementById("cpuValue"),
  memoryValue: document.getElementById("memoryValue"),
  electronValue: document.getElementById("electronValue"),
  nodeValue: document.getElementById("nodeValue"),
  auditScore: document.getElementById("auditScore"),
  auditLevel: document.getElementById("auditLevel"),
  auditSummary: document.getElementById("auditSummary"),
  auditFindings: document.getElementById("auditFindings"),
  refreshAuditBtn: document.getElementById("refreshAuditBtn"),
  linkInput: document.getElementById("linkInput"),
  connectLinkBtn: document.getElementById("connectLinkBtn"),
  addServerForm: document.getElementById("addServerForm"),
  serverList: document.getElementById("serverList"),
  serverCount: document.getElementById("serverCount"),
  settingsForm: document.getElementById("settingsForm"),
  settingsState: document.getElementById("settingsState"),
  notice: document.getElementById("notice"),
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function setText(id, value) {
  const element = document.getElementById(id)
  if (element) element.textContent = value
}

function setChecked(id, value) {
  const element = document.getElementById(id)
  if (element) element.checked = Boolean(value)
}

function setValue(id, value) {
  const element = document.getElementById(id)
  if (element) element.value = value ?? ""
}

function getChecked(id) {
  return document.getElementById(id).checked
}

function getValue(id) {
  return document.getElementById(id).value
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0
  const units = ["B", "KB", "MB", "GB", "TB"]
  let amount = value
  let unitIndex = 0

  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024
    unitIndex += 1
  }

  return `${amount >= 10 || unitIndex === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`
}

function formatRate(bytes) {
  return `${formatBytes(bytes)}/s`
}

function formatDuration(startedAt) {
  if (!startedAt) return "0s"
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${rest}s`
  return `${rest}s`
}

function notify(message, tone = "neutral") {
  elements.notice.textContent = message
  elements.notice.dataset.tone = tone
}

function updateStatus(status) {
  currentStatus = status
  const connected = status.connected === true
  const connecting = status.connecting === true

  elements.statusBadge.textContent = connecting ? "Connecting" : connected ? "Connected" : "Disconnected"
  elements.statusBadge.dataset.state = connecting ? "connecting" : connected ? "connected" : "disconnected"
  elements.connectionState.textContent = connecting ? "Starting route" : connected ? "Route active" : "Idle"
  elements.connectBtn.disabled = connecting || connected
  elements.disconnectBtn.disabled = connecting && !connected

  elements.routeMode.textContent = status.mode ? status.mode.toUpperCase() : "Proxy"
  elements.activeServer.textContent = status.server || "None"
  elements.activeProtocol.textContent = status.type ? status.type.toUpperCase() : "None"
  elements.uptimeValue.textContent = formatDuration(status.connectedAt)
  elements.latencyValue.textContent = status.health?.latencyMs ? `${status.health.latencyMs} ms` : "N/A"
  elements.helperValue.textContent = status.tun?.active ? `${status.tun.helper} / ${status.tun.interfaceName}` : status.localProxy ? "Local proxy" : "None"
  elements.downSpeed.textContent = formatRate(status.speed?.down)
  elements.upSpeed.textContent = formatRate(status.speed?.up)
  elements.downTotal.textContent = `${formatBytes(status.bytesTransferred?.down)} total`
  elements.upTotal.textContent = `${formatBytes(status.bytesTransferred?.up)} total`
  elements.activeConnections.textContent = String(status.activeConnections || 0)
  elements.killSwitchState.textContent = status.killSwitchActive ? "Kill switch blocking" : "Kill switch clear"

  if (status.specs) {
    elements.platformValue.textContent = `${status.specs.platform} / ${status.specs.arch}`
    elements.cpuValue.textContent = `${status.specs.cores} cores`
    elements.memoryValue.textContent = `${formatBytes(status.specs.rssBytes)} app / ${formatBytes(status.specs.freeMemoryBytes)} free`
    elements.electronValue.textContent = status.specs.electron || "N/A"
    elements.nodeValue.textContent = status.specs.node || "N/A"
  }

  if (status.lastError) notify(status.lastError, "warning")
}

function renderSafetyReport(report) {
  elements.auditScore.textContent = String(report.score)
  elements.auditLevel.textContent = report.level
  elements.auditSummary.textContent = report.summary

  const findings = report.findings || []
  if (findings.length === 0) {
    elements.auditFindings.innerHTML = '<div class="empty-state">No safety findings.</div>'
    return
  }

  elements.auditFindings.innerHTML = findings
    .map(
      (finding) => `
        <article class="audit-item" data-severity="${escapeHTML(finding.severity)}">
          <strong>${escapeHTML(finding.title)}</strong>
          <p>${escapeHTML(finding.detail)}</p>
        </article>
      `,
    )
    .join("")
}

async function refreshSafetyReport() {
  const report = await window.api.getSafetyReport()
  renderSafetyReport(report)
}

function applySettings(settings) {
  currentSettings = settings
  setValue("connectionMode", settings.connectionMode)
  setValue("localPort", settings.localPort)
  setChecked("allowLan", settings.allowLan)
  setValue("networkService", settings.networkService)
  setValue("killSwitchMode", settings.killSwitchMode)
  setValue("ipv6Mode", settings.ipv6Mode)
  setValue("dnsServers", (settings.dnsServers || []).join("\n"))
  setChecked("dnsProtection", settings.dnsProtection)
  setChecked("blockPrivateDestinations", settings.blockPrivateDestinations)
  setChecked("autoReconnect", settings.autoReconnect)
  setValue("maxReconnectAttempts", settings.maxReconnectAttempts)
  setValue("healthCheckInterval", settings.healthCheckInterval)
  setValue("connectTimeout", settings.connectTimeout)
  setChecked("allowInsecureTransport", settings.allowInsecureTransport)
  setValue("tlsMinVersion", settings.tlsMinVersion)
  setChecked("saveSecrets", settings.saveSecrets)
  setChecked("minimizeLogs", settings.minimizeLogs)
  setValue("tunHelper", settings.tun?.helper)
  setValue("tunHelperPath", settings.tun?.helperPath)
  setValue("tunInterfaceName", settings.tun?.interfaceName)
  setValue("tunAddress", settings.tun?.address)
  setValue("tunMtu", settings.tun?.mtu)
  setValue("tunStack", settings.tun?.stack)
  setChecked("tunAutoRoute", settings.tun?.autoRoute)
  setChecked("tunStrictRoute", settings.tun?.strictRoute)
  setValue("tunCustomArgs", settings.tun?.customArgs)
}

function readSettings() {
  return {
    connectionMode: getValue("connectionMode"),
    localPort: Number.parseInt(getValue("localPort"), 10),
    allowLan: getChecked("allowLan"),
    networkService: getValue("networkService"),
    killSwitchMode: getValue("killSwitchMode"),
    ipv6Mode: getValue("ipv6Mode"),
    dnsServers: getValue("dnsServers")
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean),
    dnsProtection: getChecked("dnsProtection"),
    blockPrivateDestinations: getChecked("blockPrivateDestinations"),
    autoReconnect: getChecked("autoReconnect"),
    maxReconnectAttempts: Number.parseInt(getValue("maxReconnectAttempts"), 10),
    healthCheckInterval: Number.parseInt(getValue("healthCheckInterval"), 10),
    connectTimeout: Number.parseInt(getValue("connectTimeout"), 10),
    allowInsecureTransport: getChecked("allowInsecureTransport"),
    tlsMinVersion: getValue("tlsMinVersion"),
    saveSecrets: getChecked("saveSecrets"),
    minimizeLogs: getChecked("minimizeLogs"),
    tun: {
      helper: getValue("tunHelper"),
      helperPath: getValue("tunHelperPath"),
      interfaceName: getValue("tunInterfaceName"),
      address: getValue("tunAddress"),
      mtu: Number.parseInt(getValue("tunMtu"), 10),
      stack: getValue("tunStack"),
      autoRoute: getChecked("tunAutoRoute"),
      strictRoute: getChecked("tunStrictRoute"),
      customArgs: getValue("tunCustomArgs"),
    },
  }
}

async function loadSettings() {
  const settings = await window.api.getSettings()
  applySettings(settings)
}

function serverSummary(server) {
  const mode = currentSettings?.connectionMode || server.mode || "proxy"
  const secret = server.secretStorage === "os" ? "secret in OS keychain" : server.secretStored ? "legacy secret saved" : server.secretRedacted ? "secret not saved" : "no secret"
  return `${String(server.type).toUpperCase()} / ${mode.toUpperCase()} / ${server.host}:${server.port} / ${secret}`
}

async function loadServers() {
  savedServers = await window.api.getServers()
  elements.serverCount.textContent = `${savedServers.length} saved`

  if (savedServers.length === 0) {
    elements.serverList.innerHTML = '<div class="empty-state">No saved servers.</div>'
    return
  }

  elements.serverList.innerHTML = savedServers
    .map(
      (server, index) => `
        <article class="server-card">
          <div>
            <strong>${escapeHTML(server.name || "Unnamed server")}</strong>
            <span>${escapeHTML(serverSummary(server))}</span>
          </div>
          <div class="server-actions">
            <button class="button small secondary" data-server-action="connect" data-server-index="${index}" type="button">Connect</button>
            <button class="button small danger" data-server-action="delete" data-server-index="${index}" type="button">Delete</button>
          </div>
        </article>
      `,
    )
    .join("")

  elements.serverList.querySelectorAll("[data-server-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.serverIndex)
      if (!Number.isInteger(index) || index < 0) return
      if (button.dataset.serverAction === "connect") await connectToServer(index)
      if (button.dataset.serverAction === "delete") await deleteServer(index)
    })
  })
}

async function connectToServer(index) {
  const server = savedServers[index]
  if (!server) return

  notify("Starting route...")
  const result = await window.api.connectSavedServer(index, {
    mode: getValue("connectionMode"),
    localPort: Number.parseInt(getValue("localPort"), 10),
    allowLan: getChecked("allowLan"),
  })

  if (result.success) {
    updateStatus(result.status)
    await refreshSafetyReport()
    notify("Route active.", "success")
  } else {
    notify(result.error, "danger")
  }
}

async function deleteServer(index) {
  await window.api.deleteServer(index)
  await loadServers()
  notify("Server deleted.")
}

async function quickConnect() {
  if (savedServers.length === 0) {
    notify("Add a server first or use a quick connect link.", "warning")
    return
  }
  await connectToServer(0)
}

async function connectFromLink() {
  const link = elements.linkInput.value.trim()
  if (!link) {
    notify("Paste a connection link first.", "warning")
    return
  }

  const parsed = await window.api.parseVlessLink(link)
  if (!parsed.success) {
    notify(parsed.error, "danger")
    return
  }

  const result = await window.api.connectVPN({
    ...parsed.config,
    mode: getValue("connectionMode"),
    localPort: Number.parseInt(getValue("localPort"), 10),
    allowLan: getChecked("allowLan"),
  })

  if (result.success) {
    updateStatus(result.status)
    await refreshSafetyReport()
    notify("Route active.", "success")
  } else {
    notify(result.error, "danger")
  }
}

elements.connectBtn.addEventListener("click", quickConnect)
elements.disconnectBtn.addEventListener("click", async () => {
  await window.api.disconnectVPN()
  const status = await window.api.getStatus()
  updateStatus(status)
  await refreshSafetyReport()
  notify("Disconnected.")
})
elements.connectLinkBtn.addEventListener("click", connectFromLink)
elements.refreshAuditBtn.addEventListener("click", refreshSafetyReport)

elements.addServerForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  const formData = new FormData(elements.addServerForm)
  const server = {
    name: formData.get("name"),
    type: formData.get("type"),
    host: formData.get("host"),
    port: Number.parseInt(formData.get("port"), 10),
    uuid: formData.get("uuid"),
    password: formData.get("uuid"),
    method: formData.get("method"),
    sni: formData.get("sni"),
    mode: getValue("connectionMode"),
    localPort: Number.parseInt(getValue("localPort"), 10),
    allowLan: getChecked("allowLan"),
  }

  const result = await window.api.saveServer(server)
  if (result.success) {
    elements.addServerForm.reset()
    await loadServers()
    notify(currentSettings?.saveSecrets ? "Server saved with configured secret policy." : "Server saved without secret material.", "success")
  } else {
    notify(result.error || "Could not save server.", "danger")
  }
})

elements.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  const result = await window.api.saveSettings(readSettings())
  if (result.success) {
    applySettings(result.settings)
    await refreshSafetyReport()
    elements.settingsState.textContent = "Saved"
    notify("Settings saved.", "success")
  } else {
    notify(result.error || "Could not save settings.", "danger")
  }
})

async function refreshStatus() {
  const status = await window.api.getStatus()
  updateStatus(status)
}

async function initialize() {
  await loadSettings()
  await loadServers()
  await refreshStatus()
  await refreshSafetyReport()
  window.api.onStatusUpdate(updateStatus)
  setInterval(refreshStatus, 1000)
  setInterval(() => {
    if (currentStatus.connected) elements.uptimeValue.textContent = formatDuration(currentStatus.connectedAt)
  }, 1000)
}

initialize().catch((error) => notify(error.message, "danger"))
