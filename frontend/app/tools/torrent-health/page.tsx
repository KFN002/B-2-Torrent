"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Activity, Users, Upload, Download, Clock } from "lucide-react"

export default function TorrentHealthPage() {
  const { t } = useLanguage()
  const [magnetLink, setMagnetLink] = useState("")
  const [health, setHealth] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  const checkHealth = async () => {
    setChecking(true)
    // Simulate API call to check torrent health
    setTimeout(() => {
      const mockHealth = {
        seeders: Math.floor(Math.random() * 500),
        leechers: Math.floor(Math.random() * 200),
        completed: Math.floor(Math.random() * 1000),
        ratio: (Math.random() * 10).toFixed(2),
        lastSeen: new Date().toISOString(),
        healthScore: Math.floor(Math.random() * 100),
      }
      setHealth(mockHealth)
      setChecking(false)
    }, 2000)
  }

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-green-500"
    if (score >= 40) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Torrent Health Checker</h1>
        </div>
        <p className="text-muted-foreground">Check the health and availability of torrents</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Check Torrent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Magnet Link or Info Hash</Label>
            <Input
              value={magnetLink}
              onChange={(e) => setMagnetLink(e.target.value)}
              placeholder="magnet:?xt=urn:btih:... or info hash"
              className="font-mono"
            />
          </div>
          <Button onClick={checkHealth} disabled={!magnetLink || checking} className="w-full">
            <Activity className="mr-2 h-4 w-4" />
            {checking ? "Checking..." : "Check Health"}
          </Button>
        </CardContent>
      </Card>

      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Health Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Health</span>
                <span className={`text-2xl font-bold ${getHealthColor(health.healthScore)}`}>
                  {health.healthScore}%
                </span>
              </div>
              <Progress value={health.healthScore} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Upload className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Seeders</p>
                      <p className="text-2xl font-bold text-green-500">{health.seeders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Download className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Leechers</p>
                      <p className="text-2xl font-bold text-blue-500">{health.leechers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-purple-500">{health.completed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Seed Ratio</p>
                      <p className="text-2xl font-bold text-amber-500">{health.ratio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-sm text-muted-foreground">Last seen: {new Date(health.lastSeen).toLocaleString()}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
