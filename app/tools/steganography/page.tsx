"use client"

import type React from "react"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff, Upload, Download } from "lucide-react"
import { toast } from "sonner"

export default function SteganographyPage() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [image, setImage] = useState<File | null>(null)
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState("")
  const [processing, setProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const encodeMessage = async () => {
    if (!image || !message) {
      toast.error(t("fillAllFields") || "Please fill all fields")
      return
    }

    setProcessing(true)
    try {
      // Simulate steganography encoding
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success(t("encodingSuccess") || "Message hidden in image successfully")
      setResult("encoded-image-data")
    } catch (error) {
      toast.error(t("encodingError") || "Failed to encode message")
    } finally {
      setProcessing(false)
    }
  }

  const decodeMessage = async () => {
    if (!image) {
      toast.error(t("selectImage") || "Please select an image")
      return
    }

    setProcessing(true)
    try {
      // Simulate steganography decoding
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const decoded = "This is a hidden message extracted from the image"
      setResult(decoded)
      toast.success(t("decodingSuccess") || "Message extracted successfully")
    } catch (error) {
      toast.error(t("decodingError") || "Failed to decode message")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("steganographyTitle") || "Image Steganography"}</h1>
          <p className="text-muted-foreground">{t("steganographyDesc") || "Hide secret messages inside images"}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={mode === "encode" ? "default" : "outline"}
            onClick={() => setMode("encode")}
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            Hide Message
          </Button>
          <Button
            variant={mode === "decode" ? "default" : "outline"}
            onClick={() => setMode("decode")}
            className="flex-1"
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Extract Message
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "encode" ? "Hide Message" : "Extract Message"}</CardTitle>
            <CardDescription>
              {mode === "encode" ? "Embed a secret message into an image" : "Retrieve hidden message from an image"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Select Image</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} />
            </div>

            {imagePreview && (
              <div className="flex justify-center">
                <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-64 rounded-lg border" />
              </div>
            )}

            {mode === "encode" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="message">Secret Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your secret message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Protect your message with a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button onClick={encodeMessage} disabled={processing} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  {processing ? "Encoding..." : "Hide Message in Image"}
                </Button>
              </>
            )}

            {mode === "decode" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="decode-password">Password (if protected)</Label>
                  <Input
                    id="decode-password"
                    type="password"
                    placeholder="Enter password if message is protected"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button onClick={decodeMessage} disabled={processing} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  {processing ? "Extracting..." : "Extract Hidden Message"}
                </Button>

                {result && (
                  <div className="space-y-2">
                    <Label>Extracted Message</Label>
                    <Textarea value={result} readOnly rows={4} className="bg-muted" />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
