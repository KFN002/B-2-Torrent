"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, FileEdit, ImageIcon, Music, Video } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"

export default function MetadataEditorPage() {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)

    try {
      // Extract metadata based on file type
      const type = selectedFile.type
      if (type.startsWith("image/")) {
        await extractImageMetadata(selectedFile)
      } else if (type.startsWith("audio/")) {
        await extractAudioMetadata(selectedFile)
      } else if (type.startsWith("video/")) {
        await extractVideoMetadata(selectedFile)
      } else {
        await extractGenericMetadata(selectedFile)
      }
      toast.success("Metadata extracted successfully")
    } catch (error) {
      toast.error("Failed to extract metadata")
    } finally {
      setLoading(false)
    }
  }

  const extractImageMetadata = async (file: File) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    return new Promise((resolve) => {
      img.onload = () => {
        setMetadata({
          type: "image",
          name: file.name,
          size: file.size,
          mimeType: file.type,
          width: img.width,
          height: img.height,
          lastModified: new Date(file.lastModified).toISOString(),
        })
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    })
  }

  const extractAudioMetadata = async (file: File) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)

    return new Promise((resolve) => {
      audio.onloadedmetadata = () => {
        setMetadata({
          type: "audio",
          name: file.name,
          size: file.size,
          mimeType: file.type,
          duration: audio.duration,
          lastModified: new Date(file.lastModified).toISOString(),
        })
        URL.revokeObjectURL(url)
        resolve(null)
      }
      audio.src = url
    })
  }

  const extractVideoMetadata = async (file: File) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(file)

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        setMetadata({
          type: "video",
          name: file.name,
          size: file.size,
          mimeType: file.type,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          lastModified: new Date(file.lastModified).toISOString(),
        })
        URL.revokeObjectURL(url)
        resolve(null)
      }
      video.src = url
    })
  }

  const extractGenericMetadata = async (file: File) => {
    setMetadata({
      type: "generic",
      name: file.name,
      size: file.size,
      mimeType: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
    })
  }

  const getTypeIcon = () => {
    if (!metadata) return FileEdit
    switch (metadata.type) {
      case "image":
        return ImageIcon
      case "audio":
        return Music
      case "video":
        return Video
      default:
        return FileEdit
    }
  }

  const TypeIcon = getTypeIcon()

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Metadata Editor</h1>
            <p className="text-muted-foreground">View and edit file metadata for images, audio, and video files</p>
          </div>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-cyan-500" />
                Upload File
              </CardTitle>
              <CardDescription>Select a file to view and edit its metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors">
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="metadata-file"
                    accept="image/*,audio/*,video/*"
                  />
                  <Label htmlFor="metadata-file" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-cyan-500" />
                      </div>
                      <div>
                        <p className="font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground mt-1">Supports images, audio, and video files</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {metadata && (
            <Card className="border-cyan-500/20 bg-cyan-500/5 animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TypeIcon className="h-5 w-5 text-cyan-500" />
                  File Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>File Name</Label>
                    <Input value={metadata.name} onChange={(e) => setMetadata({ ...metadata, name: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label>MIME Type</Label>
                    <Input value={metadata.mimeType} readOnly className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label>File Size</Label>
                    <Input value={`${(metadata.size / 1024 / 1024).toFixed(2)} MB`} readOnly className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Modified</Label>
                    <Input value={new Date(metadata.lastModified).toLocaleString()} readOnly className="bg-muted" />
                  </div>

                  {metadata.width && (
                    <div className="space-y-2">
                      <Label>Dimensions</Label>
                      <Input value={`${metadata.width} × ${metadata.height} px`} readOnly className="bg-muted" />
                    </div>
                  )}

                  {metadata.duration && (
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={`${Math.floor(metadata.duration / 60)}:${Math.floor(metadata.duration % 60)
                          .toString()
                          .padStart(2, "0")}`}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 gap-2 bg-cyan-600 hover:bg-cyan-700">
                    <Download className="h-4 w-4" />
                    Export Metadata
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
