const axios = require("axios")
const cheerio = require("cheerio")

// Custom B2 Search Engine - Aggregates results from multiple sources
class B2SearchEngine {
  constructor(store) {
    this.store = store
    this.name = "B2 Search"
    this.settings = this.loadSettings()
  }

  loadSettings() {
    return this.store.get("searchSettings", {
      darkWebAccess: false,
      violentContent: "filter",
      adultContent: "filter",
      regionalRestrictions: false,
      safeSearch: true,
      maxResults: 20,
    })
  }

  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings }
    this.store.set("searchSettings", this.settings)
  }

  // Aggregates search results from multiple privacy-focused engines
  async search(query) {
    const results = []

    if (this.isDarkWebQuery(query) && !this.settings.darkWebAccess) {
      return {
        blocked: true,
        reason: "Dark web access is disabled. Enable in Settings with caution.",
        query: query,
      }
    }

    if (this.containsRestrictedContent(query)) {
      if (this.settings.violentContent === "block" || this.settings.adultContent === "block") {
        return {
          blocked: true,
          reason: "Content filtering is enabled. This query contains restricted keywords.",
          query: query,
        }
      }
    }

    try {
      // Aggregate from multiple sources
      const sources = await Promise.allSettled([
        this.searchDuckDuckGo(query),
        this.searchStartpage(query),
        this.searchQwant(query),
      ])

      sources.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          results.push(...result.value)
        }
      })

      // Remove duplicates and apply content filtering
      const uniqueResults = this.deduplicateResults(results)
      const filteredResults = this.applyContentFilters(uniqueResults)

      return {
        results: filteredResults.slice(0, this.settings.maxResults),
        query: query,
        count: filteredResults.length,
        engine: "B2 Search",
        warning: this.getContentWarning(query),
      }
    } catch (error) {
      console.error("[B2 Search] Error:", error.message)
      return {
        error: true,
        message: "Search failed. Please try again.",
        query: query,
      }
    }
  }

  isDarkWebQuery(query) {
    const darkWebKeywords = [
      ".onion",
      "tor hidden",
      "dark web",
      "darknet",
      "deep web",
      "hidden service",
      "tor network sites",
    ]
    const lowerQuery = query.toLowerCase()
    return darkWebKeywords.some((keyword) => lowerQuery.includes(keyword))
  }

  containsRestrictedContent(query) {
    const restrictedKeywords = ["violence", "gore", "death", "murder", "weapon", "adult", "porn", "xxx", "explicit"]
    const lowerQuery = query.toLowerCase()
    return restrictedKeywords.some((keyword) => lowerQuery.includes(keyword))
  }

  getContentWarning(query) {
    if (this.containsRestrictedContent(query)) {
      return "Some results may contain mature or sensitive content. Content filtering is active."
    }
    return null
  }

  async searchDuckDuckGo(query) {
    try {
      const response = await axios.get("https://html.duckduckgo.com/html/", {
        params: { q: query },
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 5000,
      })

      const $ = cheerio.load(response.data)
      const results = []

      $(".result").each((i, elem) => {
        const title = $(elem).find(".result__title").text().trim()
        const snippet = $(elem).find(".result__snippet").text().trim()
        const url = $(elem).find(".result__url").text().trim()

        if (title && url) {
          results.push({
            title,
            snippet,
            url: url.startsWith("http") ? url : "https://" + url,
            source: "DuckDuckGo",
          })
        }
      })

      return results
    } catch (error) {
      console.error("[B2 Search] DuckDuckGo error:", error.message)
      return []
    }
  }

  async searchStartpage(query) {
    // Startpage API alternative - returns structured results
    try {
      const results = []
      // Simplified implementation - in production, use proper Startpage API
      return results
    } catch (error) {
      return []
    }
  }

  async searchQwant(query) {
    try {
      const response = await axios.get("https://api.qwant.com/api/search/web", {
        params: {
          q: query,
          count: 10,
          locale: "en_US",
          safesearch: this.settings.safeSearch ? 1 : 0,
        },
        timeout: 5000,
      })

      const results = []
      const items = response.data?.data?.result?.items || []

      items.forEach((item) => {
        results.push({
          title: item.title,
          snippet: item.desc,
          url: item.url,
          source: "Qwant",
        })
      })

      return results
    } catch (error) {
      console.error("[B2 Search] Qwant error:", error.message)
      return []
    }
  }

  deduplicateResults(results) {
    const seen = new Set()
    return results.filter((result) => {
      const key = result.url.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  applyContentFilters(results) {
    return results.filter((result) => {
      const text = (result.title + " " + result.snippet + " " + result.url).toLowerCase()

      // Filter adult content
      if (this.settings.adultContent !== "allow") {
        const adultKeywords = ["porn", "xxx", "adult", "explicit", "nsfw"]
        if (adultKeywords.some((keyword) => text.includes(keyword))) {
          return this.settings.adultContent === "warn"
        }
      }

      // Filter violent content
      if (this.settings.violentContent !== "allow") {
        const violentKeywords = ["gore", "death", "murder", "torture", "violence"]
        if (violentKeywords.some((keyword) => text.includes(keyword))) {
          return this.settings.violentContent === "warn"
        }
      }

      return true
    })
  }
}

module.exports = B2SearchEngine
