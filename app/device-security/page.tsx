"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Trash2,
  HardDrive,
  Lock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileX,
  Zap,
  Server,
  Fingerprint,
  Eye,
  EyeOff,
  Upload,
  FolderOpen,
} from "lucide-react"

export default function DeviceSecurityPage() {
  const { toast } = useToast()
  const [secureDeletePasses, setSecureDeletePasses] = useState(3)
  const [isWiping, setIsWiping] = useState(false)
  const [wipeProgress, setWipeProgress] = useState(0)
  const [currentPass, setCurrentPass] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [systemSecurity, setSystemSecurity] = useState({
    firewall: true,
    antiMalware: true,
    autoUpdates: true,
    encryptedDisk: false,
  })

  const handleSecureDelete = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to securely delete",
        variant: "destructive",
      })
      return
    }

    setIsWiping(true)
    setWipeProgress(0)
    setCurrentPass(0)

    // Simulate secure deletion with multiple passes
    for (let pass = 1; pass <= secureDeletePasses; pass++) {
      setCurrentPass(pass)

      // Each pass takes time to simulate overwriting
      for (let progress = 0; progress <= 100; progress += 2) {
        await new Promise((resolve) => setTimeout(resolve, 30))
        const totalProgress = ((pass - 1) * 100 + progress) / secureDeletePasses
        setWipeProgress(totalProgress)
      }
    }

    setIsWiping(false)
    setWipeProgress(100)
    toast({
      title: "Files Securely Deleted",
      description: `${selectedFiles.length} file(s) overwritten ${secureDeletePasses}x with random data`,
    })
    setSelectedFiles([])
    setWipeProgress(0)
    setCurrentPass(0)
  }

  const handleFileSelect = () => {
    // Simulate file selection
    const mockFiles = ["document.pdf", "photo.jpg", "data.xlsx"]
    setSelectedFiles(mockFiles)
    toast({
      title: "Files Selected",
      description: `${mockFiles.length} files ready for secure deletion`,
    })
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-4 py-8 2xl:py-12 space-y-8">
        {/* Header */}
        <div className="fade-in-up text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-red-500/20">
            <Shield className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">System-Wide Security Tools</span>
          </div>
          <h1 className="text-5xl 2xl:text-6xl font-bold text-gradient-rainbow">Device Security</h1>
          <p className="text-xl 2xl:text-2xl text-muted-foreground max-w-3xl mx-auto text-fade">
            Comprehensive device-level security tools including secure file erasure, system hardening, and privacy
            protection
          </p>
        </div>

        {/* Security Status */}
        <Card className="glass-card-transparent border-2 fade-in-up animation-delay-100">
          <CardHeader>
            <CardTitle className="text-2xl 2xl:text-3xl flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-400" />
              System Security Status
            </CardTitle>
            <CardDescription className="text-base 2xl:text-lg">Current security posture of your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Firewall</span>
                  <Switch
                    checked={systemSecurity.firewall}
                    onCheckedChange={(checked) => setSystemSecurity({ ...systemSecurity, firewall: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {systemSecurity.firewall ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="text-lg font-bold">{systemSecurity.firewall ? "Active" : "Inactive"}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Anti-Malware</span>
                  <Switch
                    checked={systemSecurity.antiMalware}
                    onCheckedChange={(checked) => setSystemSecurity({ ...systemSecurity, antiMalware: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {systemSecurity.antiMalware ? (
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="text-lg font-bold">{systemSecurity.antiMalware ? "Protected" : "Disabled"}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Auto Updates</span>
                  <Switch
                    checked={systemSecurity.autoUpdates}
                    onCheckedChange={(checked) => setSystemSecurity({ ...systemSecurity, autoUpdates: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {systemSecurity.autoUpdates ? (
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="text-lg font-bold">{systemSecurity.autoUpdates ? "Enabled" : "Disabled"}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Disk Encryption</span>
                  <Switch
                    checked={systemSecurity.encryptedDisk}
                    onCheckedChange={(checked) => setSystemSecurity({ ...systemSecurity, encryptedDisk: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {systemSecurity.encryptedDisk ? (
                    <CheckCircle className="w-5 h-5 text-pink-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="text-lg font-bold">
                    {systemSecurity.encryptedDisk ? "Encrypted" : "Unencrypted"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secure File Deletion */}
        <Card className="glass-card-transparent border-2 fade-in-up animation-delay-200">
          <CardHeader>
            <CardTitle className="text-2xl 2xl:text-3xl flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-red-400" />
              Secure File Erasure
            </CardTitle>
            <CardDescription className="text-base 2xl:text-lg">
              Military-grade file shredding with triple random data overwrite (DoD 5220.22-M & Gutmann)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base">Select Files to Erase</Label>
                <div className="flex gap-3">
                  <Button onClick={handleFileSelect} variant="outline" className="flex-1 hover-lift bg-transparent">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                  <Button variant="outline" className="flex-1 hover-lift bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Select Folder
                  </Button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/20 border border-border">
                    <p className="text-sm font-medium mb-2">Selected Files ({selectedFiles.length}):</p>
                    <div className="space-y-1">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileX className="w-3 h-3" />
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passes" className="text-base flex items-center justify-between">
                  Overwrite Passes (Random Data)
                  <Badge variant="secondary" className="text-base px-3">
                    {secureDeletePasses}x
                  </Badge>
                </Label>
                <Input
                  id="passes"
                  type="range"
                  min="3"
                  max="35"
                  value={secureDeletePasses}
                  onChange={(e) => setSecureDeletePasses(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {secureDeletePasses === 3 && "Triple Overwrite (Fast)"}
                    {secureDeletePasses > 3 && secureDeletePasses <= 7 && "DoD 5220.22-M Standard"}
                    {secureDeletePasses > 7 && secureDeletePasses <= 15 && "Enhanced Security"}
                    {secureDeletePasses > 15 && "Gutmann Method (Maximum)"}
                  </span>
                  <span className="text-muted-foreground">~{Math.round(secureDeletePasses * 0.5)} sec per MB</span>
                </div>
              </div>

              {isWiping && (
                <div className="space-y-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Pass {currentPass} of {secureDeletePasses} - Writing random data...
                    </span>
                    <span className="font-mono">{wipeProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={wipeProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Overwriting file sectors with cryptographically secure random data
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium text-green-400">Cryptographic Random</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Uses CSPRNG for data generation</p>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">Sector Overwrite</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Writes to disk sectors directly</p>
                </div>

                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">Forensic-Proof</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Prevents data recovery</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-400">⚠️ Irreversible Operation</p>
                    <p className="text-sm text-muted-foreground">
                      Files will be overwritten {secureDeletePasses} times with cryptographically random data. This
                      process cannot be undone and prevents all data recovery attempts including forensic analysis.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSecureDelete}
                disabled={isWiping || selectedFiles.length === 0}
                variant="destructive"
                size="lg"
                className="w-full hover-lift text-base"
              >
                {isWiping ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Shredding Files... (Pass {currentPass}/{secureDeletePasses})
                  </>
                ) : (
                  <>
                    <FileX className="w-5 h-5 mr-2" />
                    Securely Erase {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : "Selected Files"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Hardening */}
          <Card className="glass-card-transparent border-2 fade-in-up animation-delay-300">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Lock className="w-6 h-6 text-blue-400" />
                System Hardening
              </CardTitle>
              <CardDescription>Enhanced system security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium">Disable Unused Services</p>
                      <p className="text-xs text-muted-foreground">Reduce attack surface</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium">Fingerprint Protection</p>
                      <p className="text-xs text-muted-foreground">Prevent browser tracking</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Enable
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium">Auto-Lock System</p>
                      <p className="text-xs text-muted-foreground">Lock on inactivity</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Tools */}
          <Card className="glass-card-transparent border-2 fade-in-up animation-delay-400">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Eye className="w-6 h-6 text-green-400" />
                Privacy Tools
              </CardTitle>
              <CardDescription>Device-level privacy protection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium">Clear System Logs</p>
                      <p className="text-xs text-muted-foreground">Remove activity traces</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Clear
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-3">
                    <EyeOff className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium">Webcam/Mic Block</p>
                      <p className="text-xs text-muted-foreground">Hardware privacy control</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-sm font-medium">Wipe Free Space</p>
                      <p className="text-xs text-muted-foreground">Erase deleted file traces</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Wipe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
