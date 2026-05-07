"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  ArrowRight,
  Shield,
  Lock,
  ShieldCheck,
  ShieldBan,
  Activity,
  Zap,
  Eye,
  Network,
  Info,
  Laptop,
  ServerCog,
  HardDriveDownload,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"
import { BrandMark } from "@/components/brand-mark"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const toneStyles = {
  green: {
    iconWrap: "bg-green-500/10 group-hover:bg-green-500/20 border-green-500/20",
    icon: "text-green-400",
    link: "text-green-400 group-hover:text-green-300",
  },
  blue: {
    iconWrap: "bg-blue-500/10 group-hover:bg-blue-500/20 border-blue-500/20",
    icon: "text-blue-400",
    link: "text-blue-400 group-hover:text-blue-300",
  },
  emerald: {
    iconWrap: "bg-emerald-500/10 group-hover:bg-emerald-500/20 border-emerald-500/20",
    icon: "text-emerald-400",
    link: "text-emerald-400 group-hover:text-emerald-300",
  },
  purple: {
    iconWrap: "bg-purple-500/10 group-hover:bg-purple-500/20 border-purple-500/20",
    icon: "text-purple-400",
    link: "text-purple-400 group-hover:text-purple-300",
  },
  pink: {
    iconWrap: "bg-pink-500/10 group-hover:bg-pink-500/20 border-pink-500/20",
    icon: "text-pink-400",
    link: "text-pink-400 group-hover:text-pink-300",
  },
  orange: {
    iconWrap: "bg-orange-500/10 group-hover:bg-orange-500/20 border-orange-500/20",
    icon: "text-orange-400",
    link: "text-orange-400 group-hover:text-orange-300",
  },
  cyan: {
    iconWrap: "bg-cyan-500/10 group-hover:bg-cyan-500/20 border-cyan-500/20",
    icon: "text-cyan-400",
    link: "text-cyan-400 group-hover:text-cyan-300",
  },
} as const

type Tone = keyof typeof toneStyles

type Metric = {
  label: string
  value: string
  icon: LucideIcon
  tone: Tone
  info: string
}

type Feature = {
  icon: LucideIcon
  title: string
  description: string
  tone: Tone
  href: string
}

const stats: Metric[] = [
  {
    label: "Install Target",
    value: "Laptop + PC",
    icon: Laptop,
    tone: "green",
    info: "Designed to run on your own computer through localhost, not as a cloud-hosted account.",
  },
  {
    label: "Hosting Mode",
    value: "Localhost",
    icon: ServerCog,
    tone: "blue",
    info: "The bundled stack runs locally with Docker, Nginx, the web UI, and the backend API on your machine.",
  },
  {
    label: "Protected Traffic",
    value: "VPN/Tor",
    icon: ShieldCheck,
    tone: "emerald",
    info: "Privacy controls are managed from your local app with VPN, Tor, DNS protection, and kill switch options.",
  },
  {
    label: "Data Policy",
    value: "No Cloud",
    icon: ShieldBan,
    tone: "purple",
    info: "Downloads, settings, and tools stay inside your self-hosted desktop environment by default.",
  },
]

