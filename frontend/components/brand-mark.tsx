import { ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  iconClassName?: string
  textClassName?: string
}

export function BrandMark({ className, iconClassName, textClassName }: BrandMarkProps) {
  return (
    <div
      role="img"
      aria-label="B-2-Torrent"
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-950 text-white ring-1 ring-white/10",
        className,
      )}
    >
      <ShieldCheck className={cn("h-4 w-4 text-green-400", iconClassName)} aria-hidden="true" />
      <span className={cn("text-xs font-bold leading-none tracking-normal text-white", textClassName)}>B2</span>
    </div>
  )
}
