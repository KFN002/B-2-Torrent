import type React from "react"
import type { Metadata } from "next"
import { LanguageProvider } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"
import { SecurityStatusTicker } from "@/components/security-status-ticker"
import { SecurityAlertSystem } from "@/components/security-alert-system"
import { FirstRunWizard } from "@/components/first-run-wizard"
import "./globals.css"

export const metadata: Metadata = {
  title: "B-2-Torrent - Self-Hosted BitTorrent for Laptops and PCs",
  description:
    "Self-hosted localhost app for torrenting, encryption, compression, and media playback on personal laptops and PCs with multi-proxy protection.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <LanguageProvider>
          <Navbar />
          <SecurityAlertSystem />
          <FirstRunWizard />
          <main id="main-content" className="pb-10" tabIndex={-1}>
            {children}
          </main>
          <SecurityStatusTicker />
          <Toaster position="top-right" richColors />
        </LanguageProvider>
      </body>
    </html>
  )
}
