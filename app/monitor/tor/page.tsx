'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Shield, Globe, RefreshCw, CheckCircle2, XCircle, Clock, TrendingUp, Server } from 'lucide-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface TorConnection {
  id: string
  address: string
  port: number
  country: string
  status: 'connected' | 'connecting' | 'disconnected'
  latency: number
  bandwidth: number
  uptime: number
}

export default function TorMonitorPage() {
  const { data: connections, mutate } = useSWR<TorConnection[]>('/api/network/tor', fetcher, {
    refreshInterval: 2000,
  })

  const stats = connections ? {
    total: connections.length,
    active: connections.filter(c => c.status === 'connected').length,
    avgLatency: connections.reduce((acc, c) => acc + c.latency, 0) / connections.length || 0,
    totalBandwidth: connections.reduce((acc, c) => acc + c.bandwidth, 0),
  } : null

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tor Network Monitor</h1>
            <p className="text-muted-foreground mt-1">Monitor your Tor connections and proxy chains</p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => mutate()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Nodes</p>
                  <p className="text-3xl font-bold">{stats?.total || 0}</p>
                </div>
                <Server className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold text-success">{stats?.active || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Latency</p>
                  <p className="text-3xl font-bold">{stats?.avgLatency.toFixed(0) || 0}ms</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bandwidth</p>
                  <p className="text-3xl font-bold">{((stats?.totalBandwidth || 0) / 1024).toFixed(1)} KB/s</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connections List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Tor Connections</CardTitle>
            <CardDescription>Real-time monitoring of proxy chain connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!connections && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border/50 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {connections && connections.length === 0 && (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No Tor connections active</p>
                </div>
              )}

              {connections && connections.map((conn, index) => (
                <div 
                  key={conn.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-border transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    conn.status === 'connected' ? 'bg-success/10' : 
                    conn.status === 'connecting' ? 'bg-warning/10' : 'bg-destructive/10'
                  }`}>
                    {conn.status === 'connected' ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : conn.status === 'connecting' ? (
                      <Activity className="h-5 w-5 text-warning animate-pulse" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{conn.address}:{conn.port}</p>
                      <Badge variant="outline" className="text-xs">
                        {conn.country}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Latency: {conn.latency}ms</span>
                      <span>Bandwidth: {(conn.bandwidth / 1024).toFixed(1)} KB/s</span>
                      <span>Uptime: {Math.floor(conn.uptime / 60)}m</span>
                    </div>
                  </div>

                  <Badge 
                    variant={conn.status === 'connected' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {conn.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
