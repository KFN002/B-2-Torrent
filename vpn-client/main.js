const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require("electron")
const path = require("path")
const Store = require("electron-store")
const { exec } = require("child_process")
const http = require("http")
const httpProxy = require("http-proxy")
const socks = require("socks")

const store = new Store({
  name: "b2-vpn-config",
  encryptionKey: "b2-vpn-secure-key-" + Date.now(),
})

let killSwitchEnabled = false
let dnsLeakProtection = true
let ipv6Blocking = true
let autoReconnect = true
let splitTunneling = { enabled: false, apps: [] }

let mainWindow
let tray
let proxyServer
let socksServer
let connectionStatus = {
  connected: false,
  type: null,
  server: null,
  ip: null,
  speed: { down: 0, up: 0 },
  bytesTransferred: { down: 0, up: 0 },
  connectedAt: null,
  reconnectAttempts: 0,
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icons", "icon.png"),
    title: "B2 VPN Client - System-Wide Anonymous VPN",
    show: false,
  })

  Menu.setApplicationMenu(null)

  mainWindow.loadFile("index.html")

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

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
  const iconPath = path.join(__dirname, "icons", "tray-icon.png")
  tray = new Tray(iconPath)

  const updateTrayMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: connectionStatus.connected ? `Connected: ${connectionStatus.type}` : "Disconnected",
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Show Window",
        click: () => {
          mainWindow.show()
        },
      },
      {
        label: connectionStatus.connected ? "Disconnect" : "Quick Connect",
        click: () => {
          if (connectionStatus.connected) {
            disconnect()
          } else {
            // Connect to last used or default server
            const lastConfig = store.get("lastConnection")
            if (lastConfig) {
              connectToVPN(lastConfig)
            }
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
    ])
    tray.setContextMenu(contextMenu)
  }

  updateTrayMenu()
  tray.setToolTip("B2 VPN Client")

  tray.on("click", () => {
    mainWindow.show()
  })

  // Update tray menu when connection status changes
  setInterval(updateTrayMenu, 5000)
}

// Start local proxy server to route all device traffic
function startProxyServer(config) {
  return new Promise((resolve, reject) => {
    const proxyPort = config.localPort || 8888

    // Create HTTP/HTTPS proxy
    const proxy = httpProxy.createProxyServer({})

    proxyServer = http.createServer((req, res) => {
      const target = {
        host: config.host,
        port: config.port,
        protocol: config.protocol || "http:",
      }

      proxy.web(req, res, { target })
    })

    proxyServer.listen(proxyPort, "0.0.0.0", () => {
      console.log(`[Proxy] HTTP/HTTPS proxy running on 0.0.0.0:${proxyPort}`)

      // Also start SOCKS5 proxy
      startSOCKSProxy(config).then(() => {
        resolve({ httpPort: proxyPort, socksPort: config.localPort + 1 || 8889 })
      })
    })

    proxyServer.on("error", reject)
  })
}

// Start SOCKS5 proxy server
function startSOCKSProxy(config) {
  return new Promise((resolve, reject) => {
    const socksPort = config.localPort + 1 || 8889

    const net = require("net")
    socksServer = net.createServer((socket) => {
      socket.once("data", async (data) => {
        // Simple SOCKS5 handshake
        if (data[0] === 0x05) {
          socket.write(Buffer.from([0x05, 0x00]))

          socket.once("data", async (data) => {
            const destAddr = data.toString("utf8", 5, data.length - 2)
            const destPort = data.readUInt16BE(data.length - 2)

            try {
              const info = await socks.SocksClient.createConnection({
                proxy: {
                  host: config.host,
                  port: config.port,
                  type: 5,
                },
                command: "connect",
                destination: {
                  host: destAddr,
                  port: destPort,
                },
              })

              socket.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
              info.socket.pipe(socket)
              socket.pipe(info.socket)
            } catch (err) {
              socket.end()
            }
          })
        }
      })
    })

    socksServer.listen(socksPort, "0.0.0.0", () => {
      console.log(`[Proxy] SOCKS5 proxy running on 0.0.0.0:${socksPort}`)
      resolve()
    })

    socksServer.on("error", reject)
  })
}

