"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Server, Database, Check, ArrowRight, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface SetupConfig {
  downloadPath: string
  enableVPN: boolean
  enableTor: boolean
  enableEncryption: boolean
  enableNoLogs: boolean
  vpnProtocol: "vless" | "outline"
  maxConnections: number
  portNumber: number
}

export function FirstRunWizard() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(25)
  const [config, setConfig] = useState<SetupConfig>({
    downloadPath: "",
    enableVPN: true,
    enableTor: false,
    enableEncryption: true,
    enableNoLogs: true,
    vpnProtocol: "vless",
    maxConnections: 100,
    portNumber: 6881,
  })

  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem("b2t_setup_completed")
    if (!hasCompletedSetup) {
      setOpen(true)
    }
  }, [])

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1)
      setProgress((step + 1) * 25)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setProgress((step - 1) * 25)
    }
  }

  const completeSetup = async () => {
    try {
      await fetch("http://localhost:8080/api/config/initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      }).catch(() => {})
    } catch {
      // Backend may not be running yet
    }

    localStorage.setItem("b2t_setup_completed", "true")
    localStorage.setItem("b2t_config", JSON.stringify(config))
    toast.success("Setup completed successfully!")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient-rainbow">Welcome to B-2-Torrent</DialogTitle>
          <DialogDescription>Let's configure your secure torrenting environment</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">Step {step} of 4</p>
          </div>

          {step === 1 && (
            <Card className="border-green-500/20 glass-card animate-fade-in">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <Shield className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure your privacy protection</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label>Force Encryption</Label>
                      <p className="text-xs text-muted-foreground">Reject unencrypted connections</p>
                    </div>
                    <Switch
                      checked={config.enableEncryption}
                      onCheckedChange={(v) => setConfig({ ...config, enableEncryption: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label>No-Logs Mode</Label>
                      <p className="text-xs text-muted-foreground">Disable all activity logging</p>
                    </div>
                    <Switch
                      checked={config.enableNoLogs}
                      onCheckedChange={(v) => setConfig({ ...config, enableNoLogs: v })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-blue-500/20 glass-card animate-fade-in">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Server className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Network Configuration</h3>
                    <p className="text-sm text-muted-foreground">Set up VPN and Tor</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label>Enable VPN</Label>
                      <p className="text-xs text-muted-foreground">Route traffic through VPN</p>
                    </div>
                    <Switch
                      checked={config.enableVPN}
                      onCheckedChange={(v) => setConfig({ ...config, enableVPN: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label>Enable Tor Network</Label>
                      <p className="text-xs text-muted-foreground">Anonymous onion routing</p>
                    </div>
                    <Switch
                      checked={config.enableTor}
                      onCheckedChange={(v) => setConfig({ ...config, enableTor: v })}
                    />
                  </div>

                  {config.enableVPN && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                      <Label>VPN Protocol</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={config.vpnProtocol === "vless" ? "default" : "outline"}
                          onClick={() => setConfig({ ...config, vpnProtocol: "vless" })}
                          className="w-full"
                        >
                          VLESS
                        </Button>
                        <Button
                          variant={config.vpnProtocol === "outline" ? "default" : "outline"}
                          onClick={() => setConfig({ ...config, vpnProtocol: "outline" })}
                          className="w-full"
                        >
                          Outline
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-purple-500/20 glass-card animate-fade-in">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Database className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Download Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure download preferences</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Download Path</Label>
                    <Input
                      placeholder="/downloads or C:\Downloads"
                      value={config.downloadPath}
                      onChange={(e) => setConfig({ ...config, downloadPath: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for browser default</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Connections</Label>
                    <Input
                      type="number"
                      value={config.maxConnections}
                      onChange={(e) => setConfig({ ...config, maxConnections: Number.parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Port Number</Label>
                    <Input
                      type="number"
                      value={config.portNumber}
                      onChange={(e) => setConfig({ ...config, portNumber: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="border-green-500/20 glass-card animate-fade-in">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <Check className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Review Configuration</h3>
                    <p className="text-sm text-muted-foreground">Confirm your settings</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
                    <span className="text-sm">Encryption:</span>
                    <Badge variant={config.enableEncryption ? "default" : "secondary"}>
                      {config.enableEncryption ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
                    <span className="text-sm">No-Logs Mode:</span>
                    <Badge variant={config.enableNoLogs ? "default" : "secondary"}>
                      {config.enableNoLogs ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
                    <span className="text-sm">VPN:</span>
                    <Badge variant={config.enableVPN ? "default" : "secondary"}>
                      {config.enableVPN ? `Enabled (${config.vpnProtocol.toUpperCase()})` : "Disabled"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
                    <span className="text-sm">Tor:</span>
                    <Badge variant={config.enableTor ? "default" : "secondary"}>
                      {config.enableTor ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
                    <span className="text-sm">Max Connections:</span>
                    <span className="font-mono">{config.maxConnections}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
                    <span className="text-sm">Port:</span>
                    <span className="font-mono">{config.portNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {step < 4 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={completeSetup} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
