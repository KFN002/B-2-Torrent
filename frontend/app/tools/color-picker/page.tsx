"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n"
import { Palette, Copy } from "lucide-react"
import { toast } from "sonner"

export default function ColorPickerPage() {
  const { t } = useLanguage()
  const [color, setColor] = useState("#3b82f6")

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
      : ""
  }

  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return ""
    const r = Number.parseInt(result[1], 16) / 255
    const g = Number.parseInt(result[2], 16) / 255
    const b = Number.parseInt(result[3], 16) / 255
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
  }

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Color Picker</h1>
        <p className="text-muted-foreground">Pick colors and get HEX, RGB, HSL values</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Selection
          </CardTitle>
          <CardDescription>Select a color and copy its values</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-20 w-20 rounded-lg cursor-pointer border-2 border-border"
            />
            <div className="flex-1 space-y-2">
              <Label>Current Color</Label>
              <div className="h-20 rounded-lg border-2 border-border" style={{ backgroundColor: color }} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={color.toUpperCase()} readOnly />
              <Button onClick={() => copyValue(color)} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input value={hexToRgb(color)} readOnly />
              <Button onClick={() => copyValue(hexToRgb(color))} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input value={hexToHsl(color)} readOnly />
              <Button onClick={() => copyValue(hexToHsl(color))} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