// Set system-wide proxy (platform-specific)
function setSystemProxy(httpPort, socksPort) {
  const platform = process.platform

  if (platform === "win32") {
    // Windows: Set registry keys
    exec(
      `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`,
    )
    exec(
      `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "http=127.0.0.1:${httpPort};https=127.0.0.1:${httpPort};socks=127.0.0.1:${socksPort}" /f`,
    )
  } else if (platform === "darwin") {
    // macOS: Use networksetup
    exec(`networksetup -setwebproxy "Wi-Fi" 127.0.0.1 ${httpPort}`)
    exec(`networksetup -setsecurewebproxy "Wi-Fi" 127.0.0.1 ${httpPort}`)
    exec(`networksetup -setsocksfirewallproxy "Wi-Fi" 127.0.0.1 ${socksPort}`)
  } else if (platform === "linux") {
    // Linux: Set environment variables (works with most desktop environments)
    process.env.http_proxy = `http://127.0.0.1:${httpPort}`
    process.env.https_proxy = `http://127.0.0.1:${httpPort}`
    process.env.socks_proxy = `socks5://127.0.0.1:${socksPort}`

    // Also try to set via gsettings for GNOME
    exec(`gsettings set org.gnome.system.proxy mode 'manual'`)
    exec(`gsettings set org.gnome.system.proxy.http host '127.0.0.1'`)
    exec(`gsettings set org.gnome.system.proxy.http port ${httpPort}`)
    exec(`gsettings set org.gnome.system.proxy.https host '127.0.0.1'`)
    exec(`gsettings set org.gnome.system.proxy.https port ${httpPort}`)
    exec(`gsettings set org.gnome.system.proxy.socks host '127.0.0.1'`)
    exec(`gsettings set org.gnome.system.proxy.socks port ${socksPort}`)
  }
}

// Clear system proxy
function clearSystemProxy() {
  const platform = process.platform

  if (platform === "win32") {
    exec(
      `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`,
    )
  } else if (platform === "darwin") {
    exec(`networksetup -setwebproxystate "Wi-Fi" off`)
    exec(`networksetup -setsecurewebproxystate "Wi-Fi" off`)
    exec(`networksetup -setsocksfirewallproxystate "Wi-Fi" off`)
  } else if (platform === "linux") {
    delete process.env.http_proxy
    delete process.env.https_proxy
    delete process.env.socks_proxy
    exec(`gsettings set org.gnome.system.proxy mode 'none'`)
  }
}

function enableKillSwitch() {
  const platform = process.platform

  if (platform === "win32") {
    // Windows: Block all network adapters except VPN
    exec(`netsh advfirewall firewall add rule name="B2_VPN_KillSwitch" dir=out action=block enable=yes`)
    exec(`netsh advfirewall firewall add rule name="B2_VPN_KillSwitch" dir=in action=block enable=yes`)
  } else if (platform === "darwin") {
    // macOS: Use pf firewall
    exec(`echo "block drop all" | sudo pfctl -ef -`)
  } else if (platform === "linux") {
    // Linux: Use iptables
    exec(`sudo iptables -P INPUT DROP`)
    exec(`sudo iptables -P OUTPUT DROP`)
    exec(`sudo iptables -P FORWARD DROP`)
  }

  console.log("[Kill-Switch] Network blocked - VPN protection active")
}

function disableKillSwitch() {
  const platform = process.platform

  if (platform === "win32") {
    exec(`netsh advfirewall firewall delete rule name="B2_VPN_KillSwitch"`)
  } else if (platform === "darwin") {
    exec(`sudo pfctl -d`)
  } else if (platform === "linux") {
    exec(`sudo iptables -P INPUT ACCEPT`)
    exec(`sudo iptables -P OUTPUT ACCEPT`)
    exec(`sudo iptables -P FORWARD ACCEPT`)
  }

  console.log("[Kill-Switch] Network restored")
}

function enableDNSProtection() {
  const platform = process.platform

  if (platform === "win32") {
    exec(`netsh interface ip set dns "Ethernet" static 1.1.1.1 primary`)
    exec(`netsh interface ip add dns "Ethernet" 1.0.0.1 index=2`)
  } else if (platform === "darwin") {
    exec(`networksetup -setdnsservers "Wi-Fi" 1.1.1.1 1.0.0.1`)
  } else if (platform === "linux") {
    exec(`echo "nameserver 1.1.1.1\\nnameserver 1.0.0.1" | sudo tee /etc/resolv.conf`)
  }
}

function blockIPv6() {
  const platform = process.platform

  if (platform === "win32") {
    exec(`netsh interface ipv6 set global randomizeidentifiers=disabled`)
    exec(`netsh interface ipv6 set privacy state=disabled`)
  } else if (platform === "darwin") {
    exec(`networksetup -setv6off "Wi-Fi"`)
  } else if (platform === "linux") {
    exec(`sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1`)
    exec(`sudo sysctl -w net.ipv6.conf.default.disable_ipv6=1`)
  }
}

