"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Upload,
  Pause,
  Play,
  Trash2,
  HardDrive,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Star,
  Settings,
  Calendar,
} from "lucide-react"
import { useState } from "react"
import { TorrentLimitsDialog } from "./torrent-limits-dialog"
import { ScheduleDialog, type ScheduleConfig } from "./schedule-dialog"
import { toast } from "sonner"

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

interface TorrentCardProps {
  torrent: Torrent
  onUpdate: () => void
}

export function TorrentCard({ torrent, onUpdate }: TorrentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLimitsOpen, setIsLimitsOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(torrent.favorite || false)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatTime = (seconds: number) => {
    if (seconds === 0 || !isFinite(seconds)) return "∞"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 24) return `${Math.floor(hours / 24)}d`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (status: Torrent["status"]) => {
    switch (status) {
      case "downloading":
        return "bg-info text-info-foreground"
      case "seeding":
        return "bg-success text-success-foreground"
      case "completed":
        return "bg-success text-success-foreground border-success"
      case "paused":
        return "bg-secondary text-secondary-foreground"
      case "error":
        return "bg-destructive text-destructive-foreground border-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: Torrent["status"]) => {
    switch (status) {
      case "downloading":
        return <Loader2 className="h-3 w-3 animate-spin" />
      case "seeding":
        return <Upload className="h-3 w-3" />
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />
      case "paused":
        return <Pause className="h-3 w-3" />
      case "error":
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const handleToggleFavorite = async () => {
    try {
      await fetch(`/api/torrents/${torrent.id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !isFavorite }),
      })
      setIsFavorite(!isFavorite)
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites")
      onUpdate()
    } catch (error) {
      toast.error("Failed to update favorite status")
    }
  }

  const handlePauseResume = async () => {
    try {
      const action = torrent.status === "paused" ? "resume" : "pause"
      await fetch(`/api/torrents/${torrent.id}/${action}`, { method: "POST" })
      toast.success(action === "pause" ? "Torrent paused" : "Torrent resumed")
      onUpdate()
    } catch (error) {
      toast.error("Failed to update torrent")
    }
  }

  const handleDelete = async () => {
    try {
      await fetch(`/api/torrents/${torrent.id}`, { method: "DELETE" })
      toast.success("Torrent deleted")
      onUpdate()
    } catch (error) {
      toast.error("Failed to delete torrent")
    }
  }

  const handleSaveLimits = async (limits: { downloadLimit: number; uploadLimit: number }) => {
    try {
      await fetch(`/api/torrents/${torrent.id}/limits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limits),
      })
      toast.success("Speed limits updated")
      onUpdate()
    } catch (error) {
      toast.error("Failed to update limits")
    }
  }

  const handleSaveSchedule = async (schedule: ScheduleConfig) => {
    try {
      await fetch(`/api/torrents/${torrent.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      })
      toast.success("Schedule updated")
      onUpdate()
    } catch (error) {
      toast.error("Failed to update schedule")
    }
  }

  return (
    <>
      <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 relative overflow-hidden">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
            torrent.status === "error"
              ? "bg-destructive"
              : torrent.status === "completed"
                ? "bg-success"
                : torrent.status === "downloading"
                  ? "bg-info"
                  : torrent.status === "seeding"
                    ? "bg-success/60"
                    : "bg-muted"
          }`}
        />

        <CardContent className="p-4 md:p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isFavorite && <Star className="h-4 w-4 fill-warning text-warning flex-shrink-0 animate-scale-in" />}
                  <h3 className="font-semibold text-base md:text-lg leading-tight truncate">{torrent.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <Badge variant="secondary" className={`${getStatusColor(torrent.status)} gap-1.5`}>
                    {getStatusIcon(torrent.status)}
                    <span className="capitalize">{torrent.status}</span>
                  </Badge>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatBytes(torrent.size)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {torrent.peers}/{torrent.seeders}
                  </span>
                  {torrent.status === "downloading" && torrent.eta > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(torrent.eta)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 transition-colors ${
                    isFavorite ? "text-yellow-500 hover:text-yellow-600" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={handleToggleFavorite}
                >
                  <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => setIsScheduleOpen(true)}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => setIsLimitsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={handlePauseResume}
                >
                  {torrent.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">
                  {formatBytes(torrent.downloaded)} / {formatBytes(torrent.size)}
                </span>
                <span
                  className={`font-medium ${
                    torrent.status === "completed"
                      ? "text-success"
                      : torrent.status === "error"
                        ? "text-destructive"
                        : torrent.status === "downloading"
                          ? "text-info"
                          : "text-primary"
                  }`}
                >
                  {torrent.progress.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full transition-all duration-500 ${
                    torrent.status === "completed"
                      ? "bg-success"
                      : torrent.status === "error"
                        ? "bg-destructive"
                        : torrent.status === "downloading"
                          ? "bg-info"
                          : torrent.status === "seeding"
                            ? "bg-success/60"
                            : "bg-primary"
                  }`}
                  style={{ width: `${torrent.progress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  Download
                </p>
                <p className="text-sm font-medium text-info">{formatBytes(torrent.downloadSpeed)}/s</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  Upload
                </p>
                <p className="text-sm font-medium text-success">{formatBytes(torrent.uploadSpeed)}/s</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uploaded</p>
                <p className="text-sm font-medium">{formatBytes(torrent.uploaded)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ratio</p>
                <p className="text-sm font-medium">{torrent.ratio.toFixed(2)}</p>
              </div>
            </div>

            {isExpanded && (
              <div className="space-y-3 pt-3 border-t border-border/50 animate-slide-down">
                <h4 className="text-sm font-semibold">Detailed Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Hash (InfoHash)</p>
                    <p className="font-mono text-[10px] break-all">{torrent.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{torrent.status}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Total Size</p>
                    <p className="font-medium">{formatBytes(torrent.size)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Downloaded</p>
                    <p className="font-medium">{formatBytes(torrent.downloaded)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Uploaded</p>
                    <p className="font-medium">{formatBytes(torrent.uploaded)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Share Ratio</p>
                    <p className="font-medium">{torrent.ratio.toFixed(3)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Peers Connected</p>
                    <p className="font-medium">{torrent.peers}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Seeders Available</p>
                    <p className="font-medium">{torrent.seeders}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Download Speed</p>
                    <p className="font-medium">{formatBytes(torrent.downloadSpeed)}/s</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Upload Speed</p>
                    <p className="font-medium">{formatBytes(torrent.uploadSpeed)}/s</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">ETA</p>
                    <p className="font-medium">{formatTime(torrent.eta)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Progress</p>
                    <p className="font-medium">{torrent.progress.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs for limits and scheduling */}
      <TorrentLimitsDialog
        open={isLimitsOpen}
        onOpenChange={setIsLimitsOpen}
        torrentId={torrent.id}
        torrentName={torrent.name}
        currentDownloadLimit={torrent.downloadLimit}
        currentUploadLimit={torrent.uploadLimit}
        onSave={handleSaveLimits}
      />
      <ScheduleDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        torrentId={torrent.id}
        torrentName={torrent.name}
        onSchedule={handleSaveSchedule}
      />
    </>
  )
}
