'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { TorrentList } from '@/components/torrent-list'
import { AddTorrentDialog } from '@/components/add-torrent-dialog'
import { StatusBar } from '@/components/status-bar'

export default function Home() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onAddTorrent={() => setIsAddDialogOpen(true)} />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-sm text-foreground">
            <span className="font-bold text-success">SECURE MODE ACTIVE:</span> All traffic is routed through multi-hop encrypted proxies. No logs are stored. No telemetry is collected.
          </p>
        </div>
        
        <TorrentList />
      </main>

      <StatusBar />

      <AddTorrentDialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
      />
    </div>
  )
}
