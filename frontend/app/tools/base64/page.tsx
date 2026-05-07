'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileCode, Download, Upload } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

export default function Base64Page() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const encodeText = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)))
      setOutput(encoded)
    } catch (error) {
      setOutput('Error encoding text')
    }
  }

  const decodeText = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(input)))
      setOutput(decoded)
    } catch (error) {
      setOutput('Error decoding text - invalid Base64')
    }
  }

  const encodeFile = async () => {
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setOutput(base64)
    }
    reader.readAsDataURL(file)
  }

  const downloadDecoded = () => {
    try {
      const binary = atob(output)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'decoded-file'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error decoding file')
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <FileCode className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Base64 Encoder/Decoder</h1>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={mode === 'text' ? 'default' : 'outline'}
            onClick={() => setMode('text')}
          >
            Text
          </Button>
          <Button 
            variant={mode === 'file' ? 'default' : 'outline'}
            onClick={() => setMode('file')}
          >
            File
          </Button>
        </div>

        {mode === 'text' ? (
          <Card>
            <CardHeader>
              <CardTitle>Text Base64 Conversion</CardTitle>
              <CardDescription>
                Encode or decode text to/from Base64 format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input">Input</Label>
                <Textarea
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter text to encode or Base64 to decode..."
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={encodeText} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Encode
                </Button>
                <Button onClick={decodeText} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Decode
                </Button>
              </div>

              {output && (
                <div className="space-y-2">
                  <Label htmlFor="output">Output</Label>
                  <Textarea
                    id="output"
                    value={output}
                    readOnly
                    rows={6}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(output)}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>File Base64 Conversion</CardTitle>
              <CardDescription>
                Encode files to Base64 or decode Base64 strings to files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button onClick={encodeFile} disabled={!file} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Encode File to Base64
              </Button>

              {output && (
                <div className="space-y-2">
                  <Label htmlFor="output">Base64 Output</Label>
                  <Textarea
                    id="output"
                    value={output}
                    readOnly
                    rows={10}
                    className="font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(output)}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadDecoded}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Decoded File
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
