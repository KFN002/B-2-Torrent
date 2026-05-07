let connectionStatus = { connected: false }

// Update UI with current status
async function updateStatus() {
  const status = await window.api.getStatus()
  connectionStatus = status

  const statusBadge = document.getElementById("statusBadge")
  const statusText = document.getElementById("statusText")
  const publicIP = document.getElementById("publicIP")
  const serverInfo = document.getElementById("serverInfo")
  const protocolType = document.getElementById("protocolType")
  const connectBtn = document.getElementById("connectBtn")
  const disconnectBtn = document.getElementById("disconnectBtn")

  if (status.connected) {
    statusBadge.textContent = "Connected"
    statusBadge.classList.add("connected")
    statusText.textContent = "Connected"
    publicIP.textContent = status.ip || "Loading..."
    serverInfo.textContent = status.server || "N/A"
    protocolType.textContent = status.type || "N/A"
    connectBtn.style.display = "none"
    disconnectBtn.style.display = "flex"
  } else {
    statusBadge.textContent = "Disconnected"
    statusBadge.classList.remove("connected")
    statusText.textContent = "Disconnected"
    publicIP.textContent = "N/A"
    serverInfo.textContent = "N/A"
    protocolType.textContent = "N/A"
    connectBtn.style.display = "flex"
    disconnectBtn.style.display = "none"
  }
}

// Load saved servers
async function loadServers() {
  const servers = await window.api.getServers()
  const serverList = document.getElementById("serverList")

  if (servers.length === 0) {
    serverList.innerHTML = '<div class="info-text">No saved servers. Add one to get started!</div>'
    return
  }

  serverList.innerHTML = servers
    .map(
      (server, index) => `
        <div class="server-item">
            <div class="server-info">
                <div class="server-name">${server.name}</div>
                <div class="server-details">${server.type.toUpperCase()} • ${server.host}:${server.port}</div>
            </div>
            <div class="server-actions">
                <button class="btn btn-small btn-primary" onclick="connectToServer(${index})">Connect</button>
                <button class="btn btn-small btn-danger" onclick="deleteServer(${index})">Delete</button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Connect to server
async function connectToServer(index) {
  const servers = await window.api.getServers()
  const server = servers[index]

  const result = await window.api.connectVPN(server)

  if (result.success) {
    await updateStatus()
  } else {
    alert("Connection failed: " + result.error)
  }
}

// Delete server
async function deleteServer(index) {
  if (confirm("Delete this server?")) {
    await window.api.deleteServer(index)
    await loadServers()
  }
}

// Show settings panel
function showSettings() {
  document.getElementById("settingsModal").style.display = "flex"
  loadSettings()
}

// Load settings
async function loadSettings() {
  const settings = await window.api.getSettings()

  document.getElementById("killSwitch").checked = settings.killSwitch
  document.getElementById("dnsProtection").checked = settings.dnsProtection
  document.getElementById("ipv6Blocking").checked = settings.ipv6Blocking
  document.getElementById("autoReconnect").checked = settings.autoReconnect
}

// Save settings
async function saveSettings() {
  const settings = {
    killSwitch: document.getElementById("killSwitch").checked,
    dnsProtection: document.getElementById("dnsProtection").checked,
    ipv6Blocking: document.getElementById("ipv6Blocking").checked,
    autoReconnect: document.getElementById("autoReconnect").checked,
    splitTunneling: { enabled: false, apps: [] },
  }

  await window.api.saveSettings(settings)
  document.getElementById("settingsModal").style.display = "none"
  alert("Settings saved successfully!")
}

// Show about panel
async function showAbout() {
  const info = await window.api.getAppInfo()

  const aboutHTML = `
    <div class="about-content">
      <h1>${info.name}</h1>
      <p class="version">Version ${info.version}</p>
      <p class="description">${info.description}</p>
      
      <h3>Features</h3>
      <ul class="feature-list">
        ${info.features.map((f) => `<li>✓ ${f}</li>`).join("")}
      </ul>
      
      <p class="author">Developed by ${info.author}</p>
      <p class="license">License: ${info.license}</p>
      
      <div class="security-notice">
        <strong>⚠️ Security Notice:</strong> This application provides maximum anonymity and security. 
        All traffic is encrypted and routed through secure servers. No logs are kept. 
        Kill-switch ensures no data leaks even if VPN disconnects.
      </div>
    </div>
  `

  document.getElementById("aboutModal").innerHTML = aboutHTML
  document.getElementById("aboutModal").style.display = "flex"
}

// Event listeners
document.getElementById("connectBtn").addEventListener("click", async () => {
  const servers = await window.api.getServers()
  if (servers.length > 0) {
    connectToServer(0)
  } else {
    alert("Please add a server first or use Quick Connect via link.")
  }
})

document.getElementById("disconnectBtn").addEventListener("click", async () => {
  await window.api.disconnectVPN()
  await updateStatus()
})

document.getElementById("connectLinkBtn").addEventListener("click", async () => {
  const link = document.getElementById("linkInput").value.trim()

  if (!link) {
    alert("Please enter a connection link")
    return
  }

  const result = await window.api.parseVlessLink(link)

  if (result.success) {
    const connectResult = await window.api.connectVPN(result.config)
    if (connectResult.success) {
      await updateStatus()
    } else {
      alert("Connection failed: " + connectResult.error)
    }
  } else {
    alert("Invalid link format: " + result.error)
  }
})

document.getElementById("addServerBtn").addEventListener("click", () => {
  document.getElementById("addServerModal").style.display = "flex"
})

document.getElementById("cancelAddBtn").addEventListener("click", () => {
  document.getElementById("addServerModal").style.display = "none"
})

document.getElementById("addServerForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)
  const server = {
    name: formData.get("name"),
    type: formData.get("type"),
    host: formData.get("host"),
    port: Number.parseInt(formData.get("port")),
    uuid: formData.get("uuid"),
  }

  await window.api.saveServer(server)
  await loadServers()

  document.getElementById("addServerModal").style.display = "none"
  e.target.reset()
})

// Event listeners for new buttons
document.getElementById("settingsBtn").addEventListener("click", showSettings)
document.getElementById("aboutBtn").addEventListener("click", showAbout)
document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings)
document.getElementById("closeSettingsBtn").addEventListener("click", () => {
  document.getElementById("settingsModal").style.display = "none"
})
document.getElementById("closeAboutBtn").addEventListener("click", () => {
  document.getElementById("aboutModal").style.display = "none"
})

// Initialize
updateStatus()
loadServers()
setInterval(updateStatus, 5000)
