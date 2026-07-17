const { app, BrowserWindow, ipcMain, session, Menu, BrowserView } = require("electron")
const path = require("path")

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
app.commandLine.appendSwitch("disable-quic")
app.commandLine.appendSwitch("autoplay-policy", "user-gesture-required")
app.commandLine.appendSwitch("force-webrtc-ip-handling-policy", "disable_non_proxied_udp")
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
  downloads: 0,
  heuristic: 0,
  total: 0,
}

const DEFAULT_BROWSER_SETTINGS = {
  blockAds: true,
  blockTrackers: true,
  blockMalware: true,
  blockSocial: true,
  blockFingerprinting: true,
  blockDownloads: true,
  blockPopups: true,
  clearOnExit: true,
  antiFingerprint: true,
  secureHeaders: true,
  noHistory: true,
  noCache: true,
  httpsOnlyMode: true,
}

let mainWindow
let proxyConfig = null
let store
const tabs = new Map() // Store tab ID -> BrowserView mapping
let activeTabId = null
let tabCounter = 0

async function initializeStorage() {
  if (store) return

  const { default: Store } = await import("electron-store")
  store = new Store({
    name: "secure-browser-temp",
    clearInvalidConfig: true,
    encryptionKey: "b2-secure-random-key-" + Date.now(),
  })
}

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

function isSafeWebUrl(value) {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === "about:") return parsed.href === "about:blank"
    if (parsed.protocol === "https:") return true
    if (parsed.protocol === "http:") return !getBrowserSettings().httpsOnlyMode || isLocalHost(parsed.hostname)
    return false
  } catch {
    return false
  }
}

function normalizeNavigationUrl(value) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol === "http:" && getBrowserSettings().httpsOnlyMode && !isLocalHost(parsed.hostname)) {
      parsed.protocol = "https:"
    }
    return isSafeWebUrl(parsed.href) ? parsed.href : null
  } catch {
    return null
  }
}

function isLocalHost(hostname) {
  const host = String(hostname || "").toLowerCase()
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost")
}

function getBrowserSettings() {
  const stored = store?.get("browserSettings", {}) || {}
  return { ...DEFAULT_BROWSER_SETTINGS, ...stored }
}

function normalizeBrowserSettings(settings = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_BROWSER_SETTINGS).map(([key, fallback]) => [
      key,
      typeof fallback === "boolean" ? (settings[key] === undefined ? fallback : settings[key] === true) : settings[key] ?? fallback,
    ]),
  )
}

function isCategoryEnabled(category, settings) {
  const map = {
    ads: "blockAds",
    trackers: "blockTrackers",
    malware: "blockMalware",
    social: "blockSocial",
    fingerprinting: "blockFingerprinting",
  }
  return settings[map[category]] !== false
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
      partition: "secure-session",
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
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }))
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    try {
      if (new URL(navigationUrl).protocol !== "file:") event.preventDefault()
    } catch {
      event.preventDefault()
    }
  })

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

  const tabSession = session.fromPartition(`tab-${tabId}`, { cache: false })

  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: `tab-${tabId}`,
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
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
  tabSession.setUserAgent(customUserAgent)

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
    if (getBrowserSettings().antiFingerprint) {
      injectAntiFingerprinting(view.webContents)
    }
  })

  view.webContents.on("page-title-updated", (event, title) => {
    mainWindow.webContents.send("tab-title-updated", { tabId, title })
  })

  view.webContents.setWindowOpenHandler(({ url }) => {
    if (getBrowserSettings().blockPopups) {
      blockStats.total++
      return { action: "deny" }
    }
    const newTabId = createTab(url)
    switchToTab(newTabId)
    return { action: "deny" }
  })

  tabs.set(tabId, view)

  view.webContents.on("will-navigate", (event, navigationUrl) => {
    const safeUrl = normalizeNavigationUrl(navigationUrl)
    if (!safeUrl) {
      event.preventDefault()
      return
    }
    if (safeUrl !== navigationUrl) {
      event.preventDefault()
      view.webContents.loadURL(safeUrl)
    }
  })

  view.webContents.on("will-attach-webview", (event) => {
    event.preventDefault()
  })

  if (url && url !== "about:blank") {
    const safeUrl = normalizeNavigationUrl(url)
    if (safeUrl) view.webContents.loadURL(safeUrl)
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

  ses.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  ses.setPermissionCheckHandler(() => false)
  ses.setDevicePermissionHandler(() => false)
  if (typeof ses.setDisplayMediaRequestHandler === "function") {
    ses.setDisplayMediaRequestHandler((_request, callback) => callback({}))
  }

  ses.on("will-download", (event) => {
    if (getBrowserSettings().blockDownloads) {
      blockStats.downloads++
      blockStats.total++
      event.preventDefault()
    }
  })

  ses.webRequest.onBeforeRequest((details, callback) => {
    const settings = getBrowserSettings()
    const url = details.url.toLowerCase()
    if (!url.startsWith("http://") && !url.startsWith("https://") && url !== "about:blank") {
      callback({ cancel: true })
      return
    }
    if (url.startsWith("http://") && settings.httpsOnlyMode) {
      try {
        if (!isLocalHost(new URL(details.url).hostname)) {
          callback({ cancel: true })
          return
        }
      } catch {
        callback({ cancel: true })
        return
      }
    }

    let shouldBlock = false
    let blockType = null

    for (const [category, patterns] of Object.entries(blockLists)) {
      if (!isCategoryEnabled(category, settings)) continue
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
        blockStats.heuristic++
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
      try {
        const context = this.getContext('2d');
        if (context && this.width > 0 && this.height > 0) {
        const imageData = context.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = imageData.data[i] ^ Math.floor(Math.random() * 10);
        }
        context.putImageData(imageData, 0, 0);
        }
      } catch (_) {
      }
      return originalToDataURL.apply(this, arguments);
    };

    if (window.WebGLRenderingContext) {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 37445) return 'Generic GPU';
        if (param === 37446) return 'Generic Vendor';
        return getParameter.apply(this, arguments);
      };
    }

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

  for (const view of tabs.values()) {
    if (!view || view.isDestroyed()) continue
    const ses = view.webContents.session
    await ses.clearStorageData().catch(() => {})
    await ses.clearCache().catch(() => {})
    await ses.clearAuthCache().catch(() => {})
    await ses.clearHostResolverCache().catch(() => {})
  }

  if (store) {
    const preserved = {
      proxy: store.get("proxy"),
      browserSettings: store.get("browserSettings"),
      searchSettings: store.get("searchSettings"),
    }
    store.clear()
    for (const [key, value] of Object.entries(preserved)) {
      if (value !== undefined) store.set(key, value)
    }
  }

  console.log("[Secure Browser] All data cleared")
}

