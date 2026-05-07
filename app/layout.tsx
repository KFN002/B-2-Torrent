import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"
import { SecurityStatusTicker } from "@/components/security-status-ticker"
import { SecurityAlertSystem } from "@/components/security-alert-system"
import { FirstRunWizard } from "@/components/first-run-wizard"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "B-2-Torrent - Privacy-First BitTorrent Client",
  description:
    "All-in-one secure platform for torrenting, encryption, compression, and media playback with multi-proxy protection",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
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
        <Analytics />
      </body>
    </html>
  )
}
