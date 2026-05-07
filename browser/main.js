const { app, BrowserWindow, ipcMain, session, Menu, BrowserView } = require("electron")
const path = require("path")
const Store = require("electron-store")
const B2SearchEngine = require("./search-engine")
const searchEngine = new B2SearchEngine()

app.commandLine.appendSwitch("disable-http-cache")
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache")
app.commandLine.appendSwitch("disable-application-cache")
app.commandLine.appendSwitch("disk-cache-size", "0")
app.commandLine.appendSwitch("media-cache-size", "0")
app.commandLine.appendSwitch(
  "disable-features",
  "MediaRouter,HardwareMediaKeyHandling,NetworkPrediction,Prerender,AutofillServerCommunication",
)
app.commandLine.appendSwitch("enable-features", "NetworkService,NetworkServiceInProcess")
app.commandLine.appendSwitch("disable-background-networking")
app.commandLine.appendSwitch("disable-background-timer-throttling")
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows")
app.commandLine.appendSwitch("disable-breakpad")
app.commandLine.appendSwitch("disable-component-update")
app.commandLine.appendSwitch("disable-domain-reliability")
app.commandLine.appendSwitch("disable-sync")
app.commandLine.appendSwitch("disable-web-resources")
app.commandLine.appendSwitch("enable-quic")
app.commandLine.appendSwitch("no-pings")
app.commandLine.appendSwitch("no-referrers")

app.commandLine.appendSwitch("disable-logging")
app.commandLine.appendSwitch("log-level", "3")
app.commandLine.appendSwitch("disable-crashreporter")

app.commandLine.appendSwitch("disable-webgl")
app.commandLine.appendSwitch("disable-webgl2")
app.commandLine.appendSwitch("disable-canvas-aa")
app.commandLine.appendSwitch("disable-2d-canvas-clip-aa")
app.commandLine.appendSwitch("disable-gl-drawing-for-tests")

const store = new Store({
  name: "secure-browser-temp",
  clearInvalidConfig: true,
  encryptionKey: "b2-secure-random-key-" + Date.now(),
})

const blockLists = {
  ads: [
    "ads",
    "adserver",
    "adsystem",
    "adservice",
    "doubleclick",
    "googlesyndication",
    "googleadservices",
    "google-analytics",
    "googletagmanager",
    "facebook.com/tr",
    "connect.facebook.net",
    "scorecardresearch",
    "quantserve",
    "advertising",
    "banner",
    "sponsor",
    "affiliate",
    "admob",
    "adsense",
    "adroll",
    "outbrain",
    "taboola",
    "criteo",
    "adnxs",
    "pubmatic",
    "rubiconproject",
    "openx",
    "bidswitch",
  ],
  trackers: [
    "analytics",
    "tracking",
    "tracker",
    "telemetry",
    "metrics",
    "beacon",
    "pixel",
    "tag",
    "visitor",
    "cookie",
    "fingerprint",
    "hotjar",
    "mouseflow",
    "clarity",
    "segment",
    "mixpanel",
    "amplitude",
    "heap",
    "fullstory",
    "logrocket",
    "sentry",
    "bugsnag",
    "rollbar",
    "raygun",
    "newrelic",
  ],
  malware: [
    "malware",
    "virus",
    "trojan",
    "ransomware",
    "spyware",
    "adware",
    "cryptominer",
    "coinhive",
    "coin-hive",
    "crypto-loot",
    "cryptoloot",
    "minero",
    "jsecoin",
    "webminepool",
    "minergate",
    "cnhv.co",
    "authedmine",
  ],
  social: [
    "facebook.com/plugins",
    "twitter.com/widgets",
    "linkedin.com/embed",
    "instagram.com/embed",
    "pinterest.com/assets",
    "addthis",
    "sharethis",
    "shareaholic",
    "addtoany",
    "social-plugins",
    "like-button",
    "share-button",
  ],
  fingerprinting: [
    "fingerprint2",
    "fingerprintjs",
    "creepjs",
    "clientjs",
    "augur.io",
    "iovation",
    "threatmetrix",
    "device-fingerprint",
    "browser-fingerprint",
  ],
}

let blockStats = {
  ads: 0,
  trackers: 0,
  malware: 0,
  social: 0,
  fingerprinting: 0,
  total: 0,
}

