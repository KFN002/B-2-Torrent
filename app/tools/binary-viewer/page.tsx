"use client"

import type React from "react"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function BinaryViewerPage() {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [hexData, setHexData] = useState<string>("")
  const [binaryData, setBinaryData] = useState<string>("")
  const [textData, setTextData] = useState<string>("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    const arrayBuffer = await uploadedFile.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ")
    const binary = Array.from(bytes)
      .map((b) => b.toString(2).padStart(8, "0"))
      .join(" ")
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes)

    setHexData(hex)
    setBinaryData(binary)
    setTextData(text)

    toast.success(t("fileLoaded"), {
      description: `${uploadedFile.name} - ${bytes.length} bytes`,
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          {t("binaryViewerTitle")}
        </h1>
        <p className="text-muted-foreground">{t("binaryViewerDesc")}</p>
      </div>

      <Card className="p-6 mb-6 border-blue-500/20 bg-blue-500/5">
        <Label htmlFor="file-upload" className="mb-2 block">
          {t("selectFile")}
        </Label>
        <div className="flex gap-2">
          <Input id="file-upload" type="file" onChange={handleFileUpload} className="flex-1" />
        </div>
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

      {hexData && (
        <>
          <Card className="p-6 mb-4 border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyan-500">{t("hexadecimal")}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(hexData)
                  toast.success(t("copiedToClipboard"))
                }}
              >
                {t("copy")}
              </Button>
            </div>
            <pre className="text-xs bg-background/50 p-4 rounded overflow-auto max-h-48 font-mono">{hexData}</pre>
          </Card>

          <Card className="p-6 mb-4 border-green-500/20 bg-green-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-500">{t("binary")}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(binaryData)
                  toast.success(t("copiedToClipboard"))
                }}
              >
                {t("copy")}
              </Button>
            </div>
            <pre className="text-xs bg-background/50 p-4 rounded overflow-auto max-h-48 font-mono">{binaryData}</pre>
          </Card>

          <Card className="p-6 border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-500">{t("textRepresentation")}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(textData)
                  toast.success(t("copiedToClipboard"))
                }}
              >
                {t("copy")}
              </Button>
            </div>
            <pre className="text-xs bg-background/50 p-4 rounded overflow-auto max-h-48 font-mono whitespace-pre-wrap">
              {textData}
            </pre>
          </Card>
        </>
      )}
    </div>
  )
}
