const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("b2FileViewer", {
  openFiles: () => ipcRenderer.invoke("files:open"),
  revealFile: (filePath) => ipcRenderer.invoke("files:reveal", filePath),
  forgetFile: (filePath) => ipcRenderer.invoke("files:forget", filePath),
  deleteFile: (payload) => ipcRenderer.invoke("files:delete", payload),
  getAppInfo: () => ipcRenderer.invoke("app:info"),
})
