"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, File, FolderOpen } from "lucide-react"

interface AddTorrentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: () => void
}

export function AddTorrentDialog({ open, onOpenChange, onAdd }: AddTorrentDialogProps) {
  const [magnetLink, setMagnetLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [downloadPath, setDownloadPath] = useState("/downloads")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/torrents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnetLink, downloadPath }),
      })

      if (response.ok) {
        onAdd()
        setMagnetLink("")
        setDownloadPath("/downloads")
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to add torrent:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Torrent</DialogTitle>
          <DialogDescription className="text-base">
            Add a torrent using a magnet link or .torrent file
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="magnet" className="text-sm font-medium">
              Magnet Link
            </Label>
            <div className="relative">
              <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="magnet"
                placeholder="magnet:?xt=urn:btih:..."
                value={magnetLink}
                onChange={(e) => setMagnetLink(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="downloadPath" className="text-sm font-medium">
              Download Path
            </Label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="downloadPath"
                placeholder="/downloads"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">Files will be saved to this directory</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full gap-2 bg-transparent">
            <File className="h-4 w-4" />
            Upload .torrent file
          </Button>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!magnetLink || isLoading}>
              {isLoading ? "Adding..." : "Add Torrent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
