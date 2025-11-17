'use client'

import { Play, Pause, Trash2, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

interface TorrentCardProps {
  torrent: any
  onUpdate: () => void
}

export function TorrentCard({ torrent, onUpdate }: TorrentCardProps) {
  const [loading, setLoading] = useState(false)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSec: number) => {
    return formatBytes(bytesPerSec) + '/s'
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/torrents/${torrent.infoHash}`, {
        method: 'DELETE',
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to delete torrent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePause = async () => {
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/torrents/${torrent.infoHash}/pause`, {
        method: 'POST',
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to pause torrent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/torrents/${torrent.infoHash}/resume`, {
        method: 'POST',
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to resume torrent:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-2 truncate">{torrent.name}</h3>
          
          <div className="space-y-2">
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div
                className="bg-foreground h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(torrent.progress, 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{torrent.progress.toFixed(1)}%</span>
              <span>•</span>
              <span>{formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {formatSpeed(torrent.downloadRate)}
              </span>
              <span className="flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {formatSpeed(torrent.uploadRate)}
              </span>
              <span>•</span>
              <span>{torrent.peers} peers</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {torrent.status === 'downloading' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePause}
              disabled={loading}
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResume}
              disabled={loading}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
