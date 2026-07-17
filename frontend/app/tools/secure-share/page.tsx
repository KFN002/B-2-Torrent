import { ToolUnavailable } from "@/components/tool-unavailable"

export default function SecureSharePage() {
  return <ToolUnavailable title="Secure share" description="Peer discovery and encrypted transfer need an authenticated protocol and real device consent." reason="The previous peers and transfer progress were mock objects. No secure channel, identity verification, or delivery guarantee existed." alternative="Encrypt the file locally first, then transfer it through a separately verified channel." href="/encryption" />
}
