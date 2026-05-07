"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Subtitles,
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Upload,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

interface SubtitleEntry {
  id: string
  startTime: string
  endTime: string
  text: string
}

export default function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false)
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([])
  const [subtitleFormat, setSubtitleFormat] = useState<"srt" | "vtt">("srt")
  const [showSubtitleEditor, setShowSubtitleEditor] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
    }
  }, [])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime += seconds
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume || 0.5
      setVolume(volume || 0.5)
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00"
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseSubtitles(text)
      setSubtitles(parsed)
      toast.success("Subtitles loaded successfully")
    } catch (error) {
      toast.error("Failed to load subtitles")
    }
  }

  const parseSubtitles = (text: string): SubtitleEntry[] => {
    const entries: SubtitleEntry[] = []
    const blocks = text.trim().split("\n\n")

    for (const block of blocks) {
      const lines = block.split("\n")
      if (lines.length >= 3) {
        const timeLine = lines[1]
        const [startTime, endTime] = timeLine.split(" --> ")
        const text = lines.slice(2).join("\n")

        entries.push({
          id: lines[0],
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          text: text.trim(),
        })
      }
    }

    return entries
  }

  const exportSubtitles = () => {
    let content = ""

    if (subtitleFormat === "srt") {
      content = subtitles
        .map((entry, index) => `${index + 1}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`)
        .join("\n")
    } else {
      content =
        "WEBVTT\n\n" + subtitles.map((entry) => `${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`).join("\n")
    }

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `subtitles.${subtitleFormat}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Subtitles exported")
  }

  const addSubtitle = () => {
    setSubtitles([
      ...subtitles,
      {
        id: String(subtitles.length + 1),
        startTime: "00:00:00,000",
        endTime: "00:00:05,000",
        text: "",
      },
    ])
  }

  const updateSubtitle = (id: string, field: keyof SubtitleEntry, value: string) => {
    setSubtitles(subtitles.map((sub) => (sub.id === id ? { ...sub, [field]: value } : sub)))
  }

  const deleteSubtitle = (id: string) => {
    setSubtitles(subtitles.filter((sub) => sub.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4 md:px-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-muted">
              <Image src="/logo.png" alt="B-2-Torrent" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Video Player</h1>
              <p className="text-xs text-muted-foreground">Secure Media Playback</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <div
                ref={containerRef}
                className="relative bg-black aspect-video group"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
              >
                <video ref={videoRef} className="w-full h-full" onClick={togglePlayPause}>
                  {subtitles.map((subtitle) => (
                    <track
                      key={subtitle.id}
                      kind="subtitles"
                      src={subtitle.text}
                      srcLang="en"
                      label="English"
                      default={subtitlesEnabled}
                    />
                  ))}
                </video>

                {/* Play/Pause Overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={togglePlayPause}
                >
                  {!isPlaying && (
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="h-10 w-10 text-white ml-1" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
                    showControls ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/70 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Play/Pause */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>

                      {/* Skip Buttons */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skip(-10)}
                        className="text-white hover:bg-white/20 text-xs"
                      >
                        -10s
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skip(10)}
                        className="text-white hover:bg-white/20 text-xs"
                      >
                        +10s
                      </Button>

                      {/* Volume */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={1}
                          step={0.01}
                          onValueChange={handleVolumeChange}
                          className="w-24"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Subtitles */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                        className={`text-white hover:bg-white/20 ${subtitlesEnabled ? "bg-white/20" : ""}`}
                      >
                        <Subtitles className="h-5 w-5" />
                      </Button>

                      <Dialog open={showSubtitleEditor} onOpenChange={setShowSubtitleEditor}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                            <Upload className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Subtitle Manager</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex gap-4 flex-wrap">
                              <div className="flex-1 min-w-[200px]">
                                <Label>Format</Label>
                                <select
                                  className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background"
                                  value={subtitleFormat}
                                  onChange={(e) => setSubtitleFormat(e.target.value as "srt" | "vtt")}
                                >
                                  <option value="srt">SRT (.srt)</option>
                                  <option value="vtt">WebVTT (.vtt)</option>
                                </select>
                              </div>

                              <div className="flex gap-2 items-end">
                                <div>
                                  <Label htmlFor="subtitle-upload">Upload Subtitle</Label>
                                  <Input
                                    id="subtitle-upload"
                                    type="file"
                                    accept=".srt,.vtt"
                                    onChange={handleSubtitleUpload}
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={addSubtitle} className="gap-2" size="sm">
                                <Plus className="h-4 w-4" />
                                Add Subtitle
                              </Button>
                              <Button
                                onClick={exportSubtitles}
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent"
                                disabled={subtitles.length === 0}
                              >
                                <Download className="h-4 w-4" />
                                Export
                              </Button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {subtitles.map((subtitle) => (
                                <Card key={subtitle.id} className="border-blue-500/20">
                                  <CardContent className="p-3 space-y-3">
                                    <div className="flex gap-3 items-start">
                                      <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div>
                                          <Label className="text-xs">Start Time</Label>
                                          <Input
                                            value={subtitle.startTime}
                                            onChange={(e) => updateSubtitle(subtitle.id, "startTime", e.target.value)}
                                            placeholder="00:00:00,000"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">End Time</Label>
                                          <Input
                                            value={subtitle.endTime}
                                            onChange={(e) => updateSubtitle(subtitle.id, "endTime", e.target.value)}
                                            placeholder="00:00:05,000"
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteSubtitle(subtitle.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Subtitle Text</Label>
                                      <Textarea
                                        value={subtitle.text}
                                        onChange={(e) => updateSubtitle(subtitle.id, "text", e.target.value)}
                                        placeholder="Enter subtitle text..."
                                        className="mt-1 min-h-[60px]"
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Playback Speed */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                            <Settings className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                            <DropdownMenuItem
                              key={rate}
                              onClick={() => handlePlaybackRateChange(rate)}
                              className={playbackRate === rate ? "bg-accent" : ""}
                            >
                              {rate}x {rate === 1 && "(Normal)"}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Fullscreen */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Info */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-2">Video Title</h2>
              <p className="text-muted-foreground">
                Secure video playback with subtitle support, playback speed control, and fullscreen mode.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
