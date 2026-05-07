"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, AlertTriangle, CheckCircle, Activity, Globe, Network } from "lucide-react"
import { toast } from "sonner"

interface LeakTestResult {
  publicIP: string
  dnsIP: string
  webRTCIP: string
  isLeaked: boolean
  timestamp: string
}

export default function LeakCheckerPage() {
  const { t } = useLanguage()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<LeakTestResult | null>(null)
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false)
  const [checkInterval, setCheckInterval] = useState(60)

  const performLeakTest = async () => {
    setTesting(true)
    try {
      const externalLookupEnabled = process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_LEAK_CHECKS === "true"
      let publicIP = "Protected by local privacy mode"

      if (externalLookupEnabled) {
        const ipResponse = await fetch("https://api.ipify.org?format=json")
        const ipData = await ipResponse.json()
        publicIP = ipData.ip || publicIP
      } else {
        const localStatusResponse = await fetch("/api/security/ip")
        if (localStatusResponse.ok) {
          const localStatus = await localStatusResponse.json()
          publicIP = localStatus.ipObfuscated ? "Protected by local privacy mode" : "Direct local mode"
        }
      }

      const dnsResponse = await fetch("/api/security/dns-test")
      const dnsData = await dnsResponse.json()
      const dnsLeakDetected = Boolean(dnsData.dnsLeakDetected || dnsData.leaked)

      // Test WebRTC leak
      let webRTCIP = "Not detected"
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel("")
      pc.createOffer().then((offer) => pc.setLocalDescription(offer))

      await new Promise((resolve) => {
        pc.onicecandidate = (ice) => {
          if (ice && ice.candidate && ice.candidate.candidate) {
            const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/
            const match = ice.candidate.candidate.match(ipRegex)
            if (match) {
              webRTCIP = match[0]
            }
          }
          if (!ice || !ice.candidate) {
            resolve(null)
          }
        }
        setTimeout(resolve, 2000)
      })

      const isLeaked = webRTCIP !== "Not detected" || dnsLeakDetected

      const testResult: LeakTestResult = {
        publicIP,
        dnsIP: dnsData.dnsIP || (dnsLeakDetected ? "Leak detected" : "Protected"),
        webRTCIP,
        isLeaked,
        timestamp: new Date().toISOString(),
      }

      setResult(testResult)

      if (isLeaked) {
        toast.error(t("leakDetected") || "Leak Detected!", {
          description: t("leakDetectedDesc") || "Your IP or DNS has leaked. Enable protection in settings.",
        })
      } else {
        toast.success(t("noLeakDetected") || "No Leaks Detected", {
          description: t("noLeakDetectedDesc") || "Your connection is secure and private.",
        })
      }
    } catch (error) {
      console.error("Leak test failed:", error)
      toast.error(t("testFailed") || "Test Failed", {
        description: t("testFailedDesc") || "Unable to complete leak test. Try again.",
      })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (autoCheckEnabled) {
      intervalId = setInterval(() => {
        performLeakTest()
      }, checkInterval * 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoCheckEnabled, checkInterval])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Shield className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("leakCheckerTitle") || "IP & DNS Leak Checker"}</h1>
            <p className="text-muted-foreground">
              {t("leakCheckerDesc") || "Monitor for IP and DNS leaks while downloading"}
            </p>
          </div>
        </div>

        <Card className="border-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Manual Leak Test</h3>
                <p className="text-sm text-muted-foreground">Run a comprehensive leak detection test</p>
              </div>
              <Button onClick={performLeakTest} disabled={testing} className="gap-2">
                <Activity className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? t("testing") || "Testing..." : t("runTest") || "Run Test"}
              </Button>
            </div>

            {result && (
              <div
                className={`p-4 rounded-lg border-2 ${result.isLeaked ? "bg-destructive/10 border-destructive/30" : "bg-success/10 border-success/30"}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {result.isLeaked ? (
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-success" />
                  )}
                  <div>
                    <h4 className="font-semibold text-lg">
                      {result.isLeaked ? t("leakDetected") || "Leak Detected!" : t("secure") || "Secure"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("lastChecked") || "Last checked"}: {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Public IP:</span>
                    <span className="font-mono">{result.publicIP}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4" />
                    <span className="font-medium">DNS IP:</span>
                    <span className="font-mono">{result.dnsIP}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">WebRTC IP:</span>
                    <span className="font-mono">{result.webRTCIP}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Automatic Monitoring</h3>
                <p className="text-sm text-muted-foreground">Continuously check for leaks</p>
              </div>
              <Button
                variant={autoCheckEnabled ? "destructive" : "default"}
                onClick={() => setAutoCheckEnabled(!autoCheckEnabled)}
              >
                {autoCheckEnabled
                  ? t("stopMonitoring") || "Stop Monitoring"
                  : t("startMonitoring") || "Start Monitoring"}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Check Interval (seconds)</label>
              <input
                type="number"
                value={checkInterval}
                onChange={(e) => setCheckInterval(Number(e.target.value))}
                min="30"
                max="600"
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                disabled={autoCheckEnabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
