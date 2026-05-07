"use client"

import { useEffect, useState } from "react"
import { Plane, Server, Monitor, Package, Database, HardDrive } from "lucide-react"

interface AnimatedElement {
  id: number
  type: "plane" | "data" | "pc" | "server"
  delay: number
  animation: string
  color: string
  size: string
  duration: number
}

export function FlyingPlanes() {
  const [elements, setElements] = useState<AnimatedElement[]>([])

  useEffect(() => {
    const animations = ["animate-fly-across-3d", "animate-fly-diagonal-3d", "animate-fly-up-3d", "animate-orbit-3d"]
    const colors = [
      "text-green-500/40",
      "text-blue-500/40",
      "text-purple-500/40",
      "text-cyan-500/40",
      "text-pink-500/40",
    ]
    const types: Array<"plane" | "data" | "pc" | "server"> = ["plane", "data", "pc", "server"]
    const sizes = ["h-6 w-6", "h-8 w-8", "h-10 w-10", "h-12 w-12"]

    const elementConfigs = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      type: types[Math.floor(Math.random() * types.length)],
      delay: Math.random() * 15,
      animation: animations[Math.floor(Math.random() * animations.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      duration: 12 + Math.random() * 10,
    }))
    setElements(elementConfigs)
  }, [])

  const getIcon = (type: string, className: string) => {
    switch (type) {
      case "plane":
        return <Plane className={className} />
      case "data":
        return Math.random() > 0.5 ? <Package className={className} /> : <Database className={className} />
      case "pc":
        return Math.random() > 0.5 ? <Monitor className={className} /> : <HardDrive className={className} />
      case "server":
        return <Server className={className} />
      default:
        return <Plane className={className} />
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ perspective: "1000px" }}>
      {elements.map((element) => (
        <div
          key={element.id}
          className={`absolute ${element.animation} ${element.color}`}
          style={{
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
            top: `${Math.random() * 90}%`,
            left:
              element.animation.includes("up") || element.animation.includes("orbit") ? `${Math.random() * 100}%` : "0",
            transformStyle: "preserve-3d",
          }}
        >
          {getIcon(element.type, element.size)}
        </div>
      ))}
    </div>
  )
}
