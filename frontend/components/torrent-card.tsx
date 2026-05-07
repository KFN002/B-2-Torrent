'use client'

import { Play, Pause, Trash2, Download, Upload, Users } from 'lucide-react'
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
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    if (torrent.status === 'completed') return 'text-success'
    if (torrent.status === 'downloading') return 'text-success'
    return 'text-muted-foreground'
  }

  const getStatusText = () => {
    if (torrent.status === 'completed') return 'COMPLETED'
    if (torrent.status === 'downloading') return 'DOWNLOADING'
    return 'STARTING'
  }

  return (
    <Card className="p-5 hover:border-success/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-base truncate flex-1">{torrent.name}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor()} bg-accent`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono font-bold text-foreground">{torrent.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-300 bg-success"
                  style={{ width: `${Math.min(torrent.progress, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 bg-accent rounded p-2">
                <Download className="h-3.5 w-3.5 text-success" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">Download</span>
                  <span className="font-mono font-semibold">{formatSpeed(torrent.downloadRate)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-accent rounded p-2">
                <Upload className="h-3.5 w-3.5 text-warning" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">Upload</span>
                  <span className="font-mono font-semibold">{formatSpeed(torrent.uploadRate)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-accent rounded p-2">
                <Users className="h-3.5 w-3.5 text-foreground" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">Peers</span>
                  <span className="font-mono font-semibold">{torrent.peers}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-accent rounded p-2">
                <div className="flex flex-col flex-1">
                  <span className="text-muted-foreground text-[10px]">Size</span>
                  <span className="font-mono font-semibold text-[11px]">
                    {formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {torrent.status === 'downloading' ? (
            <Button
              variant="outline"
              size="icon"
              onClick={handlePause}
              disabled={loading}
              className="hover:bg-warning/10 hover:border-warning"
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={handleResume}
              disabled={loading}
              className="hover:bg-success/10 hover:border-success"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="hover:bg-destructive/10 hover:border-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
