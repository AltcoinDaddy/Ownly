"use client"

import { useState, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { toast } from "sonner"
import { flowMarketplaceService } from "@/lib/flow/marketplace-service"

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

interface ListingRequest {
  nft_id: string
  price: number
  currency: string
  duration?: number
}

interface PurchaseRequest {
  nft_id: string
  seller: string
}

export function useMarketplaceIntegration() {
  const { address, isConnected } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // List NFT for sale
  const listNFTForSale = useCallback(async (
    nftId: string, 
    price: number, 
    currency: string = 'FLOW',
    duration?: number
  ): Promise<void> => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet to list NFTs")
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!nftId || !price || price <= 0) {
        throw new Error("Invalid NFT ID or price")
      }

      if (price < 0.001) {
        throw new Error("Minimum price is 0.001 FLOW")
      }

      // Show loading toast
      const loadingToast = toast.loading("Listing NFT for sale...", {
        description: "Please confirm the transaction in your wallet"
      })

      // Call API endpoint
      const response = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nft_id: nftId,
          price: price,
          seller: address,
          currency: currency,
          duration: duration,
          use_flow_transaction: true // Use Flow transactions for better integration
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to list NFT')
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      // Show success notification
      toast.success("🏷️ NFT Listed Successfully!", {
        description: `Your NFT is now listed for ${price} ${currency}`,
        duration: 5000,
        action: {
          label: "View Marketplace",
          onClick: () => window.location.href = '/marketplace'
        }
      })

      console.log('[Marketplace] NFT listed successfully:', result)
    } catch (error) {
      console.error('[Marketplace] List NFT error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to list NFT'
      setError(errorMessage)
      
      // Show error notification
      toast.error("Failed to List NFT", {
        description: errorMessage,
        duration: 6000
      })
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  // Purchase NFT from marketplace
  const purchaseNFT = useCallback(async (
    listing: MarketplaceListing
  ): Promise<void> => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet to purchase NFTs")
    }

    if (listing.seller === address) {
      throw new Error("You cannot purchase your own NFT")
    }

    if (listing.status !== 'active') {
      throw new Error("This NFT is no longer available for purchase")
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check if user has sufficient balance
      const hasBalance = await flowMarketplaceService.checkFlowBalance(
        address, 
        listing.price.toString()
      )

      if (!hasBalance) {
        throw new Error(`Insufficient FLOW balance. You need ${listing.price} FLOW to purchase this NFT.`)
      }

      // Show loading toast
      const loadingToast = toast.loading("Purchasing NFT...", {
        description: "Please confirm the transaction in your wallet"
      })

      // Call API endpoint
      const response = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nft_id: listing.nft_id,
          buyer: address,
          seller: listing.seller,
          use_flow_transaction: true // Use Flow transactions for better integration
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to purchase NFT')
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      // Show success notification
      toast.success("🎉 NFT Purchased Successfully!", {
        description: `You bought "${listing.nft_metadata?.name || `NFT #${listing.nft_id}`}" for ${listing.price} ${listing.currency}`,
        duration: 6000,
        action: {
          label: "View NFT",
          onClick: () => window.location.href = `/nft/${listing.nft_id}`
        }
      })

      console.log('[Marketplace] NFT purchased successfully:', result)
    } catch (error) {
      console.error('[Marketplace] Purchase NFT error:', error)
      
      let errorMessage = 'Failed to purchase NFT'
      if (error instanceof Error) {
        if (error.message.includes('Insufficient FLOW balance')) {
          errorMessage = `Insufficient FLOW balance. You need ${listing.price} FLOW to purchase this NFT.`
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled'
        } else if (error.message.includes('no longer available')) {
          errorMessage = 'This NFT is no longer available for purchase'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      
      // Show error notification
      toast.error("Purchase Failed", {
        description: errorMessage,
        duration: 6000
      })
      
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  // Remove NFT listing
  const removeListing = useCallback(async (nftId: string): Promise<void> => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet to remove listings")
    }

    setIsLoading(true)
    setError(null)

    try {
      // Show loading toast
      const loadingToast = toast.loading("Removing listing...", {
        description: "Please confirm the transaction in your wallet"
      })

      // Use Flow marketplace service directly for removal
      const result = await flowMarketplaceService.removeListing(nftId)

      if (result.status === 'failed') {
        throw new Error(result.error || 'Failed to remove listing')
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      // Show success notification
      toast.success("Listing Removed", {
        description: "Your NFT listing has been removed from the marketplace",
        duration: 4000
      })

      console.log('[Marketplace] Listing removed successfully:', result)
    } catch (error) {
      console.error('[Marketplace] Remove listing error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove listing'
      setError(errorMessage)
      
      // Show error notification
      toast.error("Failed to Remove Listing", {
        description: errorMessage,
        duration: 5000
      })
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  // Get marketplace listings
  const getMarketplaceListings = useCallback(async (): Promise<MarketplaceListing[]> => {
    try {
      const response = await fetch('/api/marketplace', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch marketplace listings')
      }

      const listings = await response.json()
      return listings || []
    } catch (error) {
      console.error('[Marketplace] Get listings error:', error)
      return []
    }
  }, [])

  // Setup user collection if needed
  const setupUserCollection = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet")
    }

    setIsLoading(true)
    setError(null)

    try {
      const loadingToast = toast.loading("Setting up your collection...", {
        description: "This is required for marketplace transactions"
      })

      const result = await flowMarketplaceService.setupUserCollection()

      if (result.status === 'failed') {
        throw new Error(result.error || 'Failed to setup collection')
      }

      toast.dismiss(loadingToast)
      
      toast.success("Collection Setup Complete", {
        description: "Your collection is now ready for marketplace transactions",
        duration: 4000
      })

      console.log('[Marketplace] Collection setup successful:', result)
    } catch (error) {
      console.error('[Marketplace] Setup collection error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup collection'
      setError(errorMessage)
      
      toast.error("Setup Failed", {
        description: errorMessage,
        duration: 5000
      })
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  return {
    // State
    isLoading,
    error,
    
    // Actions
    listNFTForSale,
    purchaseNFT,
    removeListing,
    getMarketplaceListings,
    setupUserCollection,
    
    // Utilities
    clearError: () => setError(null)
  }
}

// Hook for marketplace transaction status tracking
export function useMarketplaceTransactionStatus() {
  const [transactions, setTransactions] = useState<Map<string, {
    id: string
    type: 'list' | 'purchase' | 'remove'
    status: 'pending' | 'processing' | 'completed' | 'failed'
    nftId: string
    timestamp: Date
    error?: string
  }>>(new Map())

  const addTransaction = useCallback((
    id: string,
    type: 'list' | 'purchase' | 'remove',
    nftId: string
  ) => {
    setTransactions(prev => new Map(prev).set(id, {
      id,
      type,
      status: 'pending',
      nftId,
      timestamp: new Date()
    }))
  }, [])

  const updateTransactionStatus = useCallback((
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string
  ) => {
    setTransactions(prev => {
      const newMap = new Map(prev)
      const transaction = newMap.get(id)
      if (transaction) {
        newMap.set(id, { ...transaction, status, error })
      }
      return newMap
    })
  }, [])

  const getTransaction = useCallback((id: string) => {
    return transactions.get(id)
  }, [transactions])

  const getPendingTransactions = useCallback(() => {
    return Array.from(transactions.values()).filter(tx => 
      tx.status === 'pending' || tx.status === 'processing'
    )
  }, [transactions])

  return {
    transactions: Array.from(transactions.values()),
    addTransaction,
    updateTransactionStatus,
    getTransaction,
    getPendingTransactions
  }
}