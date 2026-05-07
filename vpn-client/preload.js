const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("api", {
  connectVPN: (config) => ipcRenderer.invoke("connect-vpn", config),
  disconnectVPN: () => ipcRenderer.invoke("disconnect-vpn"),
  getStatus: () => ipcRenderer.invoke("get-status"),
  parseVlessLink: (link) => ipcRenderer.invoke("parse-vless-link", link),
  getServers: () => ipcRenderer.invoke("get-servers"),
  connectSavedServer: (index, overrides) => ipcRenderer.invoke("connect-saved-server", index, overrides),
  saveServer: (server) => ipcRenderer.invoke("save-server", server),
  deleteServer: (index) => ipcRenderer.invoke("delete-server", index),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),
  onStatusUpdate: (callback) => {
    const listener = (_event, status) => callback(status)
    ipcRenderer.on("status-updated", listener)
    return () => ipcRenderer.removeListener("status-updated", listener)
  },
})
