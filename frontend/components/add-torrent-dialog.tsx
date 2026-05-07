'use client'

import { useState } from 'react'
import { X, LinkIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddTorrentDialogProps {
  open: boolean
  onClose: () => void
}

export function AddTorrentDialog({ open, onClose }: AddTorrentDialogProps) {
  const [magnetUri, setMagnetUri] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/torrents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magnetUri }),
      })

      if (!response.ok) {
        throw new Error('Failed to add torrent')
      }

      setMagnetUri('')
      onClose()
    } catch (err) {
      setError('Failed to add torrent. Please verify the magnet link.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/20">
              <LinkIcon className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Add Torrent</h2>
              <p className="text-xs text-muted-foreground">Paste your magnet link below</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="magnet" className="text-sm font-medium text-foreground mb-2 block">
              Magnet URI
            </label>
            <Input
              id="magnet"
              type="text"
              placeholder="magnet:?xt=urn:btih:..."
              value={magnetUri}
              onChange={(e) => setMagnetUri(e.target.value)}
              className="font-mono text-sm"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              All downloads are routed through multi-hop encrypted proxies
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              disabled={loading || !magnetUri.trim()} 
              className="flex-1 bg-success text-black hover:bg-success/90 font-semibold"
            >
              {loading ? 'Adding Torrent...' : 'Add Torrent'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-destructive/10 hover:border-destructive"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
