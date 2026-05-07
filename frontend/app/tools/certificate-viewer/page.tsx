"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Calendar, User, Globe } from "lucide-react"
import { toast } from "sonner"

export default function CertificateViewerPage() {
  const [domain, setDomain] = useState("")
  const [cert, setCert] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  const checkCertificate = async () => {
    setChecking(true)
    // Simulate API call to check SSL certificate
    setTimeout(() => {
      const mockCert = {
        issuer: "Let's Encrypt Authority X3",
        subject: domain,
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        serialNumber: "04:A1:B2:C3:D4:E5:F6:07:08:09",
        signatureAlgorithm: "SHA256WithRSA",
        keySize: 2048,
        sans: [`www.${domain}`, domain, `*.${domain}`],
      }
      setCert(mockCert)
      setChecking(false)
      toast.success("Certificate information retrieved")
    }, 2000)
  }

  const getDaysRemaining = (validTo: string) => {
    const days = Math.floor((new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">SSL Certificate Viewer</h1>
        </div>
        <p className="text-muted-foreground">View and verify SSL/TLS certificate information</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Check Certificate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Domain</Label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="font-mono"
            />
          </div>
          <Button onClick={checkCertificate} disabled={!domain || checking} className="w-full">
            <ShieldCheck className="mr-2 h-4 w-4" />
            {checking ? "Checking..." : "Check Certificate"}
          </Button>
        </CardContent>
      </Card>

      {cert && (
        <div className="space-y-6">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <ShieldCheck className="h-12 w-12 text-green-500" />
                <div>
                  <p className="text-lg font-semibold">Certificate Valid</p>
                  <p className="text-sm text-muted-foreground">Expires in {getDaysRemaining(cert.validTo)} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certificate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label>Issued By</Label>
                    <p className="text-sm mt-1">{cert.issuer}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label>Subject</Label>
                    <p className="text-sm mt-1">{cert.subject}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label>Valid Period</Label>
                    <p className="text-sm mt-1">
                      {new Date(cert.validFrom).toLocaleDateString()} - {new Date(cert.validTo).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="mb-2 block">Subject Alternative Names (SANs)</Label>
                <div className="flex flex-wrap gap-2">
                  {cert.sans.map((san: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 text-xs bg-muted rounded-full border">
                      {san}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Key Size</Label>
                  <p className="text-sm mt-1">{cert.keySize} bits</p>
                </div>
                <div>
                  <Label>Signature Algorithm</Label>
                  <p className="text-sm mt-1">{cert.signatureAlgorithm}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label>Serial Number</Label>
                <p className="text-sm mt-1 font-mono">{cert.serialNumber}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
