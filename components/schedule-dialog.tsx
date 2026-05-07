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
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock } from 'lucide-react'

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  torrentId?: string
  torrentName?: string
  onSchedule: (schedule: ScheduleConfig) => void
}

export interface ScheduleConfig {
  enabled: boolean
  startDate?: string
  startTime?: string
  pauseWhenComplete: boolean
  deleteWhenComplete: boolean
}

export function ScheduleDialog({
  open,
  onOpenChange,
  torrentId,
  torrentName,
  onSchedule,
}: ScheduleDialogProps) {
  const [enabled, setEnabled] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [pauseWhenComplete, setPauseWhenComplete] = useState(false)
  const [deleteWhenComplete, setDeleteWhenComplete] = useState(false)

  const handleSave = () => {
    onSchedule({
      enabled,
      startDate,
      startTime,
      pauseWhenComplete,
      deleteWhenComplete,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Schedule Download</DialogTitle>
          <DialogDescription className="text-base">
            {torrentName
              ? `Schedule download for "${torrentName}"`
              : 'Configure download schedule'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Enable Scheduling */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable Scheduling</Label>
              <p className="text-xs text-muted-foreground">
                Start download at a specific time
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Pause When Complete */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Pause When Complete</Label>
              <p className="text-xs text-muted-foreground">
                Stop seeding after download completes
              </p>
            </div>
            <Switch
              checked={pauseWhenComplete}
              onCheckedChange={setPauseWhenComplete}
            />
          </div>

          {/* Delete When Complete */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Delete When Complete</Label>
              <p className="text-xs text-muted-foreground">
                Remove torrent after download completes
              </p>
            </div>
            <Switch
              checked={deleteWhenComplete}
              onCheckedChange={setDeleteWhenComplete}
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
              Save Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
