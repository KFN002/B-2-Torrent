import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'Stealth Torrent - Anonymous & Secure',
  description: 'Privacy-focused torrent client with multi-hop proxy routing and zero logging',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body className="font-mono antialiased">{children}</body>
    </html>
  )
}
