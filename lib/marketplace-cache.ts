// Marketplace Cache Service for performance optimization
import type { DapperMarketplaceListingsResponse } from './dapper/types'
import { dapperService } from './dapper/service'

export interface CachedMarketplaceData {
  key: string
  data: DapperMarketplaceListingsResponse
  cached_at: number
  expires_at: number
}

export interface MarketplaceQueryOptions {
  cursor?: string
  limit?: number
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class MarketplaceCacheService {
  private cache = new Map<string, CachedMarketplaceData>()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes for marketplace data
  private readonly MAX_CACHE_SIZE = 50

  // Generate cache key from query options
  private generateCacheKey(options?: MarketplaceQueryOptions): string {
    if (!options) return 'default'
    
    const params = new URLSearchParams()
    if (options.cursor) params.append('cursor', options.cursor)
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.category) params.append('category', options.category)
    if (options.minPrice) params.append('minPrice', options.minPrice.toString())
    if (options.maxPrice) params.append('maxPrice', options.maxPrice.toString())
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)
    
    return params.toString() || 'default'
  }

  // Get marketplace listings with caching
  async getMarketplaceListings(options?: MarketplaceQueryOptions, useCache = true): Promise<DapperMarketplaceListingsResponse> {
    const cacheKey = this.generateCacheKey(options)

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached.data
      }
    }

    try {
      // Fetch fresh data from Dapper service
      const data = await dapperService.getMarketplaceListings(options)
      
      // Cache the result
      this.setCache(cacheKey, data)
      
      return data
    } catch (error) {
      console.error('Error fetching marketplace listings:', error)
      
      // Try to return cached data if available, even if expired
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return cached.data
      }
      
      throw error
    }
  }

  // Cache management
  private getFromCache(key: string): CachedMarketplaceData | null {
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }

    // Check if cache is still valid
    if (Date.now() > cached.expires_at) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  private setCache(key: string, data: DapperMarketplaceListingsResponse): void {
    // Implement LRU cache eviction if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    const cached: CachedMarketplaceData = {
      key,
      data,
      cached_at: Date.now(),
      expires_at: Date.now() + this.CACHE_TTL
    }

    this.cache.set(key, cached)
  }

  // Clear cache for specific key or all
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
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

  // Invalidate cache when marketplace changes occur
  invalidateCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const marketplaceCacheService = new MarketplaceCacheService()