"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  List,
  ArrowLeft,
  Upload,
  Download,
  Plus,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

interface LyricsEntry {
  id: string
  startTime: string
  endTime: string
  text: string
}

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [lyrics, setLyrics] = useState<LyricsEntry[]>([])
  const [lyricsFormat, setLyricsFormat] = useState<"lrc" | "srt">("lrc")
  const [showLyricsEditor, setShowLyricsEditor] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)

  // Mock playlist
  const [playlist, setPlaylist] = useState([
    { id: 1, title: "Track 1", artist: "Artist Name", duration: "3:45", file: "/audio/track1.mp3" },
    { id: 2, title: "Track 2", artist: "Artist Name", duration: "4:20", file: "/audio/track2.mp3" },
  ])
  const [currentTrack, setCurrentTrack] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else if (currentTrack < playlist.length - 1) {
        setCurrentTrack(currentTrack + 1)
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [isRepeat, currentTrack, playlist.length])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime += seconds
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume || 0.5
      setVolume(volume || 0.5)
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleLyricsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseLyrics(text)
      setLyrics(parsed)
      toast.success("Lyrics loaded successfully")
    } catch (error) {
      toast.error("Failed to load lyrics")
    }
  }

  const parseLyrics = (text: string): LyricsEntry[] => {
    const entries: LyricsEntry[] = []
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

  const exportLyrics = () => {
    let content = ""

    if (lyricsFormat === "srt") {
      content = lyrics
        .map((entry, index) => `${index + 1}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`)
        .join("\n")
    } else {
      content = lyrics.map((entry) => `[${entry.startTime}] ${entry.text}`).join("\n")
    }

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lyrics.${lyricsFormat}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Lyrics exported")
  }

  const addLyric = () => {
    setLyrics([
      ...lyrics,
      {
        id: String(lyrics.length + 1),
        startTime: "00:00",
        endTime: "00:05",
        text: "",
      },
    ])
  }

  const updateLyric = (id: string, field: keyof LyricsEntry, value: string) => {
    setLyrics(lyrics.map((lyric) => (lyric.id === id ? { ...lyric, [field]: value } : lyric)))
  }

  const deleteLyric = (id: string) => {
    setLyrics(lyrics.filter((lyric) => lyric.id !== id))
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
              <h1 className="text-xl font-bold tracking-tight">Audio Player</h1>
              <p className="text-xs text-muted-foreground">Secure Media Playback</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Album Art & Info */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-64 h-64 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Volume2 className="h-24 w-24 text-white/30" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">{playlist[currentTrack]?.title}</h2>
                  <p className="text-xl text-muted-foreground mb-4">{playlist[currentTrack]?.artist}</p>
                  <div className="flex gap-2 justify-center md:justify-start">
                    <Button
                      variant={isShuffle ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsShuffle(!isShuffle)}
                      className={isShuffle ? "bg-pink-600 hover:bg-pink-700" : ""}
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isRepeat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsRepeat(!isRepeat)}
                      className={isRepeat ? "bg-pink-600 hover:bg-pink-700" : ""}
                    >
                      <Repeat className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowPlaylist(!showPlaylist)}>
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Controls */}
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={() => skip(-10)} className="h-12 w-12">
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button size="icon" onClick={togglePlayPause} className="h-16 w-16 bg-pink-600 hover:bg-pink-700">
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => skip(10)} className="h-12 w-12">
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-full max-w-xs"
                />
                <Dialog open={showLyricsEditor} onOpenChange={setShowLyricsEditor}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Upload className="h-4 w-4" />
                      Lyrics
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Lyrics Manager</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <Label>Format</Label>
                          <select
                            className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background"
                            value={lyricsFormat}
                            onChange={(e) => setLyricsFormat(e.target.value as "lrc" | "srt")}
                          >
                            <option value="lrc">LRC (.lrc)</option>
                            <option value="srt">SRT (.srt)</option>
                          </select>
                        </div>

                        <div className="flex gap-2 items-end">
                          <div>
                            <Label htmlFor="lyrics-upload">Upload Lyrics</Label>
                            <Input
                              id="lyrics-upload"
                              type="file"
                              accept=".lrc,.srt"
                              onChange={handleLyricsUpload}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={addLyric} className="gap-2" size="sm">
                          <Plus className="h-4 w-4" />
                          Add Line
                        </Button>
                        <Button
                          onClick={exportLyrics}
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-transparent"
                          disabled={lyrics.length === 0}
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {lyrics.map((lyric) => (
                          <Card key={lyric.id} className="border-pink-500/20">
                            <CardContent className="p-3 space-y-3">
                              <div className="flex gap-3 items-start">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Start Time</Label>
                                    <Input
                                      value={lyric.startTime}
                                      onChange={(e) => updateLyric(lyric.id, "startTime", e.target.value)}
                                      placeholder="00:00"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">End Time</Label>
                                    <Input
                                      value={lyric.endTime}
                                      onChange={(e) => updateLyric(lyric.id, "endTime", e.target.value)}
                                      placeholder="00:05"
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteLyric(lyric.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div>
                                <Label className="text-xs">Lyric Text</Label>
                                <Textarea
                                  value={lyric.text}
                                  onChange={(e) => updateLyric(lyric.id, "text", e.target.value)}
                                  placeholder="Enter lyric line..."
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
              </div>
            </CardContent>
          </Card>

          {/* Playlist */}
          {showPlaylist && (
            <Card>
              <CardHeader>
                <CardTitle>Playlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {playlist.map((track, index) => (
                    <div
                      key={track.id}
                      onClick={() => setCurrentTrack(index)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        index === currentTrack ? "bg-pink-600 text-white" : "hover:bg-muted"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.artist}</p>
                      </div>
                      <span className="text-sm">{track.duration}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <audio ref={audioRef} src={playlist[currentTrack]?.file} />
    </div>
  )
}