let mainWindow
let proxyConfig = null
const tabs = new Map() // Store tab ID -> BrowserView mapping
let activeTabId = null
let tabCounter = 0

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy":
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Content-Security-Policy":
    "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:;",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-DNS-Prefetch-Control": "off",
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      partition: "persist:secure-session",
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableRemoteModule: false,
      cache: false,
      disableHtmlFullscreenWindowResize: true,
      enableWebSQL: false,
      v8CacheOptions: "none",
      spellcheck: false,
      webgl: false,
      plugins: false,
      javascript: true,
      images: true,
      textAreasAreResizable: false,
      safeDialogs: true,
      navigateOnDragDrop: false,
    },
    icon: path.join(__dirname, "icons", "icon.png"),
    title: "B2 Secure Browser - Stealth Mode",
    show: false,
  })

  Menu.setApplicationMenu(null)

  mainWindow.loadFile("index.html")

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.on("closed", () => {
    tabs.forEach((view) => {
      if (view && !view.isDestroyed()) {
        mainWindow.removeBrowserView(view)
        view.webContents.destroy()
      }
    })
    tabs.clear()
    mainWindow = null
    clearAllData()
  })
}

function createTab(url = "about:blank") {
  const tabId = `tab-${++tabCounter}-${Date.now()}`

  const tabSession = session.fromPartition(`persist:tab-${tabId}`, { cache: false })

  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: `persist:tab-${tabId}`,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      cache: false,
      webgl: false,
      plugins: false,
      javascript: true,
      images: true,
      safeDialogs: true,
      navigateOnDragDrop: false,
    },
  })

  configureTabSecurity(tabSession)

  if (proxyConfig) {
    tabSession.setProxy({ proxyRules: proxyConfig })
  }

  const customUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  tabSession.setUserAgent(customUserAgent + " DNT/1")

  view.webContents.on("did-start-loading", () => {
    if (activeTabId === tabId) {
      mainWindow.webContents.send("tab-loading", { tabId, loading: true })
    }
  })

  view.webContents.on("did-stop-loading", () => {
    if (activeTabId === tabId) {
      const title = view.webContents.getTitle()
      const url = view.webContents.getURL()
      mainWindow.webContents.send("tab-updated", { tabId, title, url, loading: false })
    }
  })

  view.webContents.on("did-finish-load", () => {
    injectAntiFingerprinting(view.webContents)
  })

  view.webContents.on("page-title-updated", (event, title) => {
    mainWindow.webContents.send("tab-title-updated", { tabId, title })
  })

  view.webContents.setWindowOpenHandler(({ url }) => {
    const newTabId = createTab(url)
    switchToTab(newTabId)
    return { action: "deny" }
  })

  tabs.set(tabId, view)

  if (url && url !== "about:blank") {
    view.webContents.loadURL(url)
  }

  return tabId
}

function configureTabSecurity(ses) {
  ses.clearStorageData({
    storages: [
      "cookies",
      "filesystem",
      "indexdb",
      "localstorage",
      "shadercache",
      "websql",
      "serviceworkers",
      "cachestorage",
    ],
  })
  ses.clearCache()
  ses.clearAuthCache()
  ses.clearHostResolverCache()

  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const deniedPermissions = [
      "geolocation",
      "notifications",
      "media",
      "mediaKeySystem",
      "midi",
      "pointerLock",
      "fullscreen",
      "openExternal",
      "clipboard-read",
      "clipboard-sanitized-write",
    ]
    callback(deniedPermissions.includes(permission) ? false : true)
  })

  ses.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url.toLowerCase()
    let shouldBlock = false
    let blockType = null

    for (const [category, patterns] of Object.entries(blockLists)) {
      if (patterns.some((pattern) => url.includes(pattern))) {
        shouldBlock = true
        blockType = category
        blockStats[category]++
        blockStats.total++
        break
      }
    }

    if (!shouldBlock) {
      const suspiciousPatterns = [
        /\b(ad|ads|banner|popup|popunder)\d+\b/i,
        /\/ad[_-]?server/i,
        /\/track[_-]?pixel/i,
        /\/analytics[_-]?js/i,
        /\/collect[?&]/i,
        /\/beacon[?&]/i,
        /click[._-]?(tracker|track)/i,
        /imp[._-]?pixel/i,
      ]

      if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
        shouldBlock = true
        blockType = "heuristic"
        blockStats.total++
      }
    }

    callback({ cancel: shouldBlock })
  })

  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders["Referer"]
    delete details.requestHeaders["Origin"]
    details.requestHeaders["DNT"] = "1"
    details.requestHeaders["Sec-GPC"] = "1"
    delete details.requestHeaders["X-Client-Data"]
    callback({ requestHeaders: details.requestHeaders })
  })

  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        ...securityHeaders,
      },
    })
  })
}

