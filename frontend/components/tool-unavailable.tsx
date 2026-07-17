import Link from "next/link"
import { ArrowRight, Construction, ShieldAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ToolUnavailableProps = {
  title: string
  description: string
  reason: string
  alternative?: string
  href?: string
}

export function ToolUnavailable({ title, description, reason, alternative, href }: ToolUnavailableProps) {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-black px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,.1),transparent_34rem)]" />
      <Card className="relative mx-auto max-w-2xl border-white/10 bg-card/70 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-5">
          <Badge variant="outline" className="w-fit border-amber-400/30 bg-amber-400/10 text-amber-200">
            <Construction className="mr-2 h-4 w-4" /> Not implemented
          </Badge>
          <div>
            <CardTitle className="text-3xl sm:text-4xl">{title}</CardTitle>
            <p className="mt-3 text-lg leading-8 text-muted-foreground">{description}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-400/20 bg-amber-400/[0.06]">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            <AlertTitle>No fabricated result</AlertTitle>
            <AlertDescription className="text-muted-foreground">{reason}</AlertDescription>
          </Alert>
          {alternative && <p className="text-sm leading-6 text-muted-foreground">Safer alternative: {alternative}</p>}
          <Button asChild variant="outline" className="bg-background/30">
            <Link href={href ?? "/mini-apps"}>Back to available tools <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
