"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import { toast } from "sonner"

export default function ImageViewerPage() {
  const [images, setImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImages((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      }
    })
    toast.success(`${files.length} image(s) loaded`)
  }

  const downloadImage = () => {
    if (!selectedImage) return
    const link = document.createElement("a")
    link.href = selectedImage
    link.download = `image-${Date.now()}.png`
    link.click()
    toast.success("Image downloaded")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/20">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Image Viewer</h1>
        </div>
        <p className="text-muted-foreground">View and manage multiple images with zoom and rotation</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedImage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(10, z - 10))}>
                    <ZoomOut className="h-4 w-4 mr-1" />
                    Zoom Out
                  </Button>
                  <span className="text-sm font-medium">{zoom}%</span>
                  <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(300, z + 10))}>
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Zoom In
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
                    <RotateCw className="h-4 w-4 mr-1" />
                    Rotate
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadImage}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-center bg-muted/50 rounded-lg p-8 min-h-[500px] overflow-auto">
                  <img
                    src={selectedImage || "/placeholder.svg"}
                    alt="Selected"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: "transform 0.3s ease",
                      maxWidth: "100%",
                      maxHeight: "600px",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4" />
                <p>Select an image to view</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Load Images
            </Button>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 max-h-[600px] overflow-y-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img)
                      setZoom(100)
                      setRotation(0)
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img ? "border-primary" : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
