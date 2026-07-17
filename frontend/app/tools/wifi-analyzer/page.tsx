import { ToolUnavailable } from "@/components/tool-unavailable"

export default function WifiAnalyzerPage() {
  return <ToolUnavailable title="Wi-Fi analyzer" description="Browser pages do not have access to nearby wireless scan results." reason="The prior networks and signal strengths were static mock data and could not describe the user's environment." alternative="Use the operating system's wireless diagnostics while minimizing location-sensitive data collection." />
}
