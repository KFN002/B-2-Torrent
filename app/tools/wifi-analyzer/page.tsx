"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Wifi, RefreshCw } from "lucide-react"

interface NetworkInfo {
  ssid: string
  signal: number
  frequency: string
  security: string
}

export default function WiFiAnalyzerPage() {
  const { t } = useLanguage()
  const [networks, setNetworks] = useState<NetworkInfo[]>([])
  const [scanning, setScanning] = useState(false)
  const [connected, setConnected] = useState(false)

  const scanNetworks = async () => {
    setScanning(true)
    toast.info(t("scanningNetworks"))

    // Simulate network scan
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockNetworks: NetworkInfo[] = [
      { ssid: "Home WiFi", signal: -45, frequency: "2.4 GHz", security: "WPA2" },
      { ssid: "Office Network", signal: -60, frequency: "5 GHz", security: "WPA3" },
      { ssid: "Guest Network", signal: -75, frequency: "2.4 GHz", security: "Open" },
      { ssid: "Neighbor WiFi", signal: -80, frequency: "2.4 GHz", security: "WPA2" },
    ]

    setNetworks(mockNetworks)
    setScanning(false)
    toast.success(t("scanComplete"), {
      description: `${mockNetworks.length} ${t("networksFound")}`,
    })
  }

  const getSignalStrength = (signal: number) => {
    if (signal > -50) return { text: t("excellent"), color: "text-green-500" }
    if (signal > -60) return { text: t("good"), color: "text-blue-500" }
    if (signal > -70) return { text: t("fair"), color: "text-yellow-500" }
    return { text: t("poor"), color: "text-red-500" }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          {t("wifiAnalyzerTitle")}
        </h1>
        <p className="text-muted-foreground">{t("wifiAnalyzerDesc")}</p>
      </div>

      <Card className="p-6 mb-6 border-blue-500/20 bg-blue-500/5">
        <Button onClick={scanNetworks} disabled={scanning} className="w-full">
          <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? t("scanning") : t("scanNetworks")}
        </Button>
      </Card>

      {networks.length > 0 && (
        <div className="space-y-4">
          {networks.map((network, index) => {
            const strength = getSignalStrength(network.signal)
            return (
              <Card key={index} className="p-4 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Wifi className="h-6 w-6 text-cyan-500" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{network.ssid}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{network.frequency}</span>
                        <span>{network.security}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${strength.color}`}>{strength.text}</p>
                    <p className="text-sm text-muted-foreground">{network.signal} dBm</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
