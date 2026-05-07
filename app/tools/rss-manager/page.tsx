"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n"
import { Rss, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function RSSManagerPage() {
  const { t } = useLanguage()
  const [feeds, setFeeds] = useState<{ url: string; filter: string }[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [newFilter, setNewFilter] = useState("")

  const handleAdd = () => {
    if (!newUrl) return
    setFeeds([...feeds, { url: newUrl, filter: newFilter }])
    setNewUrl("")
    setNewFilter("")
    toast.success("RSS feed added")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-500">
            <Rss className="h-6 w-6" />
            {t("rssManagerTitle")}
          </CardTitle>
          <CardDescription>{t("rssManagerDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>RSS Feed URL</Label>
              <Input
                placeholder="https://example.com/rss"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="border-orange-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label>Filter (optional)</Label>
              <Input
                placeholder="keyword"
                value={newFilter}
                onChange={(e) => setNewFilter(e.target.value)}
                className="border-orange-500/30"
              />
            </div>
            <Button onClick={handleAdd} className="w-full bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Active Feeds</Label>
            {feeds.map((feed, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 border border-orange-500/20 rounded-lg">
                <div className="flex-1 text-sm">{feed.url}</div>
                <Button variant="ghost" size="sm" onClick={() => setFeeds(feeds.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
