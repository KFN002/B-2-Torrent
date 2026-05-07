"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Lock,
  Eye,
  Download,
  FileArchive,
  Music,
  Video,
  Globe,
  Activity,
  Code,
  Fingerprint,
  Ban,
  Wifi,
  Share2,
  Key,
  Magnet,
  Clock,
  ShieldCheck,
  FileCode,
  ImageIcon,
  Palette,
  Ruler,
  Hash,
  Scissors,
  FolderTree,
  LinkIcon,
  FileText,
  QrCode,
  GitCompare,
  Clipboard,
  ArrowRight,
} from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"

export default function FeaturesPage() {
  const { t } = useLanguage()

  const features = [
    {
      category: "Security & Privacy",
      icon: Shield,
      gradient: "from-green-500 to-emerald-600",
      items: [
        {
          title: "AES-256-GCM Encryption",
          desc: "Military-grade file encryption with perfect forward secrecy",
          icon: Lock,
          href: "/tools/encryption",
        },
        {
          title: "Zero-Logs Policy",
          desc: "No activity tracking or data retention whatsoever",
          icon: Eye,
          href: "/security",
        },
        { title: "Network Kill Switch", desc: "Auto-disconnect on VPN/Tor failure", icon: Ban, href: "/security" },
        {
          title: "IP & DNS Leak Protection",
          desc: "Real-time monitoring for privacy breaches",
          icon: Wifi,
          href: "/tools/leak-checker",
        },
        { title: "Traffic Obfuscation", desc: "Evade DPI and ISP throttling", icon: Fingerprint, href: "/security" },
        { title: "Steganography", desc: "Hide secret data inside images", icon: Eye, href: "/tools/steganography" },
        {
          title: "Secure File Sharing",
          desc: "Encrypted P2P with access control",
          icon: Share2,
          href: "/tools/secure-share",
        },
        {
          title: "Password Generator",
          desc: "Create strong, random passwords",
          icon: Key,
          href: "/tools/password-generator",
        },
      ],
    },
    {
      category: "Torrent Management",
      icon: Download,
      gradient: "from-blue-500 to-cyan-600",
      items: [
        {
          title: "Multi-Proxy Routing",
          desc: "Chain through Tor, VPN, or custom proxies",
          icon: Globe,
          href: "/torrents",
        },
        {
          title: "Bandwidth Scheduling",
          desc: "Control speed limits by time of day",
          icon: Clock,
          href: "/tools/bandwidth-scheduler",
        },
        { title: "Force Encryption", desc: "Reject all unencrypted peer connections", icon: Lock, href: "/torrents" },
        {
          title: "Magnet Link Parser",
          desc: "Analyze and extract torrent metadata",
          icon: Magnet,
          href: "/tools/magnet-parser",
        },
        {
          title: "Peer Verification",
          desc: "Block malicious peers automatically",
          icon: ShieldCheck,
          href: "/torrents",
        },
        {
          title: "Torrent Health Monitor",
          desc: "Real-time seeders & leechers tracking",
          icon: Activity,
          href: "/tools/torrent-health",
        },
      ],
    },
    {
      category: "File Tools",
      icon: FileArchive,
      gradient: "from-purple-500 to-violet-600",
      items: [
        {
          title: "6 Compression Formats",
          desc: "GZIP, Deflate, Brotli, LZMA, Zstandard, LZ4",
          icon: FileArchive,
          href: "/tools/compression",
        },
        {
          title: "File Splitting",
          desc: "Split large files and merge them back",
          icon: Scissors,
          href: "/tools/file-splitter",
        },
        {
          title: "Hash Verification",
          desc: "SHA-256, SHA-512, MD5, CRC32",
          icon: Fingerprint,
          href: "/tools/hash-generator",
        },
        {
          title: "Directory Tree Viewer",
          desc: "Visualize folder structures",
          icon: FolderTree,
          href: "/tools/directory-tree",
        },
        {
          title: "Binary Viewer",
          desc: "Hex, binary, and text file inspection",
          icon: FileCode,
          href: "/tools/binary-viewer",
        },
        { title: "Image Converter", desc: "Convert between formats", icon: ImageIcon, href: "/tools/image-converter" },
      ],
    },
    {
      category: "Media Players",
      icon: Video,
      gradient: "from-pink-500 to-rose-600",
      items: [
        {
          title: "Video Player",
          desc: "Full subtitle support (SRT, VTT) with editor",
          icon: Video,
          href: "/player/video",
        },
        { title: "Audio Player", desc: "Lyrics support (LRC, SRT) with manager", icon: Music, href: "/player/audio" },
        { title: "Image Viewer", desc: "Zoom, rotate, and edit images", icon: ImageIcon, href: "/tools/image-viewer" },
      ],
    },
    {
      category: "Developer Tools",
      icon: Code,
      gradient: "from-cyan-500 to-blue-600",
      items: [
        {
          title: "Base64 Encoder/Decoder",
          desc: "Encode and decode Base64 strings",
          icon: FileCode,
          href: "/tools/base64",
        },
        {
          title: "JSON Formatter",
          desc: "Format, validate, and beautify JSON",
          icon: FileText,
          href: "/tools/json-formatter",
        },
        { title: "Regex Tester", desc: "Test and debug regex patterns", icon: Code, href: "/tools/regex-tester" },
        {
          title: "Text Diff Tool",
          desc: "Compare text with highlighted differences",
          icon: GitCompare,
          href: "/tools/text-diff",
        },
        { title: "QR Code Generator", desc: "Create QR codes instantly", icon: QrCode, href: "/tools/qr-generator" },
        { title: "Color Picker", desc: "HEX, RGB, HSL color converter", icon: Palette, href: "/tools/color-picker" },
        {
          title: "Unit Converter",
          desc: "Length, weight, temperature, data",
          icon: Ruler,
          href: "/tools/unit-converter",
        },
        { title: "UUID Generator", desc: "Generate unique identifiers", icon: Hash, href: "/tools/uuid-generator" },
        { title: "URL Shortener", desc: "Create short URLs", icon: LinkIcon, href: "/tools/url-shortener" },
        {
          title: "Markdown Editor",
          desc: "Live preview markdown editor",
          icon: FileText,
          href: "/tools/markdown-editor",
        },
        { title: "Clipboard Manager", desc: "Track copy history", icon: Clipboard, href: "/tools/clipboard-manager" },
      ],
    },
    {
      category: "Network Tools",
      icon: Globe,
      gradient: "from-orange-500 to-amber-600",
      items: [
        { title: "Network Monitor", desc: "Real-time activity tracking", icon: Activity, href: "/monitor" },
        { title: "Port Scanner", desc: "Scan for open network ports", icon: Wifi, href: "/tools/port-scanner" },
        { title: "WiFi Analyzer", desc: "Analyze nearby wireless networks", icon: Wifi, href: "/tools/wifi-analyzer" },
        {
          title: "Certificate Viewer",
          desc: "SSL/TLS certificate inspection",
          icon: ShieldCheck,
          href: "/tools/certificate-viewer",
        },
        {
          title: "Bandwidth Monitor",
          desc: "Track real-time network usage",
          icon: Activity,
          href: "/tools/bandwidth-monitor",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="background-orb background-orb-1 animate-float" />
        <div className="background-orb background-orb-2 animate-float" style={{ animationDelay: "2s" }} />
        <div className="background-orb background-orb-3 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container relative px-4 py-16 xl:py-24">
        <div className="text-center space-y-6 mb-16 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-30 animate-glow-pulse" />
              <BrandMark
                className="relative h-24 w-24 xl:h-32 xl:w-32 rounded-3xl bg-muted ring-2 ring-green-500/30 glass-card"
                iconClassName="h-10 w-10 xl:h-14 xl:w-14"
                textClassName="text-xl xl:text-2xl"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl xl:text-7xl font-bold text-gradient-rainbow">Complete Feature Suite</h1>
          <p className="text-xl xl:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance">
            60+ Tools & utilities for secure file sharing, encryption, media playback, and developer productivity
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button asChild variant="outline" size="lg" className="gap-2 hover-lift bg-transparent">
              <Link href="/torrents">
                <Download className="h-5 w-5" />
                Start Downloading
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 hover-lift bg-transparent">
              <Link href="/security">
                <Shield className="h-5 w-5" />
                Security Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-16 xl:space-y-20">
          {features.map((category, catIndex) => (
            <div
              key={category.category}
              className="animate-fade-in-up"
              style={{ animationDelay: `${catIndex * 150}ms` }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-6 xl:mb-8">
                <div className={`inline-flex p-3 xl:p-4 rounded-2xl bg-gradient-to-br ${category.gradient} shadow-lg`}>
                  <category.icon className="h-6 w-6 xl:h-8 xl:w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl xl:text-3xl font-bold">{category.category}</h2>
                  <Badge variant="outline" className="mt-1">
                    {category.items.length} Features
                  </Badge>
                </div>
              </div>

              {/* Feature Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                {category.items.map((item, itemIndex) => (
                  <Link key={item.title} href={item.href} className="group">
                    <Card
                      className="border-2 hover:border-primary/50 transition-all hover:-translate-y-2 hover:shadow-2xl glass-card animate-card-entrance h-full"
                      style={{ animationDelay: `${itemIndex * 50}ms` }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          Open Tool
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 xl:mt-32 text-center animate-fade-in-up">
          <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-blue-500/5 glass-card">
            <CardContent className="p-12 xl:p-16">
              <Shield className="h-16 w-16 xl:h-20 xl:w-20 mx-auto mb-6 text-green-500" />
              <h3 className="text-3xl xl:text-4xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Download torrents with military-grade security, complete anonymity, and zero logs.
              </p>
              <Button asChild size="lg" className="gap-2 bg-green-600 hover:bg-green-700 hover-lift shadow-lg">
                <Link href="/torrents">
                  <Download className="h-5 w-5" />
                  Start Downloading Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
