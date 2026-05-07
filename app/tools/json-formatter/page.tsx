'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileJson, CheckCircle, XCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

export default function JSONFormatterPage() {
  const { t } = useLanguage()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      setIsValid(true)
      setError('')
    } catch (err) {
      setIsValid(false)
      setError((err as Error).message)
      setOutput('')
    }
  }

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      setIsValid(true)
      setError('')
    } catch (err) {
      setIsValid(false)
      setError((err as Error).message)
      setOutput('')
    }
  }

  const validateJSON = () => {
    try {
      JSON.parse(input)
      setIsValid(true)
      setError('')
    } catch (err) {
      setIsValid(false)
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <FileJson className="h-8 w-8" />
          <h1 className="text-3xl font-bold">JSON Formatter & Validator</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Input JSON</CardTitle>
              <CardDescription>
                Paste your JSON here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setIsValid(null)
                }}
                placeholder='{"key": "value"}'
                rows={15}
                className="font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button onClick={formatJSON} className="flex-1">
                  Format
                </Button>
                <Button onClick={minifyJSON} variant="outline" className="flex-1">
                  Minify
                </Button>
                <Button onClick={validateJSON} variant="outline" className="flex-1">
                  Validate
                </Button>
              </div>

              {isValid !== null && (
                <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                  {isValid ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Valid JSON</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>
                Formatted or minified JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={output}
                readOnly
                rows={15}
                className="font-mono text-sm"
              />

              {output && (
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="w-full"
                >
                  Copy to Clipboard
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
