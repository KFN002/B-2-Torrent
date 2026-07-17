import { ToolUnavailable } from "@/components/tool-unavailable"

export default function TorrentHealthPage() {
  return <ToolUnavailable title="Torrent health checker" description="Real health data requires contacting trackers or peers." reason="The previous screen returned random seed, peer, and completion counts. It has been disabled, and this audit performs no torrent or tracker traffic." alternative="Inspect a torrent only when you explicitly choose to use a trusted client and understand that peers can observe your IP." />
}
