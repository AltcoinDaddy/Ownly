// Collection Query Service - Combines Flow scripts with Dapper API and caching

import * as fcl from "@onflow/fcl"
import { dapperService } from "@/lib/dapper/service"
import { getUserNFTs, getNFTDetails, getCollectionInfo, checkUserCollection } from "./scripts"
import type { NFT, OwnlyNFTData } from "@/lib/types"

export interface CollectionQueryResult {
  address: string
  totalNFTs: number
  nfts: EnrichedNFT[]
  hasCollection: boolean
  lastUpdated: string
}

export interface EnrichedNFT {
  id: string
  name: string
  description: string
  image: string
  thumbnail: string
  owner: string
  creator?: string
  collection_id: string
  metadata_url?: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  external_url?: string
  animation_url?: string
  minted_at?: string
  transaction_hash?: string
  royalties?: any[]
  traits?: Record<string, any>
}

export interface CachedCollection {
  address: string
  data: CollectionQueryResult
  cached_at: number
  expires_at: number
}

class CollectionQueryService {
  private cache = new Map<string, CachedCollection>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100

  // Main method to get user's complete NFT collection
  async getUserCollection(address: string, useCache = true): Promise<CollectionQueryResult> {
    // Validate address format
    if (!dapperService.isValidFlowAddress(address)) {
      throw new Error('Invalid Flow address format')
    }

    const formattedAddress = dapperService.formatFlowAddress(address)

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(formattedAddress)
      if (cached) {
        return cached.data
      }
    }

