"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Network,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  AlertTriangle,
  Download,
  Upload,
  Users,
  HardDrive,
  Wifi,
  Server,
  Trash2,
  Activity,
  Zap,
  Globe,
  ShieldCheck,
  Gauge,
  ShieldAlert,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n"
import { Progress } from "@/components/ui/progress"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [connectionStats, setConnectionStats] = useState({
    activeConnections: 0,
    bandwidthUsage: 0,
    securityLevel: 100,
  })

  const [settings, setSettings] = useState({
    maxDownloadRate: "",
    maxUploadRate: "",
    maxConnections: "",
    maxPeersPerTorrent: "",
    maxActiveDownloads: "",
    maxActiveUploads: "",
    diskCacheSize: "",
    enableTor: "true",
    downloadPath: "/app/downloads",
    enableDHT: true,
    enablePEX: true,
    enableUPnP: true,
    encryption: "preferred",
    minReconnectTime: "30",
    maxFailCount: "3",
    preferEncryptedPeers: true,
    enablePeerBlocklist: true,
    trackerUpdateInterval: "30",
    scrapeInterval: "60",
    useTrackerProxies: true,
    preAllocateDiskSpace: false,
    autoMoveCompleted: false,
    completedPath: "/app/downloads/completed",
    autoStopSeeding: false,
    autoDeleteOnTermination: false,
    enforceEncryption: true,
    blockUnencryptedPeers: false,
    enablePeerVerification: true,
    maxPeerBandwidth: "",
    enableWebSeeds: false,
    randomizePort: true,
    bindToInterface: "",
    enableLocalPeerDiscovery: false,
  })

  const [securitySettings, setSecuritySettings] = useState({
    killSwitchEnabled: true,
    dnsProtectionEnabled: true,
    ipObfuscationEnabled: true,
    dataEncryptionEnabled: true,
    torEnabled: true,
    vpnType: "none",
    vlessKey: "",
    outlineKey: "",
    noLogsMode: false,
    obfuscateTraffic: false,
    forceEncryption: true,
    encryptionLevel: "strong",
    minEncryptionProtocol: "AES-256",
    rejectPlaintext: true,
    macRandomization: false,
    antiFingerprint: false,
    secureDelete: true,
    peerVerification: true,
    blockMaliciousPeers: true,
    sandboxMode: false,
    memoryEncryption: true,
    autoWipeOnExit: false,
    stealthMode: false,
  })

  useEffect(() => {
    if (open) {
      fetchSettings()
      fetchSecuritySettings()
      const interval = setInterval(fetchConnectionStats, 2000)
      return () => clearInterval(interval)
    }
  }, [open])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings({
          maxDownloadRate: data.max_download_rate || "",
          maxUploadRate: data.max_upload_rate || "",
          maxConnections: data.max_connections || "",
          maxPeersPerTorrent: data.max_peers_per_torrent || "",
          maxActiveDownloads: data.max_active_downloads || "",
          maxActiveUploads: data.max_active_uploads || "",
          diskCacheSize: data.disk_cache_size || "",
          enableTor: data.enable_tor || "true",
          downloadPath: data.download_path || "/app/downloads",
          enableDHT: data.enable_dht || true,
          enablePEX: data.enable_pex || true,
          enableUPnP: data.enable_upnp || true,
          encryption: data.encryption || "preferred",
          minReconnectTime: data.min_reconnect_time || "30",
          maxFailCount: data.max_fail_count || "3",
          preferEncryptedPeers: data.prefer_encrypted_peers || true,
          enablePeerBlocklist: data.enable_peer_blocklist || true,
          trackerUpdateInterval: data.tracker_update_interval || "30",
          scrapeInterval: data.scrape_interval || "60",
          useTrackerProxies: data.use_tracker_proxies || true,
          preAllocateDiskSpace: data.pre_allocate_disk_space || false,
          autoMoveCompleted: data.auto_move_completed || false,
          completedPath: data.completed_path || "/app/downloads/completed",
          autoStopSeeding: data.auto_stop_seeding || false,
          autoDeleteOnTermination: data.auto_delete_on_termination || false,
          enforceEncryption: data.enforce_encryption || true,
          blockUnencryptedPeers: data.block_unencrypted_peers || false,
          enablePeerVerification: data.enable_peer_verification || true,
          maxPeerBandwidth: data.max_peer_bandwidth || "",
          enableWebSeeds: data.enable_web_seeds || false,
          randomizePort: data.randomize_port || true,
          bindToInterface: data.bind_to_interface || "",
          enableLocalPeerDiscovery: data.enable_local_peer_discovery || false,
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch("/api/security/status")
      if (response.ok) {
        const data = await response.json()
        setSecuritySettings({
          ...data, // Ensure existing properties are preserved
          // Explicitly set new properties with default values if not in API response
          forceEncryption: data.forceEncryption ?? true,
          encryptionLevel: data.encryptionLevel ?? "strong",
          minEncryptionProtocol: data.minEncryptionProtocol ?? "AES-256",
          rejectPlaintext: data.rejectPlaintext ?? true,
          macRandomization: data.macRandomization ?? false,
          antiFingerprint: data.antiFingerprint ?? false,
          secureDelete: data.secureDelete ?? true,
          // Map new state properties from fetched data if available, otherwise use defaults
          peerVerification: data.peerVerification ?? true,
          blockMaliciousPeers: data.blockMaliciousPeers ?? true,
          sandboxMode: data.sandboxMode ?? false,
          memoryEncryption: data.memoryEncryption ?? true,
          autoWipeOnExit: data.autoWipeOnExit ?? false,
          stealthMode: data.stealthMode ?? false,
        })
      }
    } catch (error) {
      console.error("Failed to fetch security settings:", error)
    }
  }

  const fetchConnectionStats = async () => {
    try {
      const response = await fetch("/api/network/stats")
      if (response.ok) {
        const data = await response.json()
        setConnectionStats({
          activeConnections: data.active_connections || 0,
          bandwidthUsage: data.bandwidth_usage || 0,
          securityLevel: data.security_level || 100,
        })
      }
    } catch (error) {
      console.error("Failed to fetch connection stats:", error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: t("settingsSaved") || "Settings saved",
          description: t("settingsSavedDesc") || "Your settings have been updated successfully.",
        })
      }
    } catch (error) {
      toast({
        title: t("error") || "Error",
        description: t("settingsSaveError") || "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSecurity = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/security/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(securitySettings),
      })

      if (response.ok) {
        toast({
          title: "Security settings saved",
          description: "Your security preferences have been updated.",
        })
      }
    } catch (error) {
      toast({
        title: t("error") || "Error",
        description: t("dataDeleteError") || "Failed to save security settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKillSwitch = async () => {
    if (!confirm("This will terminate all connections and clear all data. Continue?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/security/killswitch", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Kill switch activated",
          description: "All connections terminated and data cleared.",
        })
        onOpenChange(false)
      }
    } catch (error) {
      toast({
        title: t("error") || "Error",
        description: t("killSwitchError") || "Failed to activate kill switch.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: t("dataDeleted") || "Data deleted",
          description: t("dataDeletedDesc") || "All user data and logs have been permanently deleted.",
        })
        setShowDeleteConfirm(false)
        onOpenChange(false)
      }
    } catch (error) {
      toast({
        title: t("error") || "Error",
        description: t("dataDeleteError") || "Failed to delete data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 animate-fade-in">
              <Settings className="h-6 w-6 transition-transform group-hover:rotate-90 duration-500" />
              <DialogTitle className="text-2xl">{t("securitySettings")}</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Configure your torrent client and security preferences
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="transition-all duration-200">
                General
              </TabsTrigger>
              <TabsTrigger value="advanced" className="transition-all duration-200">
                Advanced
              </TabsTrigger>
              <TabsTrigger value="security" className="transition-all duration-200">
                Security
              </TabsTrigger>
              <TabsTrigger value="privacy" className="transition-all duration-200">
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="maxDownloadRate" className="text-sm font-medium">
                  Max Download Rate (KB/s)
                </Label>
                <Input
                  id="maxDownloadRate"
                  type="number"
                  placeholder="Unlimited"
                  value={settings.maxDownloadRate}
                  onChange={(e) => setSettings({ ...settings, maxDownloadRate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUploadRate" className="text-sm font-medium">
                  Max Upload Rate (KB/s)
                </Label>
                <Input
                  id="maxUploadRate"
                  type="number"
                  placeholder="Unlimited"
                  value={settings.maxUploadRate}
                  onChange={(e) => setSettings({ ...settings, maxUploadRate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConnections" className="text-sm font-medium">
                  Max Connections per Torrent
                </Label>
                <Input
                  id="maxConnections"
                  type="number"
                  placeholder="50"
                  value={settings.maxConnections}
                  onChange={(e) => setSettings({ ...settings, maxConnections: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downloadPath" className="text-sm font-medium">
                  Download Path
                </Label>
                <Input
                  id="downloadPath"
                  value={settings.downloadPath}
                  onChange={(e) => setSettings({ ...settings, downloadPath: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 bg-transparent"
                  onClick={fetchSettings}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("reset") || "Reset"}
                </Button>
                <Button onClick={handleSave} className="flex-1 gap-2" disabled={isLoading}>
                  <Save className="h-4 w-4" />
                  {isLoading ? t("saving") || "Saving..." : t("saveSettings") || "Save Settings"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 pt-4">
              <Card className="border-info/20 bg-info/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <Settings className="h-5 w-5 text-info mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Advanced Torrent Settings</p>
                    <p className="text-xs text-muted-foreground">
                      Fine-tune connection limits, protocol settings, and bandwidth management
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxPeersPerTorrent" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Max Peers per Torrent
                  </Label>
                  <Input
                    id="maxPeersPerTorrent"
                    type="number"
                    placeholder="50"
                    value={settings.maxPeersPerTorrent}
                    onChange={(e) => setSettings({ ...settings, maxPeersPerTorrent: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of peers to connect per torrent</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxActiveDownloads" className="text-sm font-medium flex items-center gap-2">
                    <Download className="h-4 w-4 text-info" />
                    Max Active Downloads
                  </Label>
                  <Input
                    id="maxActiveDownloads"
                    type="number"
                    placeholder="5"
                    value={settings.maxActiveDownloads}
                    onChange={(e) => setSettings({ ...settings, maxActiveDownloads: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxActiveUploads" className="text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4 text-success" />
                    Max Active Uploads (Seeds)
                  </Label>
                  <Input
                    id="maxActiveUploads"
                    type="number"
                    placeholder="8"
                    value={settings.maxActiveUploads}
                    onChange={(e) => setSettings({ ...settings, maxActiveUploads: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diskCacheSize" className="text-sm font-medium flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    Disk Cache Size (MB)
                  </Label>
                  <Input
                    id="diskCacheSize"
                    type="number"
                    placeholder="64"
                    value={settings.diskCacheSize}
                    onChange={(e) => setSettings({ ...settings, diskCacheSize: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Higher values improve performance but use more RAM</p>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Protocol Settings
                  </h4>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Enable DHT</Label>
                      <p className="text-xs text-muted-foreground">Distributed Hash Table for trackerless torrents</p>
                    </div>
                    <Switch
                      checked={settings.enableDHT}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableDHT: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Enable PEX</Label>
                      <p className="text-xs text-muted-foreground">Peer Exchange for discovering additional peers</p>
                    </div>
                    <Switch
                      checked={settings.enablePEX}
                      onCheckedChange={(checked) => setSettings({ ...settings, enablePEX: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Enable UPnP/NAT-PMP</Label>
                      <p className="text-xs text-muted-foreground">Automatic port forwarding for better connectivity</p>
                    </div>
                    <Switch
                      checked={settings.enableUPnP}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableUPnP: checked })}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Peer Connection Settings
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="minReconnectTime" className="text-sm font-medium">
                      Min Reconnect Time (seconds)
                    </Label>
                    <Input
                      id="minReconnectTime"
                      type="number"
                      placeholder="30"
                      defaultValue="30"
                      value={settings.minReconnectTime}
                      onChange={(e) => setSettings({ ...settings, minReconnectTime: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Time to wait before reconnecting to failed peer</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxFailCount" className="text-sm font-medium">
                      Max Fail Count per Peer
                    </Label>
                    <Input
                      id="maxFailCount"
                      type="number"
                      placeholder="3"
                      defaultValue="3"
                      value={settings.maxFailCount}
                      onChange={(e) => setSettings({ ...settings, maxFailCount: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Number of failures before blocking a peer</p>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Prefer Encrypted Peers</Label>
                      <p className="text-xs text-muted-foreground">Prioritize connections with encryption support</p>
                    </div>
                    <Switch
                      checked={settings.preferEncryptedPeers}
                      onCheckedChange={(checked) => setSettings({ ...settings, preferEncryptedPeers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Enable Peer Blocklist</Label>
                      <p className="text-xs text-muted-foreground">Block known bad peers automatically</p>
                    </div>
                    <Switch
                      checked={settings.enablePeerBlocklist}
                      onCheckedChange={(checked) => setSettings({ ...settings, enablePeerBlocklist: checked })}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Tracker Settings
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="trackerUpdateInterval" className="text-sm font-medium">
                      Tracker Update Interval (minutes)
                    </Label>
                    <Input
                      id="trackerUpdateInterval"
                      type="number"
                      placeholder="30"
                      defaultValue="30"
                      value={settings.trackerUpdateInterval}
                      onChange={(e) => setSettings({ ...settings, trackerUpdateInterval: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scrapeInterval" className="text-sm font-medium">
                      Scrape Interval (minutes)
                    </Label>
                    <Input
                      id="scrapeInterval"
                      type="number"
                      placeholder="60"
                      defaultValue="60"
                      value={settings.scrapeInterval}
                      onChange={(e) => setSettings({ ...settings, scrapeInterval: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">How often to scrape trackers for peer/seed counts</p>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Use Tracker Proxies</Label>
                      <p className="text-xs text-muted-foreground">Route tracker requests through proxy chain</p>
                    </div>
                    <Switch
                      checked={settings.useTrackerProxies}
                      onCheckedChange={(checked) => setSettings({ ...settings, useTrackerProxies: checked })}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t("advancedSecurity") || "Advanced Security"}
                  </h4>

                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {t("enforceEncryption") || "Enforce Protocol Encryption"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("enforceEncryptionDesc") || "Require encrypted connections for all peers"}
                      </p>
                    </div>
                    <Switch
                      checked={settings.enforceEncryption}
                      onCheckedChange={(checked) => setSettings({ ...settings, enforceEncryption: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {t("blockUnencrypted") || "Block Unencrypted Peers"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("blockUnencryptedDesc") || "Reject connections from peers without encryption"}
                      </p>
                    </div>
                    <Switch
                      checked={settings.blockUnencryptedPeers}
                      onCheckedChange={(checked) => setSettings({ ...settings, blockUnencryptedPeers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {t("peerVerification") || "Enable Peer Verification"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("peerVerificationDesc") || "Verify peer identities before exchanging data"}
                      </p>
                    </div>
                    <Switch
                      checked={settings.enablePeerVerification}
                      onCheckedChange={(checked) => setSettings({ ...settings, enablePeerVerification: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPeerBandwidth" className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      {t("maxPeerBandwidth") || "Max Bandwidth per Peer (KB/s)"}
                    </Label>
                    <Input
                      id="maxPeerBandwidth"
                      type="number"
                      placeholder="100"
                      value={settings.maxPeerBandwidth}
                      onChange={(e) => setSettings({ ...settings, maxPeerBandwidth: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("maxPeerBandwidthDesc") || "Limit bandwidth usage per peer connection"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bindToInterface" className="text-sm font-medium flex items-center gap-2">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      {t("bindToInterface") || "Bind to Network Interface"}
                    </Label>
                    <Input
                      id="bindToInterface"
                      type="text"
                      placeholder="eth0, wlan0, or leave empty"
                      value={settings.bindToInterface}
                      onChange={(e) => setSettings({ ...settings, bindToInterface: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("bindToInterfaceDesc") || "Force connections through specific network interface"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t("randomizePort") || "Randomize Port on Startup"}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("randomizePortDesc") || "Use random ports to avoid ISP detection"}
                      </p>
                    </div>
                    <Switch
                      checked={settings.randomizePort}
                      onCheckedChange={(checked) => setSettings({ ...settings, randomizePort: checked })}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    File Handling
                  </h4>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Pre-allocate Disk Space</Label>
                      <p className="text-xs text-muted-foreground">Reserve disk space before downloading</p>
                    </div>
                    <Switch
                      checked={settings.preAllocateDiskSpace}
                      onCheckedChange={(checked) => setSettings({ ...settings, preAllocateDiskSpace: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Auto-move Completed</Label>
                      <p className="text-xs text-muted-foreground">Move finished downloads to separate folder</p>
                    </div>
                    <Switch
                      checked={settings.autoMoveCompleted}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoMoveCompleted: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Auto-stop Seeding</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically stop seeding when download completes
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoStopSeeding}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoStopSeeding: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completedPath" className="text-sm font-medium">
                      Completed Downloads Path
                    </Label>
                    <Input
                      id="completedPath"
                      placeholder="/app/downloads/completed"
                      value={settings.completedPath}
                      onChange={(e) => setSettings({ ...settings, completedPath: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    onClick={fetchSettings}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("reset") || "Reset"}
                  </Button>
                  <Button onClick={handleSave} className="flex-1 gap-2" disabled={isLoading}>
                    <Save className="h-4 w-4" />
                    {isLoading ? t("saving") || "Saving..." : t("saveSettings") || "Save Settings"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 pt-4 animate-slide-up">
              <Card className="border-success/20 bg-success/5 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-success/5 via-transparent to-info/5 animate-pulse" />
                <CardContent className="p-6 space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-success/20 animate-pulse">
                        <ShieldCheck className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Security Status</p>
                        <p className="text-xs text-muted-foreground">Real-time protection monitoring</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-success">{connectionStats.securityLevel}%</p>
                      <p className="text-xs text-muted-foreground">Protected</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Security Level</span>
                      <span className="font-medium">{connectionStats.securityLevel}%</span>
                    </div>
                    <Progress value={connectionStats.securityLevel} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-info" />
                        <span className="text-xs text-muted-foreground">Active Connections</span>
                      </div>
                      <p className="text-xl font-bold">{connectionStats.activeConnections}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-warning" />
                        <span className="text-xs text-muted-foreground">Bandwidth Usage</span>
                      </div>
                      <p className="text-xl font-bold">{connectionStats.bandwidthUsage} KB/s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-info/20 bg-info/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-info" />
                    <div>
                      <p className="text-sm font-semibold">VPN & Proxy Configuration</p>
                      <p className="text-xs text-muted-foreground">Configure alternative network routing</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Connection Type</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select your preferred anonymity method</p>
                      <select
                        className="w-full px-3 py-2 rounded-md border border-input bg-background transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={securitySettings.vpnType}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, vpnType: e.target.value })}
                      >
                        <option value="none">🔓 None (Direct Connection)</option>
                        <option value="tor">🧅 Tor Multi-Proxy Chain</option>
                        <option value="vless">⚡ VLESS Protocol</option>
                        <option value="outline">🛡️ Outline VPN</option>
                      </select>
                    </div>

                    {securitySettings.vpnType === "vless" && (
                      <div className="space-y-2 animate-slide-down p-4 border border-info/30 rounded-lg bg-info/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-info" />
                          <Label htmlFor="vlessKey" className="text-sm font-medium">
                            VLESS Connection String
                          </Label>
                        </div>
                        <Input
                          id="vlessKey"
                          type="password"
                          placeholder="vless://uuid@server:port?encryption=none&security=tls..."
                          value={securitySettings.vlessKey}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, vlessKey: e.target.value })}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter your complete VLESS connection URI with server details
                        </p>
                      </div>
                    )}

                    {securitySettings.vpnType === "outline" && (
                      <div className="space-y-2 animate-slide-down p-4 border border-success/30 rounded-lg bg-success/5">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-4 w-4 text-success" />
                          <Label htmlFor="outlineKey" className="text-sm font-medium">
                            Outline Access Key
                          </Label>
                        </div>
                        <Input
                          id="outlineKey"
                          type="password"
                          placeholder="ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTo...@server:port/?outline=1"
                          value={securitySettings.outlineKey}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, outlineKey: e.target.value })}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Paste your Outline VPN access key from the Outline Manager
                        </p>
                      </div>
                    )}

                    {securitySettings.vpnType === "tor" && (
                      <div className="space-y-2 animate-slide-down p-4 border border-purple-500/30 rounded-lg bg-purple-500/5">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-purple-500" />
                          <p className="text-sm font-medium">Tor Multi-Proxy Chain Active</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Traffic will be routed through multiple Tor relays for maximum anonymity
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Added Advanced Encryption Controls section */}
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-semibold">Advanced Encryption Controls</p>
                      <p className="text-xs text-muted-foreground">Force encryption on all connections</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-destructive/10 animate-pulse">
                          <ShieldAlert className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Force Encryption</Label>
                          <p className="text-xs text-muted-foreground">Reject all unencrypted peer connections</p>
                        </div>
                      </div>
                      <Switch
                        checked={securitySettings.forceEncryption}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, forceEncryption: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Encryption Level</Label>
                      <select
                        className="w-full px-3 py-2 rounded-md border border-input bg-background transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={securitySettings.encryptionLevel}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, encryptionLevel: e.target.value })}
                      >
                        <option value="basic">🔒 Basic (RC4 - Fast)</option>
                        <option value="standard">🔐 Standard (AES-128)</option>
                        <option value="strong">🛡️ Strong (AES-256 - Recommended)</option>
                        <option value="maximum">⚡ Maximum (AES-256-GCM + Perfect Forward Secrecy)</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Higher levels provide better security but may reduce speed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Minimum Protocol</Label>
                      <select
                        className="w-full px-3 py-2 rounded-md border border-input bg-background transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={securitySettings.minEncryptionProtocol}
                        onChange={(e) =>
                          setSecuritySettings({ ...securitySettings, minEncryptionProtocol: e.target.value })
                        }
                      >
                        <option value="RC4">RC4 (Legacy)</option>
                        <option value="AES-128">AES-128 (Standard)</option>
                        <option value="AES-256">AES-256 (Strong)</option>
                        <option value="ChaCha20">ChaCha20-Poly1305 (Modern)</option>
                      </select>
                      <p className="text-xs text-muted-foreground">Reject peers using weaker encryption protocols</p>
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Reject Plaintext</Label>
                        <p className="text-xs text-muted-foreground">Block all non-encrypted data transmission</p>
                      </div>
                      <Switch
                        checked={securitySettings.rejectPlaintext}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, rejectPlaintext: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">MAC Address Randomization</Label>
                        <p className="text-xs text-muted-foreground">Change MAC address to prevent device tracking</p>
                      </div>
                      <Switch
                        checked={securitySettings.macRandomization}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, macRandomization: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Anti-Fingerprinting</Label>
                        <p className="text-xs text-muted-foreground">Mask protocol fingerprints to evade DPI</p>
                      </div>
                      <Switch
                        checked={securitySettings.antiFingerprint}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, antiFingerprint: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Secure File Deletion</Label>
                        <p className="text-xs text-muted-foreground">Overwrite deleted files with random data</p>
                      </div>
                      <Switch
                        checked={securitySettings.secureDelete}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, secureDelete: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Added new Advanced Security Options section */}
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Fingerprint className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-semibold">Advanced Security Options</p>
                      <p className="text-xs text-muted-foreground">Maximum protection features</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Peer Verification</Label>
                        <p className="text-xs text-muted-foreground">Verify peer identities before connecting</p>
                      </div>
                      <Switch
                        checked={securitySettings.peerVerification}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, peerVerification: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Block Malicious Peers</Label>
                        <p className="text-xs text-muted-foreground">Auto-block peers from known bad IPs</p>
                      </div>
                      <Switch
                        checked={securitySettings.blockMaliciousPeers}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, blockMaliciousPeers: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Sandbox Mode</Label>
                        <p className="text-xs text-muted-foreground">Isolate torrent client in secure container</p>
                      </div>
                      <Switch
                        checked={securitySettings.sandboxMode}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, sandboxMode: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Memory Encryption</Label>
                        <p className="text-xs text-muted-foreground">Encrypt sensitive data in RAM</p>
                      </div>
                      <Switch
                        checked={securitySettings.memoryEncryption}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, memoryEncryption: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Auto-Wipe on Exit</Label>
                        <p className="text-xs text-muted-foreground">Automatically delete all traces when closing</p>
                      </div>
                      <Switch
                        checked={securitySettings.autoWipeOnExit}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, autoWipeOnExit: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Stealth Mode</Label>
                        <p className="text-xs text-muted-foreground">Hide app presence from system monitors</p>
                      </div>
                      <Switch
                        checked={securitySettings.stealthMode}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, stealthMode: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Kill Switch</Label>
                      <p className="text-xs text-muted-foreground">
                        Terminate all connections if privacy is compromised
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.killSwitchEnabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, killSwitchEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-info/10">
                      <Network className="h-4 w-4 text-info" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">DNS Leak Protection</Label>
                      <p className="text-xs text-muted-foreground">Prevent DNS queries from leaking your real IP</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.dnsProtectionEnabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, dnsProtectionEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-success/10">
                      <Eye className="h-4 w-4 text-success" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">IP Obfuscation</Label>
                      <p className="text-xs text-muted-foreground">Mask your real IP address from peers</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.ipObfuscationEnabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, ipObfuscationEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-warning/10">
                      <Lock className="h-4 w-4 text-warning" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Data Encryption</Label>
                      <p className="text-xs text-muted-foreground">Encrypt all user data at rest with AES-256</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.dataEncryptionEnabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, dataEncryptionEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <EyeOff className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t("noLogsMode") || "No-Logs Mode"}</Label>
                      <p className="text-xs text-muted-foreground">
                        Disable all activity logging and metadata persistence
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.noLogsMode}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, noLogsMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3 px-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-sm bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-500/10">
                      <Fingerprint className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Traffic Obfuscation</Label>
                      <p className="text-xs text-muted-foreground">
                        Evade DPI and ISP throttling with protocol disguise
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.obfuscateTraffic}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, obfuscateTraffic: checked })
                    }
                  />
                </div>
              </div>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-semibold">Emergency Actions</p>
                      <p className="text-xs text-muted-foreground">Use these in case of security breach</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleKillSwitch}
                    disabled={isLoading}
                    className="w-full gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Shield className="h-4 w-4" />
                    Activate Emergency Kill Switch
                  </Button>
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 bg-transparent transition-all hover:scale-[1.02]"
                  onClick={fetchSecuritySettings}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("reset") || "Reset"}
                </Button>
                <Button
                  onClick={handleSaveSecurity}
                  className="flex-1 gap-2 transition-all hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? t("saving") || "Saving..." : "Save Security"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 pt-4">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t("dataManagement") || "Data Management"}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("dataManagementDesc") ||
                        "Control how your data is stored and when it's deleted for maximum privacy"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {t("autoDeleteOnTermination") || "Auto-delete on App Termination"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("autoDeleteOnTerminationDesc") ||
                          "Automatically delete all user data, logs, settings, and user data when app stops or logs out"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoDeleteOnTermination}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoDeleteOnTermination: checked })}
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    {t("dangerZone") || "Danger Zone"}
                  </h4>
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-destructive">
                          {t("deleteAllUserData") || "Delete All User Data"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("deleteAllUserDataDesc") ||
                            "Permanently delete all torrents, logs, settings, and user data."}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("deleteAllData") || "Delete All Data"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 bg-transparent"
                  onClick={fetchSettings}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("reset") || "Reset"}
                </Button>
                <Button onClick={handleSave} className="flex-1 gap-2" disabled={isLoading}>
                  <Save className="h-4 w-4" />
                  {isLoading ? t("saving") || "Saving..." : t("saveSettings") || "Save Settings"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("areYouSure") || "Are you absolutely sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t("deleteAllDataWarning") ||
                  "This will permanently delete all your torrents, settings, logs, and user data."}
              </p>
              <p className="font-semibold text-destructive">
                {t("deleteAllDataWarning2") || "This action cannot be undone!"}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllData}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? t("deleting") || "Deleting..." : t("deleteAllData") || "Delete All Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
