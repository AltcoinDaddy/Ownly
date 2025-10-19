"use client"

import { useState, useEffect, useCallback } from "react"
import { collectionQueryService, type CollectionQueryResult, type EnrichedNFT } from "@/lib/flow/collection-service"
import { useWallet } from "@/lib/wallet-context"

interface UseUserCollectionOptions {
  autoFetch?: boolean
  useCache?: boolean
  refreshInterval?: number
}

interface UseUserCollectionReturn {
  collection: CollectionQueryResult | null
  nfts: EnrichedNFT[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
  getNFTDetails: (nftId: string) => Promise<EnrichedNFT | null>
}

export function useUserCollection(
  address?: string,
  options: UseUserCollectionOptions = {}
): UseUserCollectionReturn {
  const { address: walletAddress } = useWallet()
  const {
    autoFetch = true,
    useCache = true,
    refreshInterval
  } = options

  const [collection, setCollection] = useState<CollectionQueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetAddress = address || walletAddress

  const fetchCollection = useCallback(async () => {
    if (!targetAddress) {
      setCollection(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await collectionQueryService.getUserCollection(targetAddress, useCache)
      setCollection(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collection'
      setError(errorMessage)
      console.error('Error fetching user collection:', err)
    } finally {
      setLoading(false)
    }
  }, [targetAddress, useCache])

  const getNFTDetails = useCallback(async (nftId: string): Promise<EnrichedNFT | null> => {
    if (!targetAddress) return null

    try {
      return await collectionQueryService.getNFTDetails(targetAddress, nftId)
    } catch (err) {
      console.error('Error fetching NFT details:', err)
      return null
    }
  }, [targetAddress])

  const clearCache = useCallback(() => {
    if (targetAddress) {
      collectionQueryService.clearCache(targetAddress)
    }
  }, [targetAddress])

  // Initial fetch
  useEffect(() => {
    if (autoFetch && targetAddress) {
      fetchCollection()
    }
  }, [autoFetch, targetAddress, fetchCollection])

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval || !targetAddress) return

    const interval = setInterval(() => {
      fetchCollection()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, targetAddress, fetchCollection])

  return {
    collection,
    nfts: collection?.nfts || [],
    loading,
    error,
    refetch: fetchCollection,
    clearCache,
    getNFTDetails
  }
}