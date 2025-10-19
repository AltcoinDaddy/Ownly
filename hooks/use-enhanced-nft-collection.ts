"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useEvents } from "@/lib/flow/event-context"
import { useNFTTransfer } from "@/hooks/use-nft-transfer"
import { useMarketplaceIntegration } from "@/hooks/use-marketplace-integration"
import type { EnrichedNFT } from "@/lib/flow/collection-service"
import { toast } from "sonner"

interface CollectionState {
  nfts: EnrichedNFT[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  total: number
}

interface UserProfile {
  address: string
  nfts_owned: number
  nfts_created: number
  joined_at?: string
}

export function useEnhancedNFTCollection() {
  const { address, isConnected } = useWallet()
  const { galleryUpdateCount, latestEvent } = useEvents()
  const { transferNFT, isLoading: isTransferring } = useNFTTransfer()
  const { listNFTForSale, isLoading: isListing } = useMarketplaceIntegration()

  const [collection, setCollection] = useState<CollectionState>({
    nfts: [],
    loading: false,
    error: null,
    lastUpdated: null,
    total: 0
  })

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  // Fetch user's NFT collection
  const fetchCollection = useCallback(async (useCache = true) => {
    if (!address || !isConnected) {
      setCollection(prev => ({ ...prev, nfts: [], total: 0, error: null }))
      return
    }

    setCollection(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/user/${address}?cache=${useCache}&details=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch collection')
      }

      const data = await response.json()

      setCollection(prev => ({
        ...prev,
        nfts: data.nfts || [],
        total: data.total || 0,
        loading: false,
        lastUpdated: new Date(),
        error: null
      }))

      setUserProfile(data.user)

      console.log(`[Collection] Loaded ${data.total} NFTs for ${address}`)
    } catch (error) {
      console.error('[Collection] Fetch error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load collection'
      setCollection(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))

      toast.error("Failed to Load Collection", {
        description: errorMessage,
        duration: 5000
      })
    }
  }, [address, isConnected])

  // Refresh collection (force fresh data)
  const refreshCollection = useCallback(() => {
    setRefreshCount(prev => prev + 1)
    return fetchCollection(false)
  }, [fetchCollection])

