// User cache management API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/database'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params

    // Validate Flow address format
    if (!/^0x[a-fA-F0-9]{16}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Flow address format' },
        { status: 400 }
      )
    }

    // Invalidate all cache for this address
    await cacheService.invalidateCacheByAddress(address)

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for address: ${address}`
    })

  } catch (error) {
    console.error('Error invalidating user cache:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params

    // Validate Flow address format
    if (!/^0x[a-fA-F0-9]{16}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Flow address format' },
        { status: 400 }
      )
    }

    // Get cached user data
    const cachedUser = await cacheService.getCachedUser(address)
    const cachedNFTs = await cacheService.getCachedNFTsByOwner(address)

    return NextResponse.json({
      user: cachedUser,
      nfts: cachedNFTs,
      cached_at: cachedUser?.joined_at || null,
      nft_count: cachedNFTs.length
    })

  } catch (error) {
    console.error('Error getting cached user data:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}