ipcMain.handle("navigate", async (event, url) => {
  const view = tabs.get(activeTabId)
  if (!view) return { success: false }

  const safeUrl = normalizeNavigationUrl(url)
  if (!safeUrl) return { success: false, error: "Unsupported URL scheme" }

  view.webContents.loadURL(safeUrl)
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
  const tabSessions = [...tabs.values()].filter((view) => !view.isDestroyed()).map((view) => view.webContents.session)
  if (config && config.enabled) {
    const port = Number.parseInt(config.port, 10)
    if (!["socks5", "http"].includes(config.type) || !config.host || !Number.isInteger(port) || port < 1 || port > 65535) {
      return { success: false, error: "Invalid proxy configuration" }
    }

    const proxyRules =
      config.type === "socks5"
        ? `socks5://${config.host}:${port}`
        : `http=${config.host}:${port};https=${config.host}:${port}`

    await Promise.all([ses, ...tabSessions].map((targetSession) => targetSession.setProxy({ proxyRules })))
    proxyConfig = proxyRules
    store.set("proxy", { ...config, port })
  } else {
    await Promise.all([ses, ...tabSessions].map((targetSession) => targetSession.setProxy({ mode: "direct" })))
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
    downloads: 0,
    heuristic: 0,
    total: 0,
  }
  return { success: true }
})

ipcMain.handle("get-browser-settings", () => {
  return getBrowserSettings()
})

ipcMain.handle("save-browser-settings", (event, settings) => {
  store.set("browserSettings", normalizeBrowserSettings(settings))
  return { success: true }
})

ipcMain.handle("get-browser-info", () => {
  return {
    name: "B2 Secure Browser",
    version: "1.0.0",
    description: "Privacy-focused browser with ephemeral sessions and local trace reduction",
    author: "B2-Torrent Team",
    license: "Personal Use Only",
    features: [
      "Ephemeral sessions with no saved history or cache",
      "Advanced ad blocking",
      "Tracker blocking",
      "Malware protection",
      "HTTPS-only navigation upgrades",
      "Download blocking by default",
      "Popup blocking by default",
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
      "Proxy-gated search navigation",
    ],
  }
})

ipcMain.handle("b2-search", (_event, query) => {
  return {
    blocked: true,
    reason: "Direct search aggregation is disabled because it could bypass the configured browser proxy.",
    query: String(query || ""),
  }
})

ipcMain.handle("get-search-settings", () => {
  return store.get("searchSettings", {})
})

ipcMain.handle("save-search-settings", (event, settings) => {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return { success: false, error: "Invalid search settings" }
  }
  store.set("searchSettings", {
    safeSearch: settings.safeSearch !== false,
    violentContent: ["filter", "block"].includes(settings.violentContent) ? settings.violentContent : "filter",
    adultContent: ["filter", "block"].includes(settings.adultContent) ? settings.adultContent : "filter",
  })
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

  const safeUrl = normalizeNavigationUrl(url)
  if (!safeUrl) return { success: false, error: "Unsupported URL scheme" }

  view.webContents.loadURL(safeUrl)
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

app.on("ready", async () => {
  try {
    await initializeStorage()
  } catch (error) {
    console.error("[Secure Browser] Failed to initialize storage:", error)
    app.quit()
    return
  }

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
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  session.defaultSession.setPermissionCheckHandler(() => false)
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
