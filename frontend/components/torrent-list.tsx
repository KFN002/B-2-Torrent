'use client'

import useSWR from 'swr'
import { TorrentCard } from './torrent-card'
import { Loader2, Shield } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TorrentList() {
  const { data: torrents, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/torrents`,
    fetcher,
    { refreshInterval: 2000 }
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-foreground font-semibold mb-1">Connection Error</p>
        <p className="text-sm text-muted-foreground">Unable to reach the server</p>
      </div>
    )
  }

  if (!torrents) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-success" />
          <p className="text-sm text-muted-foreground">Loading torrents...</p>
        </div>
      </div>
    )
  }

  if (torrents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
          <Shield className="h-10 w-10 text-success" />
        </div>
        <p className="text-foreground font-semibold mb-2">No Active Torrents</p>
        <p className="text-sm text-muted-foreground mb-1">Click "Add Torrent" to get started</p>
        <p className="text-xs text-muted-foreground">All downloads are anonymous and encrypted</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 pb-20">
      {torrents.map((torrent: any) => (
        <TorrentCard key={torrent.infoHash} torrent={torrent} onUpdate={mutate} />
      ))}
    </div>
  )
}
