"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n"
import { FileText, Download, Copy, Check } from "lucide-react"
import { toast } from "sonner"

export default function MarkdownEditorPage() {
  const { t } = useLanguage()
  const [markdown, setMarkdown] = useState(
    "# Welcome to Markdown Editor\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2\n\n```javascript\nconst hello = 'world';\n```",
  )
  const [copied, setCopied] = useState(false)

  const renderMarkdown = (text: string) => {
    // Escape editor input before applying the controlled Markdown subset.
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;")
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    html = html.replace(/(<li[\s\S]*<\/li>)/, '<ul class="list-disc my-2">$1</ul>')
    html = html.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$2</code></pre>',
    )
    html = html.replace(/\n/g, "<br>")
    return html
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "document.md"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded markdown file")
  }

  return (
    <div className="container max-w-7xl py-8 px-4">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Markdown Editor</h1>
            <p className="text-muted-foreground">Write and preview Markdown in real-time</p>
          </div>
        </div>
      </div>

      <Card className="border-indigo-500/20">
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>Write Markdown on the left, preview on the right</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <Tabs defaultValue="split" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="split">Split</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-4">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your markdown here..."
                className="min-h-[500px] font-mono"
              />
            </TabsContent>

            <TabsContent value="split" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="Write your markdown here..."
                  className="min-h-[500px] font-mono"
                />
                <Card className="border-muted">
                  <CardContent className="p-6 min-h-[500px] prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card className="border-muted">
                <CardContent className="p-6 min-h-[500px] prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
