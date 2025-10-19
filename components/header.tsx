"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EventNotifications, RealTimeIndicator } from "@/components/event-notifications"
import { CompactRealTimeIndicator } from "@/components/real-time-integration"

export function Header() {
  const { isConnected, user, connect, disconnect } = useWallet()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <span className="text-background font-bold text-sm">O</span>
            </div>
            <span className="text-xl font-bold">Ownly</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              Home
            </Link>
            <Link href="/marketplace" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              Marketplace
            </Link>
            <Link href="/mint" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              Create
            </Link>
            {isConnected && (
              <Link href="/profile" className="text-sm font-medium hover:text-muted-foreground transition-colors">
                Profile
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isConnected && <CompactRealTimeIndicator />}
            {isConnected && <EventNotifications />}
            {isConnected && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName} />
                      <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet">My Wallet</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={disconnect}>Disconnect</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={connect}>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
      <RealTimeIndicator />
    </header>
        </div>
      </div>
    </header>
  )
}
