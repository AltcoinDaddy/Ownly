// Marketplace Purchase API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { dapperClient } from '@/lib/dapper/client'
import { DapperAPIError } from '@/lib/dapper/types'
import { marketplaceCacheService } from '@/lib/marketplace-cache'
import { flowMarketplaceService } from '@/lib/flow/marketplace-service'

export async function POST(request: NextRequest) {
  try {
    const { nft_id, buyer, seller, use_flow_transaction = false } = await request.json()

    // Validate required fields
    if (!nft_id) {
      return NextResponse.json(
        { error: 'nft_id is required' },
        { status: 400 }
      )
    }

    if (!buyer) {
      return NextResponse.json(
        { error: 'buyer address is required' },
        { status: 400 }
      )
    }

    // Validate Flow address format
    if (!/^0x[a-fA-F0-9]{16}$/.test(buyer)) {
      return NextResponse.json(
        { error: 'Invalid buyer Flow address format' },
        { status: 400 }
      )
    }

    let buyResponse

    if (use_flow_transaction && seller) {
      // Use Flow blockchain transaction directly
      console.log('Using Flow transaction for purchase')
      
      const flowResult = await flowMarketplaceService.purchaseNFT(nft_id, seller)
      
      if (flowResult.status === 'failed') {
        throw new Error(flowResult.error || 'Flow transaction failed')
      }

      buyResponse = {
        transaction_hash: flowResult.transactionId,
        status: 'completed',
        processed_at: new Date().toISOString(),
        method: 'flow_transaction'
      }
    } else {
      // Use Dapper Core API
      console.log('Using Dapper Core API for purchase')
      
      buyResponse = await dapperClient.buyNFT({
        nft_id,
        buyer
      })
    }

    // Invalidate marketplace cache since purchase was made
    marketplaceCacheService.invalidateCache()

    return NextResponse.json(buyResponse)
  } catch (error) {
    console.error('Marketplace buy error:', error)

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
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}