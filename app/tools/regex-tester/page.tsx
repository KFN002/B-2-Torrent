"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/i18n"
import { Code } from "lucide-react"

export default function RegexTesterPage() {
  const { t } = useLanguage()
  const [pattern, setPattern] = useState("")
  const [testString, setTestString] = useState("")
  const [matches, setMatches] = useState<string[]>([])

  const testRegex = (regex: string, text: string) => {
    try {
      const re = new RegExp(regex, "g")
      const results = text.match(re) || []
      setMatches(results)
    } catch (e) {
      setMatches([])
    }
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Regex Tester</h1>
        <p className="text-muted-foreground">Test regular expressions in real-time</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Test Regex
          </CardTitle>
          <CardDescription>Enter a pattern and test string</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Regex Pattern</Label>
            <Input
              placeholder="[a-z]+"
              value={pattern}
              onChange={(e) => {
                setPattern(e.target.value)
                testRegex(e.target.value, testString)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Test String</Label>
            <Textarea
              placeholder="Enter text to test against the regex..."
              value={testString}
              onChange={(e) => {
                setTestString(e.target.value)
                testRegex(pattern, e.target.value)
              }}
              rows={6}
            />
          </div>

          {matches.length > 0 && (
            <div className="space-y-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Label className="text-green-500">Matches Found: {matches.length}</Label>
              <div className="flex flex-wrap gap-2">
                {matches.map((match, i) => (
                  <span key={i} className="px-2 py-1 bg-green-500/20 rounded text-sm">
                    {match}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
