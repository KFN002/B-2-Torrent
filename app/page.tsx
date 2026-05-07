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
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function LandingPage() {
  const { t } = useLanguage()

  const stats = [
    {
      label: "Security Score",
      value: "99%",
      icon: Shield,
      color: "green",
      info: "Real-time security score based on active protections and encryption strength",
    },
    {
      label: "Active Encryption",
      value: "AES-256",
      icon: Lock,
      color: "blue",
      info: "Military-grade AES-256-GCM encryption with perfect forward secrecy",
    },
    {
      label: "Protected Connections",
      value: "24/7",
      icon: ShieldCheck,
      color: "emerald",
      info: "Continuous monitoring and protection of all network connections",
    },
    {
      label: "Zero Logs",
      value: "Active",
      icon: ShieldBan,
      color: "purple",
      info: "No-logs policy with automatic data cleanup on exit",
    },
  ]

  const features = [
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "Multi-layer protection with kill switch, DNS leak protection, and traffic obfuscation",
      color: "green",
      href: "/security",
    },
    {
      icon: Network,
      title: "VPN & Tor Network",
      description: "Route traffic through VPN or Tor with system-wide proxy support",
      color: "blue",
      href: "/network",
    },
    {
      icon: Lock,
      title: "Advanced Encryption",
      description: "Encrypt files, folders, and drives with customizable algorithms",
      color: "purple",
      href: "/encryption",
    },
    {
      icon: Eye,
      title: "IP Intelligence",
      description: "Monitor your IP address, detect leaks, and view public activity",
      color: "pink",
      href: "/ip-dashboard",
    },
    {
      icon: Zap,
      title: "60+ Mini Apps",
      description: "Security tools, file utilities, media players, and developer tools",
      color: "orange",
      href: "/mini-apps",
    },
    {
      icon: Activity,
      title: "Secure Browser",
      description: "Standalone anonymous browser with ad blocking and anti-fingerprinting",
      color: "cyan",
      href: "/about#browser",
    },
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="background-orb background-orb-1 animate-float" />
        <div className="background-orb background-orb-2 animate-float" style={{ animationDelay: "2s" }} />
        <div className="background-orb background-orb-3 animate-float" style={{ animationDelay: "4s" }} />
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
                      <div className="relative flex h-32 w-32 md:h-40 md:w-40 xl:h-56 xl:w-56 2xl:h-64 2xl:w-64 items-center justify-center rounded-3xl overflow-hidden glass-card-transparent ring-2 ring-green-500/30 group-hover:ring-green-500/50 group-hover:ring-4 transition-all duration-500 shadow-2xl">
                        <Image
                          src="/logo.png"
                          alt="B-2-Torrent"
                          width={256}
                          height={256}
                          className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                          priority
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>B-2-Torrent - Your privacy fortress</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-center animate-fade-in">
              <Badge
                variant="outline"
                className="px-4 py-2 xl:px-6 xl:py-3 text-sm xl:text-base font-semibold border-green-500/40 text-green-600 dark:text-green-400 glass-card-transparent hover:glass-card transition-all security-pulse"
              >
                <Shield className="h-4 w-4 xl:h-5 xl:w-5 mr-2" />
                Military-Grade Security & Privacy
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
                  {t("getStarted")}
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
            {stats.map((stat, index) => (
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
                            className={`p-3 xl:p-4 rounded-xl bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/20 group-hover:from-${stat.color}-500/20 group-hover:to-${stat.color}-600/30 transition-all duration-300 shadow-lg glass-card`}
                          >
                            <stat.icon className={`h-6 w-6 xl:h-8 xl:w-8 text-${stat.color}-500`} />
                          </div>
                        </div>
                        <div className={`text-2xl md:text-3xl xl:text-4xl font-bold text-gradient-rainbow`}>
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
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 pb-20 xl:pb-32 relative">
        <div className="mx-auto max-w-6xl xl:max-w-7xl space-y-8">
          <div className="text-center space-y-3 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold text-gradient-rainbow">Complete Privacy Suite</h2>
            <p className="text-lg xl:text-xl text-muted-foreground max-w-2xl mx-auto text-fade">
              Everything you need for secure, anonymous file sharing and browsing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {features.map((feature, index) => (
              <Link key={feature.title} href={feature.href} className="group">
                <Card
                  className="border-2 border-white/5 hover:border-primary/50 transition-all duration-300 card-hover-effect glass-card-transparent h-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-8 xl:p-10 space-y-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-4 rounded-2xl bg-gradient-to-br from-${feature.color}-500/10 to-${feature.color}-600/20 group-hover:from-${feature.color}-500/20 group-hover:to-${feature.color}-600/30 transition-all shadow-lg glass-card`}
                      >
                        <feature.icon className={`h-8 w-8 xl:h-10 xl:w-10 text-${feature.color}-500`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl xl:text-2xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-sm xl:text-base text-muted-foreground text-fade">{feature.description}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 text-${feature.color}-500 font-semibold`}>
                      Learn More
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
