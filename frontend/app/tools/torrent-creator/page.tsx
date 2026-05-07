"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/i18n"
import { Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function TorrentCreatorPage() {
  const { t } = useLanguage()
  const [files, setFiles] = useState<FileList | null>(null)
  const [trackers, setTrackers] = useState("")
  const [comment, setComment] = useState("")

  const handleCreate = () => {
    if (!files || files.length === 0) {
      toast.error("Please select files")
      return
    }
    toast.success("Torrent file created successfully")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-500">
            <Upload className="h-6 w-6" />
            {t("torrentCreatorTitle")}
          </CardTitle>
          <CardDescription>{t("torrentCreatorDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Files/Folder</Label>
            <Input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="border-amber-500/30" />
          </div>

          <div className="space-y-2">
            <Label>Trackers (one per line)</Label>
            <Textarea
              placeholder="udp://tracker.example.com:6969/announce"
              value={trackers}
              onChange={(e) => setTrackers(e.target.value)}
              className="border-amber-500/30 min-h-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Input
              placeholder="Description of the torrent"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border-amber-500/30"
            />
          </div>

          <Button onClick={handleCreate} className="w-full bg-amber-600 hover:bg-amber-700">
            <Upload className="h-4 w-4 mr-2" />
            Create Torrent File
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
