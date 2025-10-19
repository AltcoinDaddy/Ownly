import { cacheService } from './cache-service'
import { syncService } from './sync-service'
import { marketplaceCacheService, type MarketplaceQueryOptions } from '../marketplace-cache'
import type { NFT, User } from '../types'
import type { DapperMarketplaceListingsResponse } from '../dapper/types'

/**
 * Enhanced cache service that combines MongoDB caching with in-memory caching
 * and provides intelligent cache invalidation strategies
 */
export class EnhancedCacheService {
  private initialized = false

  // Initialize the enhanced cache system
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Start background sync processes
      await syncService.startBackgroundSync()
      
      this.initialized = true
      console.log('Enhanced cache service initialized')
      
    } catch (error) {
      console.error('Error initializing enhanced cache service:', error)
      throw error
    }
  }

  // Shutdown the cache system
  async shutdown(): Promise<void> {
    if (!this.initialized) return

    syncService.stopBackgroundSync()
    this.initialized = false
    console.log('Enhanced cache service shutdown')
  }

  // NFT caching with multi-level strategy
  async getNFT(nftId: string, useCache = true): Promise<NFT | null> {
    if (!useCache) {
      return await this.fetchNFTFromSource(nftId)
    }

    // Try MongoDB cache first
    const cached = await cacheService.getCachedNFT(nftId)
    if (cached) {
      return cached
    }

    // Fetch from source and cache
    const nft = await this.fetchNFTFromSource(nftId)
    if (nft) {
      await cacheService.cacheNFT(nft, await this.getCurrentBlockHeight())
    }

    return nft
  }

  // User collection caching with intelligent refresh
  async getUserCollection(address: string, useCache = true): Promise<NFT[]> {
    if (!useCache) {
      return await this.fetchUserCollectionFromSource(address)
    }

    // Try MongoDB cache first
    const cached = await cacheService.getCachedNFTsByOwner(address)
    if (cached.length > 0) {
      return cached
    }

    // Fetch from source and cache
    const nfts = await this.fetchUserCollectionFromSource(address)
    const blockHeight = await this.getCurrentBlockHeight()
    
    // Cache each NFT individually
    await Promise.all(
      nfts.map(nft => cacheService.cacheNFT(nft, blockHeight))
    )

    return nfts
  }

  // User profile caching
  async getUser(address: string, useCache = true): Promise<User | null> {
    if (!useCache) {
      return await this.fetchUserFromSource(address)
    }

    // Try MongoDB cache first
    const cached = await cacheService.getCachedUser(address)
    if (cached) {
      return cached
    }

    // Fetch from source and cache
    const user = await this.fetchUserFromSource(address)
    if (user) {
      const nftIds = await this.getUserNFTIds(address)
      await cacheService.cacheUser(user, nftIds)
    }

    return user
  }

  // Marketplace listings with hybrid caching
  async getMarketplaceListings(
    options?: MarketplaceQueryOptions,
    useCache = true
  ): Promise<DapperMarketplaceListingsResponse> {
    // Use the existing in-memory marketplace cache for fast access
    return await marketplaceCacheService.getMarketplaceListings(options, useCache)
  }

  // Smart cache invalidation based on blockchain events
  async invalidateByEvent(eventType: string, eventData: any): Promise<void> {
    switch (eventType) {
      case 'CollectibleMinted':
        if (eventData.to) {
          await this.invalidateUserCache(eventData.to)
        }
        break

      case 'CollectibleTransferred':
        if (eventData.nftId) {
          await cacheService.invalidateNFTCache(eventData.nftId.toString())
        }
        if (eventData.from) {
          await this.invalidateUserCache(eventData.from)
        }
        if (eventData.to) {
          await this.invalidateUserCache(eventData.to)
        }
        break

      case 'MarketplaceListing':
      case 'MarketplaceSale':
        await this.invalidateMarketplaceCache()
        if (eventData.nftId) {
          await cacheService.invalidateNFTCache(eventData.nftId.toString())
        }
        break

      default:
        console.log(`Unknown event type for cache invalidation: ${eventType}`)
    }
  }

  // Batch cache operations for efficiency
  async batchCacheNFTs(nfts: NFT[]): Promise<void> {
    const blockHeight = await this.getCurrentBlockHeight()
    
    await Promise.all(
      nfts.map(nft => cacheService.cacheNFT(nft, blockHeight))
    )
  }

  // Cache warming strategies
  async warmCache(addresses: string[]): Promise<void> {
    console.log(`Warming cache for ${addresses.length} addresses...`)
    
    // Warm user collections in parallel (but limit concurrency)
    const batchSize = 5
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async address => {
          try {
            await this.getUserCollection(address, false) // Force fresh fetch
          } catch (error) {
            console.error(`Error warming cache for address ${address}:`, error)
          }
        })
      )
    }
    
    console.log('Cache warming completed')
  }

  // Cache statistics and monitoring
  async getCacheStats(): Promise<{
    mongodb: any
    memory: any
    sync: any
  }> {
    const memoryStats = marketplaceCacheService.getCacheStats()
    
    return {
      mongodb: {
        // Would include MongoDB collection stats
        status: 'connected'
      },
      memory: memoryStats,
      sync: {
        running: syncService['isRunning'],
        processes: syncService['syncIntervals'].size
      }
    }
  }

  // Private helper methods
  private async fetchNFTFromSource(nftId: string): Promise<NFT | null> {
    // This would integrate with Dapper API or Flow blockchain
    // For now, return null as placeholder
    console.log(`Fetching NFT ${nftId} from source...`)
    return null
  }

  private async fetchUserCollectionFromSource(address: string): Promise<NFT[]> {
    // This would integrate with Flow blockchain queries
    // For now, return empty array as placeholder
    console.log(`Fetching user collection for ${address} from source...`)
    return []
  }

  private async fetchUserFromSource(address: string): Promise<User | null> {
    // This would integrate with user profile service
    // For now, return null as placeholder
    console.log(`Fetching user ${address} from source...`)
    return null
  }

  private async getUserNFTIds(address: string): Promise<string[]> {
    // This would query user's NFT IDs
    // For now, return empty array as placeholder
    return []
  }

  private async getCurrentBlockHeight(): Promise<number> {
    // This would get current Flow block height
    // For now, return current timestamp as placeholder
    return Math.floor(Date.now() / 1000)
  }

  private async invalidateUserCache(address: string): Promise<void> {
    await cacheService.invalidateCacheByAddress(address)
  }

  private async invalidateMarketplaceCache(): Promise<void> {
    // Invalidate both MongoDB and in-memory caches
    await Promise.all([
      cacheService.invalidateMarketplaceCache(),
      marketplaceCacheService.clearCache()
    ])
  }
}

// Export singleton instance
export const enhancedCacheService = new EnhancedCacheService()