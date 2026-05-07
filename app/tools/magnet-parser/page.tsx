"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Magnet, Copy, Check } from "lucide-react"
import { toast } from "sonner"

export default function MagnetParserPage() {
  const { t } = useLanguage()
  const [magnetLink, setMagnetLink] = useState("")
  const [parsedData, setParsedData] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const parseMagnetLink = () => {
    try {
      const url = new URL(magnetLink)
      if (url.protocol !== "magnet:") {
        throw new Error("Invalid magnet link")
      }

      const params = new URLSearchParams(url.search.slice(1))
      const data = {
        displayName: params.get("dn") || "N/A",
        infoHash: params.get("xt")?.replace("urn:btih:", "") || "N/A",
        trackers: params.getAll("tr"),
        length: params.get("xl") || "N/A",
        keywords: params.get("kt")?.split("+") || [],
      }

      setParsedData(data)
      toast.success("Magnet link parsed successfully")
    } catch (error) {
      toast.error("Invalid magnet link format")
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Magnet className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Magnet Link Parser</h1>
        </div>
        <p className="text-muted-foreground">Parse and extract information from magnet links</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Magnet Link Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Magnet Link</Label>
            <Textarea
              value={magnetLink}
              onChange={(e) => setMagnetLink(e.target.value)}
              placeholder="magnet:?xt=urn:btih:..."
              className="h-24 font-mono text-sm"
            />
          </div>
          <Button onClick={parseMagnetLink} disabled={!magnetLink} className="w-full">
            <Magnet className="mr-2 h-4 w-4" />
            Parse Magnet Link
          </Button>
        </CardContent>
      </Card>

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Display Name</Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(parsedData.displayName, "Name")}>
                  {copied === "Name" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Input value={parsedData.displayName} readOnly className="font-mono" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Info Hash</Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(parsedData.infoHash, "Hash")}>
                  {copied === "Hash" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Input value={parsedData.infoHash} readOnly className="font-mono text-xs" />
            </div>

            {parsedData.trackers.length > 0 && (
              <div>
                <Label>Trackers ({parsedData.trackers.length})</Label>
                <div className="mt-2 space-y-2">
                  {parsedData.trackers.map((tracker: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={tracker} readOnly className="font-mono text-xs" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tracker, `Tracker ${index + 1}`)}
                      >
                        {copied === `Tracker ${index + 1}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
