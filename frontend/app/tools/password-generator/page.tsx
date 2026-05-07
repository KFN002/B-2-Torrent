'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Key, Copy, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { useToast } from '@/hooks/use-toast'

export default function PasswordGeneratorPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [strength, setStrength] = useState(0)

  const generatePassword = () => {
    let charset = ''
    if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (numbers) charset += '0123456789'
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (charset === '') {
      toast({
        title: 'Error',
        description: 'Please select at least one character type',
        variant: 'destructive',
      })
      return
    }

    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    let newPassword = ''
    
    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length]
    }

    setPassword(newPassword)
    calculateStrength(newPassword)
  }

  const calculateStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score += 20
    if (pwd.length >= 12) score += 20
    if (pwd.length >= 16) score += 20
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20
    if (/\d/.test(pwd)) score += 10
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 10
    setStrength(Math.min(score, 100))
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
    toast({
      title: 'Copied!',
      description: 'Password copied to clipboard',
    })
  }

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500'
    if (strength < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength < 40) return 'Weak'
    if (strength < 70) return 'Medium'
    return 'Strong'
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Key className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Password Generator</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Secure Passwords</CardTitle>
            <CardDescription>
              Create strong, random passwords with customizable options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {password && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={password}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <Button onClick={copyToClipboard} size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Strength: {getStrengthText()}</span>
                    <span>{strength}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getStrengthColor()}`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Password Length</Label>
                  <span className="text-sm text-muted-foreground">{length}</span>
                </div>
                <Slider
                  value={[length]}
                  onValueChange={(value) => setLength(value[0])}
                  min={6}
                  max={64}
                  step={1}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="uppercase">Uppercase Letters (A-Z)</Label>
                  <Switch
                    id="uppercase"
                    checked={uppercase}
                    onCheckedChange={setUppercase}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lowercase">Lowercase Letters (a-z)</Label>
                  <Switch
                    id="lowercase"
                    checked={lowercase}
                    onCheckedChange={setLowercase}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="numbers">Numbers (0-9)</Label>
                  <Switch
                    id="numbers"
                    checked={numbers}
                    onCheckedChange={setNumbers}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="symbols">Symbols (!@#$%...)</Label>
                  <Switch
                    id="symbols"
                    checked={symbols}
                    onCheckedChange={setSymbols}
                  />
                </div>
              </div>
            </div>

            <Button onClick={generatePassword} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
