"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Lock,
  Unlock,
  Key,
  HardDrive,
  Folder,
  File,
  Eye,
  EyeOff,
  FileKey,
  Database,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EncryptionPage() {
  const { toast } = useToast()
  const [selectedTarget, setSelectedTarget] = useState<"file" | "folder" | "drive">("file")
  const [algorithm, setAlgorithm] = useState("AES-256-GCM")
  const [hashAlgorithm, setHashAlgorithm] = useState("SHA-256")
  const [keyDerivation, setKeyDerivation] = useState("PBKDF2")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const algorithms = [
    { value: "AES-256-GCM", label: "AES-256-GCM (Recommended)", strength: "Military Grade" },
    { value: "AES-256-CBC", label: "AES-256-CBC", strength: "High" },
    { value: "AES-192-GCM", label: "AES-192-GCM", strength: "High" },
    { value: "ChaCha20-Poly1305", label: "ChaCha20-Poly1305", strength: "Military Grade" },
    { value: "Twofish-256", label: "Twofish-256", strength: "High" },
    { value: "Serpent-256", label: "Serpent-256", strength: "Very High" },
    { value: "Camellia-256", label: "Camellia-256", strength: "High" },
  ]

  const hashAlgorithms = [
    { value: "SHA-256", label: "SHA-256" },
    { value: "SHA-512", label: "SHA-512" },
    { value: "SHA-3-256", label: "SHA-3-256" },
    { value: "BLAKE2b", label: "BLAKE2b" },
    { value: "Whirlpool", label: "Whirlpool" },
  ]

  const keyDerivations = [
    { value: "PBKDF2", label: "PBKDF2 (100,000 iterations)" },
    { value: "Argon2id", label: "Argon2id (Recommended)" },
    { value: "scrypt", label: "scrypt" },
    { value: "bcrypt", label: "bcrypt" },
  ]

  const handleEncrypt = async () => {
    if (!password || password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 12) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 12 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsEncrypting(true)
    setProgress(0)

    // Simulate encryption process
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      setProgress(i)
    }

    setIsEncrypting(false)
    toast({
      title: "Encryption Complete",
      description: `${selectedTarget} encrypted successfully with ${algorithm}`,
    })
    setPassword("")
    setConfirmPassword("")
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-4 py-8 2xl:py-12 space-y-8">
        {/* Header */}
        <div className="fade-in-up text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20">
            <FileKey className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Enterprise-Grade Encryption</span>
          </div>
          <h1 className="text-5xl 2xl:text-6xl font-bold text-gradient-rainbow">Data Encryption</h1>
          <p className="text-xl 2xl:text-2xl text-muted-foreground max-w-3xl mx-auto text-fade">
            Encrypt files, folders, and entire drives with military-grade algorithms and customizable security settings
          </p>
        </div>

        {/* Target Selection */}
        <Card className="glass-card-transparent border-2 fade-in-up animation-delay-100">
          <CardHeader>
            <CardTitle className="text-2xl 2xl:text-3xl flex items-center gap-3">
              <Shield className="w-6 h-6 text-cyan-400" />
              Select Encryption Target
            </CardTitle>
            <CardDescription className="text-base 2xl:text-lg">Choose what you want to encrypt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedTarget("file")}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedTarget === "file"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-border bg-muted/5 hover:border-cyan-500/50"
                }`}
              >
                <File className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
                <h3 className="text-lg font-bold mb-1">File Encryption</h3>
                <p className="text-sm text-muted-foreground">Encrypt individual files</p>
              </button>

              <button
                onClick={() => setSelectedTarget("folder")}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedTarget === "folder"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-border bg-muted/5 hover:border-blue-500/50"
                }`}
              >
                <Folder className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                <h3 className="text-lg font-bold mb-1">Folder Encryption</h3>
                <p className="text-sm text-muted-foreground">Encrypt entire folders</p>
              </button>

              <button
                onClick={() => setSelectedTarget("drive")}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedTarget === "drive"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border bg-muted/5 hover:border-purple-500/50"
                }`}
              >
                <HardDrive className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <h3 className="text-lg font-bold mb-1">Drive Encryption</h3>
                <p className="text-sm text-muted-foreground">Full disk encryption</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Configuration */}
        <Card className="glass-card-transparent border-2 fade-in-up animation-delay-200">
          <CardHeader>
            <CardTitle className="text-2xl 2xl:text-3xl flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-400" />
              Encryption Configuration
            </CardTitle>
            <CardDescription className="text-base 2xl:text-lg">
              Customize encryption algorithm and security parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Encryption Algorithm */}
              <div className="space-y-3">
                <Label className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Encryption Algorithm
                </Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithms.map((algo) => (
                      <SelectItem key={algo.value} value={algo.value}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{algo.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {algo.strength}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  AES-256-GCM provides authenticated encryption with 256-bit key
                </p>
              </div>

              {/* Hash Algorithm */}
              <div className="space-y-3">
                <Label className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Hash Algorithm
                </Label>
                <Select value={hashAlgorithm} onValueChange={setHashAlgorithm}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hashAlgorithms.map((hash) => (
                      <SelectItem key={hash.value} value={hash.value}>
                        {hash.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Used for integrity verification and key derivation</p>
              </div>

              {/* Key Derivation */}
              <div className="space-y-3">
                <Label className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Key Derivation Function
                </Label>
                <Select value={keyDerivation} onValueChange={setKeyDerivation}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {keyDerivations.map((kdf) => (
                      <SelectItem key={kdf.value} value={kdf.value}>
                        {kdf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Argon2id is resistant to GPU and ASIC attacks</p>
              </div>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Authenticated</span>
                </div>
                <p className="text-xs text-muted-foreground">AEAD encryption mode</p>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Perfect Forward Secrecy</span>
                </div>
                <p className="text-xs text-muted-foreground">Unique session keys</p>
              </div>

              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">Salt & IV</span>
                </div>
                <p className="text-xs text-muted-foreground">Random per encryption</p>
              </div>

              <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-medium text-pink-400">Secure Wipe</span>
                </div>
                <p className="text-xs text-muted-foreground">Original data erased</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Setup */}
        <Card className="glass-card-transparent border-2 fade-in-up animation-delay-300">
          <CardHeader>
            <CardTitle className="text-2xl 2xl:text-3xl flex items-center gap-3">
              <Key className="w-6 h-6 text-purple-400" />
              Password Protection
            </CardTitle>
            <CardDescription className="text-base 2xl:text-lg">
              Set a strong password or PIN for encryption/decryption
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-base">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter encryption password"
                    className="pr-10 bg-background/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge variant={password.length >= 12 ? "default" : "secondary"}>12+ chars</Badge>
                  <Badge variant={/[A-Z]/.test(password) ? "default" : "secondary"}>Uppercase</Badge>
                  <Badge variant={/[0-9]/.test(password) ? "default" : "secondary"}>Number</Badge>
                  <Badge variant={/[^A-Za-z0-9]/.test(password) ? "default" : "secondary"}>Special</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-base">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm encryption password"
                  className="bg-background/50"
                />
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-400">Important Security Notice</p>
                  <p className="text-sm text-muted-foreground">
                    Your password is NOT stored anywhere. If you forget it, your encrypted data cannot be recovered.
                    Write it down securely or use a password manager.
                  </p>
                </div>
              </div>
            </div>

            {isEncrypting && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Encrypting with {algorithm}...</span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Deriving key with {keyDerivation}, applying {algorithm} encryption...
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleEncrypt}
                disabled={isEncrypting || !password || password !== confirmPassword}
                size="lg"
                className="flex-1 hover-lift bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Lock className="w-5 h-5 mr-2" />
                Encrypt {selectedTarget.charAt(0).toUpperCase() + selectedTarget.slice(1)}
              </Button>

              <Button variant="outline" size="lg" className="flex-1 hover-lift bg-transparent" disabled={isEncrypting}>
                <Unlock className="w-5 h-5 mr-2" />
                Decrypt {selectedTarget.charAt(0).toUpperCase() + selectedTarget.slice(1)}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Encryption Status */}
        <Card className="glass-card-transparent border-2 fade-in-up animation-delay-400">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Database className="w-6 h-6 text-green-400" />
              Encryption Status
            </CardTitle>
            <CardDescription>Currently encrypted items on this device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/10 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium">System Drive (C:)</p>
                    <p className="text-xs text-muted-foreground">AES-256-GCM Full Disk Encryption</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Encrypted</Badge>
              </div>

              <div className="p-4 rounded-lg bg-muted/10 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">Documents/Private</p>
                    <p className="text-xs text-muted-foreground">ChaCha20-Poly1305 Container</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Encrypted</Badge>
              </div>

              <div className="p-4 rounded-lg bg-muted/10 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-sm font-medium">tax-returns-2024.pdf</p>
                    <p className="text-xs text-muted-foreground">AES-256-CBC Individual File</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Encrypted</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
