"use client"

import { useState } from "react"
import { Search, Filter, Download, Users, HardDrive, Calendar, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"

interface TorrentResult {
  id: string
  name: string
  size: string
  seeders: number
  leechers: number
  uploadDate: string
  category: string
  magnetLink: string
  quality?: string
}

export default function TorrentSearchPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TorrentResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: "all",
    quality: "all",
    minSeeders: 0,
    maxSize: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  const searchTorrents = async () => {
    if (!query.trim()) {
      toast.error(t("enterSearchQuery") || "Please enter a search query")
      return
    }

    setIsLoading(true)
    try {
      // Using iTorrentSearch API as example
      const response = await fetch(`https://itorrentsearch.vercel.app/api/all/${encodeURIComponent(query)}/1`)

      if (!response.ok) throw new Error("Search failed")

      const data = await response.json()

      // Transform API response to our format
      const transformedResults: TorrentResult[] = (data.data || []).map((item: any, index: number) => ({
        id: `${index}`,
        name: item.name || item.title || "Unknown",
        size: item.size || "Unknown",
        seeders: Number.parseInt(item.seeders || item.seed || "0"),
        leechers: Number.parseInt(item.leechers || item.leech || "0"),
        uploadDate: item.uploadDate || item.date || "Unknown",
        category: item.category || "Other",
        magnetLink: item.magnet || item.magnetLink || "",
        quality: item.quality || undefined,
      }))

      setResults(transformedResults)
      toast.success(`Found ${transformedResults.length} results`)
    } catch (error) {
      console.error("[v0] Search error:", error)
      toast.error(t("searchFailed") || "Search failed. Try again later.")
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const copyMagnetLink = (magnet: string, name: string) => {
    if (!magnet) {
      toast.error("No magnet link available")
      return
    }
    navigator.clipboard.writeText(magnet)
    toast.success(`Copied magnet link for: ${name}`)
  }

  const filteredResults = results.filter((result) => {
    if (filters.category !== "all" && result.category !== filters.category) return false
    if (filters.quality !== "all" && result.quality !== filters.quality) return false
    if (result.seeders < filters.minSeeders) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black animate-fade-in">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t("torrentSearch") || "Torrent Search"}
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t("torrentSearchDesc") ||
              "Search millions of torrents from multiple sources. Beta feature - results may vary."}
          </p>
          <Badge variant="outline" className="mt-2 border-yellow-500/50 text-yellow-500">
            <Zap className="h-3 w-3 mr-1" />
            BETA
          </Badge>
        </div>

        {/* Search Bar */}
        <Card
          className="mb-6 border-blue-500/20 bg-gray-900/50 backdrop-blur animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={t("searchPlaceholder") || "Search torrents..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchTorrents()}
                  className="pl-10 bg-black/50 border-gray-700 focus:border-blue-500 transition-all"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-gray-700 hover:border-blue-500 transition-all"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                onClick={searchTorrents}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-black/30 animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Category</label>
                    <select
                      className="w-full px-3 py-2 rounded-md bg-black/50 border border-gray-700 text-sm"
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <option value="all">All</option>
                      <option value="Movies">Movies</option>
                      <option value="TV">TV Shows</option>
                      <option value="Music">Music</option>
                      <option value="Games">Games</option>
                      <option value="Software">Software</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Quality</label>
                    <select
                      className="w-full px-3 py-2 rounded-md bg-black/50 border border-gray-700 text-sm"
                      value={filters.quality}
                      onChange={(e) => setFilters({ ...filters, quality: e.target.value })}
                    >
                      <option value="all">All</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Min Seeders</label>
                    <Input
                      type="number"
                      min="0"
                      value={filters.minSeeders}
                      onChange={(e) => setFilters({ ...filters, minSeeders: Number.parseInt(e.target.value) || 0 })}
                      className="bg-black/50 border-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Max Size</label>
                    <Input
                      placeholder="e.g. 5GB"
                      value={filters.maxSize}
                      onChange={(e) => setFilters({ ...filters, maxSize: e.target.value })}
                      className="bg-black/50 border-gray-700 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
              <p className="mt-4 text-gray-400">Searching...</p>
            </div>
          )}

          {!isLoading && filteredResults.length === 0 && query && (
            <div className="text-center py-12 animate-fade-in">
              <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No results found. Try different keywords.</p>
            </div>
          )}

          {filteredResults.map((result, index) => (
            <Card
              key={result.id}
              className="border-gray-800 bg-gray-900/50 backdrop-blur hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 hover:text-blue-400 transition-colors">
                      {result.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {result.size}
                      </div>
                      <div className="flex items-center gap-1 text-green-400">
                        <Users className="h-3 w-3" />
                        {result.seeders}
                      </div>
                      <div className="flex items-center gap-1 text-red-400">
                        <Users className="h-3 w-3" />
                        {result.leechers}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {result.uploadDate}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {result.category}
                      </Badge>
                      {result.quality && (
                        <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                          {result.quality}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyMagnetLink(result.magnetLink, result.name)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Copy Magnet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Notice */}
        {results.length > 0 && (
          <Card className="mt-6 border-yellow-500/20 bg-yellow-500/5 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-yellow-500 mb-1">Security Reminder</p>
                  <p>
                    Always verify torrent sources and use VPN/Tor for maximum anonymity. Check Settings → Security for
                    protection options.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
