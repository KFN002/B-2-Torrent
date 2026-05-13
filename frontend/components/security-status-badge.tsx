'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function SecurityStatusBadge() {
  const { data } = useSWR('/api/security/status', fetcher, {
    refreshInterval: 5000,
  })

  if (!data) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Shield className="h-3 w-3" />
        <span className="text-xs">Loading...</span>
      </Badge>
    )
  }

  const allEnabled =
    data.killSwitchActive &&
    data.dnsProtectionActive &&
    data.ipObfuscationActive &&
    data.dnsObfuscationActive &&
    data.dhtInvisible &&
    data.sharingDisabled &&
    data.dataEncryptionActive

  if (allEnabled) {
    return (
      <Badge variant="default" className="gap-1.5 bg-green-500/10 text-green-500 border-green-500/20">
        <ShieldCheck className="h-3 w-3" />
        <span className="text-xs">Secure</span>
      </Badge>
    )
  }

  if (data.killSwitchActive && data.dnsProtectionActive && data.dhtInvisible) {
    return (
      <Badge variant="default" className="gap-1.5 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
        <Shield className="h-3 w-3" />
        <span className="text-xs">Protected</span>
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="gap-1.5">
      <ShieldAlert className="h-3 w-3" />
      <span className="text-xs">Exposed</span>
    </Badge>
  )
}
