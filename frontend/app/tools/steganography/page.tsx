import { ToolUnavailable } from "@/components/tool-unavailable"

export default function SteganographyPage() {
  return <ToolUnavailable title="Steganography" description="Safe encoding needs a real, tested container format and authenticated encryption." reason="The previous UI simulated encoding and decoding without embedding or recovering data, yet reported success." alternative="Use the local authenticated file encryption tool; obscurity is not a substitute for encryption." href="/tools/encryption" />
}
