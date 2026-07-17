"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, ArrowRight, CheckCircle2, CircleOff, Network, RefreshCw, Route, Server, ShieldAlert, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type SecurityStatus = {
  proxyAvailable: boolean
  proxyRequired: boolean
  ipObfuscationActive: boolean
  dnsObfuscationActive: boolean
  dhtInvisible: boolean
  sharingDisabled: boolean
  connectionType: string
}

type ProxyRoute = {
  id: string
  address: string
  port: number
  status: string
  country: string
}

export default function NetworkPage() {
  const [status, setStatus] = useState<SecurityStatus | null>(null)
  const [routes, setRoutes] = useState<ProxyRoute[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statusResponse, routesResponse] = await Promise.all([
        fetch("/api/security/status", { cache: "no-store" }),
        fetch("/api/network/connections", { cache: "no-store" }),
      ])
      if (!statusResponse.ok || !routesResponse.ok) throw new Error("The local backend did not return network status")
      setStatus(await statusResponse.json())
      const routeData = await routesResponse.json()
      setRoutes(Array.isArray(routeData) ? routeData : [])
    } catch (cause) {
      setStatus(null)
      setRoutes([])
      setError(cause instanceof Error ? cause.message : "Network status is unavailable")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const protections = [
    ["Proxy route verified", status?.proxyAvailable === true],
    ["IP obfuscation active", status?.ipObfuscationActive === true],
    ["Proxy DNS active", status?.dnsObfuscationActive === true],
    ["DHT disabled", status?.dhtInvisible === true],
    ["Data sharing disabled", status?.sharingDisabled === true],
  ] as const

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(34,211,238,.12),transparent_38rem)]" />
      <div className="container relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
              <Network className="mr-2 h-4 w-4" /> Verified local state
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Network privacy, without invented telemetry.</h1>
            <p className="text-pretty text-lg text-muted-foreground">
              This dashboard reports only configuration known to the local backend. It does not fabricate VPN servers,
              public IPs, latency, throughput, or connection success.
            </p>
          </div>
          <Button onClick={() => void refresh()} variant="outline" className="h-11 bg-background/30" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh state
          </Button>
        </header>

        {error && (
          <Alert variant="destructive" className="mt-8">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Status unavailable</AlertTitle>
            <AlertDescription>{error}. No privacy conclusion can be made.</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <Card className="border-white/10 bg-card/60 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Current route</CardTitle>
                  <CardDescription className="mt-2">Live application configuration, not an external IP test.</CardDescription>
                </div>
                {status?.proxyAvailable ? (
                  <ShieldCheck className="h-7 w-7 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-7 w-7 text-amber-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-36 w-full" /></div>
              ) : (
                <>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                    <p className="text-sm text-muted-foreground">Connection type</p>
                    <p className="mt-1 text-2xl font-medium">{status?.connectionType ?? "Unknown"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant={status?.proxyAvailable ? "default" : "secondary"}>
                        {status?.proxyAvailable ? "Proxy configured" : "Proxy not verified"}
                      </Badge>
                      {status?.proxyRequired && <Badge variant="outline">Proxy required</Badge>}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {protections.map(([label, active]) => (
                      <div key={label} className="flex items-center gap-3 rounded-xl border border-white/8 p-4">
                        {active ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <CircleOff className="h-5 w-5 text-muted-foreground" />}
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/60 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl"><Route className="h-5 w-5 text-cyan-300" /> Configured hops</CardTitle>
              <CardDescription>“Configured” does not mean externally tested or connected.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></>
              ) : routes.length ? (
                routes.map((route, index) => (
                  <div key={route.id} className="flex items-center gap-4 rounded-xl border border-white/8 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm">{route.address}:{route.port}</p>
                      <p className="text-xs text-muted-foreground">Status: {route.status} · Location: {route.country}</p>
                    </div>
                    <Server className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <Activity className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-3 font-medium">No proxy hops configured</p>
                  <p className="mt-1 text-sm text-muted-foreground">Direct networking may expose your IP to peers.</p>
                </div>
              )}
              <Button asChild variant="outline" className="mt-3 w-full bg-background/30">
                <Link href="/about#vpn-client">Open standalone VPN guidance <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-6 border-amber-400/20 bg-amber-400/[0.06]">
          <ShieldAlert className="h-4 w-4 text-amber-300" />
          <AlertTitle>Anonymity is conditional</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            A configured proxy is not a guarantee of anonymity. Verify the proxy independently before any sensitive use;
            this audit deliberately performs no external probe and starts no torrent traffic.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
