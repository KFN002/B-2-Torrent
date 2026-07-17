"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, FileKey2, HardDrive, KeyRound, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const safeguards = [
  "Authenticated encryption detects tampering",
  "A fresh random salt and nonce for every file",
  "Encryption runs locally; files are not uploaded",
  "The password is never stored by the browser tool",
]

const algorithms = [
  { name: "AES-GCM", detail: "256-bit key · authenticated", recommended: true },
  { name: "AES-CBC", detail: "256-bit key · compatibility", recommended: false },
  { name: "AES-CTR", detail: "256-bit key · streaming", recommended: false },
]

export default function EncryptionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-[110px]" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
        <section className="mx-auto max-w-4xl space-y-6 text-center">
          <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-cyan-200">
            <ShieldCheck className="mr-2 h-4 w-4" /> Local encryption workspace
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Protect files without sending them anywhere.
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Use the browser-native encryption tool for real, local file encryption. The interface only reports work
            that the cryptographic operation actually completes.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-cyan-500 text-black hover:bg-cyan-400">
              <Link href="/tools/encryption">
                Open encryption tool <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 bg-background/30">
              <Link href="/device-security">Review local files</Link>
            </Button>
          </div>
        </section>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <Card className="border-white/10 bg-card/60 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                <FileKey2 className="h-6 w-6 text-cyan-300" />
              </div>
              <CardTitle className="text-2xl">What the local tool does</CardTitle>
              <CardDescription className="text-base">
                Select a file in your browser, derive a key from your password, encrypt it with Web Crypto, and save
                the resulting file yourself.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {safeguards.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                <p>Use a unique passphrase from a password manager. Losing it means the encrypted file cannot be recovered.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/60 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10">
                <LockKeyhole className="h-6 w-6 text-violet-300" />
              </div>
              <CardTitle className="text-2xl">Available modes</CardTitle>
              <CardDescription>Only implemented algorithms are shown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {algorithms.map((algorithm) => (
                <div key={algorithm.name} className="flex items-center justify-between rounded-xl border border-white/8 p-4">
                  <div>
                    <p className="font-medium">{algorithm.name}</p>
                    <p className="text-sm text-muted-foreground">{algorithm.detail}</p>
                  </div>
                  {algorithm.recommended && <Badge className="bg-emerald-500/15 text-emerald-300">Recommended</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-6 border-amber-400/20 bg-amber-400/[0.06] text-amber-50">
          <TriangleAlert className="h-4 w-4 text-amber-300" />
          <AlertTitle>Clear security boundary</AlertTitle>
          <AlertDescription className="text-amber-100/70">
            This tool encrypts individual files. It does not claim full-disk encryption, secure deletion, forward
            secrecy, or network anonymity. Use your operating system’s disk encryption for whole-device protection.
          </AlertDescription>
        </Alert>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [HardDrive, "No fake device status", "The app does not invent encrypted drives or files."],
            [ShieldCheck, "Authenticated mode", "AES-GCM is the recommended default."],
            [KeyRound, "Local key handling", "Passwords remain in the active browser session."],
          ].map(([Icon, title, description]) => {
            const ItemIcon = Icon as typeof HardDrive
            return (
              <div key={title as string} className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                <ItemIcon className="mb-4 h-5 w-5 text-cyan-300" />
                <p className="font-medium">{title as string}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description as string}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