function injectAntiFingerprinting(webContents) {
  webContents.executeJavaScript(`
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      const context = this.getContext('2d');
      if (context) {
        const imageData = context.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = imageData.data[i] ^ Math.floor(Math.random() * 10);
        }
        context.putImageData(imageData, 0, 0);
      }
      return originalToDataURL.apply(this, arguments);
    };

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return 'Generic GPU';
      if (param === 37446) return 'Generic Vendor';
      return getParameter.apply(this, arguments);
    };

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const originalCreateOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function() {
        const oscillator = originalCreateOscillator.apply(this, arguments);
        const originalStart = oscillator.start;
        oscillator.start = function() {
          this.frequency.value = this.frequency.value + Math.random() * 0.01;
          return originalStart.apply(this, arguments);
        };
        return oscillator;
      };
    }

    Date.prototype.getTimezoneOffset = function() { return 0; };

    Object.defineProperty(screen, 'width', { get: () => 1920 });
    Object.defineProperty(screen, 'height', { get: () => 1080 });
    Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
    Object.defineProperty(screen, 'availHeight', { get: () => 1040 });

    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });

    console.log('[B2 Secure Browser] Anti-fingerprinting protection active');
  `)
}

function switchToTab(tabId) {
  const view = tabs.get(tabId)
  if (!view) return

  if (activeTabId && tabs.has(activeTabId)) {
    const currentView = tabs.get(activeTabId)
    if (currentView && !currentView.isDestroyed()) {
      mainWindow.removeBrowserView(currentView)
    }
  }

  activeTabId = tabId
  mainWindow.addBrowserView(view)

  const bounds = mainWindow.getContentBounds()
  view.setBounds({ x: 0, y: 90, width: bounds.width, height: bounds.height - 120 })
  view.setAutoResize({ width: true, height: true })

  const title = view.webContents.getTitle()
  const url = view.webContents.getURL()
  mainWindow.webContents.send("tab-switched", {
    tabId,
    title,
    url,
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward(),
  })
}

function closeTab(tabId) {
  const view = tabs.get(tabId)
  if (!view) return

  if (activeTabId === tabId) {
    mainWindow.removeBrowserView(view)
  }

  const tabSession = view.webContents.session
  tabSession.clearStorageData()
  tabSession.clearCache()

  view.webContents.destroy()
  tabs.delete(tabId)

  if (activeTabId === tabId) {
    const remainingTabs = Array.from(tabs.keys())
    if (remainingTabs.length > 0) {
      switchToTab(remainingTabs[remainingTabs.length - 1])
    } else {
      activeTabId = null
      mainWindow.webContents.send("all-tabs-closed")
    }
  }

  mainWindow.webContents.send("tab-closed", { tabId })
}

async function clearAllData() {
  if (mainWindow) {
    const ses = mainWindow.webContents.session
    await ses.clearStorageData()
    await ses.clearCache()
    await ses.clearAuthCache()
    await ses.clearHostResolverCache()
  }

  store.clear()

  console.log("[Secure Browser] All data cleared")
}

ipcMain.handle("navigate", async (event, url) => {
  const view = tabs.get(activeTabId)
  if (!view) return { success: false }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url
  }

  view.webContents.loadURL(url)
  return { success: true }
})

ipcMain.handle("go-back", () => {
  const view = tabs.get(activeTabId)
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack()
  }
})

ipcMain.handle("go-forward", () => {
  const view = tabs.get(activeTabId)
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward()
  }
})

ipcMain.handle("reload", () => {
  const view = tabs.get(activeTabId)
  if (view) {
    view.webContents.reload()
  }
})

ipcMain.handle("stop", () => {
  const view = tabs.get(activeTabId)
  if (view) {
    view.webContents.stop()
  }
})

ipcMain.handle("get-url", () => {
  const view = tabs.get(activeTabId)
  return view ? view.webContents.getURL() : ""
})

ipcMain.handle("clear-data", async () => {
  await clearAllData()
  return { success: true }
})

ipcMain.handle("set-proxy", async (event, config) => {
  const ses = mainWindow.webContents.session
  if (config && config.enabled) {
    const proxyRules =
      config.type === "socks5"
        ? `socks5://${config.host}:${config.port}`
        : `http=${config.host}:${config.port};https=${config.host}:${config.port}`

    await ses.setProxy({ proxyRules })
    proxyConfig = proxyRules
    store.set("proxy", config)
  } else {
    await ses.setProxy({})
    proxyConfig = null
    store.delete("proxy")
  }
  return { success: true }
})

