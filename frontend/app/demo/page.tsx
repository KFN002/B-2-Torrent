import { ToolUnavailable } from "@/components/tool-unavailable"

export default function DemoPage() {
  return (
    <ToolUnavailable
      title="Demo dataset"
      description="The former demo button called an endpoint that does not exist and could not create a reliable isolated dataset."
      reason="A demo must be explicitly separated from production state and must never trigger network or torrent activity."
      alternative="Use the read-only dashboards and unavailable-tool explanations to review the interface without starting services."
    />
  )
}
