'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Download, Upload } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

interface TorrentLimitsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  torrentId?: string
  torrentName?: string
  currentDownloadLimit?: number
  currentUploadLimit?: number
  onSave: (limits: { downloadLimit: number; uploadLimit: number }) => void
}

export function TorrentLimitsDialog({
  open,
  onOpenChange,
  torrentId,
  torrentName,
  currentDownloadLimit = 0,
  currentUploadLimit = 0,
  onSave,
}: TorrentLimitsDialogProps) {
  const { t } = useLanguage()
  const [downloadLimit, setDownloadLimit] = useState(currentDownloadLimit)
  const [uploadLimit, setUploadLimit] = useState(currentUploadLimit)

  const handleSave = () => {
    onSave({ downloadLimit, uploadLimit })
    onOpenChange(false)
  }

  const formatSpeed = (kbps: number) => {
    if (kbps === 0) return 'Unlimited'
    if (kbps < 1024) return `${kbps} KB/s`
    return `${(kbps / 1024).toFixed(1)} MB/s`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {torrentName ? 'Speed Limits' : 'Global Speed Limits'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {torrentName
              ? `Set download and upload speed limits for "${torrentName}"`
              : 'Set global download and upload speed limits for all torrents'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Download Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                Download Limit
              </Label>
              <span className="text-sm font-mono text-muted-foreground">
                {formatSpeed(downloadLimit)}
              </span>
            </div>
            <Slider
              value={[downloadLimit]}
              onValueChange={(value) => setDownloadLimit(value[0])}
              max={10240}
              step={128}
              className="w-full"
            />
            <Input
              type="number"
              value={downloadLimit}
              onChange={(e) => setDownloadLimit(Number(e.target.value))}
              placeholder="0 = Unlimited"
              className="text-sm"
            />
          </div>

          {/* Upload Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-success" />
                Upload Limit
              </Label>
              <span className="text-sm font-mono text-muted-foreground">
                {formatSpeed(uploadLimit)}
              </span>
            </div>
            <Slider
              value={[uploadLimit]}
              onValueChange={(value) => setUploadLimit(value[0])}
              max={10240}
              step={128}
              className="w-full"
            />
            <Input
              type="number"
              value={uploadLimit}
              onChange={(e) => setUploadLimit(Number(e.target.value))}
              placeholder="0 = Unlimited"
              className="text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" className="flex-1" onClick={handleSave}>
              Save Limits
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
