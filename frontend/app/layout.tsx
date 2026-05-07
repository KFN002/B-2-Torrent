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
        <LanguageProvider>
          <Navbar />
          <SecurityAlertSystem />
          <FirstRunWizard />
          <div className="pb-10">{children}</div>
          <SecurityStatusTicker />
          <Toaster position="top-right" richColors />
        </LanguageProvider>
      </body>
    </html>
  )
}
