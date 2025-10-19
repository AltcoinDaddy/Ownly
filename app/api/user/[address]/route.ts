// User NFTs API endpoint with enhanced collection query service and MongoDB caching
import { NextRequest, NextResponse } from 'next/server'
import { collectionQueryService } from '@/lib/flow/collection-service'
import { enhancedCacheService } from '@/lib/database'
import { DapperAPIError } from '@/lib/dapper/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const useCache = searchParams.get('cache') !== 'false'
    const includeDetails = searchParams.get('details') === 'true'

    // Validate Flow address format
    if (!/^0x[a-fA-F0-9]{16}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Flow address format' },
        { status: 400 }
      )
    }

    // Get user's complete NFT collection using enhanced caching service
    const userNFTs = await enhancedCacheService.getUserCollection(address, useCache)
    
    // Get user profile data
    const userProfile = await enhancedCacheService.getUser(address, useCache)
    
    const collectionResult = {
      user: userProfile,
      nfts: userNFTs,
      total: userNFTs.length,
      cached: useCache
    }

    // Add cache headers
    const response = NextResponse.json(collectionResult)
    
    if (useCache) {
      response.headers.set('Cache-Control', 'public, max-age=300') // 5 minutes
    } else {
      response.headers.set('Cache-Control', 'no-cache')
    }

    return response

  } catch (error) {
    console.error('Get user collection error:', error)

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

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add endpoint for getting specific NFT details
export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const body = await request.json()
    const { nft_id } = body

    if (!nft_id) {
      return NextResponse.json(
        { error: 'nft_id is required' },
        { status: 400 }
      )
    }

    // Validate Flow address format
    if (!/^0x[a-fA-F0-9]{16}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Flow address format' },
        { status: 400 }
      )
    }

    // Get detailed NFT information using enhanced cache
    const nftDetails = await enhancedCacheService.getNFT(nft_id, true)

    if (!nftDetails) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(nftDetails)

  } catch (error) {
    console.error('Get NFT details error:', error)

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