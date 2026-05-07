"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Download, Upload, TrendingUp, TrendingDown } from "lucide-react"

export default function BandwidthMonitorPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    downloadSpeed: 0,
    uploadSpeed: 0,
    totalDownloaded: 0,
    totalUploaded: 0,
    peakDownload: 0,
    peakUpload: 0,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        downloadSpeed: Math.random() * 10240,
        uploadSpeed: Math.random() * 2048,
        totalDownloaded: Math.random() * 1024 * 1024 * 100,
        totalUploaded: Math.random() * 1024 * 1024 * 50,
        peakDownload: Math.random() * 15360,
        peakUpload: Math.random() * 3072,
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes.toFixed(2)} B/s`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB/s`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB/s`
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("bandwidthMonitorTitle") || "Bandwidth Monitor"}</h1>
          <p className="text-muted-foreground">
            {t("bandwidthMonitorDesc") || "Real-time network bandwidth monitoring"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Download className="h-4 w-4 text-blue-500" />
                Download Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{formatBytes(stats.downloadSpeed)}</div>
              <p className="text-xs text-muted-foreground mt-1">Current download rate</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Upload className="h-4 w-4 text-green-500" />
                Upload Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatBytes(stats.uploadSpeed)}</div>
              <p className="text-xs text-muted-foreground mt-1">Current upload rate</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-purple-500" />
                Total Downloaded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{formatSize(stats.totalDownloaded)}</div>
              <p className="text-xs text-muted-foreground mt-1">This session</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Peak Download
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{formatBytes(stats.peakDownload)}</div>
              <p className="text-xs text-muted-foreground mt-1">Maximum speed reached</p>
            </CardContent>
          </Card>

          <Card className="border-pink-500/20 bg-pink-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingDown className="h-4 w-4 text-pink-500" />
                Total Uploaded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-500">{formatSize(stats.totalUploaded)}</div>
              <p className="text-xs text-muted-foreground mt-1">This session</p>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-cyan-500" />
                Peak Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-500">{formatBytes(stats.peakUpload)}</div>
              <p className="text-xs text-muted-foreground mt-1">Maximum speed reached</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
