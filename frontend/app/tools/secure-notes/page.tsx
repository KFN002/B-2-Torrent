"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Lock, Unlock, Save, Trash2, Plus } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  encrypted: boolean
  timestamp: number
}

export default function SecureNotesPage() {
  const { t } = useLanguage()
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [password, setPassword] = useState("")
  const [isEncrypted, setIsEncrypted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("secure-notes")
    if (saved) {
      setNotes(JSON.parse(saved))
    }
  }, [])

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes)
    localStorage.setItem("secure-notes", JSON.stringify(updatedNotes))
  }

  const encryptContent = async (text: string, pass: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pass), { name: "PBKDF2" }, false, [
      "deriveKey",
    ])
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("b2torrent-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    )
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)
    return btoa(String.fromCharCode(...iv) + String.fromCharCode(...new Uint8Array(encrypted)))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t("error"), { description: t("titleRequired") })
      return
    }

    let finalContent = content
    if (isEncrypted && password) {
      finalContent = await encryptContent(content, password)
    }

    const note: Note = {
      id: currentNote?.id || Date.now().toString(),
      title,
      content: finalContent,
      encrypted: isEncrypted,
      timestamp: Date.now(),
    }

    const updatedNotes = currentNote ? notes.map((n) => (n.id === note.id ? note : n)) : [...notes, note]

    saveNotes(updatedNotes)
    toast.success(t("noteSaved"))
    resetForm()
  }

  const handleDelete = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id))
    toast.success(t("noteDeleted"))
  }

  const resetForm = () => {
    setCurrentNote(null)
    setTitle("")
    setContent("")
    setPassword("")
    setIsEncrypted(false)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          {t("secureNotesTitle")}
        </h1>
        <p className="text-muted-foreground">{t("secureNotesDesc")}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 border-yellow-500/20 bg-yellow-500/5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t("noteTitle")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("enterTitle")}
              />
            </div>

            <div>
              <Label htmlFor="content">{t("noteContent")}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("enterContent")}
                rows={10}
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant={isEncrypted ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEncrypted(!isEncrypted)}
              >
                {isEncrypted ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                {isEncrypted ? t("encrypted") : t("notEncrypted")}
              </Button>
            </div>

            {isEncrypted && (
              <div>
                <Label htmlFor="password">{t("encryptionPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("enterPassword")}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {t("saveNote")}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                {t("clear")}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t("savedNotes")}</h3>
            <Button size="sm" variant="outline" onClick={resetForm}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-auto">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  setCurrentNote(note)
                  setTitle(note.title)
                  setContent(note.content)
                  setIsEncrypted(note.encrypted)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate flex items-center gap-2">
                      {note.encrypted && <Lock className="h-3 w-3" />}
                      {note.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleDateString()}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(note.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