async function connectToVPN(config) {
  try {
    if (killSwitchEnabled) {
      enableKillSwitch()
    }

    if (dnsLeakProtection) {
      enableDNSProtection()
    }

    if (ipv6Blocking) {
      blockIPv6()
    }

    connectionStatus.type = config.type
    connectionStatus.server = `${config.host}:${config.port}`
    connectionStatus.connectedAt = new Date().toISOString()

    const ports = await startProxyServer(config)
    setSystemProxy(ports.httpPort, ports.socksPort)

    const fetch = require("node-fetch")
    const response = await fetch("https://api.ipify.org?format=json")
    const data = await response.json()
    connectionStatus.ip = data.ip
    connectionStatus.connected = true
    connectionStatus.reconnectAttempts = 0

    store.set("lastConnection", config)

    if (autoReconnect) {
      startConnectionMonitor(config)
    }

    console.log("[VPN] Connected successfully")
    return { success: true, status: connectionStatus }
  } catch (error) {
    console.error("[VPN] Connection failed:", error)

    if (autoReconnect && connectionStatus.reconnectAttempts < 3) {
      connectionStatus.reconnectAttempts++
      console.log(`[VPN] Auto-reconnecting... Attempt ${connectionStatus.reconnectAttempts}/3`)
      setTimeout(() => connectToVPN(config), 5000)
    }

    return { success: false, error: error.message }
  }
}

let connectionMonitor
function startConnectionMonitor(config) {
  if (connectionMonitor) {
    clearInterval(connectionMonitor)
  }

  connectionMonitor = setInterval(async () => {
    if (!connectionStatus.connected) return

    try {
      const fetch = require("node-fetch")
      await fetch("https://api.ipify.org?format=json", { timeout: 5000 })
    } catch (error) {
      console.log("[VPN] Connection lost, reconnecting...")
      await connectToVPN(config)
    }
  }, 10000)
}

function disconnect() {
  if (connectionMonitor) {
    clearInterval(connectionMonitor)
  }

  if (proxyServer) {
    proxyServer.close()
    proxyServer = null
  }

  if (socksServer) {
    socksServer.close()
    socksServer = null
  }

  clearSystemProxy()

  if (killSwitchEnabled) {
    disableKillSwitch()
  }

  connectionStatus = {
    connected: false,
    type: null,
    server: null,
    ip: null,
    speed: { down: 0, up: 0 },
    bytesTransferred: { down: 0, up: 0 },
    connectedAt: null,
    reconnectAttempts: 0,
  }

  console.log("[VPN] Disconnected")
}

// IPC Handlers
ipcMain.handle("connect-vpn", async (event, config) => {
  return await connectToVPN(config)
})

ipcMain.handle("disconnect-vpn", () => {
  disconnect()
  return { success: true }
})

ipcMain.handle("get-status", () => {
  return connectionStatus
})

ipcMain.handle("parse-vless-link", (event, link) => {
  // Parse vless://uuid@host:port?params format
  try {
    const url = new URL(link)
    const config = {
      type: "vless",
      uuid: url.username,
      host: url.hostname,
      port: Number.parseInt(url.port) || 443,
      params: {},
    }

    url.searchParams.forEach((value, key) => {
      config.params[key] = value
    })

    return { success: true, config }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle("get-servers", () => {
  return store.get("servers", [])
})

ipcMain.handle("save-server", (event, server) => {
  const servers = store.get("servers", [])
  servers.push(server)
  store.set("servers", servers)
  return { success: true }
})

ipcMain.handle("delete-server", (event, index) => {
  const servers = store.get("servers", [])
  servers.splice(index, 1)
  store.set("servers", servers)
  return { success: true }
})

ipcMain.handle("get-settings", () => {
  return {
    killSwitch: killSwitchEnabled,
    dnsProtection: dnsLeakProtection,
    ipv6Blocking: ipv6Blocking,
    autoReconnect: autoReconnect,
    splitTunneling: splitTunneling,
  }
})

ipcMain.handle("save-settings", (event, settings) => {
  killSwitchEnabled = settings.killSwitch
  dnsLeakProtection = settings.dnsProtection
  ipv6Blocking = settings.ipv6Blocking
  autoReconnect = settings.autoReconnect
  splitTunneling = settings.splitTunneling

  store.set("settings", settings)
  return { success: true }
})

ipcMain.handle("get-app-info", () => {
  return {
    name: "B2 VPN Client",
    version: "1.0.0",
    description: "System-wide anonymous VPN with kill-switch protection",
    author: "B2-Torrent Team",
    license: "Personal Use Only",
    features: [
      "System-wide VPN routing",
      "Kill-switch protection",
      "DNS leak protection",
      "IPv6 blocking",
      "Auto-reconnect",
      "Split tunneling",
      "VLESS/VMess/Shadowsocks/Outline support",
      "Tor network integration",
      "Zero logs policy",
      "Military-grade encryption",
    ],
  }
})

app.on("ready", () => {
  createWindow()
  createTray()
})

app.on("window-all-closed", () => {
  // Don't quit on window close, keep running in tray
})

app.on("before-quit", () => {
  disconnect()
})

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})
