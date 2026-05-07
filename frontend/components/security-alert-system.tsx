"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Shield, Wifi, WifiOff, Lock, Unlock, XCircle } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

interface SecurityEvent {
  type: string
  severity: "critical" | "warning" | "info"
  message: string
  timestamp: string
  details?: string
}

export function SecurityAlertSystem() {
  const { t } = useLanguage()
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set())
  const [backendAvailable, setBackendAvailable] = useState(false)

  useEffect(() => {
    const checkSecurityEvents = async () => {
      try {
        const response = await fetch("/api/security/events")
        if (!response.ok) return
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) return
        const events: SecurityEvent[] = await response.json()
        if (!Array.isArray(events)) return
        setBackendAvailable(true)

        events.forEach((event) => {
          const eventId = `${event.type}-${event.timestamp}`

          if (processedEvents.has(eventId)) return

          setProcessedEvents((prev) => new Set([...prev, eventId]))

          // Handle different security event types
          switch (event.type) {
            case "leak_detected":
              toast.error("SECURITY ALERT: IP/DNS Leak Detected!", {
                description: event.message,
                duration: 15000,
                icon: <AlertTriangle className="h-5 w-5" />,
                action: {
                  label: "Fix Now",
                  onClick: () => (window.location.href = "/security"),
                },
              })
              break

            case "killswitch_triggered":
              toast.error("Kill Switch Activated!", {
                description: "All connections terminated for security",
                duration: 10000,
                icon: <Shield className="h-5 w-5" />,
              })
              break

            case "vpn_disconnected":
              toast.error("VPN Connection Lost!", {
                description: "Your IP may be exposed. Reconnecting...",
                duration: 10000,
                icon: <WifiOff className="h-5 w-5" />,
              })
              break

            case "tor_disconnected":
              toast.error("Tor Connection Lost!", {
                description: "Privacy protection interrupted. Reconnecting...",
                duration: 10000,
                icon: <WifiOff className="h-5 w-5" />,
              })
              break

            case "encryption_disabled":
              toast.warning("Encryption Disabled!", {
                description: "Your data may be exposed. Enable encryption in settings.",
                duration: 8000,
                icon: <Unlock className="h-5 w-5" />,
              })
              break

            case "unencrypted_peer":
              toast.warning("Unencrypted Peer Connection Blocked", {
                description: event.message,
                duration: 5000,
                icon: <XCircle className="h-5 w-5" />,
              })
              break

            case "dns_leak":
              toast.error("DNS Leak Detected!", {
                description: "Your DNS queries are leaking. Enable DNS protection.",
                duration: 12000,
                icon: <AlertTriangle className="h-5 w-5" />,
                action: {
                  label: "Enable Protection",
                  onClick: () => (window.location.href = "/security"),
                },
              })
              break

            case "malicious_peer":
              toast.warning("Malicious Peer Blocked", {
                description: event.message,
                duration: 5000,
                icon: <Shield className="h-5 w-5" />,
              })
              break

            case "vpn_reconnected":
              toast.success("VPN Reconnected", {
                description: "Your connection is secure again",
                duration: 5000,
                icon: <Wifi className="h-5 w-5" />,
              })
              break

            case "tor_reconnected":
              toast.success("Tor Reconnected", {
                description: "Privacy protection restored",
                duration: 5000,
                icon: <Shield className="h-5 w-5" />,
              })
              break

            case "encryption_enabled":
              toast.success("Encryption Enabled", {
                description: "All connections are now encrypted",
                duration: 5000,
                icon: <Lock className="h-5 w-5" />,
              })
              break

            case "nologs_activated":
              toast.info("No-Logs Mode Activated", {
                description: "All activity logging disabled for maximum privacy",
                duration: 5000,
                icon: <Lock className="h-5 w-5" />,
              })
              break

            case "security_score_low":
              toast.warning("Low Security Score", {
                description: event.message,
                duration: 8000,
                icon: <AlertTriangle className="h-5 w-5" />,
                action: {
                  label: "Improve",
                  onClick: () => (window.location.href = "/security"),
                },
              })
              break
          }
        })
      } catch (error) {
        // Silent fail - backend monitoring unavailable
      }
    }

    checkSecurityEvents()
    const interval = setInterval(checkSecurityEvents, 5000)

    return () => clearInterval(interval)
  }, [processedEvents, backendAvailable, t])

  return null
}
