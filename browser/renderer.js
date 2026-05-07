let currentTabId = null
let tabs = []

// DOM Elements
const urlBar = document.getElementById("url-bar")
const goBtn = document.getElementById("go-btn")
const backBtn = document.getElementById("back-btn")
const forwardBtn = document.getElementById("forward-btn")
const reloadBtn = document.getElementById("reload-btn")
const clearBtn = document.getElementById("clear-btn")
const proxyBtn = document.getElementById("proxy-btn")
const welcomeScreen = document.getElementById("welcome-screen")
const proxyModal = document.getElementById("proxy-modal")
const proxyStatus = document.getElementById("proxy-status")
const securityStatus = document.getElementById("security-status")
const blockStatsDisplay = document.getElementById("block-stats")
const settingsBtn = document.getElementById("settings-btn")
const aboutBtn = document.getElementById("about-btn")
const saveBrowserSettingsBtn = document.getElementById("save-browser-settings-btn")
const cancelBrowserSettingsBtn = document.getElementById("cancel-browser-settings-btn")
const b2SearchCard = document.getElementById("b2-search-card")
const closeSearchBtn = document.getElementById("close-search")
const searchSettingsBtn = document.getElementById("search-settings-btn")
const searchSettingsModal = document.getElementById("search-settings-modal")
const saveSearchSettingsBtn = document.getElementById("save-search-settings-btn")
const cancelSearchSettingsBtn = document.getElementById("cancel-search-settings-btn")

const tabBar = document.getElementById("tab-bar")
const tabsContainer = document.getElementById("tabs-container")
const newTabBtn = document.getElementById("new-tab-btn")

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function safeHttpUrl(value) {
  try {
    const parsed = new URL(String(value ?? ""))
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : ""
  } catch {
    return ""
  }
}

// Proxy modal elements
const proxyEnabled = document.getElementById("proxy-enabled")
const proxyType = document.getElementById("proxy-type")
const proxyHost = document.getElementById("proxy-host")
const proxyPort = document.getElementById("proxy-port")
const saveProxyBtn = document.getElementById("save-proxy-btn")
const cancelProxyBtn = document.getElementById("cancel-proxy-btn")

// Settings modal elements
const blockAds = document.getElementById("blockAds")
const blockTrackers = document.getElementById("blockTrackers")
const blockMalware = document.getElementById("blockMalware")
const blockSocial = document.getElementById("blockSocial")
const blockFingerprinting = document.getElementById("blockFingerprinting")
const clearOnExit = document.getElementById("clearOnExit")

async function createNewTab(url = null) {
  const result = await window.electronAPI.createTab(url)
  if (result.success) {
    await refreshTabList()
  }
}

async function refreshTabList() {
  tabs = await window.electronAPI.getTabs()
  renderTabs()
}

function renderTabs() {
  tabsContainer.innerHTML = ""

  tabs.forEach((tab) => {
    const tabElement = document.createElement("div")
    tabElement.className = `tab ${tab.active ? "active" : ""}`
    tabElement.dataset.tabId = tab.id

    const tabTitle = document.createElement("span")
    tabTitle.className = "tab-title"
    tabTitle.textContent = tab.title || "New Tab"
    tabTitle.title = tab.title || "New Tab"

    const closeBtn = document.createElement("button")
    closeBtn.className = "tab-close"
    closeBtn.innerHTML = "✕"
    closeBtn.title = "Close tab"

    tabElement.appendChild(tabTitle)
    tabElement.appendChild(closeBtn)

    tabElement.addEventListener("click", (e) => {
      if (!e.target.classList.contains("tab-close")) {
        switchToTab(tab.id)
      }
    })

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      closeTab(tab.id)
    })

    tabsContainer.appendChild(tabElement)

    if (tab.active) {
      currentTabId = tab.id
    }
  })
}

async function switchToTab(tabId) {
  await window.electronAPI.switchTab(tabId)
  await refreshTabList()
}

async function closeTab(tabId) {
  await window.electronAPI.closeTab(tabId)
  await refreshTabList()
}

// Security status indicator
function updateSecurityStatus() {
  if (securityStatus) {
    securityStatus.innerHTML = `
      <span class="status-item">🔒 Encrypted</span>
      <span class="status-item">🚫 No Logs</span>
      <span class="status-item">👻 Stealth Mode</span>
      <span class="status-item">🛡️ Anti-Fingerprint</span>
    `
  }
}

