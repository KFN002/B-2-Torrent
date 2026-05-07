"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Activity,
  Globe,
  Zap,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n"

interface SecurityMetrics {
  overallScore: number
  encryption: { enabled: boolean; level: string; score: number }
  anonymity: { enabled: boolean; type: string; score: number }
  leakProtection: { active: boolean; leaksDetected: number; score: number }
  trafficObfuscation: { enabled: boolean; score: number }
  activeThreats: number
  protectedConnections: number
  blockedPeers: number
}

export function SecurityDashboard() {
  const { t } = useLanguage()
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    overallScore: 0,
    encryption: { enabled: false, level: "none", score: 0 },
    anonymity: { enabled: false, type: "none", score: 0 },
    leakProtection: { active: false, leaksDetected: 0, score: 0 },
    trafficObfuscation: { enabled: false, score: 0 },
    activeThreats: 0,
    protectedConnections: 0,
    blockedPeers: 0,
  })
  const [isMonitoring, setIsMonitoring] = useState(true)

  useEffect(() => {
    if (!isMonitoring) return

    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/security/metrics")
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        }
      } catch (error) {
        console.error("Failed to fetch security metrics:", error)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [isMonitoring])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success"
    if (score >= 70) return "text-info"
    if (score >= 50) return "text-warning"
    return "text-destructive"
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-success/10 border-success/30"
    if (score >= 70) return "bg-info/10 border-info/30"
    if (score >= 50) return "bg-warning/10 border-warning/30"
    return "bg-destructive/10 border-destructive/30"
  }

  return (
    <div className="space-y-6">
      <Card className={`border-2 ${getScoreBg(metrics.overallScore)} overflow-hidden relative`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-success/20 to-info/20 animate-pulse">
                <ShieldCheck className={`h-6 w-6 ${getScoreColor(metrics.overallScore)}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Security Score</CardTitle>
                <p className="text-xs text-muted-foreground">Real-time protection analysis</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="transition-all hover:scale-105"
            >
              {isMonitoring ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {isMonitoring ? "Monitoring" : "Paused"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="text-center py-6">
            <div className={`text-6xl font-bold ${getScoreColor(metrics.overallScore)} animate-scale-in`}>
              {metrics.overallScore}
            </div>
            <p className="text-sm text-muted-foreground mt-2">out of 100</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Overall Protection</span>
              <span className="font-medium">{metrics.overallScore}%</span>
            </div>
            <Progress value={metrics.overallScore} className="h-3 transition-all duration-500" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-3 rounded-lg bg-card border border-border hover:border-success/50 transition-all">
              <Shield className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-xl font-bold">{metrics.protectedConnections}</p>
              <p className="text-xs text-muted-foreground">Protected</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border hover:border-destructive/50 transition-all">
              <ShieldAlert className="h-5 w-5 text-destructive mx-auto mb-1" />
              <p className="text-xl font-bold">{metrics.activeThreats}</p>
              <p className="text-xs text-muted-foreground">Threats</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border hover:border-warning/50 transition-all">
              <XCircle className="h-5 w-5 text-warning mx-auto mb-1" />
              <p className="text-xl font-bold">{metrics.blockedPeers}</p>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border hover:border-success/50 transition-all hover:shadow-lg group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-all">
                  <Lock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Encryption</h3>
                  <p className="text-xs text-muted-foreground">{metrics.encryption.level}</p>
                </div>
              </div>
              {metrics.encryption.enabled ? (
                <CheckCircle2 className="h-5 w-5 text-success animate-scale-in" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <Progress value={metrics.encryption.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{metrics.encryption.score}% encrypted traffic</p>
          </CardContent>
        </Card>

        <Card className="border border-border hover:border-info/50 transition-all hover:shadow-lg group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10 group-hover:bg-info/20 transition-all">
                  <Globe className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Anonymity</h3>
                  <p className="text-xs text-muted-foreground">{metrics.anonymity.type}</p>
                </div>
              </div>
              {metrics.anonymity.enabled ? (
                <CheckCircle2 className="h-5 w-5 text-success animate-scale-in" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <Progress value={metrics.anonymity.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{metrics.anonymity.score}% anonymous</p>
          </CardContent>
        </Card>

        <Card className="border border-border hover:border-warning/50 transition-all hover:shadow-lg group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-all">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Leak Protection</h3>
                  <p className="text-xs text-muted-foreground">{metrics.leakProtection.leaksDetected} leaks detected</p>
                </div>
              </div>
              {metrics.leakProtection.active && metrics.leakProtection.leaksDetected === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-success animate-scale-in" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <Progress value={metrics.leakProtection.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{metrics.leakProtection.score}% protected</p>
          </CardContent>
        </Card>

        <Card className="border border-border hover:border-purple-500/50 transition-all hover:shadow-lg group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
                  <Zap className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Traffic Obfuscation</h3>
                  <p className="text-xs text-muted-foreground">DPI evasion</p>
                </div>
              </div>
              {metrics.trafficObfuscation.enabled ? (
                <CheckCircle2 className="h-5 w-5 text-success animate-scale-in" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <Progress value={metrics.trafficObfuscation.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{metrics.trafficObfuscation.score}% obfuscated</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-info/20 bg-info/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-info" />
            <CardTitle className="text-sm">Security Best Practices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <SecurityTip
            icon={<Shield className="h-4 w-4" />}
            title="Enable Force Encryption"
            description="Reject all unencrypted peer connections to maximize privacy"
          />
          <SecurityTip
            icon={<Globe className="h-4 w-4" />}
            title="Use Tor or VPN"
            description="Route traffic through anonymity networks to hide your IP address"
          />
          <SecurityTip
            icon={<Lock className="h-4 w-4" />}
            title="Activate No-Logs Mode"
            description="Disable history and metadata for complete plausible deniability"
          />
          <SecurityTip
            icon={<Zap className="h-4 w-4" />}
            title="Traffic Obfuscation"
            description="Mask protocol fingerprints to evade ISP throttling and DPI"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityTip({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-info/50 transition-all group">
      <div className="p-1.5 rounded bg-info/10 group-hover:bg-info/20 transition-all">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
