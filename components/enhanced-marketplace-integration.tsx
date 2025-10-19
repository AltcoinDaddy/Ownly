"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useMarketplaceEvents } from "@/lib/flow/event-context"
import { useBlockchainEvents } from "@/lib/flow/hooks"
import { BlockchainEvent } from "@/lib/flow/events"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  TrendingUp, 
  ShoppingCart, 
  Tag, 
  Zap, 
  RefreshCw, 
  DollarSign,
  Activity,
  Clock,
  User
} from "lucide-react"
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
  isUserInvolved: boolean
}

interface EnhancedMarketplaceIntegrationProps {
  onMarketplaceRefresh?: () => void
  onListingUpdate?: (nftId: string, eventType: string) => void
  showActivity?: boolean
  showStats?: boolean
  autoRefresh?: boolean
  className?: string
}

export function EnhancedMarketplaceIntegration({
  onMarketplaceRefresh,
  onListingUpdate,
  showActivity = true,
  showStats = true,
  autoRefresh = true,
  className
}: EnhancedMarketplaceIntegrationProps) {
  const { address } = useWallet()
  const [activities, setActivities] = useState<MarketplaceActivity[]>([])
  const [isLive, setIsLive] = useState(false)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalVolume: 0,
    activeListings: 0,
    userSales: 0,
    userPurchases: 0
  })

  const { lastMarketplaceEvent, marketplaceUpdateCount } = useMarketplaceEvents()

  // Enhanced marketplace event processing
  const processMarketplaceEvent = useCallback((event: BlockchainEvent) => {
    const isUserInvolved = address && (
      event.data.seller === address || 
      event.data.buyer === address
    )

    const activity: MarketplaceActivity = {
      id: `${event.type}-${event.transactionId}-${Date.now()}`,
      type: event.type.includes('SALE') ? 'sale' : 'listing',
      nftId: event.data.nftId,
      price: parseFloat(event.data.price) || 0,
      currency: event.data.currency || 'FLOW',
      seller: event.data.seller,
      buyer: event.data.buyer,
      timestamp: event.timestamp,
      transactionId: event.transactionId,
      isUserInvolved: !!isUserInvolved
    }

    // Update activities
    setActivities(prev => [activity, ...prev].slice(0, 50))
    setIsLive(true)

    // Update stats
    setStats(prev => {
      const newStats = { ...prev }
      
      if (activity.type === 'sale') {
        newStats.totalSales += 1
        newStats.totalVolume += activity.price
        
        if (address === activity.seller) {
          newStats.userSales += 1
        }
        if (address === activity.buyer) {
          newStats.userPurchases += 1
        }
      } else if (activity.type === 'listing') {
        newStats.activeListings += 1
      }
      
      return newStats
    })

    // Show enhanced notifications
    showMarketplaceNotification(activity)

    // Trigger callbacks
    if (onListingUpdate) {
      onListingUpdate(activity.nftId, activity.type)
    }

    if (autoRefresh && onMarketplaceRefresh) {
      setTimeout(() => onMarketplaceRefresh(), 1500)
    }

    // Remove live indicator
    setTimeout(() => setIsLive(false), 4000)
  }, [address, onListingUpdate, onMarketplaceRefresh, autoRefresh])

  // Listen to marketplace events
  useBlockchainEvents({
    onSale: processMarketplaceEvent,
    onListing: processMarketplaceEvent
  })

  const showMarketplaceNotification = (activity: MarketplaceActivity) => {
    if (activity.type === 'sale') {
      if (activity.seller === address) {
        toast.success("💰 Your NFT Sold!", {
          description: `NFT #${activity.nftId} sold for ${activity.price} ${activity.currency}`,
          duration: 6000,
          action: {
            label: "View Profile",
            onClick: () => window.location.href = `/profile`
          }
        })
      } else if (activity.buyer === address) {
        toast.success("🎉 Purchase Successful!", {
          description: `You bought NFT #${activity.nftId} for ${activity.price} ${activity.currency}`,
          duration: 6000,
          action: {
            label: "View NFT",
            onClick: () => window.location.href = `/nft/${activity.nftId}`
          }
        })
      } else {
        toast.info("💸 NFT Sale", {
          description: `NFT #${activity.nftId} sold for ${activity.price} ${activity.currency}`,
          duration: 3000
        })
      }
    } else if (activity.type === 'listing') {
      if (activity.seller === address) {
        toast.success("🏷️ NFT Listed Successfully!", {
          description: `Your NFT #${activity.nftId} is now listed for ${activity.price} ${activity.currency}`,
          duration: 5000,
          action: {
            label: "View Marketplace",
            onClick: () => window.location.href = `/marketplace`
          }
        })
      } else {
        toast.info("🆕 New NFT Listed", {
          description: `NFT #${activity.nftId} listed for ${activity.price} ${activity.currency}`,
          duration: 3000
        })
      }
    }
  }

  const formatTime = (timestamp: Date) => {
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getActivityIcon = (type: string, isUserInvolved: boolean) => {
    if (type === 'sale') {
      return (
        <ShoppingCart className={cn(
          "w-4 h-4",
          isUserInvolved ? "text-green-600" : "text-green-500"
        )} />
      )
    }
    return (
      <Tag className={cn(
        "w-4 h-4",
        isUserInvolved ? "text-blue-600" : "text-blue-500"
      )} />
    )
  }

  const getActivityColor = (type: string, isUserInvolved: boolean) => {
    if (type === 'sale') {
      return isUserInvolved 
        ? "bg-green-100 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
        : "bg-green-50 text-green-800 border-green-100 dark:bg-green-950 dark:text-green-200 dark:border-green-900"
    }
    return isUserInvolved
      ? "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800"
      : "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900"
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Live Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-lg font-bold">{stats.totalSales}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="text-lg font-bold">{stats.totalVolume.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Active Listings</p>
                <p className="text-lg font-bold">{stats.activeListings}</p>
              </div>
            </div>
          </Card>
          
          {address && (
            <>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Your Sales</p>
                    <p className="text-lg font-bold">{stats.userSales}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Your Purchases</p>
                    <p className="text-lg font-bold">{stats.userPurchases}</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Live Activity Feed */}
      {showActivity && (
        <Card>
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
              {onMarketplaceRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarketplaceRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Real-time marketplace transactions</span>
              <Badge variant="outline">{marketplaceUpdateCount} updates</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">
                  No recent marketplace activity
                </p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Live updates will appear here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-1 p-4">
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300",
                        index === 0 && isLive 
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 animate-in slide-in-from-top-2 shadow-sm" 
                          : "bg-muted/30 hover:bg-muted/50",
                        activity.isUserInvolved && "ring-1 ring-blue-200 dark:ring-blue-800"
                      )}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type, activity.isUserInvolved)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={cn(
                            "text-xs border",
                            getActivityColor(activity.type, activity.isUserInvolved)
                          )}>
                            {activity.type.toUpperCase()}
                            {activity.isUserInvolved && " (YOU)"}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTime(activity.timestamp)}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            NFT #{activity.nftId}
                            {activity.nftName && ` "${activity.nftName}"`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.type === 'sale' ? (
                              <>
                                Sold by {formatAddress(activity.seller)} to {formatAddress(activity.buyer!)} 
                                for <span className="font-medium text-green-600">{activity.price} {activity.currency}</span>
                              </>
                            ) : (
                              <>
                                Listed by {formatAddress(activity.seller)} 
                                for <span className="font-medium text-blue-600">{activity.price} {activity.currency}</span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Tx: {activity.transactionId.slice(0, 12)}...
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
      )}
    </div>
  )
}

