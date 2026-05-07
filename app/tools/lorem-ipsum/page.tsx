"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/i18n"
import { FileText, Copy, Check } from "lucide-react"
import { toast } from "sonner"

export default function LoremIpsumPage() {
  const { t } = useLanguage()
  const [type, setType] = useState("paragraphs")
  const [count, setCount] = useState("3")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const lorem = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
    "Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  ]

  const words = lorem.join(" ").split(" ")

  const generate = () => {
    const num = Number.parseInt(count)
    if (isNaN(num) || num <= 0) {
      toast.error("Invalid count")
      return
    }

    let result = ""
    if (type === "paragraphs") {
      for (let i = 0; i < num; i++) {
        result += lorem[i % lorem.length] + "\n\n"
      }
    } else if (type === "sentences") {
      for (let i = 0; i < num; i++) {
        result += lorem[i % lorem.length] + " "
      }
    } else if (type === "words") {
      for (let i = 0; i < num; i++) {
        result += words[i % words.length] + " "
      }
    }

    setOutput(result.trim())
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10 text-slate-500 border border-slate-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Lorem Ipsum Generator</h1>
            <p className="text-muted-foreground">Generate placeholder text for your designs</p>
          </div>
        </div>
      </div>

      <Card className="border-slate-500/20">
        <CardHeader>
          <CardTitle>Generate Text</CardTitle>
          <CardDescription>Choose type and amount of text to generate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraphs">Paragraphs</SelectItem>
                  <SelectItem value="sentences">Sentences</SelectItem>
                  <SelectItem value="words">Words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Count</Label>
              <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} min="1" max="100" />
            </div>
          </div>

          <Button onClick={generate} className="w-full">
            Generate Lorem Ipsum
          </Button>

          {output && (
            <>
              <div className="flex justify-between items-center">
                <Label>Output ({output.length} characters)</Label>
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <Textarea value={output} readOnly className="min-h-[300px] font-sans" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
