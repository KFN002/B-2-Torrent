"use client"

import { Input } from "@/components/ui/input"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/i18n"
import { ImageIcon, Download } from "lucide-react"
import { toast } from "sonner"

export default function ImageConverterPage() {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState("png")

  const handleConvert = () => {
    if (!file) return
    toast.success(`Converting to ${format.toUpperCase()}...`)
    // Simulate conversion
    setTimeout(() => {
      toast.success("Conversion complete!")
    }, 1500)
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Image Converter</h1>
        <p className="text-muted-foreground">Convert images between different formats</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Convert Image
          </CardTitle>
          <CardDescription>Support for PNG, JPG, WebP, and more</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label>Output Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
                <SelectItem value="bmp">BMP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleConvert} disabled={!file} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Convert & Download
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
