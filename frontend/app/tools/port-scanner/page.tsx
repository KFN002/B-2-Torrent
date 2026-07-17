import { ToolUnavailable } from "@/components/tool-unavailable"

export default function PortScannerPage() {
  return <ToolUnavailable title="Port scanner" description="A browser cannot reliably perform a consent-aware TCP port scan." reason="The old implementation randomly labeled ports as open. It neither scanned the target nor produced evidence-backed results." alternative="Use an authorized network scanner only on systems you own or have explicit permission to test." />
}
