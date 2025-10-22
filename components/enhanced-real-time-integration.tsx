"use client"

import { useEffect, useState, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useEvents } from "@/lib/flow/event-context"
import { useBlockchainEvents } from "@/lib/flow/hooks"
import { BlockchainEvent } from "@/lib/flow/events"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Activity, RefreshCw, Bell, CheckCircle, ArrowRightLeft, ShoppingCart, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedRealTimeIntegrationProps {
  onGalleryUpdate?: () => void
  onMarketplaceUpdate?: () => void
  onNFTUpdate?: (nftId: string, eventType: string) => void
  showNotifications?: boolean
  showIndicator?: boolean
  autoRefresh?: boolean
  className?: string
}

export function EnhancedRealTimeIntegration({
  onGalleryUpdate,
  onMarketplaceUpdate,
  onNFTUpdate,
  showNotifications = true,
  showIndicator = true,
  autoRefresh = true,
  className
}: EnhancedRealTimeIntegrationProps) {
  const { address } = useWallet()
  const [recentEvents, setRecentEvents] = useState<BlockchainEvent[]>([])
  const [isLive, setIsLive] = useState(false)
  const [eventCount, setEventCount] = useState(0)
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)

  // Enhanced event handling with user-specific logic
  const handleEvent = useCallback((event: BlockchainEvent, eventType: string) => {
    setRecentEvents(prev => [event, ...prev].slice(0, 20))
    setEventCount(prev => prev + 1)
    setIsLive(true)
    setLastEventTime(new Date())

    const { data } = event
    const isUserEvent = address && (
      data.recipient === address || 
      data.to === address || 
      data.from === address ||
      data.seller === address ||
      data.buyer === address
    )

    // Trigger appropriate callbacks
    if (eventType === 'mint' || eventType === 'transfer') {
      if (onGalleryUpdate && (isUserEvent || autoRefresh)) {
        setTimeout(() => onGalleryUpdate(), 1000)
      }
    }

    if (eventType === 'sale' || eventType === 'listing') {
      if (onMarketplaceUpdate) {
        setTimeout(() => onMarketplaceUpdate(), 1000)
      }
      if (onGalleryUpdate && isUserEvent) {
        setTimeout(() => onGalleryUpdate(), 1500)
      }
    }

    // Notify about specific NFT updates
    if (onNFTUpdate && data.nftId) {
      onNFTUpdate(data.nftId, eventType)
    }

    // Show enhanced notifications
    if (showNotifications) {
      showEnhancedNotification(event, eventType, isUserEvent)
    }

    // Remove live indicator after 3 seconds
    setTimeout(() => setIsLive(false), 3000)
  }, [address, onGalleryUpdate, onMarketplaceUpdate, onNFTUpdate, showNotifications, autoRefresh])

  // Listen to all blockchain events with enhanced processing
  useBlockchainEvents({
    onMint: (event) => handleEvent(event, 'mint'),
    onTransfer: (event) => handleEvent(event, 'transfer'),
    onSale: (event) => handleEvent(event, 'sale'),
    onListing: (event) => handleEvent(event, 'listing')
  })

  const showEnhancedNotification = (event: BlockchainEvent, type: string, isUserEvent: boolean) => {
    const { data } = event
    
    switch (type) {
      case 'mint':
        if (isUserEvent) {
          toast.success("🎉 NFT Minted Successfully!", {
            description: `Your NFT #${data.nftId} has been minted and added to your collection`,
            duration: 6000,
            action: {
              label: "View NFT",
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/nft/${data.nftId}`
                }
              }
            }
          })
        } else {
          toast.info("✨ New NFT Minted", {
            description: `NFT #${data.nftId} was minted by ${formatAddress(data.creator)}`,
            duration: 3000
          })
        }
        break

      case 'transfer':
        if (data.to === address) {
          toast.success("📥 NFT Received!", {
            description: `You received NFT #${data.nftId} from ${formatAddress(data.from)}`,
            duration: 5000,
            action: {
              label: "View Collection",
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/profile`
                }
              }
            }
          })
        } else if (data.from === address) {
          toast.info("📤 NFT Transferred", {
            description: `NFT #${data.nftId} sent to ${formatAddress(data.to)}`,
            duration: 4000
          })
        } else {
          toast.info("🔄 NFT Transfer", {
            description: `NFT #${data.nftId} transferred`,
            duration: 2000
          })
        }
        break

      case 'sale':
        if (data.seller === address) {
          toast.success("💰 NFT Sold!", {
            description: `Your NFT #${data.nftId} sold for ${data.price} ${data.currency}`,
            duration: 6000,
            action: {
              label: "View Transaction",
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/profile`
                }
              }
            }
          })
        } else if (data.buyer === address) {
          toast.success("🛒 NFT Purchased!", {
            description: `You bought NFT #${data.nftId} for ${data.price} ${data.currency}`,
            duration: 6000,
            action: {
              label: "View NFT",
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/nft/${data.nftId}`
                }
              }
            }
          })
        } else {
          toast.info("💸 NFT Sale", {
            description: `NFT #${data.nftId} sold for ${data.price} ${data.currency}`,
            duration: 3000
          })
        }
        break

      case 'listing':
        if (data.seller === address) {
          toast.success("🏷️ NFT Listed!", {
            description: `Your NFT #${data.nftId} is now listed for ${data.price} ${data.currency}`,
            duration: 5000,
            action: {
              label: "View Marketplace",
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/marketplace`
                }
              }
            }
          })
        } else {
          toast.info("🆕 New NFT Listed", {
            description: `NFT #${data.nftId} listed for ${data.price} ${data.currency}`,
            duration: 3000,
            action: {
              label: "View Marketplace",
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/marketplace`
                }
              }
            }
          })
        }
        break
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'COLLECTIBLE_MINTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'COLLECTIBLE_TRANSFERRED':
        return <ArrowRightLeft className="w-4 h-4 text-blue-500" />
      case 'SALE_COMPLETED':
        return <ShoppingCart className="w-4 h-4 text-purple-500" />
      case 'LISTING_CREATED':
        return <Tag className="w-4 h-4 text-orange-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getEventDescription = (event: BlockchainEvent): string => {
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

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return timestamp.toLocaleDateString()
  }

  if (!showIndicator) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Enhanced Live Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            isLive 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse shadow-lg"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-green-500 animate-ping" : "bg-gray-400"
            )} />
            {isLive ? "Live Update" : "Connected"}
          </div>
          
          {eventCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {eventCount} events
            </Badge>
          )}
        </div>

        {lastEventTime && (
          <span className="text-xs text-muted-foreground">
            Last: {lastEventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Enhanced Recent Events Summary */}
      {recentEvents.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Blockchain Activity</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {recentEvents.length} events
              </Badge>
            </div>
            
            <div className="space-y-2">
              {recentEvents.slice(0, 5).map((event, index) => (
                <div 
                  key={`${event.transactionId}-${index}`} 
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg transition-all",
                    index === 0 && isLive 
                      ? "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800" 
                      : "bg-muted/50"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {getEventDescription(event)}
                    </p>
                    {event.data.nftId && address && (
                      event.data.recipient === address || 
                      event.data.to === address || 
                      event.data.from === address ||
                      event.data.seller === address ||
                      event.data.buyer === address
                    ) && (
                      <Badge className="mt-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Your NFT
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {recentEvents.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  +{recentEvents.length - 5} more events
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Compact version for headers or navigation
export function CompactRealTimeIndicator({ 
  className,
  showCount = true 
}: { 
  className?: string
  showCount?: boolean 
}) {
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
        isLive ? "bg-green-500 animate-pulse shadow-lg" : "bg-gray-400"
      )} />
      {showCount && eventCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {eventCount}
        </Badge>
      )}
    </div>
  )
}

// Hook for components that need enhanced real-time event data
export function useEnhancedRealTimeEvents() {
  const [events, setEvents] = useState<BlockchainEvent[]>([])
  const [isLive, setIsLive] = useState(false)
  const [lastEvent, setLastEvent] = useState<BlockchainEvent | null>(null)
  const [userEvents, setUserEvents] = useState<BlockchainEvent[]>([])
  const { address } = useWallet()

  useBlockchainEvents({
    onMint: (event) => handleEvent(event),
    onTransfer: (event) => handleEvent(event),
    onSale: (event) => handleEvent(event),
    onListing: (event) => handleEvent(event)
  })

  const handleEvent = (event: BlockchainEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 100))
    setLastEvent(event)
    setIsLive(true)
    
    // Track user-specific events
    const isUserEvent = address && (
      event.data.recipient === address || 
      event.data.to === address || 
      event.data.from === address ||
      event.data.seller === address ||
      event.data.buyer === address
    )
    
    if (isUserEvent) {
      setUserEvents(prev => [event, ...prev].slice(0, 50))
    }
    
    setTimeout(() => setIsLive(false), 3000)
  }

  return {
    events,
    userEvents,
    lastEvent,
    isLive,
    eventCount: events.length,
    userEventCount: userEvents.length
  }
}