    try {
      // Step 1: Check if user has collection set up
      const hasCollection = await checkUserCollection(formattedAddress)
      
      if (!hasCollection) {
        const emptyResult: CollectionQueryResult = {
          address: formattedAddress,
          totalNFTs: 0,
          nfts: [],
          hasCollection: false,
          lastUpdated: new Date().toISOString()
        }
        
        this.setCache(formattedAddress, emptyResult)
        return emptyResult
      }

      // Step 2: Get basic NFT data from Flow blockchain
      const [flowNFTs, collectionInfo] = await Promise.all([
        getUserNFTs(formattedAddress),
        getCollectionInfo(formattedAddress)
      ])

      // Step 3: Enrich with Dapper API data
      const enrichedNFTs = await this.enrichNFTsWithDapperData(flowNFTs, formattedAddress)

      const result: CollectionQueryResult = {
        address: formattedAddress,
        totalNFTs: collectionInfo?.totalNFTs || enrichedNFTs.length,
        nfts: enrichedNFTs,
        hasCollection: true,
        lastUpdated: new Date().toISOString()
      }

      // Cache the result
      this.setCache(formattedAddress, result)
      return result

    } catch (error) {
      console.error('Error fetching user collection:', error)
      
      // Try to return cached data if available, even if expired
      const cached = this.cache.get(formattedAddress)
      if (cached) {
        return cached.data
      }
      
      throw error
    }
  }

  // Get detailed NFT information
  async getNFTDetails(address: string, nftId: string): Promise<EnrichedNFT | null> {
    const formattedAddress = dapperService.formatFlowAddress(address)
    
    try {
      // Get detailed data from Flow blockchain
      const flowDetails = await getNFTDetails(formattedAddress, nftId)
      
      if (!flowDetails) {
        return null
      }

      // Enrich with additional metadata if needed
      const enriched = await this.enrichSingleNFT(flowDetails, formattedAddress)
      return enriched

    } catch (error) {
      console.error('Error fetching NFT details:', error)
      return null
    }
  }

  // Enrich Flow NFT data with Dapper API information
  private async enrichNFTsWithDapperData(flowNFTs: any[], address: string): Promise<EnrichedNFT[]> {
    if (!flowNFTs || flowNFTs.length === 0) {
      return []
    }

    try {
      // Get additional data from Dapper API
      const dapperResponse = await dapperService.getUserCollection(address)
      const dapperNFTsMap = new Map(
        dapperResponse.nfts.map(nft => [nft.nft_id, nft])
      )

      // Combine Flow and Dapper data
      const enrichedNFTs: EnrichedNFT[] = []

      for (const flowNFT of flowNFTs) {
        const dapperNFT = dapperNFTsMap.get(flowNFT.id.toString())
        
        const enriched: EnrichedNFT = {
          id: flowNFT.id.toString(),
          name: flowNFT.name || 'Untitled',
          description: flowNFT.description || '',
          image: flowNFT.thumbnail || '',
          thumbnail: flowNFT.thumbnail || '',
          owner: flowNFT.owner || address,
          collection_id: flowNFT.collectionId || 'ownly_collectibles',
          metadata_url: dapperNFT?.metadata_url,
          minted_at: dapperNFT?.owned_at,
          // Add any additional fields from Flow metadata
          external_url: flowNFT.externalURL,
          royalties: flowNFT.royalties,
          traits: flowNFT.traits
        }

        // Fetch additional metadata if metadata_url is available
        if (enriched.metadata_url) {
          try {
            const metadata = await this.fetchMetadata(enriched.metadata_url)
            if (metadata) {
              enriched.attributes = metadata.attributes
              enriched.animation_url = metadata.animation_url
              enriched.external_url = enriched.external_url || metadata.external_url
              enriched.creator = metadata.creator
            }
          } catch (error) {
            console.warn('Failed to fetch metadata for NFT', enriched.id, error)
          }
        }

        enrichedNFTs.push(enriched)
      }

      return enrichedNFTs

    } catch (error) {
      console.warn('Failed to enrich with Dapper data, using Flow data only:', error)
      
      // Fallback to Flow data only
      return flowNFTs.map(nft => ({
        id: nft.id.toString(),
        name: nft.name || 'Untitled',
        description: nft.description || '',
        image: nft.thumbnail || '',
        thumbnail: nft.thumbnail || '',
        owner: nft.owner || address,
        collection_id: nft.collectionId || 'ownly_collectibles',
        external_url: nft.externalURL,
        royalties: nft.royalties,
        traits: nft.traits
      }))
    }
  }

  // Enrich a single NFT with additional data
  private async enrichSingleNFT(flowNFT: any, address: string): Promise<EnrichedNFT> {
    const enriched: EnrichedNFT = {
      id: flowNFT.id.toString(),
      name: flowNFT.name || 'Untitled',
      description: flowNFT.description || '',
      image: flowNFT.thumbnail || '',
      thumbnail: flowNFT.thumbnail || '',
      owner: flowNFT.owner || address,
      collection_id: flowNFT.collectionId || 'ownly_collectibles',
      external_url: flowNFT.externalURL,
      royalties: flowNFT.royalties,
      traits: flowNFT.traits
    }

    // Try to get additional data from Dapper API
    try {
      const dapperResponse = await dapperService.getUserCollection(address)
      const dapperNFT = dapperResponse.nfts.find(nft => nft.nft_id === enriched.id)
      
      if (dapperNFT) {
        enriched.metadata_url = dapperNFT.metadata_url
        enriched.minted_at = dapperNFT.owned_at

        // Fetch metadata if available
        if (enriched.metadata_url) {
          const metadata = await this.fetchMetadata(enriched.metadata_url)
          if (metadata) {
            enriched.attributes = metadata.attributes
            enriched.animation_url = metadata.animation_url
            enriched.external_url = enriched.external_url || metadata.external_url
            enriched.creator = metadata.creator
          }
        }
      }
    } catch (error) {
      console.warn('Failed to enrich single NFT with Dapper data:', error)
    }

    return enriched
  }

  // Fetch metadata from IPFS or HTTP URL
  private async fetchMetadata(metadataUrl: string): Promise<any | null> {
    try {
      // Handle IPFS URLs
      let fetchUrl = metadataUrl
      if (metadataUrl.startsWith('ipfs://')) {
        fetchUrl = metadataUrl.replace('ipfs://', 'https://nftstorage.link/ipfs/')
      }

      const response = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.warn('Failed to fetch metadata from', metadataUrl, error)
      return null
    }
  }

  // Cache management
  private getFromCache(address: string): CachedCollection | null {
    const cached = this.cache.get(address)
    
    if (!cached) {
      return null
    }

    // Check if cache is still valid
    if (Date.now() > cached.expires_at) {
      this.cache.delete(address)
      return null
    }

    return cached
  }

  private setCache(address: string, data: CollectionQueryResult): void {
    // Implement LRU cache eviction if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    const cached: CachedCollection = {
      address,
      data,
      cached_at: Date.now(),
      expires_at: Date.now() + this.CACHE_TTL
    }

    this.cache.set(address, cached)
  }

  // Clear cache for specific address
  clearCache(address?: string): void {
    if (address) {
      const formattedAddress = dapperService.formatFlowAddress(address)
      this.cache.delete(formattedAddress)
    } else {
      this.cache.clear()
    }
  }

  // Get cache stats
  getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL
    }
  }
}

// Export singleton instance
export const collectionQueryService = new CollectionQueryService()
export { CollectionQueryService }