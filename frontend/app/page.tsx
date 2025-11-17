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
      
      <main className="container mx-auto px-4 py-8">
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
