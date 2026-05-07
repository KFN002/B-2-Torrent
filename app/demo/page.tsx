"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PlayCircle, Database, Shield, Zap } from "lucide-react"

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const startDemo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Demo Mode Activated",
          description: "Fake data generated successfully. Explore the app!",
        })

        // Redirect to torrents page
        setTimeout(() => {
          window.location.href = "/torrents"
        }, 1500)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start demo mode.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fade-in-up">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Demo Mode</Badge>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Test B-2-Torrent
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience all features with fake data. No real torrents, no risks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-900/50 border-blue-500/20 hover:border-blue-500/40 transition-all">
            <CardHeader>
              <Database className="w-12 h-12 text-blue-400 mb-2" />
              <CardTitle className="text-blue-400">Fake Data</CardTitle>
              <CardDescription>Pre-populated with sample torrents to explore</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900/50 border-green-500/20 hover:border-green-500/40 transition-all">
            <CardHeader>
              <Shield className="w-12 h-12 text-green-400 mb-2" />
              <CardTitle className="text-green-400">Safe Testing</CardTitle>
              <CardDescription>No real connections or downloads</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900/50 border-purple-500/20 hover:border-purple-500/40 transition-all">
            <CardHeader>
              <Zap className="w-12 h-12 text-purple-400 mb-2" />
              <CardTitle className="text-purple-400">Full Features</CardTitle>
              <CardDescription>Access all tools and settings</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900/50 border-pink-500/20 hover:border-pink-500/40 transition-all">
            <CardHeader>
              <PlayCircle className="w-12 h-12 text-pink-400 mb-2" />
              <CardTitle className="text-pink-400">Quick Start</CardTitle>
              <CardDescription>One click to begin exploring</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={startDemo}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-12 py-6 text-lg rounded-full shadow-lg hover:shadow-2xl transition-all"
          >
            {isLoading ? "Loading..." : "Start Demo Mode"}
          </Button>
        </div>
      </div>
    </div>
  )
}