  // Auto-refresh when real-time events occur
  useEffect(() => {
    if (galleryUpdateCount > 0 && address) {
      console.log('[Collection] Real-time update detected, refreshing collection')
      
      // Add a small delay to allow blockchain to update
      const timer = setTimeout(() => {
        fetchCollection(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [galleryUpdateCount, address, fetchCollection])

  // Initial load and address changes
  useEffect(() => {
    if (address && isConnected) {
      fetchCollection(true)
    } else {
      setCollection({
        nfts: [],
        loading: false,
        error: null,
        lastUpdated: null,
        total: 0
      })
      setUserProfile(null)
    }
  }, [address, isConnected, fetchCollection])

  // Enhanced NFT transfer with collection update
  const handleTransferNFT = useCallback(async (
    nft: EnrichedNFT, 
    recipientAddress: string
  ): Promise<void> => {
    try {
      await transferNFT(nft, recipientAddress)
      
      // Optimistically update collection
      setCollection(prev => ({
        ...prev,
        nfts: prev.nfts.filter(n => n.id !== nft.id),
        total: prev.total - 1
      }))

      // Refresh after a delay to get accurate data
      setTimeout(() => {
        refreshCollection()
      }, 3000)

      toast.success("NFT Transfer Successful", {
        description: `"${nft.name}" has been transferred to ${recipientAddress.slice(0, 8)}...`,
        duration: 5000
      })
    } catch (error) {
      console.error('[Collection] Transfer error:', error)
      throw error
    }
  }, [transferNFT, refreshCollection])

  // Enhanced NFT listing with collection update
  const handleListNFTForSale = useCallback(async (
    nft: EnrichedNFT,
    price: number,
    currency: string = 'FLOW',
    duration?: number
  ): Promise<void> => {
    try {
      await listNFTForSale(nft.id, price, currency, duration)
      
      // Refresh collection to show updated status
      setTimeout(() => {
        refreshCollection()
      }, 2000)

      toast.success("NFT Listed Successfully", {
        description: `"${nft.name}" is now listed for ${price} ${currency}`,
        duration: 5000,
        action: {
          label: "View Marketplace",
          onClick: () => window.location.href = '/marketplace'
        }
      })
    } catch (error) {
      console.error('[Collection] Listing error:', error)
      throw error
    }
  }, [listNFTForSale, refreshCollection])

  // Get NFT by ID
  const getNFTById = useCallback((nftId: string): EnrichedNFT | undefined => {
    return collection.nfts.find(nft => nft.id === nftId)
  }, [collection.nfts])

  // Filter NFTs by collection
  const getNFTsByCollection = useCallback((collectionId: string): EnrichedNFT[] => {
    return collection.nfts.filter(nft => nft.collection_id === collectionId)
  }, [collection.nfts])

  // Get collection statistics
  const getCollectionStats = useCallback(() => {
    const collections = new Map<string, number>()
    const creators = new Map<string, number>()
    let totalValue = 0

    collection.nfts.forEach(nft => {
      // Count by collection
      const collectionCount = collections.get(nft.collection_id) || 0
      collections.set(nft.collection_id, collectionCount + 1)

      // Count by creator
      if (nft.creator) {
        const creatorCount = creators.get(nft.creator) || 0
        creators.set(nft.creator, creatorCount + 1)
      }

      // Add to total value (if available)
      if (nft.last_sale_price) {
        totalValue += parseFloat(nft.last_sale_price)
      }
    })

    return {
      totalNFTs: collection.total,
      collections: Array.from(collections.entries()).map(([id, count]) => ({ id, count })),
      creators: Array.from(creators.entries()).map(([address, count]) => ({ address, count })),
      estimatedValue: totalValue,
      lastUpdated: collection.lastUpdated
    }
  }, [collection])

  // Search NFTs
  const searchNFTs = useCallback((query: string): EnrichedNFT[] => {
    if (!query.trim()) return collection.nfts

    const searchTerm = query.toLowerCase()
    return collection.nfts.filter(nft => 
      nft.name.toLowerCase().includes(searchTerm) ||
      nft.description.toLowerCase().includes(searchTerm) ||
      nft.id.includes(searchTerm) ||
      nft.collection_id.toLowerCase().includes(searchTerm)
    )
  }, [collection.nfts])

  // Check if NFT is owned by user
  const isNFTOwned = useCallback((nftId: string): boolean => {
    return collection.nfts.some(nft => nft.id === nftId)
  }, [collection.nfts])

  return {
    // Collection state
    collection: collection.nfts,
    loading: collection.loading || isTransferring || isListing,
    error: collection.error,
    total: collection.total,
    lastUpdated: collection.lastUpdated,
    
    // User profile
    userProfile,
    
    // Actions
    refreshCollection,
    handleTransferNFT,
    handleListNFTForSale,
    
    // Utilities
    getNFTById,
    getNFTsByCollection,
    getCollectionStats,
    searchNFTs,
    isNFTOwned,
    
    // Status
    isTransferring,
    isListing,
    refreshCount
  }
}

// Hook for individual NFT details with real-time updates
export function useNFTDetails(nftId: string) {
  const [nft, setNFT] = useState<EnrichedNFT | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { address } = useWallet()
  const { latestEvent } = useEvents()

  const fetchNFTDetails = useCallback(async () => {
    if (!nftId || !address) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/${address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nft_id: nftId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch NFT details')
      }

      const nftData = await response.json()
      setNFT(nftData)
    } catch (error) {
      console.error('[NFTDetails] Fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load NFT details'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [nftId, address])

  // Refresh when events occur for this NFT
  useEffect(() => {
    if (latestEvent && latestEvent.data.nftId === nftId) {
      console.log('[NFTDetails] Real-time update for NFT', nftId)
      fetchNFTDetails()
    }
  }, [latestEvent, nftId, fetchNFTDetails])

  // Initial load
  useEffect(() => {
    fetchNFTDetails()
  }, [fetchNFTDetails])

  return {
    nft,
    loading,
    error,
    refresh: fetchNFTDetails
  }
}