import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { WalletProvider } from "@/lib/wallet-context"
import { EventProvider } from "@/lib/flow/event-context"
import { PerformanceInit } from "@/components/performance-init"
import { DatabaseInit } from "@/components/database-init"
import { HydrationInit } from "@/components/hydration-init"
import { HydrationErrorBoundary } from "@/components/hydration-error-boundary"
import { HydrationDashboard } from "@/components/hydration-dashboard"
import { NotificationSystem } from "@/components/notification-system"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { LoadingFallback } from "@/components/loading-fallback"
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <HydrationErrorBoundary enableRecovery={true} showErrorDetails={process.env.NODE_ENV === 'development'}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={<LoadingFallback variant="minimal" />}>
              <HydrationInit />
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
            <HydrationDashboard />
          </ThemeProvider>
        </HydrationErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
