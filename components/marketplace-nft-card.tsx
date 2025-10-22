"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Heart, ShoppingCart, Clock, User, Zap } from "lucide-react"
import { useMarketplaceEvents } from "@/lib/flow/event-context"
import { toast } from "sonner"

interface MarketplaceListing {
  listing_id: string
  nft_id: string
  price: number
  currency: 'FLOW'
  seller: string
  status: 'active' | 'sold' | 'cancelled'
  created_at: string
  nft_metadata?: {
    name: string
    description: string
    image: string
    metadata_url: string
    collection_id: string
    creator: string
  }
}

interface MarketplaceNFTCardProps {
  listing: MarketplaceListing
  onBuy: (listing: MarketplaceListing) => void
  onViewDetails: (listing: MarketplaceListing) => void
  userAddress?: string
}

export function MarketplaceNFTCard({ 
  listing, 
  onBuy, 
  onViewDetails,
  userAddress 
}: MarketplaceNFTCardProps) {
  const [imageError, setImageError] = useState(false)
  const [recentlyUpdated, setRecentlyUpdated] = useState(false)
  
  const isOwnListing = listing.seller === userAddress
  const canPurchase = userAddress && !isOwnListing && listing.status === 'active'
  
  // Real-time marketplace events
  const { lastMarketplaceEvent, marketplaceUpdateCount } = useMarketplaceEvents()

  // Enhanced real-time marketplace updates for this specific NFT
  useEffect(() => {
    if (lastMarketplaceEvent && lastMarketplaceEvent.data.nftId === listing.nft_id) {
      setRecentlyUpdated(true)
      
      // Show enhanced notifications for relevant events
      if (lastMarketplaceEvent.type.includes("SALE")) {
        if (listing.seller === userAddress) {
          toast.success(`🎉 Your NFT "${listing.nft_metadata?.name}" was sold!`, {
            description: `Sold for ${lastMarketplaceEvent.data.price} ${lastMarketplaceEvent.data.currency}`,
            duration: 6000,
            action: {
              label: "View Profile",
              onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = `/profile`
              }
            }
            }
          })
        } else if (lastMarketplaceEvent.data.buyer === userAddress) {
          toast.success(`🛒 You purchased "${listing.nft_metadata?.name}"!`, {
            description: `Purchased for ${lastMarketplaceEvent.data.price} ${lastMarketplaceEvent.data.currency}`,
            duration: 6000,
            action: {
              label: "View NFT",
              onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = `/nft/${listing.nft_id}`
              }
            }
            }
          })
        }
      } else if (lastMarketplaceEvent.type.includes("LISTING") && listing.seller === userAddress) {
        toast.info(`🏷️ Your NFT "${listing.nft_metadata?.name}" is now listed`, {
          description: `Listed for ${lastMarketplaceEvent.data.price} ${lastMarketplaceEvent.data.currency}`,
          duration: 4000
        })
      }
      
      // Remove highlight after 5 seconds for better visibility
      const timer = setTimeout(() => setRecentlyUpdated(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [lastMarketplaceEvent, listing.nft_id, listing.seller, listing.nft_metadata?.name, userAddress])

  // Listen for marketplace events via custom events
  useEffect(() => {
    const handleMarketplaceEvent = (event: CustomEvent) => {
      const { eventType, data } = event.detail
      
      if (data.nftId === listing.nft_id) {
        setRecentlyUpdated(true)
        
        if (eventType === 'sale' && data.seller === userAddress) {
          toast.success(`Your NFT was sold for ${data.price} ${data.currency}!`)
        } else if (eventType === 'listing' && data.seller === userAddress) {
          toast.info(`Your NFT is now listed for ${data.price} ${data.currency}`)
        }
        
        setTimeout(() => setRecentlyUpdated(false), 3000)
      }
    }

    // Only add event listeners on client side
    if (typeof window !== 'undefined') {
      window.addEventListener("marketplace-event", handleMarketplaceEvent as EventListener)
      return () => window.removeEventListener("marketplace-event", handleMarketplaceEvent as EventListener)
    }
  }, [listing.nft_id, listing.seller, userAddress])
  
  const statusColors = {
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    sold: "bg-gray-500/10 text-gray-500 border-gray-500/20", 
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className={`group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-foreground/20 ${
      recentlyUpdated ? 'ring-2 ring-blue-500 ring-opacity-50 animate-pulse' : ''
    }`}>
      <CardContent className="p-0">
        {/* NFT Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageError ? (
            <Image
              src={listing.nft_metadata?.image || "/placeholder.svg"}
              alt={listing.nft_metadata?.name || "NFT"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span>Image not available</span>
            </div>
          )}
          
          {/* Status Badge */}
          <Badge 
            className={`absolute top-3 right-3 capitalize ${statusColors[listing.status]}`}
          >
            {listing.status}
          </Badge>
          
          {/* Own Listing Badge */}
          {isOwnListing && (
            <Badge className="absolute top-3 left-3 bg-blue-500/10 text-blue-500 border-blue-500/20">
              Your Listing
            </Badge>
          )}
          
          {/* Real-time Update Indicator */}
          {recentlyUpdated && (
            <Badge className="absolute bottom-3 left-3 bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              Live Update
            </Badge>
          )}
        </div>

        {/* NFT Details */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg mb-1 group-hover:text-muted-foreground transition-colors line-clamp-1">
              {listing.nft_metadata?.name || `NFT #${listing.nft_id}`}
            </h3>
            {listing.nft_metadata?.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {listing.nft_metadata.description}
              </p>
            )}
          </div>

          {/* Creator Info */}
          {listing.nft_metadata?.creator && (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback>
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {listing.nft_metadata.creator.slice(0, 6)}...{listing.nft_metadata.creator.slice(-4)}
              </span>
            </div>
          )}

          {/* Price and Seller */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-bold text-lg">
                  {listing.price} {listing.currency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Seller</p>
                <p className="text-xs font-mono">
                  {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </p>
              </div>
            </div>

            {/* Listed Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Listed {formatDate(listing.created_at)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(listing)}
              className="flex-1"
            >
              View Details
            </Button>
            
            {canPurchase && (
              <Button
                size="sm"
                onClick={() => onBuy(listing)}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Buy Now
              </Button>
            )}
            
            {isOwnListing && listing.status === 'active' && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                disabled
              >
                Your Listing
              </Button>
            )}
            
            {!userAddress && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                disabled
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}