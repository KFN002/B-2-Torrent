const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  navigate: (url) => ipcRenderer.invoke("navigate", url),
  goBack: () => ipcRenderer.invoke("go-back"),
  goForward: () => ipcRenderer.invoke("go-forward"),
  reload: () => ipcRenderer.invoke("reload"),
  stop: () => ipcRenderer.invoke("stop"),
  getUrl: () => ipcRenderer.invoke("get-url"),
  clearData: () => ipcRenderer.invoke("clear-data"),
  setProxy: (config) => ipcRenderer.invoke("set-proxy", config),
  getProxy: () => ipcRenderer.invoke("get-proxy"),
  getBlockStats: () => ipcRenderer.invoke("get-block-stats"),
  resetBlockStats: () => ipcRenderer.invoke("reset-block-stats"),
  getBrowserSettings: () => ipcRenderer.invoke("get-browser-settings"),
  saveBrowserSettings: (settings) => ipcRenderer.invoke("save-browser-settings", settings),
  getBrowserInfo: () => ipcRenderer.invoke("get-browser-info"),
  b2Search: (query) => ipcRenderer.invoke("b2-search", query),
  getSearchSettings: () => ipcRenderer.invoke("get-search-settings"),
  saveSearchSettings: (settings) => ipcRenderer.invoke("save-search-settings", settings),
  createTab: (url) => ipcRenderer.invoke("create-tab", url),
  switchTab: (tabId) => ipcRenderer.invoke("switch-tab", tabId),
  closeTab: (tabId) => ipcRenderer.invoke("close-tab", tabId),
  getTabs: () => ipcRenderer.invoke("get-tabs"),
  tabNavigate: (tabId, url) => ipcRenderer.invoke("tab-navigate", { tabId, url }),
  tabGoBack: (tabId) => ipcRenderer.invoke("tab-go-back", tabId),
  tabGoForward: (tabId) => ipcRenderer.invoke("tab-go-forward", tabId),
  tabReload: (tabId) => ipcRenderer.invoke("tab-reload", tabId),
  tabStop: (tabId) => ipcRenderer.invoke("tab-stop", tabId),
  onTabLoading: (callback) => subscribe("tab-loading", callback),
  onTabUpdated: (callback) => subscribe("tab-updated", callback),
  onTabTitleUpdated: (callback) => subscribe("tab-title-updated", callback),
  onTabSwitched: (callback) => subscribe("tab-switched", callback),
  onTabClosed: (callback) => subscribe("tab-closed", callback),
  onAllTabsClosed: (callback) => subscribe("all-tabs-closed", callback),
})

function subscribe(channel, callback) {
  if (typeof callback !== "function") return () => {}
  const listener = (_event, data) => callback(data)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}
