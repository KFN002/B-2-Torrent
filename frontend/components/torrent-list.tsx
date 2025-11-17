'use client'

import useSWR from 'swr'
import { TorrentCard } from './torrent-card'
import { Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TorrentList() {
  const { data: torrents, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/torrents`,
    fetcher,
    { refreshInterval: 2000 }
  )

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Failed to load torrents</p>
      </div>
    )
  }

  if (!torrents) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (torrents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-2">No active torrents</p>
        <p className="text-xs text-muted-foreground">Add a magnet link to get started</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {torrents.map((torrent: any) => (
        <TorrentCard key={torrent.infoHash} torrent={torrent} onUpdate={mutate} />
      ))}
    </div>
  )
}
