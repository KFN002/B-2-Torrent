"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n"
import { Clock, Copy, Check } from "lucide-react"
import { toast } from "sonner"

export default function TimestampConverterPage() {
  const { t } = useLanguage()
  const [timestamp, setTimestamp] = useState(Date.now().toString())
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timestampToDate = () => {
    const ts = Number.parseInt(timestamp)
    if (isNaN(ts)) {
      toast.error("Invalid timestamp")
      return
    }
    const d = new Date(ts)
    setDate(d.toISOString().slice(0, 16))
  }

  const dateToTimestamp = () => {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      toast.error("Invalid date")
      return
    }
    setTimestamp(d.getTime().toString())
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container max-w-3xl py-8 px-4">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Timestamp Converter</h1>
            <p className="text-muted-foreground">Convert between Unix timestamps and human-readable dates</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Current Unix Timestamp</div>
              <div className="text-3xl font-bold font-mono">{currentTime}</div>
              <div className="text-sm text-muted-foreground">{new Date(currentTime).toUTCString()}</div>
              <Button onClick={() => handleCopy(currentTime.toString())} variant="outline" size="sm" className="mt-2">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle>Timestamp to Date</CardTitle>
            <CardDescription>Convert Unix timestamp to human-readable date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Unix Timestamp (milliseconds)</Label>
              <Input
                type="number"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="1234567890000"
              />
            </div>
            <Button onClick={timestampToDate} className="w-full">
              Convert to Date
            </Button>
            {date && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Result</div>
                <div className="font-mono">{new Date(date).toUTCString()}</div>
                <div className="font-mono text-sm text-muted-foreground mt-1">{date}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle>Date to Timestamp</CardTitle>
            <CardDescription>Convert human-readable date to Unix timestamp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date and Time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={dateToTimestamp} className="w-full">
              Convert to Timestamp
            </Button>
            {timestamp && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Result</div>
                <div className="font-mono text-lg">{timestamp}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