async function updateBlockStats() {
  if (!blockStatsDisplay) return

  const stats = await window.electronAPI.getBlockStats()
  blockStatsDisplay.innerHTML = `
    <span class="status-item">🚫 ${stats.total} Blocked</span>
    <span class="status-item" title="Ads blocked">📢 ${stats.ads} Ads</span>
    <span class="status-item" title="Trackers blocked">👁️ ${stats.trackers} Trackers</span>
    <span class="status-item" title="Malware blocked">🦠 ${stats.malware} Malware</span>
  `
}

// Navigation
async function navigate(url) {
  if (!url) return

  // Check if this is a search query (not a URL)
  if (!url.includes(".") && !url.startsWith("http")) {
    await handleB2Search(url)
    return
  }

  // Handle URL navigation
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url
  }

  await window.electronAPI.navigate(url)
  document.getElementById("search-results").classList.add("hidden")
  welcomeScreen.classList.add("hidden")

  setTimeout(async () => {
    const currentUrl = await window.electronAPI.getUrl()
    urlBar.value = currentUrl
  }, 100)
}

// B2 Search functionality
async function handleB2Search(query) {
  if (!query.trim()) return

  const resultsContainer = document.getElementById("search-results")
  const resultsContent = document.getElementById("search-results-content")

  resultsContainer.classList.remove("hidden")
  welcomeScreen.classList.add("hidden")

  resultsContent.innerHTML = '<div class="loading">🔍 Searching securely...</div>'

  try {
    const searchData = await window.electronAPI.b2Search(query)

    if (searchData.blocked) {
      resultsContent.innerHTML = `
        <div class="blocked-message">
          <div class="blocked-icon">🚫</div>
          <h3>Search Blocked</h3>
          <p>${escapeHTML(searchData.reason)}</p>
          <p class="blocked-query">Query: "${escapeHTML(searchData.query)}"</p>
          <button id="open-search-settings-from-results" class="primary-btn">Open Search Settings</button>
        </div>
      `
      document.getElementById("open-search-settings-from-results")?.addEventListener("click", showSearchSettings)
      return
    }

    if (searchData.error) {
      resultsContent.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>Search Error</h3>
          <p>${searchData.message}</p>
        </div>
      `
      return
    }

    let html = `
      <div class="search-info">
        <p>Found ${Number(searchData.count) || 0} results for "<strong>${escapeHTML(searchData.query)}</strong>"</p>
        <p class="search-engine">Powered by B2 Search (Beta) - Aggregated from multiple privacy-focused sources</p>
        ${searchData.warning ? `<div class="content-warning">⚠️ ${escapeHTML(searchData.warning)}</div>` : ""}
      </div>
    `

    if (searchData.results && searchData.results.length > 0) {
      html += '<div class="results-list">'
      searchData.results.forEach((result) => {
        const resultUrl = safeHttpUrl(result.url)
        if (!resultUrl) return

        html += `
          <div class="result-item">
            <h3 class="result-title">
              <a href="${escapeHTML(resultUrl)}" data-result-url="${escapeHTML(resultUrl)}">
                ${escapeHTML(result.title)}
              </a>
            </h3>
            <p class="result-url">${escapeHTML(resultUrl)}</p>
            <p class="result-snippet">${escapeHTML(result.snippet || "No description available")}</p>
            <span class="result-source">Source: ${escapeHTML(result.source)}</span>
          </div>
        `
      })
      html += "</div>"
    } else {
      html += '<div class="no-results">No results found. Try different keywords.</div>'
    }

    resultsContent.innerHTML = html
    resultsContent.querySelectorAll("[data-result-url]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault()
        navigate(link.getAttribute("data-result-url"))
      })
    })
  } catch (error) {
    console.error("[B2 Search] Error:", error)
    resultsContent.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <h3>Search Failed</h3>
        <p>An unexpected error occurred. Please try again.</p>
      </div>
    `
  }
}

// Event Listeners
goBtn.addEventListener("click", () => navigate(urlBar.value))
urlBar.addEventListener("keypress", (e) => {
  if (e.key === "Enter") navigate(urlBar.value)
})

backBtn.addEventListener("click", () => window.electronAPI.goBack())
forwardBtn.addEventListener("click", () => window.electronAPI.goForward())
reloadBtn.addEventListener("click", () => window.electronAPI.reload())

newTabBtn.addEventListener("click", () => createNewTab())

clearBtn.addEventListener("click", async () => {
  if (confirm("Clear all browsing data? This will reset the browser.")) {
    await window.electronAPI.clearData()
    welcomeScreen.classList.remove("hidden")
    urlBar.value = ""
    alert("All data cleared. Browser is now in pristine state.")
  }
})

// Proxy configuration
proxyBtn.addEventListener("click", async () => {
  const config = await window.electronAPI.getProxy()
  if (config) {
    proxyEnabled.checked = config.enabled
    proxyType.value = config.type
    proxyHost.value = config.host
    proxyPort.value = config.port
  }
  proxyModal.classList.remove("hidden")
})

saveProxyBtn.addEventListener("click", async () => {
  const config = {
    enabled: proxyEnabled.checked,
    type: proxyType.value,
    host: proxyHost.value,
    port: Number.parseInt(proxyPort.value),
  }

  await window.electronAPI.setProxy(config)
  proxyModal.classList.add("hidden")

  if (config.enabled) {
    proxyStatus.textContent = `🌐 Proxy: ${config.type.toUpperCase()} ${config.host}:${config.port}`
  } else {
    proxyStatus.textContent = "No Proxy"
  }

  alert("Proxy settings saved. Please reload the page for changes to take effect.")
})

cancelProxyBtn.addEventListener("click", () => {
  proxyModal.classList.add("hidden")
})

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type
    if (type === "tor") {
      proxyType.value = "socks5"
      proxyHost.value = "127.0.0.1"
      proxyPort.value = "9050"
    } else if (type === "vpn") {
      proxyType.value = "http"
      proxyHost.value = "127.0.0.1"
      proxyPort.value = "8888"
    }
  })
})

