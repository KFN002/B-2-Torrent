"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  FolderOpen,
} from "lucide-react"

interface SecureDeleteResult {
  path: string
  name: string
  size: number
  deleted: boolean
  error?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export default function DeviceSecurityPage() {
  const { toast } = useToast()
  const [secureDeletePasses, setSecureDeletePasses] = useState(3)
  const [isWiping, setIsWiping] = useState(false)
  const [wipeProgress, setWipeProgress] = useState(0)
  const [currentPass, setCurrentPass] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [filePathInput, setFilePathInput] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [secureDeleteErrors, setSecureDeleteErrors] = useState<string[]>([])
  const [systemSecurity, setSystemSecurity] = useState({
    firewall: true,
    antiMalware: true,
    autoUpdates: true,
    encryptedDisk: false,
  })

  const getRequestedFilePaths = () =>
    filePathInput
      .split("\n")
      .map((path) => path.trim())
      .filter(Boolean)

  const formatBytes = (value: number) => {
    if (value === 0) return "0 B"
    const units = ["B", "KB", "MB", "GB", "TB"]
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
    return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
  }

  const handleValidateSecureDelete = async () => {
    const filePaths = getRequestedFilePaths()
    if (filePaths.length === 0) {
      toast({
        title: "No Paths Entered",
        description: "Enter app-owned file paths under the configured download, upload, or temp directories.",
        variant: "destructive",
      })
      return
    }

    setIsWiping(true)
    setWipeProgress(20)
    setCurrentPass(0)
    setSecureDeleteErrors([])

    try {
      const response = await fetch(`${API_URL}/security/secure-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePaths, passes: secureDeletePasses, dryRun: true }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to validate files")
      }

      const results = (data.results || []) as SecureDeleteResult[]
      const validFiles = results
        .filter((result) => !result.error)
        .map((result) => `${result.name} (${formatBytes(result.size)})`)

      setSelectedFiles(validFiles)
      setSecureDeleteErrors(data.errors || [])
      setDeleteConfirm("")
      setWipeProgress(100)
      toast({
        title: "Validation Complete",
        description: `${validFiles.length} file(s) can be securely deleted`,
      })
    } catch (error) {
      setSelectedFiles([])
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate files",
        variant: "destructive",
      })
    } finally {
      setIsWiping(false)
      setWipeProgress(0)
    }
  }

  const handleSecureDelete = async () => {
    const filePaths = getRequestedFilePaths()
    if (filePaths.length === 0 || selectedFiles.length === 0) {
      toast({
        title: "No Validated Files",
        description: "Validate app-owned file paths before deleting.",
        variant: "destructive",
      })
      return
    }

    if (deleteConfirm !== "SECURE_DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Type SECURE_DELETE exactly before running destructive deletion.",
        variant: "destructive",
      })
      return
    }

    setIsWiping(true)
    setWipeProgress(35)
    setCurrentPass(secureDeletePasses)

    try {
      const response = await fetch(`${API_URL}/security/secure-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePaths,
          passes: secureDeletePasses,
          dryRun: false,
          confirm: "SECURE_DELETE",
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Secure deletion failed")
      }

      setSecureDeleteErrors(data.errors || [])
      setSelectedFiles([])
      setDeleteConfirm("")
      setFilePathInput("")
      setWipeProgress(100)
      toast({
        title: "Secure Deletion Complete",
        description: data.message || "Selected files were deleted.",
      })
    } catch (error) {
      toast({
        title: "Secure Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to securely delete files",
        variant: "destructive",
      })
    } finally {
      setIsWiping(false)
      setWipeProgress(0)
      setCurrentPass(0)
    }
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
              Configurable random-data overwrite for app-owned files, with clear SSD and snapshot caveats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="secure-delete-paths" className="text-base">
                  App-Owned File Paths to Erase
                </Label>
                <Textarea
                  id="secure-delete-paths"
                  value={filePathInput}
                  onChange={(event) => {
                    setFilePathInput(event.target.value)
                    setSelectedFiles([])
                    setDeleteConfirm("")
                  }}
                  placeholder={"/data/downloads/example.iso\n/data/downloads/example.srt"}
                  rows={4}
                  className="font-mono text-sm"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleValidateSecureDelete}
                    variant="outline"
                    className="flex-1 hover-lift bg-transparent"
                    disabled={isWiping}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Validate Paths
                  </Button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/20 border border-border">
                    <p className="text-sm font-medium mb-2">Validated Files ({selectedFiles.length}):</p>
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

                {secureDeleteErrors.length > 0 && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm font-medium mb-2 text-red-300">Rejected Paths ({secureDeleteErrors.length}):</p>
                    <div className="space-y-1">
                      {secureDeleteErrors.map((error, idx) => (
                        <div key={idx} className="text-sm text-red-200/90 flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-1" />
                          <span>{error}</span>
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
                    {secureDeletePasses > 3 && secureDeletePasses <= 7 && "7-pass overwrite preset"}
                    {secureDeletePasses > 7 && secureDeletePasses <= 15 && "Enhanced Security"}
                    {secureDeletePasses > 15 && "35-pass overwrite preset"}
                  </span>
                  <span className="text-muted-foreground">~{Math.round(secureDeletePasses * 0.5)} sec per MB</span>
                </div>
              </div>

              {isWiping && (
                <div className="space-y-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {currentPass > 0
                        ? `Deleting with ${secureDeletePasses} overwrite pass(es)...`
                        : "Validating file paths..."}
                    </span>
                    <span className="font-mono">{wipeProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={wipeProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    The backend only accepts regular files inside configured app-owned directories.
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
                    <span className="text-xs font-medium text-blue-400">Best-Effort Overwrite</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Syncs random overwrite passes before unlink</p>
                </div>

                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">Storage Caveats</span>
                  </div>
                  <p className="text-xs text-muted-foreground">SSD wear leveling and snapshots can retain copies</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-400">⚠️ Irreversible Operation</p>
                    <p className="text-sm text-muted-foreground">
                      Files will be overwritten {secureDeletePasses} times with cryptographically random data. This
                      process cannot be undone, but SSDs, snapshots, backups, and journaling filesystems may retain
                      copies outside app control.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secure-delete-confirm" className="text-base">
                  Type SECURE_DELETE to enable deletion
                </Label>
                <Input
                  id="secure-delete-confirm"
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  placeholder="SECURE_DELETE"
                  className="font-mono"
                />
              </div>

              <Button
                onClick={handleSecureDelete}
                disabled={isWiping || selectedFiles.length === 0 || deleteConfirm !== "SECURE_DELETE"}
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
