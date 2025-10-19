"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useMarketplaceIntegration } from "@/hooks/use-marketplace-integration"
import { Loader2, ShoppingCart, Wallet, AlertTriangle, CheckCircle, DollarSign } from "lucide-react"
import Image from "next/image"

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

interface BuyNFTModalProps {
  listing: MarketplaceListing | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPurchase?: (listingId: string) => Promise<void>
  onPurchaseComplete?: () => void
  userAddress?: string
}

export function BuyNFTModal({
  listing,
  open,
  onOpenChange,
  onPurchase,
  onPurchaseComplete,
  userAddress
}: BuyNFTModalProps) {
  const [imageError, setImageError] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { toast } = useToast()
  const { purchaseNFT, isLoading: isPurchasing, error } = useMarketplaceIntegration()

  const handlePurchase = async () => {
    if (!listing) return

    try {
      // Use the integrated marketplace hook
      await purchaseNFT(listing)
      
      // Call completion callback if provided
      if (onPurchaseComplete) {
        onPurchaseComplete()
      }
      
      // Close modal and reset
      onOpenChange(false)
      resetModal()
    } catch (error) {
      // Error handling is done in the hook
      console.error("Purchase failed:", error)
    }
  }

  const handleConfirmPurchase = () => {
    setShowConfirmation(true)
  }

  const resetModal = () => {
    setImageError(false)
    setShowConfirmation(false)
  }

  const handleClose = () => {
    if (!isPurchasing) {
      onOpenChange(false)
      resetModal()
    }
  }

  if (!listing) return null

  const isOwnListing = listing.seller === userAddress
  const canPurchase = userAddress && !isOwnListing && listing.status === 'active'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Purchase NFT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Preview */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {!imageError ? (
              <Image
                src={listing.nft_metadata?.image || "/placeholder.svg"}
                alt={listing.nft_metadata?.name || "NFT"}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span>Image not available</span>
              </div>
            )}
          </div>

          {/* NFT Details */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg">
              {listing.nft_metadata?.name || `NFT #${listing.nft_id}`}
            </h3>
            {listing.nft_metadata?.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {listing.nft_metadata.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {listing.nft_metadata?.collection_id || 'Unknown Collection'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Price and Seller Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-bold text-lg">
                {listing.price} {listing.currency}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Seller</span>
              <span className="text-sm font-mono">
                {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge 
                variant={listing.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {listing.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {!showConfirmation ? (
            /* Purchase Step */
            <>
              {/* Wallet Connection Warning */}
              {!userAddress && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Connect your wallet to purchase this NFT
                  </span>
                </div>
              )}

              {/* Own Listing Warning */}
              {isOwnListing && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    This is your own listing
                  </span>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </span>
                </div>
              )}

              {/* Purchase Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPurchasing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={!canPurchase || isPurchasing}
                  className="flex-1"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Review Purchase
                </Button>
              </div>
            </>
          ) : (
            /* Confirmation Step */
            <>
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Confirm Purchase</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NFT:</span>
                    <span className="font-medium">{listing.nft_metadata?.name || `NFT #${listing.nft_id}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-bold text-lg">{listing.price} {listing.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller:</span>
                    <span className="font-mono text-xs">
                      {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas fees:</span>
                    <span className="text-xs">Paid by your wallet</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center p-2 bg-blue-50 dark:bg-blue-950/50 rounded">
                This transaction will be recorded on the Flow blockchain
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isPurchasing}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="flex-1"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Confirm Purchase
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}