document.querySelectorAll(".engine-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    e.preventDefault()
    const url = card.getAttribute("href")
    navigate(url)
  })
})
;(async () => {
  const config = await window.electronAPI.getProxy()
  if (config && config.enabled) {
    proxyStatus.textContent = `🌐 Proxy: ${config.type.toUpperCase()} ${config.host}:${config.port}`
  }
  await refreshTabList()
})()

function showBrowserSettings() {
  document.getElementById("browserSettingsModal").style.display = "flex"
  loadBrowserSettings()
}

async function loadBrowserSettings() {
  const settings = await window.electronAPI.getBrowserSettings()

  document.getElementById("blockAds").checked = settings.blockAds
  document.getElementById("blockTrackers").checked = settings.blockTrackers
  document.getElementById("blockMalware").checked = settings.blockMalware
  document.getElementById("blockSocial").checked = settings.blockSocial
  document.getElementById("blockFingerprinting").checked = settings.blockFingerprinting
  document.getElementById("clearOnExit").checked = settings.clearOnExit
}

async function saveBrowserSettings() {
  const settings = {
    blockAds: document.getElementById("blockAds").checked,
    blockTrackers: document.getElementById("blockTrackers").checked,
    blockMalware: document.getElementById("blockMalware").checked,
    blockSocial: document.getElementById("blockSocial").checked,
    blockFingerprinting: document.getElementById("blockFingerprinting").checked,
    clearOnExit: document.getElementById("clearOnExit").checked,
    antiFingerprint: true,
    secureHeaders: true,
    noHistory: true,
    noCache: true,
  }

  await window.electronAPI.saveBrowserSettings(settings)
  document.getElementById("browserSettingsModal").style.display = "none"
  alert("Settings saved! Reload for changes to take effect.")
}

if (saveBrowserSettingsBtn) {
  saveBrowserSettingsBtn.addEventListener("click", saveBrowserSettings)
}

if (cancelBrowserSettingsBtn) {
  cancelBrowserSettingsBtn.addEventListener("click", () => {
    document.getElementById("browserSettingsModal").style.display = "none"
  })
}

async function showBrowserAbout() {
  const info = await window.electronAPI.getBrowserInfo()

  const aboutHTML = `
    <div class="about-content">
      <h1>${escapeHTML(info.name)}</h1>
      <p class="version">Version ${escapeHTML(info.version)}</p>
      <p class="description">${escapeHTML(info.description)}</p>
      
      <h3>Security Features</h3>
      <ul class="feature-list">
        ${info.features.map((f) => `<li>✓ ${escapeHTML(f)}</li>`).join("")}
      </ul>
      
      <p class="author">Developed by ${escapeHTML(info.author)}</p>
      <p class="license">License: ${escapeHTML(info.license)}</p>
      
      <div class="security-notice">
        <strong>🔒 Privacy Notice:</strong> This browser uses ephemeral sessions, clears local data, 
        and reduces common browser fingerprinting and leak surfaces. Use trusted proxies or Tor routes 
        when you need network-layer anonymity.
      </div>
    </div>
  `

  document.getElementById("browserAboutModal").innerHTML = aboutHTML
  document.getElementById("browserAboutModal").style.display = "flex"
}

