"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Zap, TrendingUp, ShoppingCart, Tag, RefreshCw } from "lucide-react"
import { useMarketplaceEvents } from "@/lib/flow/event-context"
import { cn } from "@/lib/utils"

interface MarketplaceActivity {
  id: string
  type: 'sale' | 'listing'
  nftId: string
  nftName?: string
  price: number
  currency: string
  seller: string
  buyer?: string
  timestamp: Date
  transactionId: string
}

interface RealTimeMarketplaceProps {
  onRefreshMarketplace?: () => void
  className?: string
}

export function RealTimeMarketplace({ onRefreshMarketplace, className }: RealTimeMarketplaceProps) {
  const [activities, setActivities] = useState<MarketplaceActivity[]>([])
  const [isLive, setIsLive] = useState(false)
  
  const { lastMarketplaceEvent, marketplaceUpdateCount } = useMarketplaceEvents()

  // Process real-time marketplace events
  useEffect(() => {
    if (lastMarketplaceEvent) {
      const activity: MarketplaceActivity = {
        id: `${lastMarketplaceEvent.type}-${lastMarketplaceEvent.transactionId}`,
        type: lastMarketplaceEvent.type.includes('SALE') ? 'sale' : 'listing',
        nftId: lastMarketplaceEvent.data.nftId,
        price: lastMarketplaceEvent.data.price,
        currency: lastMarketplaceEvent.data.currency || 'FLOW',
        seller: lastMarketplaceEvent.data.seller,
        buyer: lastMarketplaceEvent.data.buyer,
        timestamp: lastMarketplaceEvent.timestamp,
        transactionId: lastMarketplaceEvent.transactionId
      }

      setActivities(prev => [activity, ...prev].slice(0, 20)) // Keep last 20 activities
      setIsLive(true)
      
      // Auto-refresh marketplace if callback provided
      if (onRefreshMarketplace) {
        setTimeout(() => {
          onRefreshMarketplace()
        }, 1000) // Small delay to allow blockchain to update
      }
      
      // Remove live indicator after 3 seconds
      setTimeout(() => setIsLive(false), 3000)
    }
  }, [lastMarketplaceEvent, onRefreshMarketplace])

  const getActivityIcon = (type: string) => {
    return type === 'sale' ? (
      <ShoppingCart className="w-4 h-4 text-green-500" />
    ) : (
      <Tag className="w-4 h-4 text-blue-500" />
    )
  }

  const getActivityColor = (type: string) => {
    return type === 'sale' 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Live Marketplace Activity
            {isLive && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </CardTitle>
          {onRefreshMarketplace && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshMarketplace}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time marketplace transactions • {marketplaceUpdateCount} updates
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              No recent marketplace activity
            </p>
            <p className="text-muted-foreground/70 text-xs mt-1">
              Live updates will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2 p-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300",
                    index === 0 && isLive 
                      ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 animate-in slide-in-from-top-2" 
                      : "bg-muted/50"
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={cn("text-xs", getActivityColor(activity.type))}>
                        {activity.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        NFT #{activity.nftId} {activity.nftName && `"${activity.nftName}"`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === 'sale' ? (
                          <>
                            Sold by {formatAddress(activity.seller)} to {formatAddress(activity.buyer!)} 
                            for <span className="font-medium">{activity.price} {activity.currency}</span>
                          </>
                        ) : (
                          <>
                            Listed by {formatAddress(activity.seller)} 
                            for <span className="font-medium">{activity.price} {activity.currency}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Tx: {activity.transactionId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for sidebars or smaller spaces
export function CompactMarketplaceActivity({ className }: { className?: string }) {
  const { lastMarketplaceEvent, marketplaceUpdateCount } = useMarketplaceEvents()
  const [recentActivity, setRecentActivity] = useState<MarketplaceActivity | null>(null)

  useEffect(() => {
    if (lastMarketplaceEvent) {
      setRecentActivity({
        id: lastMarketplaceEvent.transactionId,
        type: lastMarketplaceEvent.type.includes('SALE') ? 'sale' : 'listing',
        nftId: lastMarketplaceEvent.data.nftId,
        price: lastMarketplaceEvent.data.price,
        currency: lastMarketplaceEvent.data.currency || 'FLOW',
        seller: lastMarketplaceEvent.data.seller,
        buyer: lastMarketplaceEvent.data.buyer,
        timestamp: lastMarketplaceEvent.timestamp,
        transactionId: lastMarketplaceEvent.transactionId
      })
    }
  }, [lastMarketplaceEvent])

  if (!recentActivity) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    )
  }

  return (
    <div className={cn("p-3 border rounded-lg bg-muted/50", className)}>
      <div className="flex items-center gap-2 mb-2">
        {recentActivity.type === 'sale' ? (
          <ShoppingCart className="w-4 h-4 text-green-500" />
        ) : (
          <Tag className="w-4 h-4 text-blue-500" />
        )}
        <Badge className={cn(
          "text-xs",
          recentActivity.type === 'sale' 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        )}>
          {recentActivity.type.toUpperCase()}
        </Badge>
      </div>
      
      <p className="text-sm font-medium mb-1">
        NFT #{recentActivity.nftId}
      </p>
      <p className="text-xs text-muted-foreground">
        {recentActivity.price} {recentActivity.currency} • Just now
      </p>
    </div>
  )
}