ipcMain.handle("get-proxy", () => {
  return store.get("proxy", null)
})

ipcMain.handle("get-block-stats", () => {
  return blockStats
})

ipcMain.handle("reset-block-stats", () => {
  blockStats = {
    ads: 0,
    trackers: 0,
    malware: 0,
    social: 0,
    fingerprinting: 0,
    total: 0,
  }
  return { success: true }
})

ipcMain.handle("get-browser-settings", () => {
  return {
    blockAds: true,
    blockTrackers: true,
    blockMalware: true,
    blockSocial: true,
    blockFingerprinting: true,
    clearOnExit: true,
    antiFingerprint: true,
    secureHeaders: true,
    noHistory: true,
    noCache: true,
  }
})

ipcMain.handle("save-browser-settings", (event, settings) => {
  store.set("browserSettings", settings)
  return { success: true }
})

ipcMain.handle("get-browser-info", () => {
  return {
    name: "B2 Secure Browser",
    version: "1.0.0",
    description: "Ultra-secure, anonymous browser with zero logs and complete stealth mode",
    author: "B2-Torrent Team",
    license: "Personal Use Only",
    features: [
      "Zero logs - No history, no cache, no traces",
      "Advanced ad blocking",
      "Tracker blocking",
      "Malware protection",
      "Anti-fingerprinting",
      "Automatic data clearing",
      "Secure headers",
      "WebRTC leak protection",
      "Canvas fingerprint protection",
      "Audio context protection",
      "WebGL fingerprint protection",
      "Timezone spoofing",
      "Screen resolution spoofing",
      "Hardware spoofing",
      "DNT header",
      "GPC header",
      "Tor/VPN proxy support",
      "Privacy-focused search engines",
    ],
  }
})

ipcMain.handle("b2-search", async (event, query) => {
  const results = await searchEngine.search(query)
  return results
})

ipcMain.handle("get-search-settings", () => {
  return searchEngine.loadSettings()
})

ipcMain.handle("save-search-settings", (event, settings) => {
  searchEngine.saveSettings(settings)
  return { success: true }
})

ipcMain.handle("create-tab", async (event, url) => {
  const tabId = createTab(url)
  switchToTab(tabId)
  return { tabId, success: true }
})

ipcMain.handle("switch-tab", async (event, tabId) => {
  switchToTab(tabId)
  return { success: true }
})

ipcMain.handle("close-tab", async (event, tabId) => {
  closeTab(tabId)
  return { success: true }
})

ipcMain.handle("get-tabs", async () => {
  const tabList = []
  tabs.forEach((view, tabId) => {
    tabList.push({
      id: tabId,
      title: view.webContents.getTitle() || "New Tab",
      url: view.webContents.getURL() || "",
      active: tabId === activeTabId,
    })
  })
  return tabList
})

ipcMain.handle("tab-navigate", async (event, { tabId, url }) => {
  const view = tabs.get(tabId || activeTabId)
  if (!view) return { success: false }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url
  }

  view.webContents.loadURL(url)
  return { success: true }
})

ipcMain.handle("tab-go-back", async (event, tabId) => {
  const view = tabs.get(tabId || activeTabId)
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack()
  }
  return { success: true }
})

ipcMain.handle("tab-go-forward", async (event, tabId) => {
  const view = tabs.get(tabId || activeTabId)
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward()
  }
  return { success: true }
})

ipcMain.handle("tab-reload", async (event, tabId) => {
  const view = tabs.get(tabId || activeTabId)
  if (view) {
    view.webContents.reload()
  }
  return { success: true }
})

ipcMain.handle("tab-stop", async (event, tabId) => {
  const view = tabs.get(tabId || activeTabId)
  if (view) {
    view.webContents.stop()
  }
  return { success: true }
})

app.on("ready", () => {
  const savedProxy = store.get("proxy")
  if (savedProxy && savedProxy.enabled) {
    proxyConfig =
      savedProxy.type === "socks5"
        ? `socks5://${savedProxy.host}:${savedProxy.port}`
        : `http=${savedProxy.host}:${savedProxy.port};https=${savedProxy.host}:${savedProxy.port}`
  }

  createWindow()

  setTimeout(() => {
    const initialTabId = createTab()
    switchToTab(initialTabId)
  }, 500)

  session.defaultSession.setSpellCheckerEnabled(false)
  session.defaultSession.setDevicePermissionHandler(() => false)
})

app.on("window-all-closed", () => {
  clearAllData()
  app.quit()
})

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on("before-quit", async () => {
  await clearAllData()
})
