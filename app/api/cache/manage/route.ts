import { NextRequest, NextResponse } from 'next/server'
import { enhancedCacheService, cacheService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    switch (action) {
      case 'initialize':
        await enhancedCacheService.initialize()
        return NextResponse.json({
          success: true,
          message: 'Enhanced cache service initialized'
        })
        
      case 'shutdown':
        await enhancedCacheService.shutdown()
        return NextResponse.json({
          success: true,
          message: 'Enhanced cache service shutdown'
        })
        
      case 'invalidate_user':
        if (!data?.address) {
          return NextResponse.json({
            success: false,
            error: 'Address is required'
          }, { status: 400 })
        }
        
        await cacheService.invalidateCacheByAddress(data.address)
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for address: ${data.address}`
        })
        
      case 'invalidate_nft':
        if (!data?.nftId) {
          return NextResponse.json({
            success: false,
            error: 'NFT ID is required'
          }, { status: 400 })
        }
        
        await cacheService.invalidateNFTCache(data.nftId)
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for NFT: ${data.nftId}`
        })
        
      case 'invalidate_marketplace':
        await cacheService.invalidateMarketplaceCache()
        return NextResponse.json({
          success: true,
          message: 'Marketplace cache invalidated'
        })
        
      case 'cleanup':
        await cacheService.cleanupExpiredCache()
        return NextResponse.json({
          success: true,
          message: 'Expired cache entries cleaned up'
        })
        
      case 'warm_cache':
        if (!data?.addresses || !Array.isArray(data.addresses)) {
          return NextResponse.json({
            success: false,
            error: 'Addresses array is required'
          }, { status: 400 })
        }
        
        await enhancedCacheService.warmCache(data.addresses)
        return NextResponse.json({
          success: true,
          message: `Cache warmed for ${data.addresses.length} addresses`
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error in cache management:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get cache statistics
    const stats = await enhancedCacheService.getCacheStats()
    
    return NextResponse.json({
      success: true,
      stats
    })
    
  } catch (error) {
    console.error('Error getting cache stats:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}