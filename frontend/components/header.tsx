import { Shield, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onAddTorrent: () => void
}

export function Header({ onAddTorrent }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" strokeWidth={1.5} />
            <div>
              <h1 className="text-xl font-bold tracking-tight">TORRENT CLIENT</h1>
              <p className="text-xs text-muted-foreground">Private • Secure • Anonymous</p>
            </div>
          </div>

          <Button onClick={onAddTorrent} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Torrent
          </Button>
        </div>
      </div>
    </header>
  )
}
