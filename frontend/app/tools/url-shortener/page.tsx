import { ToolUnavailable } from "@/components/tool-unavailable"

export default function URLShortenerPage() {
  return (
    <ToolUnavailable
      title="URL shortener"
      description="A short link requires a real redirect service and a retention policy. This app will not invent links that do not resolve."
      reason="The previous implementation generated a random b2t.sh address without storing any redirect."
      alternative="Share the original URL or use a service whose logging and deletion policy you have reviewed."
    />
  )
}
