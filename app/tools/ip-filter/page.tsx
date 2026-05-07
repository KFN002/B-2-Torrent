"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n"
import { Shield, Upload, Download } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function IPFilterPage() {
  const { t } = useLanguage()
  const [ipList, setIpList] = useState("")

  const handleImport = () => {
    toast.success("IP blocklist imported")
  }

  const handleExport = () => {
    const blob = new Blob([ipList], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ip-blocklist.txt"
    a.click()
    toast.success("Blocklist exported")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Shield className="h-6 w-6" />
            {t("ipFilterTitle")}
          </CardTitle>
          <CardDescription>{t("ipFilterDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>IP Blocklist (CIDR format)</Label>
            <Textarea
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              value={ipList}
              onChange={(e) => setIpList(e.target.value)}
              className="border-red-500/30 min-h-64 font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={handleImport} className="flex-1 bg-red-600 hover:bg-red-700">
              <Upload className="h-4 w-4 mr-2" />
              Import Blocklist
            </Button>
            <Button onClick={handleExport} variant="outline" className="flex-1 border-red-500/50 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Blocklist
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
