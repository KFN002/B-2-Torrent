"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Eye, Zap, Globe, Users, Code, Heart } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

export default function AboutPage() {
  const { t } = useLanguage()

  const values = [
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your privacy is our top priority. We implement military-grade encryption and zero-logs policy.",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: Lock,
      title: "Security by Design",
      description: "Built from the ground up with security in mind. Every feature includes protection mechanisms.",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: Eye,
      title: "Complete Anonymity",
      description: "Multi-layer protection with Tor, VPN, and traffic obfuscation to keep you anonymous.",
      gradient: "from-purple-500 to-violet-600",
    },
    {
      icon: Zap,
      title: "High Performance",
      description: "Optimized for speed without compromising security. Fast downloads with maximum privacy.",
      gradient: "from-orange-500 to-amber-600",
    },
  ]

  const features = [
    { icon: Globe, label: "40+ Tools", color: "text-blue-500" },
    { icon: Users, label: "Open Source", color: "text-green-500" },
    { icon: Code, label: "Modern Stack", color: "text-purple-500" },
    { icon: Heart, label: "Made with Care", color: "text-pink-500" },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="background-orb background-orb-1 animate-float" />
        <div className="background-orb background-orb-2 animate-float" style={{ animationDelay: "2s" }} />
        <div className="background-orb background-orb-3 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container relative px-4 py-16 xl:py-24">
        <div className="mx-auto max-w-4xl text-center space-y-6 animate-fade-in-up mb-16">
          <Badge variant="outline" className="px-4 py-2 text-sm border-green-500/40 text-green-600 bg-green-500/5">
            About B-2-Torrent
          </Badge>
          <h1 className="text-4xl md:text-6xl xl:text-7xl font-bold text-gradient-rainbow">
            Privacy-First File Sharing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            B-2-Torrent is a comprehensive privacy-focused BitTorrent client with advanced security features, encryption
            tools, and a complete suite of utilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {values.map((value, index) => (
            <Card
              key={value.title}
              className="border-2 hover:border-primary/50 transition-all duration-300 glass-card animate-card-entrance group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8">
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${value.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {features.map((feature, index) => (
            <Card
              key={feature.label}
              className="glass-card border-2 hover:border-primary/50 transition-all hover:-translate-y-2 animate-card-entrance"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 text-center">
                <feature.icon className={`h-10 w-10 ${feature.color} mx-auto mb-3`} />
                <p className="font-semibold">{feature.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 glass-card max-w-3xl mx-auto animate-fade-in">
          <CardContent className="p-10 text-center space-y-4">
            <h2 className="text-3xl font-bold text-gradient-blue">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe everyone deserves complete privacy and security when sharing files online. B-2-Torrent combines
              cutting-edge encryption, multi-layer anonymity, and powerful tools to ensure your data stays private and
              your identity remains protected.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
