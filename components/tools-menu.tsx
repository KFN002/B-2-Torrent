'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, Video, Lock, Minimize2, Activity } from 'lucide-react'
import Link from 'next/link'

interface ToolsMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ToolsMenu({ open, onOpenChange }: ToolsMenuProps) {
  const tools = [
    {
      title: 'Audio Player',
      description: 'Play music files with playlist support',
      icon: Music,
      href: '/player/audio',
      color: 'text-purple-500',
    },
    {
      title: 'Video Player',
      description: 'Watch videos with subtitles and controls',
      icon: Video,
      href: '/player/video',
      color: 'text-blue-500',
    },
    {
      title: 'File Encryption',
      description: 'Encrypt and decrypt files with AES-256',
      icon: Lock,
      href: '/tools/encryption',
      color: 'text-green-500',
    },
    {
      title: 'File Compression',
      description: 'Compress files with GZIP or Deflate',
      icon: Minimize2,
      href: '/tools/compression',
      color: 'text-orange-500',
    },
    {
      title: 'Network Monitor',
      description: 'Monitor proxy connections and traffic',
      icon: Activity,
      href: '/monitor',
      color: 'text-red-500',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Tools & Features</DialogTitle>
          <DialogDescription>
            Access all B-2-Torrent tools and utilities
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} onClick={() => onOpenChange(false)}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                    <div className={`p-3 rounded-lg bg-muted ${tool.color}`}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground">
            All tools process files locally in your browser for maximum privacy and security.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
