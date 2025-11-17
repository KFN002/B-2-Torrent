'use client'

import { Shield, Plus, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onAddTorrent: () => void
}

export function Header({ onAddTorrent }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-success" strokeWidth={1.5} />
                <Lock className="h-3 w-3 text-success absolute -bottom-0.5 -right-0.5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">STEALTH TORRENT</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Multi-Proxy • Zero Logs • Maximum Privacy
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onAddTorrent} 
            className="gap-2 bg-success text-black hover:bg-success/90 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Torrent
          </Button>
        </div>
      </div>
    </header>
  )
}
