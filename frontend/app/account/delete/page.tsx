"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const confirmation = "DELETE MY LOCAL IDENTITY"

export default function DeleteAccountPage() {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const remove = async () => {
    setBusy(true)
    const response = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: value }) })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      setBusy(false)
      return toast.error(payload?.error || "Deletion failed")
    }
    await createClient().auth.signOut({ scope: "local" }).catch(() => {})
		localStorage.clear()
		sessionStorage.clear()
		if ("caches" in window) {
			await Promise.all((await caches.keys()).map((key) => caches.delete(key)))
		}
		if (typeof indexedDB.databases === "function") {
			for (const database of await indexedDB.databases()) {
				if (database.name) indexedDB.deleteDatabase(database.name)
			}
		}
    toast.success("Identity and Supabase data permanently deleted")
    router.replace("/auth")
  }

  return (
    <div className="container max-w-2xl px-4 py-16">
      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-3xl">Full identity deletion</CardTitle><CardDescription>Irreversibly remove the current Auth user, private Storage objects, and database rows that cascade from the user ID.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>This cannot be undone</AlertTitle><AlertDescription>This does not overwrite SSD blocks or delete unrelated torrent downloads. Use full-disk encryption and the device cleanup controls for those boundaries.</AlertDescription></Alert>
          <div className="space-y-2"><p className="text-sm">Type <span className="font-mono font-semibold">{confirmation}</span></p><Input value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" spellCheck={false} /></div>
          <Button variant="destructive" className="w-full" disabled={busy || value !== confirmation} onClick={() => void remove()}><Trash2 className="mr-2 h-4 w-4" /> {busy ? "Deleting…" : "Permanently delete identity and data"}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
