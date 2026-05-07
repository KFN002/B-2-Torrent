"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/i18n"
import { Hash, Copy, Check, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function UUIDGeneratorPage() {
  const { t } = useLanguage()
  const [version, setVersion] = useState("v4")
  const [count, setCount] = useState("1")
  const [uuids, setUuids] = useState<string[]>([])
  const [copied, setCopied] = useState<number | null>(null)

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const generate = () => {
    const num = Number.parseInt(count)
    if (isNaN(num) || num <= 0 || num > 100) {
      toast.error("Count must be between 1 and 100")
      return
    }

    const newUuids = Array.from({ length: num }, () => generateUUID())
    setUuids(newUuids)
    toast.success(`Generated ${num} UUID${num > 1 ? "s" : ""}`)
  }

  const handleCopy = (uuid: string, index: number) => {
    navigator.clipboard.writeText(uuid)
    setCopied(index)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join("\n"))
    toast.success("Copied all UUIDs to clipboard")
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">UUID Generator</h1>
            <p className="text-muted-foreground">Generate universally unique identifiers (UUIDs)</p>
          </div>
        </div>
      </div>

      <Card className="border-teal-500/20">
        <CardHeader>
          <CardTitle>Generate UUIDs</CardTitle>
          <CardDescription>Create random UUIDs for your applications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Version</Label>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v4">UUID v4 (Random)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Count</Label>
              <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} min="1" max="100" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generate} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate
            </Button>
            {uuids.length > 1 && (
              <Button onClick={copyAll} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            )}
          </div>

          {uuids.length > 0 && (
            <div className="space-y-2">
              <Label>Generated UUIDs</Label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {uuids.map((uuid, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border hover:border-teal-500/50 transition-colors"
                  >
                    <code className="flex-1 font-mono text-sm">{uuid}</code>
                    <Button onClick={() => handleCopy(uuid, index)} variant="ghost" size="sm">
                      {copied === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
