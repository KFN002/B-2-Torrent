"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Clipboard, Copy, Trash2, Clock } from "lucide-react"
import { toast } from "sonner"

interface ClipboardEntry {
  id: string
  content: string
  timestamp: Date
  type: string
}

export default function ClipboardManagerPage() {
  const { t } = useLanguage()
  const [history, setHistory] = useState<ClipboardEntry[]>([])
  const [currentText, setCurrentText] = useState("")

  const saveToHistory = () => {
    if (!currentText.trim()) {
      toast.error(t("enterText") || "Please enter some text")
      return
    }

    const entry: ClipboardEntry = {
      id: Date.now().toString(),
      content: currentText,
      timestamp: new Date(),
      type: "text",
    }

    setHistory([entry, ...history].slice(0, 20))
    setCurrentText("")
    toast.success(t("savedToClipboard") || "Saved to clipboard history")
  }

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(t("copiedToClipboard") || "Copied to clipboard")
    } catch (error) {
      toast.error(t("copyError") || "Failed to copy")
    }
  }

  const deleteEntry = (id: string) => {
    setHistory(history.filter((entry) => entry.id !== id))
    toast.success(t("entryDeleted") || "Entry deleted")
  }

  const clearHistory = () => {
    setHistory([])
    toast.success(t("historyCleared") || "History cleared")
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("clipboardManagerTitle") || "Clipboard Manager"}</h1>
          <p className="text-muted-foreground">
            {t("clipboardManagerDesc") || "Manage and track your clipboard history"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add to Clipboard</CardTitle>
            <CardDescription>Save text to your clipboard history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter text to save..."
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              rows={4}
            />
            <Button onClick={saveToHistory} className="w-full">
              <Clipboard className="mr-2 h-4 w-4" />
              Save to History
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Clipboard History ({history.length})</h2>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {history.map((entry) => (
            <Card key={entry.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-mono bg-muted p-2 rounded break-all">{entry.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {entry.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(entry.content)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteEntry(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {history.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clipboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No clipboard history yet</p>
                <p className="text-sm">Save some text to start tracking your clipboard</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
