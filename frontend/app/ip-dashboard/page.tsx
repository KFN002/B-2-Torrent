"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Globe,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HardDrive,
  Cpu,
  MemoryStick,
  Monitor,
  Wifi,
  Battery,
} from "lucide-react"

interface IPData {
  ip: string
  country: string
  city: string
  region: string
  isp: string
  org: string
  as: string
  lat: number
  lon: number
  timezone: string
  isVPN: boolean
  isTor: boolean
  isProxy: boolean
}

interface SystemInfo {
  platform: string
  cpuCores: number
  memory: number
  screen: string
  browser: string
  language: string
}

interface BrowserData {
  online: boolean
  cookiesEnabled: boolean
  doNotTrack: string
  connectionType: string
  downlink: number
  rtt: number
}

export default function IPDashboardPage() {
  const [ipData, setIpData] = useState<IPData | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [torrents, setTorrents] = useState<any[]>([])
  const [browserData, setBrowserData] = useState<BrowserData | null>(null)

  useEffect(() => {
    fetchIPData()
    fetchLocalTorrents()
    collectSystemInfo()
    collectBrowserData()
  }, [])

  const fetchIPData = async () => {
    setLoading(true)
    const externalLookupEnabled = process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_LEAK_CHECKS === "true"

    if (!externalLookupEnabled) {
      try {
        const response = await fetch("/api/security/ip", { cache: "no-store" })
        if (!response.ok) throw new Error("Local privacy API unavailable")

        const data = await response.json()
        const vpnEnabled = data.vpnType && data.vpnType !== "none"

        setIpData({
          ip: data.ipObfuscated ? "Protected by local privacy mode" : "Direct local mode",
          country: "Private",
          city: "Localhost",
          region: "Local device",
          isp: data.connectionType || "Local B-2-Torrent",
          org: "Self-hosted",
          as: "Local",
          lat: 0,
          lon: 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local",
          isVPN: Boolean(vpnEnabled),
          isTor: Boolean(data.torEnabled),
          isProxy: Boolean(data.ipObfuscated),
        })
      } catch {
        setIpData({
          ip: "Local API unavailable",
          country: "Private",
          city: "Localhost",
          region: "Local device",
          isp: "Start the self-hosted backend",
          org: "Self-hosted",
          as: "Local",
          lat: 0,
          lon: 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local",
          isVPN: false,
          isTor: false,
          isProxy: false,
        })
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const response = await fetch("https://ipapi.co/json/")
      const data = await response.json()

      setIpData({
        ip: data.ip,
        country: data.country_name,
        city: data.city,
        region: data.region,
        isp: data.org,
        org: data.org,
        as: data.asn,
        lat: data.latitude,
        lon: data.longitude,
        timezone: data.timezone,
        isVPN: false,
        isTor: false,
        isProxy: false,
      })
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const fetchLocalTorrents = async () => {
    try {
      const response = await fetch("/api/torrents", { cache: "no-store" })
      if (!response.ok) throw new Error("Local torrent API unavailable")
      const data = await response.json()
      setTorrents(Array.isArray(data) ? data : [])
    } catch {
      setTorrents([])
    }
  }

  const collectSystemInfo = () => {
    const nav = navigator as any
    const connection = (nav as any).connection || (nav as any).mozConnection || (nav as any).webkitConnection

    setSystemInfo({
      platform: nav.platform || "Unknown",
      cpuCores: nav.hardwareConcurrency || 0,
      memory: (nav.deviceMemory || 0) * 1024,
      screen: `${window.screen.width}x${window.screen.height}`,
      browser: nav.userAgent,
      language: nav.language,
    })
  }

  const collectBrowserData = () => {
    const nav = navigator as any
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection

    setBrowserData({
      online: nav.onLine,
      cookiesEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack,
      connectionType: connection?.effectiveType || "unknown",
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    })
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="container relative px-4 py-16 xl:py-24">
        <div className="text-center space-y-6 mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-30 animate-glow-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-muted ring-2 ring-blue-500/30 glass-card-transparent">
                <Globe className="h-12 w-12 text-blue-500" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gradient-rainbow text-fade">Local Device Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-fade">
            System and privacy status for the laptop or PC running your self-hosted B-2-Torrent app.
          </p>
          <Button
            onClick={() => {
              fetchIPData()
              collectBrowserData()
            }}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card-transparent border-2 border-blue-500/20 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Connection Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-muted-foreground">Public IP</span>
                      <span className="text-lg font-mono font-bold">{ipData?.ip}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-muted-foreground">Location</span>
                      <span className="font-medium">
                        {ipData?.city}, {ipData?.country}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-muted-foreground">ISP</span>
                      <span className="font-medium">{ipData?.isp}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-muted-foreground">Timezone</span>
                      <span className="font-medium">{ipData?.timezone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-center mb-2">
                        {ipData?.isVPN ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="text-xs font-medium">VPN</div>
                      <div className="text-xs text-muted-foreground">{ipData?.isVPN ? "Detected" : "Clean"}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-center mb-2">
                        {ipData?.isTor ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="text-xs font-medium">Tor</div>
                      <div className="text-xs text-muted-foreground">{ipData?.isTor ? "Detected" : "Clean"}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-center mb-2">
                        {ipData?.isProxy ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="text-xs font-medium">Proxy</div>
                      <div className="text-xs text-muted-foreground">{ipData?.isProxy ? "Detected" : "Clean"}</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card-transparent border-2 border-purple-500/20 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-500" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">CPU Cores</span>
                </div>
                <span className="font-medium">{systemInfo?.cpuCores || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <span className="font-medium">{systemInfo?.memory || 0} MB</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Screen</span>
                </div>
                <span className="font-medium">{systemInfo?.screen}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Language</span>
                </div>
                <span className="font-medium">{systemInfo?.language}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Platform</span>
                </div>
                <span className="font-medium">{systemInfo?.platform}</span>
              </div>
              {browserData && (
                <>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Connection</span>
                    </div>
                    <span className="font-medium">{browserData.connectionType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 text-muted-foreground">Activity</span>
                      <span className="text-sm font-medium">Downlink</span>
                    </div>
                    <span className="font-medium">{browserData.downlink} Mbps</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <Badge variant={browserData.online ? "default" : "destructive"}>
                      {browserData.online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card-transparent border-2 border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-500" />
              Local Torrent Activity
              <Badge variant="secondary" className="ml-2">
                Local Data
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {torrents.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No local torrent activity yet</p>
                <p className="text-sm text-muted-foreground mt-2">Add torrents to the self-hosted manager to see them here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {torrents.map((torrent, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border border-orange-500/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{torrent.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {torrent.status || "active"} • {Math.round(torrent.progress || 0)}% complete
                        </p>
                      </div>
                      <HardDrive className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                ))}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-500">
                    Use B-2-Torrent VPN or Tor to keep local downloads private and secure.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
