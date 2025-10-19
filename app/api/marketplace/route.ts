// Marketplace Data API endpoint - Fetch marketplace listings and data
import { NextRequest, NextResponse } from 'next/server'
import { DapperAPIError } from '@/lib/dapper/types'
import { marketplaceCacheService } from '@/lib/marketplace-cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const category = searchParams.get('category') || undefined
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    const useCache = searchParams.get('cache') !== 'false'

    // Build options object
    const options = {
      cursor,
      limit,
      category,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder
    }

    // Fetch marketplace data with caching
    const marketplaceData = await marketplaceCacheService.getMarketplaceListings(options, useCache)

    // Add caching headers for performance
    const response = NextResponse.json(marketplaceData)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    
    return response
  } catch (error) {
    console.error('Marketplace data fetch error:', error)

    if (error instanceof DapperAPIError) {
      return NextResponse.json(
        { 
          error: error.message,
          type: error.type,
          details: error.details
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}