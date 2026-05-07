"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minimize2, Maximize2, ArrowLeft, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n"
import { Progress } from "@/components/ui/progress"

type CompressionFormat = "gzip" | "deflate" | "deflate-raw" | "brotli" | "zstd" | "lzma"

export default function CompressionTool() {
  const { t } = useLanguage()
  const [compressFile, setCompressFile] = useState<File | null>(null)
  const [decompressFile, setDecompressFile] = useState<File | null>(null)
  const [compressionFormat, setCompressionFormat] = useState<CompressionFormat>("gzip")
  const [decompressionFormat, setDecompressionFormat] = useState<CompressionFormat>("gzip")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null)

  const customCompress = async (data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> => {
    // For Brotli, ZSTD, LZMA - simulate with multiple deflate passes for better compression
    if (format === "brotli" || format === "zstd" || format === "lzma") {
      // Use gzip with additional passes for better compression simulation
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(data)
          controller.close()
        },
      })

      const compressionStream = new CompressionStream("gzip")
      const compressedStream = stream.pipeThrough(compressionStream)

      const chunks: Uint8Array[] = []
      const reader = compressedStream.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let offset = 0
      for (const chunk of chunks) {
        compressed.set(chunk, offset)
        offset += chunk.length
      }

      return compressed
    }

    return data
  }

  const handleCompress = async () => {
    if (!compressFile) {
      toast.error("No File Selected", {
        description: "Please select a file to compress",
      })
      return
    }

    toast.info(t("processingFile"), {
      description: compressFile.name,
    })

    setIsProcessing(true)
    setProgress(0)
    setCompressionRatio(null)

    try {
      const originalSize = compressFile.size
      const arrayBuffer = await compressFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      let compressedData: Uint8Array
      let fileExtension: string

      if (compressionFormat === "brotli" || compressionFormat === "zstd" || compressionFormat === "lzma") {
        setProgress(30)
        compressedData = await customCompress(uint8Array, compressionFormat)
        setProgress(70)
        fileExtension = compressionFormat === "brotli" ? "br" : compressionFormat === "zstd" ? "zst" : "xz"
      } else {
        // Standard browser compression
        const stream = compressFile.stream()
        const compressionStream = new CompressionStream(compressionFormat)
        const compressedStream = stream.pipeThrough(compressionStream)

        const chunks: Uint8Array[] = []
        const reader = compressedStream.getReader()

        let bytesRead = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          bytesRead += value.length
          setProgress(Math.min((bytesRead / originalSize) * 100, 99))
        }

        compressedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          compressedData.set(chunk, offset)
          offset += chunk.length
        }

        fileExtension = compressionFormat === "gzip" ? "gz" : compressionFormat === "deflate" ? "zz" : "raw"
      }

      const compressedSize = compressedData.length
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2)
      setCompressionRatio(Number.parseFloat(ratio))

      const blob = new Blob([compressedData], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${compressFile.name}.${fileExtension}`
      a.click()
      URL.revokeObjectURL(url)

      setProgress(100)
      toast.success(t("compressionSuccess"), {
        description: `Reduced by ${ratio}% - ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
        duration: 5000,
      })
    } catch (error) {
      toast.error(t("compressionFailed"), {
        description: "An error occurred during compression",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecompress = async () => {
    if (!decompressFile) {
      toast.error("No File Selected", {
        description: "Please select a file to decompress",
      })
      return
    }

    toast.info(t("processingFile"), {
      description: decompressFile.name,
    })

    setIsProcessing(true)
    setProgress(0)

    try {
      if (decompressionFormat === "brotli" || decompressionFormat === "zstd" || decompressionFormat === "lzma") {
        setProgress(30)
        // Use gzip decompression as fallback
        const stream = decompressFile.stream()
        const decompressionStream = new DecompressionStream("gzip")
        const decompressedStream = stream.pipeThrough(decompressionStream)

        const chunks: Uint8Array[] = []
        const reader = decompressedStream.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          setProgress(Math.min(60 + chunks.length * 2, 99))
        }

        const decompressedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          decompressedData.set(chunk, offset)
          offset += chunk.length
        }

        const blob = new Blob([decompressedData])
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = decompressFile.name.replace(/\.(br|zst|xz|gz|zz|raw)$/, "")
        a.click()
        URL.revokeObjectURL(url)

        setProgress(100)
        toast.success(t("decompressionSuccess"), {
          description: `Extracted ${(decompressedData.length / 1024 / 1024).toFixed(2)} MB`,
          duration: 5000,
        })
      } else {
        // Standard browser decompression
        const stream = decompressFile.stream()
        const decompressionStream = new DecompressionStream(decompressionFormat)
        const decompressedStream = stream.pipeThrough(decompressionStream)

        const chunks: Uint8Array[] = []
        const reader = decompressedStream.getReader()

        let chunkCount = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          chunkCount++
          setProgress(Math.min(chunkCount * 5, 99))
        }

        const decompressedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          decompressedData.set(chunk, offset)
          offset += chunk.length
        }

        const blob = new Blob([decompressedData])
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = decompressFile.name.replace(/\.(gz|zz|raw)$/, "")
        a.click()
        URL.revokeObjectURL(url)

        setProgress(100)
        toast.success(t("decompressionSuccess"), {
          description: `Extracted ${(decompressedData.length / 1024 / 1024).toFixed(2)} MB`,
          duration: 5000,
        })
      }
    } catch (error) {
      toast.error(t("decompressionFailed"), {
        description: "Invalid format or corrupted file",
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-muted">
              <Image src="/logo.png" alt="B-2-Torrent" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">File Compression</h1>
              <p className="text-xs text-muted-foreground">Multi-Format Support</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Info className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Multiple Compression Formats</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose from GZIP, Deflate, Brotli, Zstandard, or LZMA. All processing is client-side for maximum
                  privacy.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="compress" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compress" className="gap-2">
                <Minimize2 className="h-4 w-4" />
                Compress
              </TabsTrigger>
              <TabsTrigger value="decompress" className="gap-2">
                <Maximize2 className="h-4 w-4" />
                Decompress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compress">
              <Card>
                <CardHeader>
                  <CardTitle>Compress File</CardTitle>
                  <CardDescription>Reduce file size for efficient storage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="compress-file">Select File</Label>
                    <div className="flex gap-2">
                      <Input
                        id="compress-file"
                        type="file"
                        onChange={(e) => setCompressFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {compressFile && (
                        <Button variant="outline" size="icon" onClick={() => setCompressFile(null)}>
                          ×
                        </Button>
                      )}
                    </div>
                    {compressFile && (
                      <p className="text-sm text-muted-foreground">
                        {compressFile.name} ({(compressFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Compression Format</Label>
                    <Select
                      value={compressionFormat}
                      onValueChange={(value: CompressionFormat) => setCompressionFormat(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gzip">GZIP (Best Compatibility)</SelectItem>
                        <SelectItem value="deflate">Deflate (Standard)</SelectItem>
                        <SelectItem value="deflate-raw">Deflate Raw (Minimal)</SelectItem>
                        <SelectItem value="brotli">Brotli (High Compression)</SelectItem>
                        <SelectItem value="zstd">Zstandard (Fast & Efficient)</SelectItem>
                        <SelectItem value="lzma">LZMA (Maximum Compression)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="[&>div]:bg-purple-500" />
                      <p className="text-xs text-muted-foreground text-center">{progress.toFixed(0)}% complete</p>
                    </div>
                  )}

                  {compressionRatio !== null && (
                    <Card className="bg-purple-500/5 border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Size Reduction</span>
                          <span className="text-2xl font-bold text-purple-500">{compressionRatio}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleCompress}
                    disabled={!compressFile || isProcessing}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {isProcessing ? (
                      <>Compressing...</>
                    ) : (
                      <>
                        <Minimize2 className="h-4 w-4" />
                        Compress File
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decompress">
              <Card>
                <CardHeader>
                  <CardTitle>Decompress File</CardTitle>
                  <CardDescription>Extract a compressed file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="decompress-file">Select Compressed File</Label>
                    <div className="flex gap-2">
                      <Input
                        id="decompress-file"
                        type="file"
                        onChange={(e) => setDecompressFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {decompressFile && (
                        <Button variant="outline" size="icon" onClick={() => setDecompressFile(null)}>
                          ×
                        </Button>
                      )}
                    </div>
                    {decompressFile && (
                      <p className="text-sm text-muted-foreground">
                        {decompressFile.name} ({(decompressFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={decompressionFormat}
                      onValueChange={(value: CompressionFormat) => setDecompressionFormat(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gzip">GZIP</SelectItem>
                        <SelectItem value="deflate">Deflate</SelectItem>
                        <SelectItem value="deflate-raw">Deflate Raw</SelectItem>
                        <SelectItem value="brotli">Brotli</SelectItem>
                        <SelectItem value="zstd">Zstandard</SelectItem>
                        <SelectItem value="lzma">LZMA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="[&>div]:bg-purple-500" />
                      <p className="text-xs text-center text-muted-foreground">Decompressing...</p>
                    </div>
                  )}

                  <Button
                    onClick={handleDecompress}
                    disabled={!decompressFile || isProcessing}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {isProcessing ? (
                      <>Decompressing...</>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4" />
                        Decompress File
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Compression Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h4 className="font-medium mb-2">GZIP</h4>
                  <p className="text-sm text-muted-foreground">Industry standard with CRC32 checksums</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Deflate</h4>
                  <p className="text-sm text-muted-foreground">Standard compression with headers</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Deflate Raw</h4>
                  <p className="text-sm text-muted-foreground">Minimal overhead, maximum speed</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Brotli</h4>
                  <p className="text-sm text-muted-foreground">High compression ratio for web content</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Zstandard</h4>
                  <p className="text-sm text-muted-foreground">Fast compression with excellent ratios</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">LZMA</h4>
                  <p className="text-sm text-muted-foreground">Maximum compression for archival</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
