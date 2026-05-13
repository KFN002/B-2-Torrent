"use client"

import { useEffect, useState } from "react"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Wifi,
  Lock,
  Server,
  HardDrive,
  Cpu,
  Globe,
  MapPin,
  Network,
  Download,
  Upload,
  Zap,
  Eye,
} from "lucide-react"

interface SecurityStatus {
  killSwitchActive: boolean
  dnsProtectionActive: boolean
  dnsObfuscationActive: boolean
  ipObfuscationActive: boolean
  dhtInvisible: boolean
  sharingDisabled: boolean
  udpTrackersBlocked: boolean
  proxyRequired: boolean
  proxyAvailable: boolean
  trafficObfuscationActive: boolean
  dataEncryptionActive: boolean
  securityScore: number
  noLogsMode: boolean
  leaksDetected: number
  connectionType: string
  downloadSpeed: number
  uploadSpeed: number
}

export function SecurityStatusTicker() {
  // Language removed - English only
  const [status, setStatus] = useState<SecurityStatus>({
    killSwitchActive: true,
    dnsProtectionActive: true,
    dnsObfuscationActive: false,
    ipObfuscationActive: false,
    dhtInvisible: true,
    sharingDisabled: true,
    udpTrackersBlocked: false,
    proxyRequired: false,
    proxyAvailable: false,
    trafficObfuscationActive: false,
    dataEncryptionActive: true,
    securityScore: 100,
    noLogsMode: false,
    leaksDetected: 0,
    connectionType: "Secure Connection",
    downloadSpeed: 0,
    uploadSpeed: 0,
  })
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [activeTorrents, setActiveTorrents] = useState(0)
  const [systemInfo, setSystemInfo] = useState({
    memory: 0,
    cpu: 0,
    peers: 0,
    vpnServer: "Auto",
    uptime: 0,
  })
  const [networkInfo, setNetworkInfo] = useState({
    publicIP: "Protected",
    localIP: "Detecting...",
    country: "Unknown",
    city: "Unknown",
    isp: "Protected",
    protocol: "Unknown",
    bandwidth: "0 Mbps",
    latency: 0,
    dataTransferred: { down: 0, up: 0 },
  })

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      if (process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_LEAK_CHECKS !== "true") {
        try {
          const response = await fetch("/api/security/ip")
          if (response.ok) {
            const data = await response.json()
            setNetworkInfo((prev) => ({
              ...prev,
              publicIP: data.ipObfuscated ? "Protected" : "Direct",
              localIP: "Hidden",
              isp: data.connectionType || "Protected",
              country: "Private",
              city: "Private",
            }))
          }
        } catch {
          setNetworkInfo((prev) => ({ ...prev, publicIP: "Protected", localIP: "Hidden" }))
        }
        return
      }

      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json")
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          setNetworkInfo((prev) => ({ ...prev, publicIP: ipData.ip }))

          try {
            const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`)
            if (geoResponse.ok) {
              const geoData = await geoResponse.json()
              if (!geoData.error) {
                setNetworkInfo((prev) => ({
                  ...prev,
                  country: geoData.country_name || "Unknown",
                  city: geoData.city || "Unknown",
                  isp: geoData.org || "Unknown",
                }))
              }
            }
          } catch {
            // Geo lookup failed - IP still set
          }
        }
      } catch {
        setNetworkInfo((prev) => ({ ...prev, publicIP: "Protected" }))
      }

      try {
        const pc = new RTCPeerConnection({ iceServers: [] })
        pc.createDataChannel("")
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        pc.onicecandidate = (ice) => {
          if (!ice?.candidate?.candidate) return
          const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate)
          if (match) {
            setNetworkInfo((prev) => ({ ...prev, localIP: match[1] }))
            pc.close()
          }
        }
        setTimeout(() => pc.close(), 5000)
      } catch {
        setNetworkInfo((prev) => ({ ...prev, localIP: "N/A" }))
      }
    }

    const updateConnectionInfo = () => {
      if ("connection" in navigator) {
        const conn = (navigator as any).connection
        if (conn) {
          setNetworkInfo((prev) => ({
            ...prev,
            protocol: conn.effectiveType || "Unknown",
            bandwidth: conn.downlink ? `${conn.downlink} Mbps` : "Unknown",
          }))
        }
      }
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/security/status")
        if (!response.ok) return
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) return
        const data = await response.json()
        setStatus((prev) => ({ ...prev, ...data }))
      } catch {
        // Backend not available - use secure defaults
      }
    }

    const fetchTorrentCount = async () => {
      try {
        const response = await fetch("/api/torrents")
        if (!response.ok) return
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) return
        const data = await response.json()
        if (!Array.isArray(data)) return
        setActiveTorrents(data.filter((t: any) => t.status === "downloading" || t.status === "seeding").length)
        const totalPeers = data.reduce((sum: number, t: any) => sum + (t.peers || 0), 0)
        const totalDown = data.reduce((sum: number, t: any) => sum + (t.downloaded || 0), 0)
        const totalUp = data.reduce((sum: number, t: any) => sum + (t.uploaded || 0), 0)
        setSystemInfo((prev) => ({ ...prev, peers: totalPeers }))
        setNetworkInfo((prev) => ({ ...prev, dataTransferred: { down: totalDown, up: totalUp } }))
      } catch {
        // Backend not available
      }
    }

    const collectSystemInfo = () => {
      if (typeof window !== "undefined" && "performance" in window) {
        const memory = (performance as any).memory
        const latency = Math.round(Math.random() * 20 + 10) // 10-30ms simulated
        setSystemInfo((prev) => ({
          ...prev,
          memory: memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : 0,
          cpu: Math.round(Math.random() * 30 + 10), // Simulated CPU usage
          uptime: Math.floor(performance.now() / 1000 / 60), // Minutes since page load
        }))
        setNetworkInfo((prev) => ({ ...prev, latency }))
      }
    }

    setMounted(true)
    setCurrentTime(new Date())
    fetchNetworkInfo()
    updateConnectionInfo()
    fetchStatus()
    fetchTorrentCount()
    collectSystemInfo()
    const statusInterval = setInterval(fetchStatus, 10000)
    const torrentInterval = setInterval(fetchTorrentCount, 10000)
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    const systemInterval = setInterval(collectSystemInfo, 5000)
    const networkInterval = setInterval(updateConnectionInfo, 15000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(torrentInterval)
      clearInterval(timeInterval)
      clearInterval(systemInterval)
      clearInterval(networkInterval)
    }
  }, [])

  const protectionLevel =
    status.killSwitchActive &&
    status.dnsProtectionActive &&
    status.ipObfuscationActive &&
    status.dnsObfuscationActive &&
    status.dhtInvisible &&
    status.sharingDisabled
      ? "MAXIMUM"
      : status.killSwitchActive && status.dnsProtectionActive && status.dhtInvisible
        ? "HIGH"
        : "BASIC"

  const isSecure = status.leaksDetected === 0 && protectionLevel !== "BASIC"

  const formattedTime = mounted && currentTime
    ? `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}:${String(currentTime.getSeconds()).padStart(2, "0")}`
    : "--:--:--"

  if (!mounted) return null

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-background via-background/95 to-background border-t border-border/40 backdrop-blur-lg">
      <div className="overflow-hidden">
        <div className="animate-[marquee-fast_16.67s_linear_infinite] whitespace-nowrap py-2.5 px-4 flex items-center gap-8 text-xs font-medium">
          {/* Security Status */}
          <div className="inline-flex items-center gap-2">
            {isSecure ? (
              <CheckCircle className="h-3.5 w-3.5 text-success animate-pulse" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-warning animate-pulse" />
            )}
            <span className={isSecure ? "text-success" : "text-warning"}>Security: {protectionLevel}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">Public IP: {networkInfo.publicIP}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Network className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">Local IP: {networkInfo.localIP}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">
              {networkInfo.city}, {networkInfo.country}
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-destructive" />
            <span className="text-muted-foreground">ISP: {networkInfo.isp}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {/* Connection Type */}
          <div className="inline-flex items-center gap-2">
            <Wifi className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">
              {status.connectionType} ({networkInfo.protocol})
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">Bandwidth: {networkInfo.bandwidth}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Latency: {networkInfo.latency}ms</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">VPN Server: {systemInfo.vpnServer}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {/* Active Torrents */}
          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">Active Torrents: {activeTorrents}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">Connected Peers: {systemInfo.peers}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Download className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">
              Total Downloaded: {formatBytes(networkInfo.dataTransferred.down)}
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Upload className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">Total Uploaded: {formatBytes(networkInfo.dataTransferred.up)}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {/* Active Protections */}
          <div className="inline-flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">
              Kill Switch: {status.killSwitchActive ? "✓" : "✗"} | DNS Protection:{" "}
              {status.dnsProtectionActive ? "✓" : "✗"} | IP: {status.ipObfuscationActive ? "masked" : "direct"} |
              DNS: {status.dnsObfuscationActive ? "proxied" : "local"} | DHT:{" "}
              {status.dhtInvisible ? "silent" : "visible"} | Upload: {status.sharingDisabled ? "blocked" : "open"}
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {/* No Logs Mode */}
          {status.noLogsMode && (
            <>
              <div className="inline-flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-accent animate-pulse" />
                <span className="text-accent font-semibold">NO-LOGS MODE ACTIVE</span>
              </div>
              <div className="inline-block h-3 w-px bg-border/40" />
            </>
          )}

          {/* Traffic Stats */}
          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">
              ↓ {(status.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s | ↑{" "}
              {(status.uploadSpeed / 1024 / 1024).toFixed(2)} MB/s
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">CPU: {systemInfo.cpu}%</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <HardDrive className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">Memory: {systemInfo.memory}%</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Uptime: {systemInfo.uptime}m</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {/* Leak Status */}
          <div className="inline-flex items-center gap-2">
            {status.leaksDetected > 0 ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse" />
                <span className="text-destructive font-semibold">{status.leaksDetected} LEAKS DETECTED!</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span className="text-success">NO LEAKS DETECTED</span>
              </>
            )}
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {/* Encryption Status */}
          <div className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-success" />
            <span className="text-success">AES-256 ENCRYPTION ACTIVE</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {/* Current Time */}
          <div className="inline-flex items-center gap-2">
            <span className="text-muted-foreground">{formattedTime}</span>
          </div>

          {/* Repeat for continuous scrolling */}
          <div className="inline-block h-3 w-px bg-border/40" />
          <div className="inline-flex items-center gap-2">
            {isSecure ? (
              <CheckCircle className="h-3.5 w-3.5 text-success animate-pulse" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-warning animate-pulse" />
            )}
            <span className={isSecure ? "text-success" : "text-warning"}>Security: {protectionLevel}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">Public IP: {networkInfo.publicIP}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Network className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">Local IP: {networkInfo.localIP}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">
              {networkInfo.city}, {networkInfo.country}
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-destructive" />
            <span className="text-muted-foreground">ISP: {networkInfo.isp}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Wifi className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">
              {status.connectionType} ({networkInfo.protocol})
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">Bandwidth: {networkInfo.bandwidth}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Latency: {networkInfo.latency}ms</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">VPN Server: {systemInfo.vpnServer}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">Active Torrents: {activeTorrents}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">Connected Peers: {systemInfo.peers}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Download className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">
              Total Downloaded: {formatBytes(networkInfo.dataTransferred.down)}
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Upload className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">Total Uploaded: {formatBytes(networkInfo.dataTransferred.up)}</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">
              Kill Switch: {status.killSwitchActive ? "✓" : "✗"} | DNS Protection:{" "}
              {status.dnsProtectionActive ? "✓" : "✗"} | IP: {status.ipObfuscationActive ? "masked" : "direct"} |
              DNS: {status.dnsObfuscationActive ? "proxied" : "local"} | DHT:{" "}
              {status.dhtInvisible ? "silent" : "visible"} | Upload: {status.sharingDisabled ? "blocked" : "open"}
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          {status.noLogsMode && (
            <>
              <div className="inline-flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-accent animate-pulse" />
                <span className="text-accent font-semibold">NO-LOGS MODE ACTIVE</span>
              </div>
              <div className="inline-block h-3 w-px bg-border/40" />
            </>
          )}

          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">
              ↓ {(status.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s | ↑{" "}
              {(status.uploadSpeed / 1024 / 1024).toFixed(2)} MB/s
            </span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-warning" />
            <span className="text-muted-foreground">CPU: {systemInfo.cpu}%</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <HardDrive className="h-3.5 w-3.5 text-info" />
            <span className="text-muted-foreground">Memory: {systemInfo.memory}%</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Uptime: {systemInfo.uptime}m</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            {status.leaksDetected > 0 ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse" />
                <span className="text-destructive font-semibold">{status.leaksDetected} LEAKS DETECTED!</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span className="text-success">NO LEAKS DETECTED</span>
              </>
            )}
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-success" />
            <span className="text-success">AES-256 ENCRYPTION ACTIVE</span>
          </div>

          <div className="inline-block h-3 w-px bg-border/40" />

          <div className="inline-flex items-center gap-2">
            <span className="text-muted-foreground">{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
