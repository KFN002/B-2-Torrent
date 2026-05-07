'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BrandMark } from '@/components/brand-mark'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2, FileSearch, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'

interface ScanResult {
  filename: string
  size: number
  hash: string
  suspicious: boolean
  threats: string[]
  checks: {
    name: string
    passed: boolean
    description: string
  }[]
}

export default function VirusChecker() {
  const [file, setFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const { toast } = useToast()

  const calculateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const performSecurityChecks = async (file: File): Promise<ScanResult['checks']> => {
    const checks: ScanResult['checks'] = []
    
    // Check file extension
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar']
    const hasSuspiciousExt = suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    checks.push({
      name: 'File Extension',
      passed: !hasSuspiciousExt,
      description: hasSuspiciousExt ? 'Executable file detected' : 'Safe file extension'
    })

    // Check file size (unusually small executables can be suspicious)
    const isSmallExecutable = hasSuspiciousExt && file.size < 10000
    checks.push({
      name: 'File Size Analysis',
      passed: !isSmallExecutable,
      description: isSmallExecutable ? 'Unusually small executable' : 'Normal file size'
    })

    // Check for double extensions
    const hasDoubleExtension = /\.[a-z]{3,4}\.[a-z]{3,4}$/i.test(file.name)
    checks.push({
      name: 'Double Extension Check',
      passed: !hasDoubleExtension,
      description: hasDoubleExtension ? 'Suspicious double extension detected' : 'No double extensions'
    })

    // Read file header for magic number check
    const buffer = await file.slice(0, 4).arrayBuffer()
    const header = new Uint8Array(buffer)
    const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Common executable signatures
    const executableSignatures = ['4d5a', '7f45', 'cafeba']
    const hasExecutableSignature = executableSignatures.some(sig => headerHex.startsWith(sig))
    checks.push({
      name: 'File Signature',
      passed: !hasExecutableSignature,
      description: hasExecutableSignature ? 'Executable signature detected' : 'No executable signature'
    })

    return checks
  }

  const handleScan = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to scan',
        variant: 'destructive',
      })
      return
    }

    setIsScanning(true)
    setProgress(0)
    setResult(null)

    try {
      // Calculate file hash
      setProgress(25)
      const hash = await calculateHash(file)
      
      // Perform security checks
      setProgress(50)
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate scanning
      const checks = await performSecurityChecks(file)
      
      setProgress(75)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Determine if file is suspicious
      const failedChecks = checks.filter(c => !c.passed)
      const suspicious = failedChecks.length > 1
      
      const threats: string[] = []
      if (suspicious) {
        failedChecks.forEach(check => {
          threats.push(check.description)
        })
      }

      setProgress(100)
      setResult({
        filename: file.name,
        size: file.size,
        hash,
        suspicious,
        threats,
        checks
      })

      toast({
        title: suspicious ? 'Potential Threats Detected' : 'Scan Complete',
        description: suspicious 
          ? `Found ${threats.length} suspicious indicator(s)` 
          : 'No threats detected',
        variant: suspicious ? 'destructive' : 'default',
      })
    } catch (error) {
      toast({
        title: 'Scan Failed',
        description: 'An error occurred during scanning',
        variant: 'destructive',
      })
    } finally {
      setIsScanning(false)
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
              <h1 className="text-xl font-bold tracking-tight">File Security Scanner</h1>
              <p className="text-xs text-muted-foreground">Basic Threat Detection</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Basic Security Scanner
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This tool performs basic file analysis and heuristic checks. It is NOT a replacement for professional antivirus software.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan File</CardTitle>
              <CardDescription>
                Upload a file for basic security analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scan-file">Select File</Label>
                <div className="flex gap-2">
                  <Input
                    id="scan-file"
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

              {isScanning && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-center text-muted-foreground">
                    Scanning... {progress.toFixed(0)}%
                  </p>
                </div>
              )}

              <Button
                onClick={handleScan}
                disabled={!file || isScanning}
                className="w-full gap-2"
              >
                {isScanning ? (
                  <>Scanning...</>
                ) : (
                  <>
                    <FileSearch className="h-4 w-4" />
                    Scan File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <>
              <Card className={result.suspicious ? 'border-red-500/20 bg-red-500/5' : 'border-green-500/20 bg-green-500/5'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {result.suspicious ? (
                        <>
                          <XCircle className="h-6 w-6 text-red-500" />
                          Potential Threats Detected
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                          No Threats Detected
                        </>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Filename:</span>
                      <span className="font-mono text-xs break-all max-w-xs text-right">{result.filename}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{(result.size / 1024).toFixed(2)} KB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SHA-256:</span>
                      <span className="font-mono text-xs break-all max-w-xs text-right">{result.hash.substring(0, 16)}...</span>
                    </div>
                  </div>

                  {result.threats.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-red-500">Detected Issues:</Label>
                      {result.threats.map((threat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-red-500">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>{threat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.checks.map((check, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          {check.passed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{check.name}</p>
                            <p className="text-xs text-muted-foreground">{check.description}</p>
                          </div>
                        </div>
                        <Badge variant={check.passed ? 'default' : 'destructive'}>
                          {check.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
