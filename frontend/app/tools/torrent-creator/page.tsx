import { ToolUnavailable } from "@/components/tool-unavailable"

export default function TorrentCreatorPage() {
  return (
    <ToolUnavailable
      title="Torrent creator"
      description="The previous page reported success without producing a torrent file. It is disabled until real, verified metadata generation is implemented."
      reason="A false success state could cause data-sharing mistakes and was not safe to present as functional."
      alternative="Create and verify metadata with a trusted offline tool outside this application."
    />
  )
}
