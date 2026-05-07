"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Upload, Plus, Shield, Activity, Users, SettingsIcon, Gauge, Filter, SortAsc } from "lucide-react"
import useSWR from "swr"
import { AddTorrentDialog } from "@/components/add-torrent-dialog"
import { TorrentCard } from "@/components/torrent-card"
import { StatsCard } from "@/components/stats-card"
import { SettingsDialog } from "@/components/settings-dialog"
import { SecurityStatusBadge } from "@/components/security-status-badge"
import { TorrentLimitsDialog } from "@/components/torrent-limits-dialog"
import { SecurityMonitor } from "@/components/security-monitor"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Torrent {
  id: string
  name: string
  status: "downloading" | "seeding" | "paused" | "error" | "completed"
  progress: number
  downloadSpeed: number
  uploadSpeed: number
  size: number
  downloaded: number
  uploaded: number
  peers: number
  seeders: number
  eta: number
  ratio: number
  favorite?: boolean
  downloadLimit?: number
  uploadLimit?: number
}

export default function TorrentsPage() {
  const { t } = useLanguage()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isGlobalLimitsOpen, setIsGlobalLimitsOpen] = useState(false)

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("favorite")

  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set())

  const {
    data: torrents,
    error,
    mutate,
  } = useSWR<Torrent[]>("/api/torrents", fetcher, {
    refreshInterval: 1000,
  })

  const sortedTorrents = useMemo(() => {
    if (!torrents) return []

    let filtered = [...torrents]

    // Apply filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus)
    }

    // Apply sort
    filtered.sort((a, b) => {
      // Favorites always first
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1

      // Then by selected criteria
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "progress":
          return b.progress - a.progress
        case "speed":
          return b.downloadSpeed + b.uploadSpeed - (a.downloadSpeed + a.uploadSpeed)
        case "size":
          return b.size - a.size
        default:
          return 0
      }
    })

    return filtered
  }, [torrents, filterStatus, sortBy])

  const stats = torrents
    ? {
        totalDownload: torrents.reduce((acc, t) => acc + t.downloadSpeed, 0),
        totalUpload: torrents.reduce((acc, t) => acc + t.uploadSpeed, 0),
        activeTorrents: torrents.filter((t) => t.status === "downloading" || t.status === "seeding").length,
        totalPeers: torrents.reduce((acc, t) => acc + t.peers, 0),
      }
    : null

  const handleSaveGlobalLimits = async (limits: { downloadLimit: number; uploadLimit: number }) => {
    try {
      await fetch("/api/settings/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limits),
      })
      toast.success("Global speed limits updated")
    } catch (error) {
      toast.error("Failed to update global limits")
    }
  }

  useSWR(
    "/api/torrents/events",
    async (url) => {
      const response = await fetch(url)
      const events = await response.json()

      events.forEach((event: any) => {
        const eventId = `${event.type}-${event.torrentId}-${event.timestamp}`

        // Skip if already processed
        if (processedEvents.has(eventId)) return

        setProcessedEvents((prev) => new Set([...prev, eventId]))

        switch (event.type) {
          case "completed":
            toast.success(t("torrentCompleted"), {
              description: event.torrentName,
              duration: 5000,
            })
            break
          case "seeding":
            toast.info(t("torrentSeeding"), {
              description: event.torrentName,
              duration: 3000,
            })
            break
          case "seeding-stopped":
            toast.info(t("seedingStopped"), {
              description: event.torrentName,
              duration: 3000,
            })
            break
          case "paused":
            toast(t("torrentPaused"), {
              description: event.torrentName,
              duration: 3000,
            })
            break
          case "resumed":
            toast.success(t("torrentResumed"), {
              description: event.torrentName,
              duration: 3000,
            })
            break
          case "error":
            toast.error(t("torrentFailed"), {
              description: `${event.torrentName} - ${event.message}`,
              duration: 5000,
            })
            break
          case "added":
            toast.success(t("torrentAdded"), {
              description: event.torrentName,
              duration: 3000,
            })
            break
          case "deleted":
            toast.error(t("torrentDeleted"), {
              description: event.torrentName,
              duration: 3000,
            })
            break
          case "speed-limit-reached":
            toast.warning(t("speedLimitReached"), {
              description: event.torrentName,
              duration: 3000,
            })
            break
        }
      })

      return events
    },
    { refreshInterval: 2000 },
  )

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="background-orb background-orb-1 animate-float" />
        <div className="background-orb background-orb-2 animate-float" style={{ animationDelay: "2s" }} />
        <div className="background-orb background-orb-3 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <main className="container px-4 py-6 md:px-6 md:py-8 max-w-7xl 2xl:max-w-[1800px] mx-auto relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 animate-fade-in-left">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight text-gradient-rainbow">
                Torrents
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base xl:text-lg 2xl:text-xl">
                Manage your torrent downloads with maximum security
              </p>
            </div>
            <SecurityStatusBadge />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsGlobalLimitsOpen(true)}
              className="h-9 w-9 hover:bg-primary/10 transition-colors"
            >
              <Gauge className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsSettingsDialogOpen(true)}
              className="h-9 w-9 hover:bg-primary/10 transition-colors"
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 animate-scale-in hover:scale-105 transition-transform"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Torrent</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_300px] xl:grid-cols-[1fr_400px] 2xl:grid-cols-[1fr_450px] mb-6 md:mb-8">
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:gap-6 2xl:gap-8">
              <StatsCard
                title="Download Speed"
                value={stats ? `${(stats.totalDownload / 1024 / 1024).toFixed(2)} MB/s` : "0 MB/s"}
                icon={Download}
                trend="+12.3%"
                color="info"
              />
              <StatsCard
                title="Upload Speed"
                value={stats ? `${(stats.totalUpload / 1024 / 1024).toFixed(2)} MB/s` : "0 MB/s"}
                icon={Upload}
                trend="+8.1%"
                color="success"
              />
              <StatsCard
                title="Active Torrents"
                value={stats?.activeTorrents.toString() || "0"}
                icon={Activity}
                description={`${torrents?.length || 0} total`}
                color="accent"
              />
              <StatsCard
                title="Connected Peers"
                value={stats?.totalPeers.toString() || "0"}
                icon={Users}
                description="Global network"
                color="warning"
              />
            </div>

            <Card className="mb-6 md:mb-8 border-success/30 bg-gradient-to-br from-success/10 to-info/10 animate-slide-down hover:border-success/40 transition-all group relative overflow-hidden glass-card hover-lift">
              <div className="absolute inset-0 bg-gradient-to-r from-success/10 via-info/15 to-success/10 animate-shimmer" />
              <CardContent className="flex items-start gap-4 p-5 md:p-6 xl:p-8 2xl:p-10 relative">
                <div className="p-3 xl:p-4 2xl:p-5 rounded-xl bg-success/15 group-hover:bg-success/25 transition-all shadow-lg security-glow">
                  <Shield className="h-6 w-6 xl:h-7 xl:w-7 2xl:h-8 2xl:w-8 text-success flex-shrink-0" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-base xl:text-lg 2xl:text-xl font-bold text-foreground">
                    Multi-layer security protection enabled
                  </p>
                  <p className="text-sm xl:text-base 2xl:text-lg text-muted-foreground leading-relaxed">
                    Your connection is protected with kill switch, DNS leak protection, IP obfuscation, traffic
                    obfuscation, and AES-256 encryption with perfect forward secrecy.
                  </p>
                  <Link href="/security">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-sm xl:text-base text-success hover:text-success/80 transition-colors"
                    >
                      View Security Dashboard →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden md:block animate-fade-in">
            <SecurityMonitor />
          </div>
        </div>

        {/* Torrents List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight">
                {t("allTorrents")}
              </h2>
              {sortedTorrents && sortedTorrents.length > 0 && (
                <Badge variant="secondary" className="text-xs xl:text-sm animate-scale-in">
                  {sortedTorrents.length}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent hover:bg-primary/5 transition-all"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("filterBy")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterStatus("all")}>{t("allTorrents")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("downloading")}>
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-info animate-pulse" />
                      {t("downloading")}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("seeding")}>
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      {t("seeding")}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      {t("completed")}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("paused")}>
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-secondary" />
                      {t("paused")}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("error")}>
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      {t("error")}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent hover:bg-primary/5 transition-all"
                  >
                    <SortAsc className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("sortBy")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("favorite")}>{t("addToFavorites")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>{t("sortByName")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("progress")}>{t("sortByProgress")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("speed")}>{t("sortBySpeed")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("size")}>{t("sortBySize")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!torrents && !error && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-5 bg-muted rounded animate-shimmer" />
                      <div className="h-4 bg-muted rounded w-2/3 animate-shimmer" />
                      <div className="h-2 bg-muted rounded animate-shimmer" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {sortedTorrents && sortedTorrents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4 animate-scale-in">
                  <Download className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No torrents yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                  Add your first torrent to start downloading with multi-layer security protection
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 animate-scale-in">
                  <Plus className="h-4 w-4" />
                  Add Torrent
                </Button>
              </CardContent>
            </Card>
          )}

          {sortedTorrents && sortedTorrents.length > 0 && (
            <div className="space-y-3">
              {sortedTorrents.map((torrent, index) => (
                <div key={torrent.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up">
                  <TorrentCard torrent={torrent} onUpdate={mutate} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddTorrentDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={mutate} />
      <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />
      <TorrentLimitsDialog
        open={isGlobalLimitsOpen}
        onOpenChange={setIsGlobalLimitsOpen}
        onSave={handleSaveGlobalLimits}
      />
    </div>
  )
}
