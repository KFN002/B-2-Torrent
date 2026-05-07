"use client"

import { SecurityDashboard } from "@/components/security-dashboard"
import { SecurityMonitor } from "@/components/security-monitor"
import { Shield } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

export default function SecurityPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="background-orb background-orb-1 animate-float" />
        <div className="background-orb background-orb-2 animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="background-orb background-orb-3 animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-[1920px] animate-fade-in relative">
        <div className="mb-8 lg:mb-12 animate-fade-in-left">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 via-info/20 to-purple-500/20 backdrop-blur-sm border border-success/30 animate-pulse-subtle shadow-2xl security-glow">
              <Shield className="h-7 w-7 lg:h-8 lg:w-8 text-success" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gradient-rainbow">Security Center</h1>
              <p className="text-muted-foreground text-base lg:text-lg mt-1">
                Monitor and manage your security, privacy, and anonymity settings
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2 animate-fade-in-up">
            <SecurityDashboard />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <SecurityMonitor />
          </div>
        </div>
      </main>
    </div>
  )
}