// Compact marketplace activity widget
export function CompactMarketplaceActivity({ 
  className,
  maxItems = 3 
}: { 
  className?: string
  maxItems?: number 
}) {
  const [recentActivities, setRecentActivities] = useState<MarketplaceActivity[]>([])
  const { address } = useWallet()

  useBlockchainEvents({
    onSale: (event) => addActivity(event, 'sale'),
    onListing: (event) => addActivity(event, 'listing')
  })

  const addActivity = (event: BlockchainEvent, type: 'sale' | 'listing') => {
    const activity: MarketplaceActivity = {
      id: event.transactionId,
      type,
      nftId: event.data.nftId,
      price: parseFloat(event.data.price) || 0,
      currency: event.data.currency || 'FLOW',
      seller: event.data.seller,
      buyer: event.data.buyer,
      timestamp: event.timestamp,
      transactionId: event.transactionId,
      isUserInvolved: !!(address && (event.data.seller === address || event.data.buyer === address))
    }

    setRecentActivities(prev => [activity, ...prev].slice(0, maxItems))
  }

  if (recentActivities.length === 0) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {recentActivities.map((activity) => (
        <div key={activity.id} className="p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            {activity.type === 'sale' ? (
              <ShoppingCart className="w-4 h-4 text-green-500" />
            ) : (
              <Tag className="w-4 h-4 text-blue-500" />
            )}
            <Badge className={cn(
              "text-xs",
              activity.type === 'sale' 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            )}>
              {activity.type.toUpperCase()}
            </Badge>
            {activity.isUserInvolved && (
              <Badge variant="outline" className="text-xs">YOU</Badge>
            )}
          </div>
          
          <p className="text-sm font-medium mb-1">
            NFT #{activity.nftId}
          </p>
          <p className="text-xs text-muted-foreground">
            {activity.price} {activity.currency} • Just now
          </p>
        </div>
      ))}
    </div>
  )
}