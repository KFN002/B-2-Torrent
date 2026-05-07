"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BrandMark } from "@/components/brand-mark"
import { Lock, Unlock, ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n"
import { Progress } from "@/components/ui/progress"

type EncryptionAlgorithm = "AES-GCM" | "AES-CBC" | "AES-CTR"
type KeySize = 128 | 192 | 256

export default function EncryptionTool() {
  const { t } = useLanguage()
  const [encryptFile, setEncryptFile] = useState<File | null>(null)
  const [decryptFile, setDecryptFile] = useState<File | null>(null)
  const [encryptKey, setEncryptKey] = useState("")
  const [decryptKey, setDecryptKey] = useState("")
  const [algorithm, setAlgorithm] = useState<EncryptionAlgorithm>("AES-GCM")
  const [keySize, setKeySize] = useState<KeySize>(256)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleEncrypt = async () => {
    if (!encryptFile || !encryptKey) {
      toast.error("Missing Information", {
        description: "Please select a file and enter an encryption key",
      })
      return
    }

    toast.info(t("processingFile"), {
      description: encryptFile.name,
    })

    setIsProcessing(true)
    setProgress(0)

    try {
      const arrayBuffer = await encryptFile.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      setProgress(25)

      const encoder = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(encryptKey), "PBKDF2", false, [
        "deriveBits",
        "deriveKey",
      ])

      const salt = crypto.getRandomValues(new Uint8Array(16))
      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: algorithm, length: keySize },
        false,
        ["encrypt"],
      )
      setProgress(50)

      const iv = crypto.getRandomValues(new Uint8Array(algorithm === "AES-GCM" ? 12 : 16))
      const encrypted = await crypto.subtle.encrypt(
        algorithm === "AES-GCM"
          ? { name: algorithm, iv }
          : algorithm === "AES-CBC"
            ? { name: algorithm, iv }
            : { name: algorithm, counter: iv, length: 64 },
        key,
        data,
      )
      setProgress(75)

      const algorithmByte = algorithm === "AES-GCM" ? 0 : algorithm === "AES-CBC" ? 1 : 2
      const keySizeByte = keySize === 128 ? 0 : keySize === 192 ? 1 : 2
      const result = new Uint8Array(2 + salt.length + iv.length + encrypted.byteLength)
      result.set([algorithmByte, keySizeByte], 0)
      result.set(salt, 2)
      result.set(iv, 2 + salt.length)
      result.set(new Uint8Array(encrypted), 2 + salt.length + iv.length)

      const blob = new Blob([result], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${encryptFile.name}.b2t`
      a.click()
      URL.revokeObjectURL(url)

      setProgress(100)
      toast.success(t("encryptionSuccess"), {
        description: `${encryptFile.name} with ${algorithm}-${keySize}`,
        duration: 5000,
      })
    } catch (error) {
      toast.error(t("encryptionFailed"), {
        description: "An error occurred during encryption",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecrypt = async () => {
    if (!decryptFile || !decryptKey) {
      toast.error("Missing Information", {
        description: "Please select a file and enter the decryption key",
      })
      return
    }

    toast.info(t("processingFile"), {
      description: decryptFile.name,
    })

    setIsProcessing(true)
    setProgress(0)

    try {
      const arrayBuffer = await decryptFile.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      setProgress(25)

      const algorithmByte = data[0]
      const keySizeByte = data[1]
      const detectedAlgorithm: EncryptionAlgorithm =
        algorithmByte === 0 ? "AES-GCM" : algorithmByte === 1 ? "AES-CBC" : "AES-CTR"
      const detectedKeySize: KeySize = keySizeByte === 0 ? 128 : keySizeByte === 1 ? 192 : 256
      const ivLength = detectedAlgorithm === "AES-GCM" ? 12 : 16

      const salt = data.slice(2, 18)
      const iv = data.slice(18, 18 + ivLength)
      const encrypted = data.slice(18 + ivLength)

      const encoder = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(decryptKey), "PBKDF2", false, [
        "deriveBits",
        "deriveKey",
      ])

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: detectedAlgorithm, length: detectedKeySize },
        false,
        ["decrypt"],
      )
      setProgress(50)

      const decrypted = await crypto.subtle.decrypt(
        detectedAlgorithm === "AES-GCM"
          ? { name: detectedAlgorithm, iv }
          : detectedAlgorithm === "AES-CBC"
            ? { name: detectedAlgorithm, iv }
            : { name: detectedAlgorithm, counter: iv, length: 64 },
        key,
        encrypted,
      )
      setProgress(75)

      const blob = new Blob([decrypted])
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = decryptFile.name.replace(".b2t", "")
      a.click()
      URL.revokeObjectURL(url)

      setProgress(100)
      toast.success(t("decryptionSuccess"), {
        description: `${decryptFile.name} using ${detectedAlgorithm}-${detectedKeySize}`,
        duration: 5000,
      })
    } catch (error) {
      toast.error(t("decryptionFailed"), {
        description: "Invalid key or corrupted file",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
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
              <h1 className="text-xl font-bold tracking-tight">File Encryption</h1>
              <p className="text-xs text-muted-foreground">Multi-Algorithm Support</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Military-Grade Encryption</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose from AES-GCM, AES-CBC, or AES-CTR with 128/192/256-bit keys. All processing happens locally -
                  files never leave your device.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="encrypt" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="encrypt" className="gap-2">
                <Lock className="h-4 w-4" />
                Encrypt
              </TabsTrigger>
              <TabsTrigger value="decrypt" className="gap-2">
                <Unlock className="h-4 w-4" />
                Decrypt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="encrypt">
              <Card>
                <CardHeader>
                  <CardTitle>Encrypt File</CardTitle>
                  <CardDescription>Secure your files with advanced encryption</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Encryption Algorithm</Label>
                      <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as EncryptionAlgorithm)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AES-GCM">AES-GCM (Recommended)</SelectItem>
                          <SelectItem value="AES-CBC">AES-CBC</SelectItem>
                          <SelectItem value="AES-CTR">AES-CTR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Key Size</Label>
                      <Select
                        value={keySize.toString()}
                        onValueChange={(v) => setKeySize(Number.parseInt(v) as KeySize)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="128">128-bit</SelectItem>
                          <SelectItem value="192">192-bit</SelectItem>
                          <SelectItem value="256">256-bit (Recommended)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="encrypt-file">Select File</Label>
                    <div className="flex gap-2">
                      <Input
                        id="encrypt-file"
                        type="file"
                        onChange={(e) => setEncryptFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {encryptFile && (
                        <Button variant="outline" size="icon" onClick={() => setEncryptFile(null)}>
                          ×
                        </Button>
                      )}
                    </div>
                    {encryptFile && (
                      <p className="text-sm text-muted-foreground">
                        {encryptFile.name} ({(encryptFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="encrypt-key">Encryption Key</Label>
                    <Input
                      id="encrypt-key"
                      type="password"
                      placeholder="Enter a strong password"
                      value={encryptKey}
                      onChange={(e) => setEncryptKey(e.target.value)}
                    />
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="[&>div]:bg-green-500" />
                      <p className="text-xs text-center text-muted-foreground">{progress.toFixed(0)}% complete</p>
                    </div>
                  )}

                  <Button
                    onClick={handleEncrypt}
                    disabled={!encryptFile || !encryptKey || isProcessing}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Encrypt File
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decrypt">
              <Card>
                <CardHeader>
                  <CardTitle>Decrypt File</CardTitle>
                  <CardDescription>Algorithm detected automatically from file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="decrypt-file">Select Encrypted File (.b2t)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="decrypt-file"
                        type="file"
                        accept=".b2t"
                        onChange={(e) => setDecryptFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {decryptFile && (
                        <Button variant="outline" size="icon" onClick={() => setDecryptFile(null)}>
                          ×
                        </Button>
                      )}
                    </div>
                    {decryptFile && (
                      <p className="text-sm text-muted-foreground">
                        {decryptFile.name} ({(decryptFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="decrypt-key">Decryption Key</Label>
                    <Input
                      id="decrypt-key"
                      type="password"
                      placeholder="Enter the encryption password"
                      value={decryptKey}
                      onChange={(e) => setDecryptKey(e.target.value)}
                    />
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="[&>div]:bg-green-500" />
                      <p className="text-xs text-center text-muted-foreground">{progress.toFixed(0)}% complete</p>
                    </div>
                  )}

                  <Button
                    onClick={handleDecrypt}
                    disabled={!decryptFile || !decryptKey || isProcessing}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4" />
                        Decrypt File
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Supported Algorithms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="font-medium mb-2">AES-GCM</h4>
                  <p className="text-sm text-muted-foreground">
                    Authenticated encryption with built-in integrity checking
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AES-CBC</h4>
                  <p className="text-sm text-muted-foreground">Classic cipher block chaining mode</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AES-CTR</h4>
                  <p className="text-sm text-muted-foreground">Counter mode for stream encryption</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
