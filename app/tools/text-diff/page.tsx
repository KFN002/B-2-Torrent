'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { GitCompare } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

export default function TextDiffPage() {
  const { t } = useLanguage()
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [diff, setDiff] = useState<Array<{type: 'add' | 'remove' | 'same', text: string}>>([])

  const calculateDiff = (str1: string, str2: string) => {
    const lines1 = str1.split('\n')
    const lines2 = str2.split('\n')
    const result: Array<{type: 'add' | 'remove' | 'same', text: string}> = []

    const maxLen = Math.max(lines1.length, lines2.length)
    
    for (let i = 0; i < maxLen; i++) {
      const line1 = lines1[i]
      const line2 = lines2[i]

      if (line1 === line2) {
        result.push({ type: 'same', text: line1 || '' })
      } else {
        if (line1 !== undefined) {
          result.push({ type: 'remove', text: line1 })
        }
        if (line2 !== undefined) {
          result.push({ type: 'add', text: line2 })
        }
      }
    }

    setDiff(result)
  }

  const handleCompare = () => {
    calculateDiff(text1, text2)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <GitCompare className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Text Diff Tool</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Text</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={text1}
                onChange={(e) => {
                  setText1(e.target.value)
                  handleCompare()
                }}
                placeholder="Enter original text..."
                rows={15}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modified Text</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={text2}
                onChange={(e) => {
                  setText2(e.target.value)
                  handleCompare()
                }}
                placeholder="Enter modified text..."
                rows={15}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {diff.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Differences</CardTitle>
              <CardDescription>
                Lines in red were removed, lines in green were added
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm space-y-1 max-h-96 overflow-auto">
                {diff.map((line, index) => (
                  <div
                    key={index}
                    className={`px-2 py-1 ${
                      line.type === 'add'
                        ? 'bg-green-500/10 text-green-500'
                        : line.type === 'remove'
                        ? 'bg-red-500/10 text-red-500'
                        : ''
                    }`}
                  >
                    <span className="select-none mr-2">
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                    </span>
                    {line.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
