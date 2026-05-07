"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n"
import { LinkIcon, Copy, Check } from "lucide-react"
import { toast } from "sonner"

export default function URLShortenerPage() {
  const { t } = useLanguage()
  const [url, setUrl] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const shortenUrl = () => {
    if (!url) return
    // Simulate URL shortening
    const hash = Math.random().toString(36).substring(2, 8)
    setShortUrl(`https://b2t.sh/${hash}`)
    toast.success("URL shortened successfully")
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">URL Shortener</h1>
        <p className="text-muted-foreground">Create short, shareable links</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Shorten URL
          </CardTitle>
          <CardDescription>Enter a long URL to create a short link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Original URL</Label>
            <Input
              placeholder="https://example.com/very/long/url/path"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <Button onClick={shortenUrl} className="w-full">
            <LinkIcon className="h-4 w-4 mr-2" />
            Shorten URL
          </Button>

          {shortUrl && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Shortened URL</Label>
              <div className="flex gap-2">
                <Input value={shortUrl} readOnly />
                <Button onClick={copyToClipboard} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
