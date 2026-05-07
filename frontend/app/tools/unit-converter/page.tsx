"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n"
import { ArrowRightLeft, Ruler } from "lucide-react"

export default function UnitConverterPage() {
  const { t } = useLanguage()
  const [category, setCategory] = useState("length")
  const [fromUnit, setFromUnit] = useState("meters")
  const [toUnit, setToUnit] = useState("feet")
  const [inputValue, setInputValue] = useState("1")
  const [result, setResult] = useState("")

  const conversions = {
    length: {
      meters: 1,
      kilometers: 0.001,
      centimeters: 100,
      millimeters: 1000,
      miles: 0.000621371,
      yards: 1.09361,
      feet: 3.28084,
      inches: 39.3701,
    },
    weight: {
      kilograms: 1,
      grams: 1000,
      milligrams: 1000000,
      pounds: 2.20462,
      ounces: 35.274,
      tons: 0.001,
    },
    temperature: {
      celsius: {
        celsius: (v: number) => v,
        fahrenheit: (v: number) => (v * 9) / 5 + 32,
        kelvin: (v: number) => v + 273.15,
      },
      fahrenheit: {
        celsius: (v: number) => ((v - 32) * 5) / 9,
        fahrenheit: (v: number) => v,
        kelvin: (v: number) => ((v - 32) * 5) / 9 + 273.15,
      },
      kelvin: {
        celsius: (v: number) => v - 273.15,
        fahrenheit: (v: number) => ((v - 273.15) * 9) / 5 + 32,
        kelvin: (v: number) => v,
      },
    },
    volume: {
      liters: 1,
      milliliters: 1000,
      gallons: 0.264172,
      quarts: 1.05669,
      pints: 2.11338,
      cups: 4.22675,
      fluid_ounces: 33.814,
    },
    data: {
      bytes: 1,
      kilobytes: 0.001,
      megabytes: 0.000001,
      gigabytes: 0.000000001,
      terabytes: 0.000000000001,
    },
  }

  const convert = () => {
    const value = Number.parseFloat(inputValue)
    if (isNaN(value)) {
      setResult("Invalid input")
      return
    }

    if (category === "temperature") {
      const temp = conversions.temperature as any
      const converted = temp[fromUnit][toUnit](value)
      setResult(converted.toFixed(2))
    } else {
      const units = conversions[category as keyof typeof conversions] as any
      const base = value / units[fromUnit]
      const converted = base * units[toUnit]
      setResult(converted.toFixed(6))
    }
  }

  return (
    <div className="container max-w-3xl py-8 px-4">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Ruler className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Unit Converter</h1>
            <p className="text-muted-foreground">Convert between different units of measurement</p>
          </div>
        </div>
      </div>

      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle>Convert Units</CardTitle>
          <CardDescription>Select category and units to convert</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="length">Length</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="data">Data Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(conversions[category as keyof typeof conversions]).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(conversions[category as keyof typeof conversions]).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter value"
            />
          </div>

          <Button onClick={convert} className="w-full">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Convert
          </Button>

          {result && (
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Result</div>
                  <div className="text-3xl font-bold">
                    {result} {toUnit.replace("_", " ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
