'use client'

import useSWR from 'swr'
import { Shield, WifiOff, Lock, Globe, Eye } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StatusBar() {
  const { data: health } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/health`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const torEnabled = health?.tor === 'enabled'

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full ${torEnabled ? 'bg-success/20' : 'bg-muted'}`}>
                <Shield className={`h-3 w-3 ${torEnabled ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-muted-foreground">Multi-Proxy:</span>
              <span className={torEnabled ? 'text-success font-semibold' : 'text-muted-foreground'}>
                {torEnabled ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Tracking:</span>
              <span className="text-success font-semibold">DISABLED</span>
            </div>

            <div className="flex items-center gap-2">
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Logs:</span>
              <span className="text-success font-semibold">NONE</span>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Route:</span>
              <span className="text-foreground">Multi-Hop Encrypted</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Stealth Mode v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
