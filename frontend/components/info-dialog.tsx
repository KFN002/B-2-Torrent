'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { BrandMark } from '@/components/brand-mark'
import { Shield, Lock, Eye, Server, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InfoDialog({ open, onOpenChange }: InfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <BrandMark className="h-12 w-12 bg-muted" iconClassName="h-5 w-5" textClassName="sr-only" />
            <div>
              <DialogTitle className="text-2xl">B-2-Torrent</DialogTitle>
              <DialogDescription className="text-base">
                Self-hosted BitTorrent for laptops and PCs
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">About the Project</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              B-2-Torrent is a privacy-focused BitTorrent workspace designed to run on your own laptop or PC. 
              It combines a local web app, Go backend, desktop utilities, and optional proxy protection into a 
              self-hosted localhost stack.
            </p>
          </div>

          <div className="grid gap-3">
            <Card className="border-border/50">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Multi-Proxy Chain</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Route your connection through multiple SOCKS5 proxies in sequence for enhanced anonymity
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Tor Integration</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Built-in Tor support for accessing the network through the Tor anonymity network
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Privacy-First Design</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No telemetry, no tracking, and automatic data cleanup on shutdown
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Local Architecture</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Built with Go, Next.js, Docker, and Nginx for a self-hosted desktop install
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="font-semibold text-sm">Technical Stack</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">Go</span>
              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">Next.js</span>
              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">PostgreSQL</span>
              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">Docker</span>
              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">Tor</span>
              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">SOCKS5</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => window.open('https://github.com/KFN002/B-2-Torrent', '_blank')}
            >
              <Github className="h-4 w-4" />
              Source Code
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
