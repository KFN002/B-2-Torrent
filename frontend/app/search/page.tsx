"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Activity,
  Copy,
  Download,
  Filter,
  HardDrive,
  Hash,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"

interface LocalTorrent {
  id: string
  infoHash?: string
  name: string
  status: "downloading" | "seeding" | "paused" | "error" | "completed" | string
  progress: number
  size: number
  totalSize?: number
  downloaded: number
  uploaded: number
  downloadSpeed: number
  uploadSpeed: number
  peers: number
  seeders: number
  ratio: number
}

const statusStyles: Record<string, string> = {
  downloading: "bg-info text-info-foreground",
  seeding: "bg-success text-success-foreground",
  completed: "bg-success text-success-foreground",
  paused: "bg-secondary text-secondary-foreground",
  error: "bg-destructive text-destructive-foreground",
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export default function TorrentSearchPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState("")
  const [torrents, setTorrents] = useState<LocalTorrent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    minSeeders: 0,
    minProgress: 0,
  })

  const loadLocalTorrents = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/torrents", { cache: "no-store" })
      if (!response.ok) throw new Error(`Local API returned ${response.status}`)

      const data = await response.json()
      setTorrents(Array.isArray(data) ? data : [])
    } catch {
      setTorrents([])
      setError("Unable to reach the local B-2-Torrent API. Start the self-hosted stack and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLocalTorrents()
  }, [])

  const filteredResults = useMemo(() => {
    const term = query.trim().toLowerCase()

    return torrents.filter((torrent) => {
      const identity = `${torrent.name} ${torrent.id} ${torrent.infoHash || ""}`.toLowerCase()
      if (term && !identity.includes(term)) return false
      if (filters.status !== "all" && torrent.status !== filters.status) return false
      if ((torrent.seeders || 0) < filters.minSeeders) return false
      if ((torrent.progress || 0) < filters.minProgress) return false
      return true
    })
  }, [filters, query, torrents])

  const copyTorrentId = async (torrent: LocalTorrent) => {
    const value = torrent.infoHash || torrent.id
    if (!value) {
      toast.error("This torrent does not expose an info hash yet")
      return
    }

    await navigator.clipboard.writeText(value)
    toast.success("Copied local torrent identifier")
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10">
                <Search className="h-6 w-6 text-blue-300" />
              </div>
              <Badge variant="outline" className="border-green-500/40 text-green-300">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Local self-hosted search
              </Badge>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                {t("torrentSearch") || "Local Torrent Search"}
              </h1>
              <p className="mt-3 text-base text-muted-foreground md:text-lg">
                {t("torrentSearchDesc") ||
                  "Search torrents already managed by your local B-2-Torrent laptop or PC install."}
              </p>
            </div>
          </div>

          <Button onClick={loadLocalTorrents} disabled={isLoading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Local Data
          </Button>
        </div>

        <Card className="mb-6 glass-card border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by torrent name or info hash..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 pl-10"
                />
              </div>
              <Button
                onClick={() => setShowFilters((value) => !value)}
                variant="outline"
                className="h-11 gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 grid gap-4 rounded-lg border border-border bg-muted/40 p-4 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground">Status</span>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    value={filters.status}
                    onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                  >
                    <option value="all">All</option>
                    <option value="downloading">Downloading</option>
                    <option value="seeding">Seeding</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="error">Error</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground">Minimum Seeders</span>
                  <Input
                    type="number"
                    min="0"
                    value={filters.minSeeders}
                    onChange={(event) =>
                      setFilters({ ...filters, minSeeders: Number.parseInt(event.target.value) || 0 })
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground">Minimum Progress</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minProgress}
                    onChange={(event) =>
                      setFilters({ ...filters, minProgress: Number.parseInt(event.target.value) || 0 })
                    }
                  />
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-warning/30 bg-warning/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold text-warning">Local API unavailable</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredResults.length} local result{filteredResults.length === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">No public torrent index is queried by default.</p>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Loading local torrents...
              </CardContent>
            </Card>
          )}

          {!isLoading && filteredResults.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">No local torrents found</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Add torrents in the local manager, then use this page to search what your self-hosted app already
                  knows about.
                </p>
                <Button asChild className="mt-6 gap-2">
                  <Link href="/torrents">
                    <Download className="h-4 w-4" />
                    Open Torrent Manager
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {filteredResults.map((torrent) => (
            <Card key={torrent.id} className="glass-card border-border transition-colors hover:border-blue-500/40">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusStyles[torrent.status] || "bg-muted text-muted-foreground"}>
                        {torrent.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        {(torrent.infoHash || torrent.id || "pending").slice(0, 14)}
                      </span>
                    </div>

                    <h2 className="truncate text-lg font-semibold">{torrent.name}</h2>

                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-5">
                      <span className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        {formatBytes(torrent.size || torrent.totalSize || 0)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {(torrent.progress || 0).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-2 text-green-300">
                        <Users className="h-4 w-4" />
                        {torrent.seeders || 0} seeders
                      </span>
                      <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        {formatBytes(torrent.downloadSpeed || 0)}/s
                      </span>
                      <span className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {formatBytes(torrent.uploadSpeed || 0)}/s
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyTorrentId(torrent)} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy ID
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/torrents">Manage</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
