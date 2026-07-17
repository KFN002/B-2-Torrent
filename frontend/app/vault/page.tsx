"use client"

import { useEffect, useState } from "react"
import { Download, FileLock2, Loader2, RefreshCw, Trash2, Upload, Vault } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { toast } from "sonner"

type VaultObject = { name: string; id: string | null; created_at: string | null; metadata?: { size?: number } }
const bucket = "private-vault"
const maxFileBytes = 50 * 1024 * 1024

export default function VaultPage() {
  const configured = isSupabaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [files, setFiles] = useState<VaultObject[]>([])
  const [loading, setLoading] = useState(configured)
  const [busy, setBusy] = useState(false)

  const refresh = async (activeUser = user) => {
    if (!activeUser) return
    setLoading(true)
    const { data, error } = await createClient().storage.from(bucket).list(activeUser.id, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    setFiles((data ?? []) as VaultObject[])
  }

  useEffect(() => {
    if (!configured) return
    void createClient().auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) void refresh(data.user)
      else setLoading(false)
    })
  }, [configured])

  const upload = async (file: File | undefined) => {
    if (!file || !user) return
    if (file.size > maxFileBytes) return toast.error("Files are limited to 50 MiB")
    const safeName = file.name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "file"
    const objectPath = `${user.id}/${crypto.randomUUID()}-${safeName}`
    setBusy(true)
    const { error } = await createClient().storage.from(bucket).upload(objectPath, file, {
      cacheControl: "0",
      upsert: false,
      contentType: "application/octet-stream",
    })
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success("Stored in the private local vault")
    await refresh(user)
  }

  const download = async (name: string) => {
    if (!user) return
    const { data, error } = await createClient().storage.from(bucket).createSignedUrl(`${user.id}/${name}`, 30, { download: name })
    if (error) return toast.error(error.message)
    window.location.assign(data.signedUrl)
  }

  const remove = async (name: string) => {
    if (!user || !window.confirm(`Delete ${name} permanently from local storage?`)) return
    const { error } = await createClient().storage.from(bucket).remove([`${user.id}/${name}`])
    if (error) return toast.error(error.message)
    setFiles((current) => current.filter((file) => file.name !== name))
  }

  if (!configured) {
    return <div className="container max-w-2xl py-16"><Alert><Vault className="h-4 w-4" /><AlertTitle>Vault not configured</AlertTitle><AlertDescription>Set up self-hosted Supabase using supabase/README.md.</AlertDescription></Alert></div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.12),transparent_38rem)]" />
      <div className="relative mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="border-violet-400/30 bg-violet-400/10 text-violet-200"><FileLock2 className="mr-2 h-4 w-4" /> RLS-protected local storage</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Private vault</h1>
            <p className="mt-2 text-muted-foreground">Private bucket objects are scoped to your anonymous user ID.</p>
          </div>
          <Button variant="outline" onClick={() => void refresh()} disabled={!user || loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
        </header>

        {!user ? (
          <Alert><FileLock2 className="h-4 w-4" /><AlertTitle>Sign in first</AlertTitle><AlertDescription>Create an anonymous local identity on the Identity page before using Storage.</AlertDescription></Alert>
        ) : (
          <Card className="border-white/10 bg-card/70 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Encrypted transport, private access</CardTitle>
              <CardDescription>Files remain on the self-hosted Supabase Storage volume. At-rest encryption depends on your disk encryption.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-400/30 bg-violet-400/[0.04] p-8 text-center hover:bg-violet-400/[0.07]">
                {busy ? <Loader2 className="h-7 w-7 animate-spin text-violet-300" /> : <Upload className="h-7 w-7 text-violet-300" />}
                <span className="mt-3 font-medium">Choose a file to store locally</span>
                <span className="mt-1 text-xs text-muted-foreground">50 MiB maximum · stored as application/octet-stream</span>
                <Input className="sr-only" type="file" disabled={busy} onChange={(event) => void upload(event.target.files?.[0])} />
              </label>

              <div className="space-y-3">
                {loading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading private objects…</div> : files.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">No files stored for this identity.</div>
                ) : files.map((file) => (
                  <div key={file.name} className="flex items-center gap-3 rounded-xl border border-white/8 p-4">
                    <FileLock2 className="h-5 w-5 shrink-0 text-violet-300" />
                    <div className="min-w-0 flex-1"><p className="truncate font-mono text-sm">{file.name}</p><p className="text-xs text-muted-foreground">{file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(1)} KiB` : "Size unavailable"}</p></div>
                    <Button size="icon" variant="ghost" aria-label={`Download ${file.name}`} onClick={() => void download(file.name)}><Download className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" aria-label={`Delete ${file.name}`} onClick={() => void remove(file.name)}><Trash2 className="h-4 w-4" /></Button>
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
