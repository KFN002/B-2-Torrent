"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Globe,
  Activity,
  Lock,
  Unlock,
  RefreshCw,
  MapPin,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Server,
  Network,
  Radio,
  Settings,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface VPNServer {
  id: string
  name: string
  country: string
  city: string
  protocol: "vless" | "outline" | "tor"
  load: number
  latency: number
  status: "online" | "offline" | "maintenance"
}

interface ConnectionStatus {
  connected: boolean
  protocol: string
  serverName: string
  ip: string
  realIp: string
  dnsServers: string[]
  uploadSpeed: number
  downloadSpeed: number
  dataTransferred: number
  connectionTime: number
  encryption: string
  port: number
}

export default function NetworkPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("vpn")
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    protocol: "",
    serverName: "",
    ip: "Not Connected",
    realIp: "Loading...",
    dnsServers: [],
    uploadSpeed: 0,
    downloadSpeed: 0,
    dataTransferred: 0,
    connectionTime: 0,
    encryption: "",
    port: 0,
  })

  const [vpnConfig, setVpnConfig] = useState({
    protocol: "vless",
    vlessKey: "",
    outlineKey: "",
    customServer: "",
    autoConnect: true,
    killSwitch: true,
    dnsLeakProtection: true,
    splitTunneling: false,
    systemWideProxy: false,
    httpProxy: "",
    socksProxy: "",
  })

  const [torConfig, setTorConfig] = useState({
    enabled: false,
    bridges: false,
    bridgeType: "obfs4",
    customBridges: "",
    circuitHops: 3,
    newIdentityInterval: 10,
    isolateDestAddress: true,
    isolateDestPort: true,
  })

  const [servers] = useState<VPNServer[]>([
    {
      id: "1",
      name: "Amsterdam-01",
      country: "Netherlands",
      city: "Amsterdam",
      protocol: "vless",
      load: 45,
      latency: 23,
      status: "online",
    },
    {
      id: "2",
      name: "London-02",
      country: "UK",
      city: "London",
      protocol: "vless",
      load: 67,
      latency: 18,
      status: "online",
    },
    {
      id: "3",
      name: "NewYork-03",
      country: "USA",
      city: "New York",
      protocol: "outline",
      load: 89,
      latency: 78,
      status: "online",
    },
    {
      id: "4",
      name: "Tokyo-01",
      country: "Japan",
      city: "Tokyo",
      protocol: "vless",
      load: 34,
      latency: 156,
      status: "online",
    },
    {
      id: "5",
      name: "Singapore-02",
      country: "Singapore",
      city: "Singapore",
      protocol: "outline",
      load: 56,
      latency: 178,
      status: "online",
    },
    {
      id: "6",
      name: "Frankfurt-01",
      country: "Germany",
      city: "Frankfurt",
      protocol: "vless",
      load: 23,
      latency: 28,
      status: "online",
    },
    {
      id: "7",
      name: "TorNode-01",
      country: "Various",
      city: "Multi-hop",
      protocol: "tor",
      load: 78,
      latency: 234,
      status: "online",
    },
  ])

  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  useEffect(() => {
    // Simulate getting real IP
    setTimeout(() => {
      setConnectionStatus((prev) => ({ ...prev, realIp: "203.0.113.42" }))
    }, 1000)

    // Update speeds simulation
    const interval = setInterval(() => {
      if (connectionStatus.connected) {
        setConnectionStatus((prev) => ({
          ...prev,
          uploadSpeed: Math.random() * 10 + 5,
          downloadSpeed: Math.random() * 50 + 20,
          dataTransferred: prev.dataTransferred + Math.random() * 1024 * 1024,
          connectionTime: prev.connectionTime + 1,
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [connectionStatus.connected])

  const handleConnect = async (server: VPNServer) => {
    setIsConnecting(true)
    setSelectedServer(server)

    // Simulate connection
    setTimeout(() => {
      setConnectionStatus({
        connected: true,
        protocol: server.protocol.toUpperCase(),
        serverName: server.name,
        ip: "192.0.2." + Math.floor(Math.random() * 255),
        realIp: connectionStatus.realIp,
        dnsServers: ["1.1.1.1", "1.0.0.1"],
        uploadSpeed: 0,
        downloadSpeed: 0,
        dataTransferred: 0,
        connectionTime: 0,
        encryption: server.protocol === "tor" ? "AES-256 + Onion Routing" : "AES-256-GCM",
        port: server.protocol === "tor" ? 9050 : 443,
      })
      setIsConnecting(false)
      toast({
        title: "Connected Successfully",
        description: `Connected to ${server.name} via ${server.protocol.toUpperCase()}`,
      })

      // Apply system-wide proxy if enabled
      if (vpnConfig.systemWideProxy) {
        toast({
          title: "System Proxy Configured",
          description: "All system traffic is now routed through the VPN",
        })
      }
    }, 2000)
  }

  const handleDisconnect = () => {
    setConnectionStatus({
      ...connectionStatus,
      connected: false,
      protocol: "",
      serverName: "",
      ip: "Not Connected",
      uploadSpeed: 0,
      downloadSpeed: 0,
      connectionTime: 0,
    })
    setSelectedServer(null)
    toast({
      title: "Disconnected",
      description: "VPN connection terminated",
      variant: "destructive",
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleSaveProxySettings = () => {
    toast({
      title: "Proxy Settings Saved",
      description: "System-wide proxy configuration has been applied",
    })
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="container mx-auto px-4 py-8 2xl:py-12 space-y-8">
        {/* Header */}
        <div className="fade-in-up text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-green-500/10 to-purple-500/10 border border-blue-500/20">
            <Network className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">VPN & Tor Network Control</span>
          </div>
          <h1 className="text-5xl 2xl:text-6xl font-bold text-gradient-rainbow">Network & Proxy Management</h1>
          <p className="text-xl 2xl:text-2xl text-muted-foreground max-w-3xl mx-auto text-fade">
            Secure your connection with VPN and Tor network routing. Configure system-wide proxy settings for complete
            device anonymity.
          </p>
        </div>

        {/* Connection Status Card */}
        <Card className="glass-card-transparent border-2 fade-in-up animation-delay-100 hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${connectionStatus.connected ? "bg-green-500/20" : "bg-gray-500/20"}`}>
                  {connectionStatus.connected ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl 2xl:text-3xl">
                    {connectionStatus.connected ? "Connected" : "Disconnected"}
                  </CardTitle>
                  <CardDescription className="text-base 2xl:text-lg">
                    {connectionStatus.connected ? connectionStatus.serverName : "Not connected to any server"}
                  </CardDescription>
                </div>
              </div>
              {connectionStatus.connected && (
                <Button onClick={handleDisconnect} variant="destructive" size="lg" className="hover-lift">
                  <Unlock className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 2xl:gap-6">
              {/* IP Address */}
              <div className="p-4 2xl:p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-muted-foreground">VPN IP</span>
                </div>
                <p className="text-xl 2xl:text-2xl font-bold text-blue-400">{connectionStatus.ip}</p>
              </div>

              {/* Real IP */}
              <div className="p-4 2xl:p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-muted-foreground">Real IP</span>
                </div>
                <p className="text-xl 2xl:text-2xl font-bold text-purple-400">{connectionStatus.realIp}</p>
              </div>

              {/* Protocol */}
              <div className="p-4 2xl:p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-muted-foreground">Protocol</span>
                </div>
                <p className="text-xl 2xl:text-2xl font-bold text-green-400">{connectionStatus.protocol || "None"}</p>
              </div>

              {/* Encryption */}
              <div className="p-4 2xl:p-6 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 text-pink-400" />
                  <span className="text-sm text-muted-foreground">Encryption</span>
                </div>
                <p className="text-lg 2xl:text-xl font-bold text-pink-400">{connectionStatus.encryption || "None"}</p>
              </div>
            </div>

            {connectionStatus.connected && (
              <>
                {/* Speed Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 2xl:gap-6">
                  <div className="p-4 rounded-xl glass-card-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Download</span>
                      <TrendingDown className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {connectionStatus.downloadSpeed.toFixed(2)} MB/s
                    </p>
                  </div>

                  <div className="p-4 rounded-xl glass-card-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Upload</span>
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{connectionStatus.uploadSpeed.toFixed(2)} MB/s</p>
                  </div>

                  <div className="p-4 rounded-xl glass-card-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Data Transferred</span>
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-purple-400">
                      {formatBytes(connectionStatus.dataTransferred)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl glass-card-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Connection Time</span>
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">{formatTime(connectionStatus.connectionTime)}</p>
                  </div>
                </div>

                {/* DNS Servers */}
                <div className="p-4 rounded-xl glass-card-transparent">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    DNS Servers
                  </h3>
                  <div className="flex gap-3">
                    {connectionStatus.dnsServers.map((dns, i) => (
                      <Badge key={i} variant="secondary" className="px-4 py-2 text-sm">
                        {dns}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-card-transparent p-2 h-auto">
            <TabsTrigger value="vpn" className="text-base 2xl:text-lg py-3 data-[state=active]:bg-blue-500/20">
              <Shield className="w-4 h-4 mr-2" />
              VPN Servers
            </TabsTrigger>
            <TabsTrigger value="tor" className="text-base 2xl:text-lg py-3 data-[state=active]:bg-purple-500/20">
              <Radio className="w-4 h-4 mr-2" />
              Tor Network
            </TabsTrigger>
            <TabsTrigger value="proxy" className="text-base 2xl:text-lg py-3 data-[state=active]:bg-green-500/20">
              <Settings className="w-4 h-4 mr-2" />
              System Proxy
            </TabsTrigger>
            <TabsTrigger value="config" className="text-base 2xl:text-lg py-3 data-[state=active]:bg-pink-500/20">
              <Lock className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* VPN Servers Tab */}
          <TabsContent value="vpn" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 2xl:gap-6">
              {servers
                .filter((s) => s.protocol !== "tor")
                .map((server) => (
                  <Card
                    key={server.id}
                    className={`glass-card-transparent hover-lift transition-all ${
                      selectedServer?.id === server.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg 2xl:text-xl flex items-center gap-2">
                          <Server className="w-5 h-5" />
                          {server.name}
                        </CardTitle>
                        <Badge
                          variant={server.status === "online" ? "default" : "secondary"}
                          className={server.status === "online" ? "bg-green-500" : ""}
                        >
                          {server.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {server.city}, {server.country}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Server Load</span>
                          <span className="font-semibold">{server.load}%</span>
                        </div>
                        <Progress value={server.load} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Protocol</p>
                          <Badge variant="outline" className="uppercase">
                            {server.protocol}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Latency</p>
                          <p className="text-sm font-semibold">{server.latency}ms</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleConnect(server)}
                        disabled={connectionStatus.connected || isConnecting}
                        className="w-full hover-lift"
                        size="lg"
                      >
                        {isConnecting && selectedServer?.id === server.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Tor Network Tab */}
          <TabsContent value="tor" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl 2xl:text-3xl flex items-center gap-3">
                  <Radio className="w-6 h-6 text-purple-400" />
                  Tor Network Configuration
                </CardTitle>
                <CardDescription className="text-base 2xl:text-lg">
                  Configure Tor routing for maximum anonymity with multi-hop onion routing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tor-enabled" className="text-base flex items-center justify-between">
                      Enable Tor Network
                      <Switch
                        id="tor-enabled"
                        checked={torConfig.enabled}
                        onCheckedChange={(checked) => setTorConfig({ ...torConfig, enabled: checked })}
                      />
                    </Label>
                    <p className="text-sm text-muted-foreground">Route all traffic through Tor network</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bridges" className="text-base flex items-center justify-between">
                      Use Bridges
                      <Switch
                        id="bridges"
                        checked={torConfig.bridges}
                        onCheckedChange={(checked) => setTorConfig({ ...torConfig, bridges: checked })}
                      />
                    </Label>
                    <p className="text-sm text-muted-foreground">Use bridge relays to bypass Tor blocking</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isolate-dest" className="text-base flex items-center justify-between">
                      Isolate Destinations
                      <Switch
                        id="isolate-dest"
                        checked={torConfig.isolateDestAddress}
                        onCheckedChange={(checked) => setTorConfig({ ...torConfig, isolateDestAddress: checked })}
                      />
                    </Label>
                    <p className="text-sm text-muted-foreground">Use different circuits for different destinations</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isolate-port" className="text-base flex items-center justify-between">
                      Isolate Ports
                      <Switch
                        id="isolate-port"
                        checked={torConfig.isolateDestPort}
                        onCheckedChange={(checked) => setTorConfig({ ...torConfig, isolateDestPort: checked })}
                      />
                    </Label>
                    <p className="text-sm text-muted-foreground">Separate circuits for different ports</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="circuit-hops">Circuit Hops: {torConfig.circuitHops}</Label>
                  <input
                    type="range"
                    id="circuit-hops"
                    min="3"
                    max="7"
                    value={torConfig.circuitHops}
                    onChange={(e) => setTorConfig({ ...torConfig, circuitHops: Number.parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of relays in Tor circuit (more = slower but more anonymous)
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="new-identity">New Identity Interval: {torConfig.newIdentityInterval} minutes</Label>
                  <input
                    type="range"
                    id="new-identity"
                    min="5"
                    max="60"
                    step="5"
                    value={torConfig.newIdentityInterval}
                    onChange={(e) =>
                      setTorConfig({ ...torConfig, newIdentityInterval: Number.parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">How often to request a new Tor circuit</p>
                </div>

                {torConfig.bridges && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="bridge-type">Bridge Type</Label>
                      <Select
                        value={torConfig.bridgeType}
                        onValueChange={(value) => setTorConfig({ ...torConfig, bridgeType: value })}
                      >
                        <SelectTrigger id="bridge-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="obfs4">obfs4 (Recommended)</SelectItem>
                          <SelectItem value="obfs3">obfs3</SelectItem>
                          <SelectItem value="meek">meek-azure</SelectItem>
                          <SelectItem value="snowflake">Snowflake</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="custom-bridges">Custom Bridges (Optional)</Label>
                      <textarea
                        id="custom-bridges"
                        placeholder="Enter custom bridge addresses, one per line"
                        value={torConfig.customBridges}
                        onChange={(e) => setTorConfig({ ...torConfig, customBridges: e.target.value })}
                        className="w-full h-24 p-3 rounded-lg bg-muted border border-border resize-none"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      handleConnect(servers.find((s) => s.protocol === "tor") || servers[servers.length - 1])
                    }
                    disabled={!torConfig.enabled || connectionStatus.connected}
                    size="lg"
                    className="flex-1 hover-lift"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Connect to Tor
                  </Button>
                  <Button variant="outline" size="lg" className="hover-lift bg-transparent">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Identity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tor Circuit Visualization */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-xl 2xl:text-2xl">Current Tor Circuit</CardTitle>
                <CardDescription>Visual representation of your Tor routing path</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-8">
                  {["Your Device", "Guard Node", "Middle Relay", "Exit Node", "Destination"].map((node, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            i === 0 || i === 4
                              ? "bg-blue-500/20 border-2 border-blue-500"
                              : "bg-purple-500/20 border-2 border-purple-500"
                          }`}
                        >
                          <Shield className="w-8 h-8" />
                        </div>
                        <span className="text-xs text-center">{node}</span>
                      </div>
                      {i < 4 && <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 mx-2" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proxy" className="space-y-6">
            <Card className="glass-card-transparent">
              <CardHeader>
                <CardTitle className="text-2xl 2xl:text-3xl flex items-center gap-3">
                  <Settings className="w-6 h-6 text-green-400" />
                  System-Wide Proxy Settings
                </CardTitle>
                <CardDescription className="text-base 2xl:text-lg">
                  Configure proxy settings for your entire device. All applications will route through the configured
                  proxy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-400">System Proxy Active</p>
                      <p className="text-sm text-muted-foreground">
                        When enabled, all system traffic (browsers, apps, services) will route through the configured
                        proxy servers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl glass-card-transparent">
                    <div>
                      <Label htmlFor="system-proxy" className="text-base font-semibold">
                        Enable System-Wide Proxy
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Route all device traffic through proxy servers
                      </p>
                    </div>
                    <Switch
                      id="system-proxy"
                      checked={vpnConfig.systemWideProxy}
                      onCheckedChange={(checked) => setVpnConfig({ ...vpnConfig, systemWideProxy: checked })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="http-proxy" className="text-base">
                        HTTP/HTTPS Proxy
                      </Label>
                      <Input
                        id="http-proxy"
                        placeholder="http://proxy.example.com:8080"
                        value={vpnConfig.httpProxy}
                        onChange={(e) => setVpnConfig({ ...vpnConfig, httpProxy: e.target.value })}
                        disabled={!vpnConfig.systemWideProxy}
                      />
                      <p className="text-xs text-muted-foreground">Format: protocol://host:port</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="socks-proxy" className="text-base">
                        SOCKS5 Proxy
                      </Label>
                      <Input
                        id="socks-proxy"
                        placeholder="socks5://proxy.example.com:1080"
                        value={vpnConfig.socksProxy}
                        onChange={(e) => setVpnConfig({ ...vpnConfig, socksProxy: e.target.value })}
                        disabled={!vpnConfig.systemWideProxy}
                      />
                      <p className="text-xs text-muted-foreground">Format: socks5://host:port</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-yellow-400">Important</p>
                        <p className="text-sm text-muted-foreground">
                          System-wide proxy settings will affect all applications on your device. Ensure your proxy
                          server is secure and trustworthy. Misconfiguration may block internet access.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProxySettings}
                    size="lg"
                    className="w-full hover-lift"
                    disabled={!vpnConfig.systemWideProxy}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Apply Proxy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VPN Configuration */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-xl 2xl:text-2xl">VPN Configuration</CardTitle>
                  <CardDescription>Configure VPN connection parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="protocol">Protocol</Label>
                    <Select
                      value={vpnConfig.protocol}
                      onValueChange={(value) => setVpnConfig({ ...vpnConfig, protocol: value })}
                    >
                      <SelectTrigger id="protocol">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vless">VLESS</SelectItem>
                        <SelectItem value="outline">Outline VPN</SelectItem>
                        <SelectItem value="wireguard">WireGuard</SelectItem>
                        <SelectItem value="openvpn">OpenVPN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {vpnConfig.protocol === "vless" && (
                    <div className="space-y-3">
                      <Label htmlFor="vless-key" className="flex items-center justify-between">
                        VLESS Key
                        <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)} className="h-auto p-1">
                          {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </Label>
                      <Input
                        id="vless-key"
                        type={showKeys ? "text" : "password"}
                        value={vpnConfig.vlessKey}
                        onChange={(e) => setVpnConfig({ ...vpnConfig, vlessKey: e.target.value })}
                        placeholder="vless://..."
                      />
                    </div>
                  )}

                  {vpnConfig.protocol === "outline" && (
                    <div className="space-y-3">
                      <Label htmlFor="outline-key" className="flex items-center justify-between">
                        Outline Access Key
                        <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)} className="h-auto p-1">
                          {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </Label>
                      <Input
                        id="outline-key"
                        type={showKeys ? "text" : "password"}
                        value={vpnConfig.outlineKey}
                        onChange={(e) => setVpnConfig({ ...vpnConfig, outlineKey: e.target.value })}
                        placeholder="ss://..."
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="custom-server">Custom Server (Optional)</Label>
                    <Input
                      id="custom-server"
                      value={vpnConfig.customServer}
                      onChange={(e) => setVpnConfig({ ...vpnConfig, customServer: e.target.value })}
                      placeholder="server.example.com:443"
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-connect">Auto-Connect</Label>
                        <p className="text-sm text-muted-foreground">Connect automatically on startup</p>
                      </div>
                      <Switch
                        id="auto-connect"
                        checked={vpnConfig.autoConnect}
                        onCheckedChange={(checked) => setVpnConfig({ ...vpnConfig, autoConnect: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="kill-switch">Kill Switch</Label>
                        <p className="text-sm text-muted-foreground">Block traffic if VPN disconnects</p>
                      </div>
                      <Switch
                        id="kill-switch"
                        checked={vpnConfig.killSwitch}
                        onCheckedChange={(checked) => setVpnConfig({ ...vpnConfig, killSwitch: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dns-leak">DNS Leak Protection</Label>
                        <p className="text-sm text-muted-foreground">Prevent DNS leaks</p>
                      </div>
                      <Switch
                        id="dns-leak"
                        checked={vpnConfig.dnsLeakProtection}
                        onCheckedChange={(checked) => setVpnConfig({ ...vpnConfig, dnsLeakProtection: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="split-tunnel">Split Tunneling</Label>
                        <p className="text-sm text-muted-foreground">Route specific apps through VPN</p>
                      </div>
                      <Switch
                        id="split-tunnel"
                        checked={vpnConfig.splitTunneling}
                        onCheckedChange={(checked) => setVpnConfig({ ...vpnConfig, splitTunneling: checked })}
                      />
                    </div>
                  </div>

                  <Button className="w-full hover-lift" size="lg">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>

              {/* Security Options */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-xl 2xl:text-2xl">Advanced Security</CardTitle>
                  <CardDescription>Additional privacy and security options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h3 className="font-semibold text-red-400">Critical Security Features</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">IPv6 Leak Protection</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">WebRTC Leak Protection</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Block Local Network Access</span>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl glass-card space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-green-400" />
                      Encryption Settings
                    </h3>
                    <Select defaultValue="aes256">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aes256">AES-256-GCM (Recommended)</SelectItem>
                        <SelectItem value="aes128">AES-128-GCM</SelectItem>
                        <SelectItem value="chacha20">ChaCha20-Poly1305</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-xl glass-card space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      DNS Settings
                    </h3>
                    <Select defaultValue="cloudflare">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cloudflare">Cloudflare (1.1.1.1)</SelectItem>
                        <SelectItem value="google">Google (8.8.8.8)</SelectItem>
                        <SelectItem value="quad9">Quad9 (9.9.9.9)</SelectItem>
                        <SelectItem value="custom">Custom DNS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-xl glass-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Multi-Hop Connection</span>
                      <Switch />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Route through multiple VPN servers for extra anonymity
                    </p>
                  </div>

                  <div className="p-4 rounded-xl glass-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Stealth Mode</span>
                      <Switch />
                    </div>
                    <p className="text-xs text-muted-foreground">Disguise VPN traffic as regular HTTPS traffic</p>
                  </div>

                  <div className="p-4 rounded-xl glass-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">MAC Address Randomization</span>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-xs text-muted-foreground">Change MAC address to prevent device tracking</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