if (b2SearchCard) {
  b2SearchCard.addEventListener("click", (e) => {
    e.preventDefault()
    const query = prompt("Enter your search query:")
    if (query) {
      handleB2Search(query)
    }
  })
}

if (closeSearchBtn) {
  closeSearchBtn.addEventListener("click", () => {
    document.getElementById("search-results").classList.add("hidden")
    welcomeScreen.classList.remove("hidden")
  })
}

async function showSearchSettings() {
  const settings = await window.electronAPI.getSearchSettings()

  document.getElementById("safe-search").checked = settings.safeSearch
  document.getElementById("adult-content").value = settings.adultContent
  document.getElementById("violent-content").value = settings.violentContent
  document.getElementById("regional-restrictions").checked = settings.regionalRestrictions
  document.getElementById("dark-web-access").checked = settings.darkWebAccess
  document.getElementById("max-results").value = settings.maxResults

  searchSettingsModal.classList.remove("hidden")
}

if (searchSettingsBtn) {
  searchSettingsBtn.addEventListener("click", showSearchSettings)
}

if (saveSearchSettingsBtn) {
  saveSearchSettingsBtn.addEventListener("click", async () => {
    const darkWebEnabled = document.getElementById("dark-web-access").checked

    if (darkWebEnabled) {
      const confirmed = confirm(
        "⚠️ EXTREME WARNING ⚠️\n\n" +
          "You are about to enable dark web access. This is EXTREMELY DANGEROUS and NOT RECOMMENDED.\n\n" +
          "Dark web access may expose you to:\n" +
          "- Illegal content\n" +
          "- Dangerous websites\n" +
          "- Malicious actors\n" +
          "- Legal risks\n\n" +
          "You assume ALL responsibility for your actions.\n\n" +
          "Are you ABSOLUTELY SURE you want to enable this?",
      )

      if (!confirmed) {
        document.getElementById("dark-web-access").checked = false
        return
      }
    }

    const settings = {
      safeSearch: document.getElementById("safe-search").checked,
      adultContent: document.getElementById("adult-content").value,
      violentContent: document.getElementById("violent-content").value,
      regionalRestrictions: document.getElementById("regional-restrictions").checked,
      darkWebAccess: document.getElementById("dark-web-access").checked,
      maxResults: Number.parseInt(document.getElementById("max-results").value),
    }

    await window.electronAPI.saveSearchSettings(settings)
    searchSettingsModal.classList.add("hidden")
    alert("Search settings saved successfully!")
  })
}

if (cancelSearchSettingsBtn) {
  cancelSearchSettingsBtn.addEventListener("click", () => {
    searchSettingsModal.classList.add("hidden")
  })
}

setInterval(
  async () => {
    console.log("[B2 Secure Browser] Auto-clearing session data")
    await window.electronAPI.clearData()
  },
  30 * 60 * 1000,
)

window.electronAPI.onTabUpdated((data) => {
  if (data.tabId === currentTabId) {
    urlBar.value = data.url || ""
  }
  refreshTabList()
})

window.electronAPI.onTabTitleUpdated((data) => {
  refreshTabList()
})

window.electronAPI.onTabSwitched((data) => {
  currentTabId = data.tabId
  urlBar.value = data.url || ""
  welcomeScreen.classList.add("hidden")
  document.getElementById("search-results").classList.add("hidden")
})

window.electronAPI.onTabClosed(() => {
  refreshTabList()
})

window.electronAPI.onAllTabsClosed(() => {
  welcomeScreen.classList.remove("hidden")
  urlBar.value = ""
})

updateSecurityStatus()

updateBlockStats()
setInterval(updateBlockStats, 3000)

if (settingsBtn) {
  settingsBtn.addEventListener("click", showBrowserSettings)
}

if (aboutBtn) {
  aboutBtn.addEventListener("click", showBrowserAbout)
}
