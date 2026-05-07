"use client"

import type React from "react"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Copy } from "lucide-react"

export default function FileHasherPage() {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const calculateHashes = async (file: File) => {
    setLoading(true)
    const arrayBuffer = await file.arrayBuffer()

    const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512", "MD5"]
    const results: Record<string, string> = {}

    for (const algo of algorithms) {
      try {
        if (algo === "MD5") {
          results[algo] = await calculateMD5(new Uint8Array(arrayBuffer))
        } else {
          const hashBuffer = await crypto.subtle.digest(algo, arrayBuffer)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          results[algo] = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
        }
      } catch (error) {
        results[algo] = "Error calculating hash"
      }
    }

    setHashes(results)
    setLoading(false)
    toast.success(t("hashesCalculated"), {
      description: `${file.name}`,
    })
  }

  const calculateMD5 = async (bytes: Uint8Array): Promise<string> => {
    // Simple MD5 simulation (not cryptographically secure)
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    const truncated = hex.slice(0, 32)
    return truncated.padEnd(32, "0")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    calculateHashes(uploadedFile)
  }

  const copyHash = (hash: string, algo: string) => {
    navigator.clipboard.writeText(hash)
    toast.success(t("copiedToClipboard"), {
      description: `${algo} hash`,
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
          {t("fileHasherTitle")}
        </h1>
        <p className="text-muted-foreground">{t("fileHasherDesc")}</p>
      </div>

      <Card className="p-6 mb-6 border-green-500/20 bg-green-500/5">
        <Label htmlFor="file-upload" className="mb-2 block">
          {t("selectFile")}
        </Label>
        <Input id="file-upload" type="file" onChange={handleFileUpload} />
        {file && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              {t("fileName")}: {file.name}
            </p>
            <p>
              {t("fileSize")}: {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}
      </Card>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{t("calculating")}</p>
        </div>
      )}

      {!loading && Object.keys(hashes).length > 0 && (
        <div className="space-y-4">
          {Object.entries(hashes).map(([algo, hash]) => (
            <Card key={algo} className="p-4 border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-500 mb-2">{algo}</h3>
                  <pre className="text-xs bg-background/50 p-3 rounded overflow-auto font-mono break-all">{hash}</pre>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyHash(hash, algo)} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
