import { ToolUnavailable } from "@/components/tool-unavailable"

export default function BandwidthMonitorPage() {
  return <ToolUnavailable title="Bandwidth monitor" description="System-wide transfer rates require operating-system telemetry." reason="The old screen generated random download, upload, total, and peak values. It has been removed rather than presenting fictional activity." alternative="Use your OS network monitor or the verified per-transfer statistics on the torrents page." />
}
