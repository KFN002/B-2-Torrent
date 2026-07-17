"use client"

import Link from "next/link"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import {
  Download,
  Shield,
  Activity,
  Info,
  Menu,
  Home,
  Book,
  Sparkles,
  Network,
  HardDrive,
  Lock,
  Fingerprint,
  Vault,
  ChevronDown,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"
import { InfoDialog } from "@/components/info-dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { t } = useLanguage()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  type NavItem = {
    href: string
    label: string
    icon: LucideIcon
    beta?: boolean
  }

  const primaryNav: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/torrents", label: "Torrents", icon: Download },
    { href: "/network", label: "Network", icon: Network },
    { href: "/vault", label: "Vault", icon: Vault },
  ]

  const securityNav: NavItem[] = [
    { href: "/security", label: "Security Center", icon: Shield },
    { href: "/encryption", label: "Encryption", icon: Lock },
    { href: "/device-security", label: "Device Security", icon: HardDrive },
  ]

  const toolsNav: NavItem[] = [
    { href: "/mini-apps", label: "Mini Apps", icon: Sparkles },
    { href: "/ip-dashboard", label: "IP Dashboard", icon: Activity },
    { href: "/search", label: "Search", icon: Sparkles, beta: true },
    { href: "/about", label: "About", icon: Book },
    { href: "/auth", label: "Identity", icon: Fingerprint },
  ]

  const allNavItems = [...primaryNav, ...securityNav, ...toolsNav]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        <div className="container flex h-14 items-center justify-between px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/30 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <BrandMark
                className="relative h-9 w-9 bg-card group-hover:ring-green-500/30 transition-all"
                iconClassName="h-4 w-4"
                textClassName="sr-only"
              />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <div className="hidden sm:block">
              <p className="text-base font-semibold tracking-tight text-white">B-2-Torrent</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Self-Hosted</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Primary Links */}
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-foreground/80 hover:text-foreground hover:bg-white/10 font-medium h-8 px-3"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            ))}

            {/* Security Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-green-300 hover:text-green-200 hover:bg-green-500/10 font-medium h-8 px-3"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-sm">Security</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52 bg-popover text-popover-foreground border-border">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">Security Tools</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {securityNav.map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="focus:bg-accent">
                    <Link href={item.href} className="flex items-center gap-2.5 cursor-pointer">
                      <item.icon className="h-4 w-4 text-green-300" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-foreground/80 hover:text-foreground hover:bg-white/10 font-medium h-8 px-3"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-sm">Tools</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-popover text-popover-foreground border-border">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">Utilities</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {toolsNav.map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="focus:bg-accent">
                    <Link href={item.href} className="flex items-center gap-2.5 cursor-pointer">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                      {item.beta && (
                        <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          BETA
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsInfoOpen(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <Info className="h-4 w-4" />
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-72 bg-popover text-popover-foreground border-l border-border p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <BrandMark className="h-8 w-8 bg-card" iconClassName="h-4 w-4" textClassName="sr-only" />
                      <div>
                        <h2 className="text-sm font-semibold text-white">B-2-Torrent</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Laptop + PC</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Nav Items */}
                  <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {allNavItems.map((item) => {
                      const isSecure = securityNav.some((s) => s.href === item.href)
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                          <div
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                              isSecure
                                ? "text-green-300 hover:bg-green-500/10"
                                : "text-foreground/80 hover:text-foreground hover:bg-white/10"
                            }`}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.beta && (
                              <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                BETA
                              </Badge>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="p-4 border-t border-border">
                    <p className="text-[10px] text-muted-foreground text-center">Self-hosted. Local. Private.</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <InfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
    </>
  )
}
