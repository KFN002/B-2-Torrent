"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Wifi, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function PortScannerPage() {
  const [target, setTarget] = useState("")
  const [startPort, setStartPort] = useState("1")
  const [endPort, setEndPort] = useState("1000")
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ port: number; status: string; service: string }[]>([])

  const commonPorts: { [key: number]: string } = {
    20: "FTP Data",
    21: "FTP Control",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    3306: "MySQL",
    5432: "PostgreSQL",
    6379: "Redis",
    8080: "HTTP Alt",
  }

  const scanPorts = async () => {
    setScanning(true)
    setResults([])
    setProgress(0)

    const start = Number.parseInt(startPort)
    const end = Number.parseInt(endPort)
    const total = end - start + 1
    const openPorts: { port: number; status: string; service: string }[] = []

    // Simulate port scanning
    for (let port = start; port <= end; port++) {
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Randomly simulate open ports (for demo)
      const isOpen = Math.random() > 0.95 || Object.keys(commonPorts).includes(port.toString())

      if (isOpen) {
        openPorts.push({
          port,
          status: "open",
          service: commonPorts[port] || "Unknown",
        })
      }

      setProgress(((port - start + 1) / total) * 100)
    }

    setResults(openPorts)
    setScanning(false)
    toast.success(`Scan complete. Found ${openPorts.length} open ports`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
            <Wifi className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Port Scanner</h1>
        </div>
        <p className="text-muted-foreground">Scan network ports for open services and vulnerabilities</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scan Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Target (IP or Domain)</Label>
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="192.168.1.1 or example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Port</Label>
              <Input
                type="number"
                value={startPort}
                onChange={(e) => setStartPort(e.target.value)}
                min="1"
                max="65535"
              />
            </div>
            <div>
              <Label>End Port</Label>
              <Input type="number" value={endPort} onChange={(e) => setEndPort(e.target.value)} min="1" max="65535" />
            </div>
          </div>

          {scanning && (
            <div>
              <Label>Progress</Label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">{progress.toFixed(1)}%</p>
            </div>
          )}

          <Button onClick={scanPorts} disabled={!target || scanning} className="w-full">
            <Wifi className="mr-2 h-4 w-4" />
            {scanning ? "Scanning..." : "Start Scan"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results ({results.length} open ports)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.port}
                  className="flex items-center justify-between p-3 border rounded-lg bg-red-500/5 border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Port {result.port}</p>
                      <p className="text-sm text-muted-foreground">{result.service}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-red-500">OPEN</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