const features: Feature[] = [
  {
    icon: HardDriveDownload,
    title: "Self-Hosted Torrenting",
    description: "Manage downloads from your local web UI with desktop-friendly controls and private storage.",
    tone: "green",
    href: "/torrents",
  },
  {
    icon: Network,
    title: "VPN & Tor Network",
    description: "Route traffic through privacy layers that you configure from the laptop or PC running the app.",
    tone: "blue",
    href: "/network",
  },
  {
    icon: Lock,
    title: "Local Encryption",
    description: "Encrypt files and folders on your own machine with configurable algorithms.",
    tone: "purple",
    href: "/encryption",
  },
  {
    icon: Eye,
    title: "Device Intelligence",
    description: "Review local system and connection status without default third-party lookups.",
    tone: "pink",
    href: "/ip-dashboard",
  },
  {
    icon: Zap,
    title: "Desktop Utilities",
    description: "Use security, file, media, and developer tools from the same self-hosted app.",
    tone: "orange",
    href: "/mini-apps",
  },
  {
    icon: Activity,
    title: "Secure Browser",
    description: "Use the standalone browser companion for private desktop browsing workflows.",
    tone: "cyan",
    href: "/about#browser",
  },
]

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
      </div>

      <section className="relative overflow-hidden">
        <div className="container relative px-4 pt-24 pb-20 md:pt-32 md:pb-24 xl:pt-40 xl:pb-32 2xl:pt-48 2xl:pb-40">
          <div className="mx-auto max-w-5xl xl:max-w-6xl 2xl:max-w-7xl text-center space-y-8 xl:space-y-12">
            <div className="flex justify-center mb-8 xl:mb-12 animate-scale-in">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-all duration-700 animate-rotate-gradient" />
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-60 group-hover:opacity-80 animate-glow-pulse" />
                      <BrandMark
                        className="relative h-32 w-32 md:h-40 md:w-40 xl:h-56 xl:w-56 2xl:h-64 2xl:w-64 rounded-3xl glass-card-transparent ring-2 ring-green-500/30 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:ring-4 group-hover:ring-green-500/50"
                        iconClassName="h-12 w-12 md:h-16 md:w-16 xl:h-24 xl:w-24"
                        textClassName="text-2xl md:text-3xl xl:text-5xl"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>B-2-Torrent - self-hosted privacy on your computer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-center animate-fade-in">
              <Badge
                variant="outline"
                className="px-4 py-2 xl:px-6 xl:py-3 text-sm xl:text-base font-semibold border-green-500/40 text-green-300 glass-card-transparent hover:glass-card transition-all security-pulse"
              >
                <Shield className="h-4 w-4 xl:h-5 xl:w-5 mr-2" />
                Self-Hosted for Laptops and PCs
              </Badge>
            </div>

            <div className="space-y-4 xl:space-y-6 animate-slide-up">
              <h1 className="text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight text-balance text-desktop-hero text-gradient-rainbow">
                {t("heroTitle")}
              </h1>
              <p className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl text-muted-foreground max-w-2xl xl:max-w-4xl mx-auto text-balance text-desktop-body text-fade">
                {t("heroDescription")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 xl:gap-6 justify-center items-center pt-4 xl:pt-8 animate-slide-down">
              <Button
                asChild
                size="lg"
                className="gap-2 xl:gap-3 bg-green-600/90 hover:bg-green-700 xl:h-14 xl:px-8 xl:text-lg hover-lift shadow-lg glass-card backdrop-blur-sm"
              >
                <Link href="/torrents">
                  <Download className="h-5 w-5 xl:h-6 xl:w-6" />
                  Open Local App
                  <ArrowRight className="h-4 w-4 xl:h-5 xl:w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 xl:gap-3 glass-card-transparent xl:h-14 xl:px-8 xl:text-lg hover-lift border-white/10 hover:border-white/20 bg-transparent"
              >
                <Link href="/features">
                  <Activity className="h-5 w-5 xl:h-6 xl:w-6" />
                  Explore Features
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 xl:gap-3 glass-card-transparent xl:h-14 xl:px-8 xl:text-lg hover-lift border-green-500/30 hover:border-green-500/50 bg-transparent"
              >
                <Link href="/security">
                  <Shield className="h-5 w-5 xl:h-6 xl:w-6" />
                  Security Center
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 pb-16 xl:pb-24 animate-fade-in relative">
        <div className="mx-auto max-w-6xl xl:max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
            {stats.map((stat, index) => {
              const tone = toneStyles[stat.tone]

              return (
                <TooltipProvider key={stat.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card
                        className="border-2 border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg card-hover-effect animate-card-entrance glass-card-transparent relative overflow-hidden group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-green-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
                        <CardContent className="p-6 xl:p-8 text-center space-y-3 xl:space-y-4 relative">
                          <div className="flex justify-center">
                            <div
                              className={`p-3 xl:p-4 rounded-lg border ${tone.iconWrap} transition-all duration-300 shadow-lg glass-card`}
                            >
                              <stat.icon className={`h-6 w-6 xl:h-8 xl:w-8 ${tone.icon}`} />
                            </div>
                          </div>
                          <div className="text-2xl md:text-3xl xl:text-4xl font-bold text-gradient-rainbow">
                            {stat.value}
                          </div>
                          <div className="text-sm xl:text-base text-muted-foreground">{stat.label}</div>
                          <Info className="h-4 w-4 text-muted-foreground/50 absolute top-2 right-2" />
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="glass-card max-w-xs">
                      <p>{stat.info}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container px-4 pb-20 xl:pb-32 relative">
        <div className="mx-auto max-w-6xl xl:max-w-7xl space-y-8">
          <div className="text-center space-y-3 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold text-gradient-rainbow">Local Privacy Workspace</h2>
            <p className="text-lg xl:text-xl text-muted-foreground max-w-2xl mx-auto text-fade">
              Everything runs from your own computer, tuned for desktop screens and private localhost access.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {features.map((feature, index) => {
              const tone = toneStyles[feature.tone]

              return (
                <Link key={feature.title} href={feature.href} className="group">
                  <Card
                    className="border-2 border-white/5 hover:border-primary/50 transition-all duration-300 card-hover-effect glass-card-transparent h-full"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-8 xl:p-10 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-4 rounded-lg border ${tone.iconWrap} transition-all shadow-lg glass-card`}>
                          <feature.icon className={`h-8 w-8 xl:h-10 xl:w-10 ${tone.icon}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl xl:text-2xl font-bold mb-2">{feature.title}</h3>
                          <p className="text-sm xl:text-base text-muted-foreground text-fade">{feature.description}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 ${tone.link} font-semibold`}>
                        Learn More
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
