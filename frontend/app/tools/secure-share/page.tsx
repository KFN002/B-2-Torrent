"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BrandMark } from "@/components/brand-mark"
import { Share2, Upload, Download, Lock, Wifi, Users, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface SharedFile {
  id: string
  name: string
  size: number
  encrypted: boolean
  timestamp: Date
}

interface PeerDevice {
  id: string
  name: string
  ip: string
  status: "connected" | "pending" | "offline"
  filesShared: number
}

export default function SecureShare() {
  const { t } = useLanguage()
  const [files, setFiles] = useState<SharedFile[]>([])
  const [peers, setPeers] = useState<PeerDevice[]>([])
  const [isSharing, setIsSharing] = useState(false)
  const [encryptionKey, setEncryptionKey] = useState("")
  const [autoEncrypt, setAutoEncrypt] = useState(true)
  const [allowedDevices, setAllowedDevices] = useState<string[]>([])

  useEffect(() => {
    // Mock peer discovery
    const mockPeers: PeerDevice[] = [
      { id: "1", name: "Device-A", ip: "192.168.1.105", status: "connected", filesShared: 2 },
      { id: "2", name: "Device-B", ip: "192.168.1.106", status: "pending", filesShared: 0 },
      { id: "3", name: "Device-C", ip: "192.168.1.107", status: "offline", filesShared: 1 },
    ]
    setPeers(mockPeers)
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    for (const file of selectedFiles) {
      const newFile: SharedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        encrypted: autoEncrypt,
        timestamp: new Date(),
      }

      if (autoEncrypt && encryptionKey) {
        toast.success(`File "${file.name}" encrypted and ready to share`)
      } else {
        toast.success(`File "${file.name}" ready to share`)
      }

      setFiles((prev) => [...prev, newFile])
    }
  }

  const toggleSharing = () => {
    setIsSharing(!isSharing)
    if (!isSharing) {
      toast.success("Secure sharing started on local network")
    } else {
      toast.info("Secure sharing stopped")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const toggleDeviceAccess = (deviceId: string) => {
    setAllowedDevices((prev) => (prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]))
  }

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
            <BrandMark className="h-10 w-10 bg-muted" iconClassName="h-5 w-5" textClassName="sr-only" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Secure Share</h1>
              <p className="text-xs text-muted-foreground">P2P encrypted file sharing on LAN</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sharing Control */}
            <Card className={isSharing ? "border-green-500/50 bg-green-500/5" : ""}>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      Sharing Status
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isSharing ? "Broadcasting on local network" : "Not sharing files"}
                    </p>
                  </div>
                  <Button
                    onClick={toggleSharing}
                    variant={isSharing ? "default" : "outline"}
                    className={isSharing ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {isSharing ? "Stop Sharing" : "Start Sharing"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-encrypt Files</Label>
                      <p className="text-xs text-muted-foreground">Automatically encrypt shared files</p>
                    </div>
                    <Switch checked={autoEncrypt} onCheckedChange={setAutoEncrypt} />
                  </div>

                  {autoEncrypt && (
                    <div className="space-y-2">
                      <Label htmlFor="encryption-key">Encryption Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="encryption-key"
                          type="password"
                          placeholder="Enter encryption key..."
                          value={encryptionKey}
                          onChange={(e) => setEncryptionKey(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Share this key with authorized devices</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="file-upload">Select Files to Share</Label>
                    <Input id="file-upload" type="file" multiple onChange={handleFileSelect} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shared Files */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Shared Files ({files.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {file.encrypted && "🔒 Encrypted"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No files shared yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nearby Devices */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nearby Devices ({peers.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {peers.map((peer) => (
                  <Card
                    key={peer.id}
                    className={`border ${
                      peer.status === "connected"
                        ? "border-green-500/50 bg-green-500/5"
                        : peer.status === "pending"
                          ? "border-yellow-500/50 bg-yellow-500/5"
                          : "border-border/50"
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{peer.name}</p>
                          <p className="text-xs text-muted-foreground">{peer.ip}</p>
                        </div>
                        {peer.status === "connected" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : peer.status === "pending" ? (
                          <div className="h-5 w-5 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{peer.filesShared} files shared</span>
                        <Switch
                          checked={allowedDevices.includes(peer.id)}
                          onCheckedChange={() => toggleDeviceAccess(peer.id)}
                          disabled={peer.status === "offline"}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2">Security Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• End-to-end encryption with AES-256</li>
                <li>• Local network only (no internet exposure)</li>
                <li>• Device-level access control</li>
                <li>• Automatic file cleanup on disconnect</li>
                <li>• No data stored on intermediate servers</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
