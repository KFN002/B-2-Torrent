"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { Fingerprint, Loader2, LogOut, ShieldCheck, Trash2, Vault } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AuthPage() {
  const configured = isSupabaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) return
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [configured])

  const signInAnonymously = async () => {
    setLoading(true)
    const { data, error } = await createClient().auth.signInAnonymously()
    setLoading(false)
    if (error) return toast.error(error.message)
    setUser(data.user)
    toast.success("Private local identity created")
  }

  const signOut = async () => {
    await createClient().auth.signOut({ scope: "local" })
    setUser(null)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,.12),transparent_38rem)]" />
      <Card className="relative mx-auto max-w-2xl border-white/10 bg-card/70 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-5">
          <Badge variant="outline" className="w-fit border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
            <Fingerprint className="mr-2 h-4 w-4" /> Local Supabase Auth
          </Badge>
          <div>
            <CardTitle className="text-3xl sm:text-4xl">Private device identity</CardTitle>
            <CardDescription className="mt-3 text-base leading-7">
              Anonymous sign-in creates a random user identifier in your self-hosted Supabase database. No email,
              phone number, social login, analytics, or cloud account is required.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!configured ? (
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Local Supabase setup required</AlertTitle>
              <AlertDescription>Configure the local URL and publishable key described in supabase/README.md.</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Verifying local session…</div>
          ) : user ? (
            <>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                <p className="text-sm text-muted-foreground">Anonymous identity</p>
                <p className="mt-1 font-mono text-sm">{user.id}</p>
                <p className="mt-3 text-xs text-muted-foreground">Created {new Date(user.created_at).toLocaleString()}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild className="h-11"><Link href="/vault"><Vault className="mr-2 h-4 w-4" /> Open private vault</Link></Button>
                <Button variant="outline" className="h-11" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Forget session on this device</Button>
              </div>
              <Button asChild variant="ghost" className="w-full text-destructive hover:text-destructive">
                <Link href="/account/delete"><Trash2 className="mr-2 h-4 w-4" /> Permanently delete identity and data</Link>
              </Button>
            </>
          ) : (
            <Button className="h-12 w-full bg-emerald-500 text-black hover:bg-emerald-400" onClick={signInAnonymously}>
              <Fingerprint className="mr-2 h-5 w-5" /> Create anonymous local identity
            </Button>
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            Authentication controls Supabase-backed database and Storage data. The core app remains bound to localhost;
            anonymity still depends on network routing, not on the account system.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
