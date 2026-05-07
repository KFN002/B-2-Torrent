"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, Ban, Plus, Trash2, Globe, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

interface BlockedPeer {
  id: string
  ip: string
  reason: string
  addedAt: Date
}

export default function PeerBlockerPage() {
  const { t } = useLanguage()
  const [blockedPeers, setBlockedPeers] = useState<BlockedPeer[]>([])
  const [newIp, setNewIp] = useState("")
  const [newReason, setNewReason] = useState("")
  const [bulkIps, setBulkIps] = useState("")

  const handleAddPeer = () => {
    if (!newIp) {
      toast.error("Please enter an IP address or range")
      return
    }

    const peer: BlockedPeer = {
      id: Date.now().toString(),
      ip: newIp,
      reason: newReason || "Manually blocked",
      addedAt: new Date(),
    }

    setBlockedPeers([...blockedPeers, peer])
    setNewIp("")
    setNewReason("")
    toast.success(`Blocked ${newIp}`, {
      description: "Peer will be rejected from all torrents",
    })
  }

  const handleBulkAdd = () => {
    const ips = bulkIps
      .split("\n")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0)

    if (ips.length === 0) {
      toast.error("Please enter at least one IP address")
      return
    }

    const newPeers: BlockedPeer[] = ips.map((ip) => ({
      id: `${Date.now()}-${Math.random()}`,
      ip,
      reason: "Bulk import",
      addedAt: new Date(),
    }))

    setBlockedPeers([...blockedPeers, ...newPeers])
    setBulkIps("")
    toast.success(`Blocked ${ips.length} peer(s)`)
  }

  const handleRemovePeer = (id: string) => {
    setBlockedPeers(blockedPeers.filter((p) => p.id !== id))
    toast.success("Peer unblocked")
  }

  const handleClearAll = () => {
    if (confirm("Remove all blocked peers?")) {
      setBlockedPeers([])
      toast.success("All peers unblocked")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Peer Blocker</h1>
            <p className="text-muted-foreground">Block unwanted peers by IP address or range to improve privacy</p>
          </div>

          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Add Blocked Peer
              </CardTitle>
              <CardDescription>Enter an IP address or CIDR range to block</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>IP Address or Range</Label>
                <Input
                  placeholder="e.g., 192.168.1.100 or 10.0.0.0/8"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Input
                  placeholder="e.g., Suspicious activity, Copyright troll"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>

              <Button onClick={handleAddPeer} className="w-full gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
                Block Peer
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-red-500" />
                Bulk Import
              </CardTitle>
              <CardDescription>Import multiple IP addresses (one per line)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="192.168.1.100&#10;10.0.0.0/8&#10;172.16.0.0/12"
                value={bulkIps}
                onChange={(e) => setBulkIps(e.target.value)}
                rows={6}
              />
              <Button onClick={handleBulkAdd} variant="outline" className="w-full gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Import All
              </Button>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Privacy Protection</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Blocked peers cannot connect to your torrents. Use this to block known copyright trolls, suspicious
                  IPs, or entire ranges.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Blocked Peers
                <Badge variant="secondary">{blockedPeers.length}</Badge>
              </h2>
              {blockedPeers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Clear All
                </Button>
              )}
            </div>

            {blockedPeers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No peers blocked yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {blockedPeers.map((peer) => (
                  <Card key={peer.id} className="border-red-500/20 bg-red-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <Globe className="h-4 w-4 text-red-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-mono font-semibold">{peer.ip}</div>
                            <div className="text-sm text-muted-foreground truncate">{peer.reason}</div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {peer.addedAt.toLocaleDateString()}
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemovePeer(peer.id)}
                          className="h-8 w-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
