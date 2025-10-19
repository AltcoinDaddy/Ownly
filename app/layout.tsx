import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { WalletProvider } from "@/lib/wallet-context"
import { EventProvider } from "@/lib/flow/event-context"
import { PerformanceInit } from "@/components/performance-init"
import { DatabaseInit } from "@/components/database-init"
import { NotificationSystem } from "@/components/notification-system"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Ownly - NFT Marketplace on Flow",
  description: "Mint, trade, and showcase authentic digital collectibles on Flow blockchain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <WalletProvider>
            <EventProvider>
              <PerformanceInit />
              <DatabaseInit />
              <NotificationSystem enableToasts={true} enableBrowserNotifications={true} />
              {children}
              <Toaster />
            </EventProvider>
          </WalletProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
