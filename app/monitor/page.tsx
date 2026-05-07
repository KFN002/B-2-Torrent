'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Activity, Shield, Globe, Network, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ProxyConnection {
  id: string
  address: string
  port: number
  protocol: string
  status: 'connected' | 'disconnected' | 'error'
  latency: number
  bytesIn: number
  bytesOut: number
  uptime: number
}

interface NetworkStats {
  totalConnections: number
  activeProxies: number
  totalBytesIn: number
  totalBytesOut: number
  averageLatency: number
  connectionQuality: 'excellent' | 'good' | 'poor'
}

export default function NetworkMonitor() {
  const { data: connections, mutate } = useSWR<ProxyConnection[]>('/api/network/connections', fetcher, {
    refreshInterval: 2000,
  })

  const { data: stats } = useSWR<NetworkStats>('/api/network/stats', fetcher, {
    refreshInterval: 2000,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'disconnected':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-500'
      case 'good':
        return 'text-yellow-500'
      case 'poor':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-muted">
                <Image 
                  src="/logo.png" 
                  alt="B-2-Torrent" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Network Monitor</h1>
                <p className="text-xs text-muted-foreground">Proxy & Connection Status</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalConnections || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeProxies || 0} active proxies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Received</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(stats?.totalBytesIn || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Incoming traffic
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Sent</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(stats?.totalBytesOut || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outgoing traffic
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Quality</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold capitalize ${getQualityColor(stats?.connectionQuality || 'good')}`}>
                  {stats?.connectionQuality || 'Good'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.averageLatency || 0}ms avg latency
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Proxy Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!connections && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
                  ))}
                </div>
              )}

              {connections && connections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active proxy connections
                </div>
              )}

              {connections && connections.length > 0 && (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(connection.status)} animate-pulse`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium font-mono">
                              {connection.address}:{connection.port}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {connection.protocol.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Latency: {connection.latency}ms</span>
                            <span>Uptime: {formatUptime(connection.uptime)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ↓ {formatBytes(connection.bytesIn)}
                        </p>
                        <p className="text-sm font-medium">
                          ↑ {formatBytes(connection.bytesOut)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Chain */}
          <Card>
            <CardHeader>
              <CardTitle>Proxy Chain Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="flex items-center justify-center w-24 h-24 rounded-lg border-2 border-primary bg-primary/10">
                  <div className="text-center">
                    <p className="text-xs font-medium">You</p>
                    <p className="text-xs text-muted-foreground">Local</p>
                  </div>
                </div>
                
                {connections && connections.slice(0, 3).map((connection, index) => (
                  <div key={connection.id} className="flex items-center gap-2">
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="flex items-center justify-center w-24 h-24 rounded-lg border-2 border-muted bg-muted/10">
                      <div className="text-center">
                        <p className="text-xs font-medium">Proxy {index + 1}</p>
                        <p className="text-xs text-muted-foreground">{connection.latency}ms</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="flex items-center justify-center w-24 h-24 rounded-lg border-2 border-green-500/50 bg-green-500/10">
                    <div className="text-center">
                      <p className="text-xs font-medium">Internet</p>
                      <p className="text-xs text-green-500">Secure</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
