"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Clock, Calendar, Zap, Plus, Trash2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"

interface Schedule {
  id: string
  name: string
  startTime: string
  endTime: string
  days: string[]
  downloadLimit: number
  uploadLimit: number
  enabled: boolean
}

export default function BandwidthSchedulerPage() {
  const { t } = useLanguage()
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      name: "Night Hours",
      startTime: "22:00",
      endTime: "06:00",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      downloadLimit: 0,
      uploadLimit: 5120,
      enabled: true,
    },
  ])

  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: "",
    startTime: "00:00",
    endTime: "00:00",
    days: [],
    downloadLimit: 0,
    uploadLimit: 0,
    enabled: true,
  })

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const handleAddSchedule = () => {
    if (!newSchedule.name || !newSchedule.startTime || !newSchedule.endTime) {
      toast.error("Please fill in all required fields")
      return
    }

    const schedule: Schedule = {
      id: Date.now().toString(),
      name: newSchedule.name,
      startTime: newSchedule.startTime || "00:00",
      endTime: newSchedule.endTime || "00:00",
      days: newSchedule.days || [],
      downloadLimit: newSchedule.downloadLimit || 0,
      uploadLimit: newSchedule.uploadLimit || 0,
      enabled: newSchedule.enabled !== false,
    }

    setSchedules([...schedules, schedule])
    setNewSchedule({
      name: "",
      startTime: "00:00",
      endTime: "00:00",
      days: [],
      downloadLimit: 0,
      uploadLimit: 0,
      enabled: true,
    })
    toast.success("Schedule added successfully")
  }

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id))
    toast.success("Schedule deleted")
  }

  const toggleSchedule = (id: string) => {
    setSchedules(schedules.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  const toggleDay = (day: string) => {
    const days = newSchedule.days || []
    if (days.includes(day)) {
      setNewSchedule({ ...newSchedule, days: days.filter((d) => d !== day) })
    } else {
      setNewSchedule({ ...newSchedule, days: [...days, day] })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Bandwidth Scheduler</h1>
            <p className="text-muted-foreground">
              Schedule automatic speed limits based on time of day and day of week
            </p>
          </div>

          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-500" />
                Add New Schedule
              </CardTitle>
              <CardDescription>Create a time-based bandwidth limit schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input
                  placeholder="e.g., Night Hours, Work Hours"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Time
                  </Label>
                  <Input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    End Time
                  </Label>
                  <Input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Active Days
                </Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={newSchedule.days?.includes(day) ? "default" : "outline"}
                      onClick={() => toggleDay(day)}
                      className="min-w-[60px]"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Download Limit (KB/s)</Label>
                  <Input
                    type="number"
                    placeholder="0 = Unlimited"
                    value={newSchedule.downloadLimit}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, downloadLimit: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Limit (KB/s)</Label>
                  <Input
                    type="number"
                    placeholder="0 = Unlimited"
                    value={newSchedule.uploadLimit}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, uploadLimit: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleAddSchedule} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Active Schedules</h2>
            {schedules.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No schedules configured yet</p>
                </CardContent>
              </Card>
            ) : (
              schedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className={`border-amber-500/20 ${schedule.enabled ? "bg-amber-500/5" : "opacity-60"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Switch checked={schedule.enabled} onCheckedChange={() => toggleSchedule(schedule.id)} />
                          <h3 className="font-semibold">{schedule.name}</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {schedule.days.join(", ") || "All days"}
                          </div>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Download:</span>{" "}
                            <span className="font-medium">
                              {schedule.downloadLimit === 0 ? "Unlimited" : `${schedule.downloadLimit} KB/s`}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Upload:</span>{" "}
                            <span className="font-medium">
                              {schedule.uploadLimit === 0 ? "Unlimited" : `${schedule.uploadLimit} KB/s`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
