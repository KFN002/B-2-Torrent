'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Activity, Clock, Globe, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

interface ConnectionTest {
  url: string
  status: 'pending' | 'success' | 'error'
  latency?: number
  statusCode?: number
  error?: string
}

export default function NetworkAnalyzer() {
  const [testUrl, setTestUrl] = useState('')
  const [connections, setConnections] = useState<ConnectionTest[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  const testConnection = async (url: string): Promise<ConnectionTest> => {
    const startTime = performance.now()
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
      const latency = performance.now() - startTime
      
      return {
        url,
        status: 'success',
        latency: Math.round(latency),
        statusCode: response.status || 200
      }
    } catch (error) {
      return {
        url,
        status: 'error',
        latency: Math.round(performance.now() - startTime),
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  const handleAnalyze = async () => {
    if (!testUrl) {
      toast({
        title: 'No URL Provided',
        description: 'Please enter a URL to test',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)
    setConnections([])

    // Test connection multiple times
    const tests: ConnectionTest[] = []
    
    for (let i = 0; i < 5; i++) {
      const result = await testConnection(testUrl)
      tests.push(result)
      setConnections([...tests])
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsAnalyzing(false)
    
    const successCount = tests.filter(t => t.status === 'success').length
    toast({
      title: 'Analysis Complete',
      description: `${successCount}/5 connections successful`,
    })
  }

  const avgLatency = connections.filter(c => c.latency).reduce((sum, c) => sum + (c.latency || 0), 0) / connections.length || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4 md:px-6">
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
              <h1 className="text-xl font-bold tracking-tight">Network Analyzer</h1>
              <p className="text-xs text-muted-foreground">Connection Testing & Diagnostics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Connection</CardTitle>
              <CardDescription>
                Analyze network connectivity and measure latency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-url">URL to Test</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-url"
                    type="url"
                    placeholder="https://example.com"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !testUrl}
                    className="gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {connections.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{avgLatency.toFixed(0)}ms</p>
                        <p className="text-xs text-muted-foreground">Avg Latency</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{connections.length}</p>
                        <p className="text-xs text-muted-foreground">Tests Run</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Globe className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">
                          {connections.filter(c => c.status === 'success').length}/{connections.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connections.map((conn, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          {conn.status === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : conn.status === 'error' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Test {idx + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              {conn.error || `${conn.statusCode || 'OK'}`}
                            </p>
                          </div>
                        </div>
                        {conn.latency && (
                          <Badge variant={conn.latency < 100 ? 'default' : conn.latency < 300 ? 'secondary' : 'destructive'}>
                            {conn.latency}ms
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
