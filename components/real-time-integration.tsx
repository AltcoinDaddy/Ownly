"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useBlockchainEvents } from "@/lib/flow/hooks"
import { BlockchainEvent } from "@/lib/flow/events"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Activity, RefreshCw, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface RealTimeIntegrationProps {
  onNFTUpdate?: () => void
  onMarketplaceUpdate?: () => void
  showIndicator?: boolean
  showToasts?: boolean
  className?: string
}

export function RealTimeIntegration({
  onNFTUpdate,
  onMarketplaceUpdate,
  showIndicator = true,
  showToasts = true,
  className
}: RealTimeIntegrationProps) {
  const { address } = useWallet()
  const [recentEvents, setRecentEvents] = useState<BlockchainEvent[]>([])
  const [isLive, setIsLive] = useState(false)
  const [eventCount, setEventCount] = useState(0)

  // Listen to all blockchain events
  const { events, latestEvent, isConnected } = useBlockchainEvents({
    onMint: (event) => {
      handleEvent(event, 'mint')
      if (onNFTUpdate) onNFTUpdate()
    },
    onTransfer: (event) => {
      handleEvent(event, 'transfer')
      if (onNFTUpdate) onNFTUpdate()
    },
    onSale: (event) => {
      handleEvent(event, 'sale')
      if (onMarketplaceUpdate) onMarketplaceUpdate()
      if (onNFTUpdate) onNFTUpdate()
    },
    onListing: (event) => {
      handleEvent(event, 'listing')
      if (onMarketplaceUpdate) onMarketplaceUpdate()
    }
  })

  const handleEvent = (event: BlockchainEvent, type: string) => {
    setRecentEvents(prev => [event, ...prev].slice(0, 10))
    setEventCount(prev => prev + 1)
    setIsLive(true)

    // Show toast notifications if enabled
    if (showToasts) {
      showEventToast(event, type)
    }

    // Remove live indicator after 3 seconds
    setTimeout(() => setIsLive(false), 3000)
  }

  const showEventToast = (event: BlockchainEvent, type: string) => {
    const { data } = event
    
    switch (type) {
      case 'mint':
        if (address === data.recipient) {
          toast.success("NFT Minted!", {
            description: `Your NFT #${data.nftId} has been minted`,
            duration: 5000
          })
        } else {
          toast.info("New NFT Minted", {
            description: `NFT #${data.nftId} was minted`,
            duration: 3000
          })
        }
        break

      case 'transfer':
        if (address === data.to) {
          toast.success("NFT Received!", {
            description: `You received NFT #${data.nftId}`,
            duration: 5000
          })
        } else if (address === data.from) {
          toast.info("NFT Transferred", {
            description: `NFT #${data.nftId} has been sent`,
            duration: 4000
          })
        }
        break

      case 'sale':
        if (address === data.seller) {
          toast.success("NFT Sold!", {
            description: `Your NFT #${data.nftId} sold for ${data.price} ${data.currency}`,
            duration: 6000
          })
        } else if (address === data.buyer) {
          toast.success("NFT Purchased!", {
            description: `You bought NFT #${data.nftId} for ${data.price} ${data.currency}`,
            duration: 6000
          })
        } else {
          toast.info("NFT Sale", {
            description: `NFT #${data.nftId} sold for ${data.price} ${data.currency}`,
            duration: 3000
          })
        }
        break

      case 'listing':
        if (address === data.seller) {
          toast.success("NFT Listed!", {
            description: `Your NFT #${data.nftId} is now listed for ${data.price} ${data.currency}`,
            duration: 5000
          })
        } else {
          toast.info("New NFT Listed", {
            description: `NFT #${data.nftId} listed for ${data.price} ${data.currency}`,
            duration: 3000
          })
        }
        break
    }
  }

  if (!showIndicator) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Live Status Indicator */}
      {isConnected && (
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all",
            isLive 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-green-500" : "bg-gray-400"
            )} />
            {isLive ? "Live Update" : "Connected"}
          </div>
          
          {eventCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {eventCount} events
            </Badge>
          )}
        </div>
      )}

      {/* Recent Events Summary */}
      {recentEvents.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Activity</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {recentEvents.length} recent events
              </span>
            </div>
            
            <div className="mt-2 space-y-1">
              {recentEvents.slice(0, 3).map((event, index) => (
                <div key={event.transactionId} className="text-xs text-muted-foreground">
                  {getEventDescription(event)}
                </div>
              ))}
              {recentEvents.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{recentEvents.length - 3} more events
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getEventDescription(event: BlockchainEvent): string {
  const { type, data, timestamp } = event
  const timeAgo = getTimeAgo(timestamp)
  
  switch (type) {
    case 'COLLECTIBLE_MINTED':
      return `NFT #${data.nftId} minted ${timeAgo}`
    case 'COLLECTIBLE_TRANSFERRED':
      return `NFT #${data.nftId} transferred ${timeAgo}`
    case 'SALE_COMPLETED':
      return `NFT #${data.nftId} sold for ${data.price} ${data.currency} ${timeAgo}`
    case 'LISTING_CREATED':
      return `NFT #${data.nftId} listed for ${data.price} ${data.currency} ${timeAgo}`
    default:
      return `Event occurred ${timeAgo}`
  }
}

function getTimeAgo(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  
  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Compact version for headers or sidebars
export function CompactRealTimeIndicator({ className }: { className?: string }) {
  const [isLive, setIsLive] = useState(false)
  const [eventCount, setEventCount] = useState(0)

  useBlockchainEvents({
    onMint: () => handleEvent(),
    onTransfer: () => handleEvent(),
    onSale: () => handleEvent(),
    onListing: () => handleEvent()
  })

  const handleEvent = () => {
    setEventCount(prev => prev + 1)
    setIsLive(true)
    setTimeout(() => setIsLive(false), 3000)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-all",
        isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
      )} />
      {eventCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {eventCount}
        </Badge>
      )}
    </div>
  )
}

// Hook for components that need real-time event data
export function useRealTimeEvents() {
  const [events, setEvents] = useState<BlockchainEvent[]>([])
  const [isLive, setIsLive] = useState(false)
  const [lastEvent, setLastEvent] = useState<BlockchainEvent | null>(null)

  useBlockchainEvents({
    onMint: (event) => handleEvent(event),
    onTransfer: (event) => handleEvent(event),
    onSale: (event) => handleEvent(event),
    onListing: (event) => handleEvent(event)
  })

  const handleEvent = (event: BlockchainEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 50))
    setLastEvent(event)
    setIsLive(true)
    setTimeout(() => setIsLive(false), 3000)
  }

  return {
    events,
    lastEvent,
    isLive,
    eventCount: events.length
  }
}