// Cache management API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { collectionQueryService } from '@/lib/flow/collection-service'

// Clear cache for specific user
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

    // Clear cache for this address
    collectionQueryService.clearCache(address)

    return NextResponse.json({ 
      success: true, 
      message: `Cache cleared for address ${address}` 
    })

  } catch (error) {
    console.error('Clear cache error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get cache stats
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const stats = collectionQueryService.getCacheStats()
    
    return NextResponse.json({
      cache_stats: stats,
      address: params.address
    })

  } catch (error) {
    console.error('Get cache stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}