'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandMark } from '@/components/brand-mark'
import { ArrowLeft, Hash, Copy, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

export default function HashGenerator() {
  const [textInput, setTextInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256')
  const [textHash, setTextHash] = useState('')
  const [fileHash, setFileHash] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateHash = async (data: ArrayBuffer, algo: HashAlgorithm): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest(algo, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleTextHash = async () => {
    if (!textInput) {
      toast({
        title: 'No Input',
        description: 'Please enter text to hash',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    const encoder = new TextEncoder()
    const data = encoder.encode(textInput)
    const hash = await generateHash(data.buffer, algorithm)
    setTextHash(hash)
    setIsProcessing(false)
  }

  const handleFileHash = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to hash',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    const buffer = await file.arrayBuffer()
    const hash = await generateHash(buffer, algorithm)
    setFileHash(hash)
    setIsProcessing(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Copied',
      description: 'Hash copied to clipboard',
    })
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
              <h1 className="text-xl font-bold tracking-tight">Hash Generator</h1>
              <p className="text-xs text-muted-foreground">Cryptographic Hash Functions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Selection</CardTitle>
              <CardDescription>Choose a hash algorithm</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as HashAlgorithm)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHA-1">SHA-1 (Legacy)</SelectItem>
                  <SelectItem value="SHA-256">SHA-256 (Recommended)</SelectItem>
                  <SelectItem value="SHA-384">SHA-384</SelectItem>
                  <SelectItem value="SHA-512">SHA-512</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text Hash</TabsTrigger>
              <TabsTrigger value="file">File Hash</TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle>Hash Text</CardTitle>
                  <CardDescription>Generate hash from text input</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-input">Text Input</Label>
                    <Textarea
                      id="text-input"
                      placeholder="Enter text to hash..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <Button
                    onClick={handleTextHash}
                    disabled={!textInput || isProcessing}
                    className="w-full gap-2"
                  >
                    <Hash className="h-4 w-4" />
                    Generate Hash
                  </Button>

                  {textHash && (
                    <div className="space-y-2">
                      <Label>Hash Output</Label>
                      <div className="relative">
                        <Textarea
                          value={textHash}
                          readOnly
                          rows={3}
                          className="font-mono text-xs pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(textHash)}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="file">
              <Card>
                <CardHeader>
                  <CardTitle>Hash File</CardTitle>
                  <CardDescription>Generate hash from file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-input">Select File</Label>
                    <div className="flex gap-2">
                      <Input
                        id="file-input"
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {file && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setFile(null)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    {file && (
                      <p className="text-sm text-muted-foreground">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleFileHash}
                    disabled={!file || isProcessing}
                    className="w-full gap-2"
                  >
                    <Hash className="h-4 w-4" />
                    Generate Hash
                  </Button>

                  {fileHash && (
                    <div className="space-y-2">
                      <Label>Hash Output</Label>
                      <div className="relative">
                        <Textarea
                          value={fileHash}
                          readOnly
                          rows={3}
                          className="font-mono text-xs pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(fileHash)}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
