"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Lock,
  FileArchive,
  Music,
  Video,
  Code,
  Eye,
  Share2,
  Key,
  Magnet,
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
  FileCode,
  Clock,
  Activity,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function MiniAppsPage() {
  const miniApps = [
    {
      category: "Security Tools",
      gradient: "from-green-500 to-emerald-600",
      apps: [
        { title: "File Encryption", desc: "AES-256-GCM encryption", icon: Lock, href: "/tools/encryption" },
        { title: "Secure File Sharing", desc: "P2P encrypted sharing", icon: Share2, href: "/tools/secure-share" },
        { title: "Password Generator", desc: "Strong passwords", icon: Key, href: "/tools/password-generator" },
        { title: "Steganography", desc: "Hide data in images", icon: Eye, href: "/tools/steganography" },
        { title: "Secure Notes", desc: "Encrypted notepad", icon: FileText, href: "/tools/secure-notes" },
      ],
    },
    {
      category: "File Tools",
      gradient: "from-purple-500 to-violet-600",
      apps: [
        { title: "Compression Tool", desc: "6 formats support", icon: FileArchive, href: "/tools/compression" },
        { title: "File Splitter", desc: "Split & merge files", icon: Scissors, href: "/tools/file-splitter" },
        { title: "Hash Generator", desc: "Verify file integrity", icon: Hash, href: "/tools/hash-generator" },
        { title: "Binary Viewer", desc: "Hex/binary inspector", icon: FileCode, href: "/tools/binary-viewer" },
        { title: "Image Converter", desc: "Format conversion", icon: ImageIcon, href: "/tools/image-converter" },
        { title: "Directory Tree", desc: "Folder visualizer", icon: FolderTree, href: "/tools/directory-tree" },
      ],
    },
    {
      category: "Media Players",
      gradient: "from-pink-500 to-rose-600",
      apps: [
        { title: "Video Player", desc: "Subtitle support", icon: Video, href: "/player/video" },
        { title: "Audio Player", desc: "Lyrics manager", icon: Music, href: "/player/audio" },
        { title: "Image Viewer", desc: "Full-featured viewer", icon: ImageIcon, href: "/tools/image-viewer" },
      ],
    },
    {
      category: "Developer Tools",
      gradient: "from-cyan-500 to-blue-600",
      apps: [
        { title: "Base64 Tool", desc: "Encode/decode", icon: FileCode, href: "/tools/base64" },
        { title: "JSON Formatter", desc: "Format & validate", icon: FileText, href: "/tools/json-formatter" },
        { title: "Regex Tester", desc: "Test patterns", icon: Code, href: "/tools/regex-tester" },
        { title: "Text Diff", desc: "Compare text", icon: GitCompare, href: "/tools/text-diff" },
        { title: "QR Generator", desc: "Create QR codes", icon: QrCode, href: "/tools/qr-generator" },
        { title: "Color Picker", desc: "Color converter", icon: Palette, href: "/tools/color-picker" },
        { title: "Unit Converter", desc: "All units", icon: Ruler, href: "/tools/unit-converter" },
        { title: "UUID Generator", desc: "Unique IDs", icon: Hash, href: "/tools/uuid-generator" },
        { title: "URL Shortener", desc: "Shorten links", icon: LinkIcon, href: "/tools/url-shortener" },
        { title: "Markdown Editor", desc: "Live preview", icon: FileText, href: "/tools/markdown-editor" },
        { title: "Clipboard Manager", desc: "History tracking", icon: Clipboard, href: "/tools/clipboard-manager" },
        { title: "Timestamp Converter", desc: "Convert formats", icon: Clock, href: "/tools/timestamp-converter" },
      ],
    },
    {
      category: "Network Tools",
      gradient: "from-orange-500 to-amber-600",
      apps: [
        { title: "Magnet Parser", desc: "Analyze torrents", icon: Magnet, href: "/tools/magnet-parser" },
        { title: "Bandwidth Monitor", desc: "Track usage", icon: Activity, href: "/tools/bandwidth-monitor" },
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl blur-2xl opacity-30 animate-glow-pulse" />
              <div className="relative flex h-24 w-24 xl:h-32 xl:w-32 items-center justify-center rounded-3xl bg-muted ring-2 ring-purple-500/30 glass-card">
                <Image src="/logo.png" alt="B-2-Torrent" width={128} height={128} className="object-contain p-3" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl xl:text-7xl font-bold text-gradient-rainbow">Mini Apps Collection</h1>
          <p className="text-xl xl:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance">
            40+ Functional tools for encryption, file management, development, and media
          </p>
        </div>

        <div className="space-y-16 xl:space-y-20">
          {miniApps.map((category, catIndex) => (
            <div
              key={category.category}
              className="animate-fade-in-up"
              style={{ animationDelay: `${catIndex * 150}ms` }}
            >
              <div className="flex items-center gap-4 mb-6 xl:mb-8">
                <div className={`inline-flex p-3 xl:p-4 rounded-2xl bg-gradient-to-br ${category.gradient} shadow-lg`}>
                  <div className="h-6 w-6 xl:h-8 xl:w-8" />
                </div>
                <div>
                  <h2 className="text-2xl xl:text-3xl font-bold">{category.category}</h2>
                  <Badge variant="outline" className="mt-1">
                    {category.apps.length} Apps
                  </Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                {category.apps.map((app, appIndex) => (
                  <Link key={app.title} href={app.href} className="group">
                    <Card className="border-2 hover:border-primary/50 transition-all hover:-translate-y-2 hover:shadow-2xl glass-card animate-card-entrance h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                            <app.icon className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-base leading-tight">{app.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{app.desc}</p>
                        <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          Open App
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
      </div>
    </div>
  )
}
