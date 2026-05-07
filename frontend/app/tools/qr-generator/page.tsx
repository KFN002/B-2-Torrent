'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { QrCode, Download } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import QRCode from 'qrcode'

export default function QRGeneratorPage() {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')

  const generateQR = async () => {
    if (!text) return

    const dataUrl = await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
    setQrDataUrl(dataUrl)
  }

  const downloadQR = () => {
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'qrcode.png'
    a.click()
  }

  useEffect(() => {
    if (text) {
      const timeout = setTimeout(generateQR, 500)
      return () => clearTimeout(timeout)
    }
  }, [text])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <QrCode className="h-8 w-8" />
          <h1 className="text-3xl font-bold">QR Code Generator</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate QR Codes</CardTitle>
            <CardDescription>
              Create QR codes locally on this device for URLs, text, contact info, and more
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Text or URL</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text, URL, or any data..."
                rows={4}
              />
            </div>

            {qrDataUrl && (
              <div className="space-y-4">
                <div className="flex justify-center p-6 bg-white rounded-lg">
                  <img src={qrDataUrl || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
                </div>

                <Button onClick={downloadQR} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
