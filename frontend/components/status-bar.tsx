'use client'

import useSWR from 'swr'
import { Shield, WifiOff } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StatusBar() {
  const { data: health } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/health`,
    fetcher,
    { refreshInterval: 5000 }
  )

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Tor: </span>
              <span className={health?.tor === 'enabled' ? 'text-foreground' : 'text-muted-foreground'}>
                {health?.tor === 'enabled' ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">No Logs • No History</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            Private Torrent Client v1.0
          </div>
        </div>
      </div>
    </footer>
  )
}
