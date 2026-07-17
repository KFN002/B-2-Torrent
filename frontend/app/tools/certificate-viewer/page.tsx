import { ToolUnavailable } from "@/components/tool-unavailable"

export default function CertificateViewerPage() {
  return <ToolUnavailable title="TLS certificate viewer" description="Certificate inspection needs a real TLS handshake through a trusted backend." reason="The previous screen invented issuer, validity, serial number, SANs, and key size. It is disabled until verified certificate retrieval is implemented." alternative="Use your browser's certificate panel or OpenSSL directly against a host you intend to contact." />
}
