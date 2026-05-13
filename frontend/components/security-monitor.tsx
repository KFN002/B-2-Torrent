"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface SecurityStatus {
  killSwitchActive: boolean
  dnsProtectionActive: boolean
  dnsObfuscationActive: boolean
  ipObfuscationActive: boolean
  dhtInvisible: boolean
  sharingDisabled: boolean
  trafficObfuscationActive: boolean
  dataEncryptionActive: boolean
  proxyRequired: boolean
  proxyAvailable: boolean
  udpTrackersBlocked: boolean
  securityScore: number
  noLogsMode: boolean
  leaksDetected: number
  lastCheck: string
}

export function SecurityMonitor() {
  const [status, setStatus] = useState<SecurityStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const response = await fetch("/api/security/status")
        const data = await response.json()
        setStatus(data)

        // Alert on leaks detected
        if (data.leaksDetected > 0) {
          toast.error("Security Alert: IP or DNS leak detected!", {
            description: "Your real IP may be exposed. Check security settings.",
            duration: 10000,
          })
        }
      } catch (error) {
        console.error("Failed to fetch security status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSecurity()
    const interval = setInterval(checkSecurity, 10000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading || !status) {
    return null
  }

  const protectionLevel =
    status.killSwitchActive &&
    status.dnsProtectionActive &&
    status.ipObfuscationActive &&
    status.dnsObfuscationActive &&
    status.dhtInvisible &&
    status.sharingDisabled
      ? "maximum"
      : status.killSwitchActive && status.dnsProtectionActive && status.dhtInvisible
        ? "high"
        : "basic"

  return (
    <Card className="border-success/20 bg-success/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            Security Monitor
          </CardTitle>
          <Badge
            variant={protectionLevel === "maximum" ? "default" : protectionLevel === "high" ? "secondary" : "outline"}
            className={
              protectionLevel === "maximum"
                ? "bg-success text-success-foreground"
                : protectionLevel === "high"
                  ? "bg-info text-info-foreground"
                  : ""
            }
          >
            {protectionLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <SecurityItem active={status.killSwitchActive} label="Kill Switch" />
        <SecurityItem active={status.dnsProtectionActive} label="DNS Protection" />
        <SecurityItem active={status.ipObfuscationActive} label="IP Obfuscation" />
        <SecurityItem active={status.dnsObfuscationActive} label="DNS Obfuscation" />
        <SecurityItem active={status.dhtInvisible} label="DHT Invisibility" />
        <SecurityItem active={status.sharingDisabled} label="Sharing Disabled" />
        <SecurityItem active={status.udpTrackersBlocked} label="UDP Trackers Blocked" />
        <SecurityItem active={status.trafficObfuscationActive} label="Traffic Obfuscation" />
        <SecurityItem active={status.dataEncryptionActive} label="Data Encryption" />
        <SecurityItem active={status.noLogsMode} label="No-Logs Mode" />

        {status.proxyRequired && !status.proxyAvailable && (
          <div className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-xs text-warning font-medium">Proxy chain required for requested obfuscation</span>
          </div>
        )}

        {status.leaksDetected > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive font-medium">{status.leaksDetected} leak(s) detected</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SecurityItem({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {active ? (
        <CheckCircle className="h-3 w-3 text-success" />
      ) : (
        <XCircle className="h-3 w-3 text-muted-foreground/50" />
      )}
    </div>
  )
}
