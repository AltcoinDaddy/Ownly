// Marketplace Listing API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { dapperClient } from '@/lib/dapper/client'
import { DapperAPIError } from '@/lib/dapper/types'
import { marketplaceCacheService } from '@/lib/marketplace-cache'
import { flowMarketplaceService } from '@/lib/flow/marketplace-service'

export async function POST(request: NextRequest) {
  try {
    const { nft_id, price, seller, use_flow_transaction = false } = await request.json()

    // Validate required fields
    if (!nft_id) {
      return NextResponse.json(
        { error: 'nft_id is required' },
        { status: 400 }
      )
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    if (!seller) {
      return NextResponse.json(
        { error: 'seller address is required' },
        { status: 400 }
      )
    }

    // Validate Flow address format
    if (!/^0x[a-fA-F0-9]{16}$/.test(seller)) {
      return NextResponse.json(
        { error: 'Invalid seller Flow address format' },
        { status: 400 }
      )
    }

    let listResponse

    if (use_flow_transaction) {
      // Use Flow blockchain transaction directly
      console.log('Using Flow transaction for listing')
      
      const flowResult = await flowMarketplaceService.listNFTForSale(nft_id, price.toString())
      
      if (flowResult.status === 'failed') {
        throw new Error(flowResult.error || 'Flow transaction failed')
      }

      listResponse = {
        transaction_hash: flowResult.transactionId,
        status: 'completed',
        processed_at: new Date().toISOString(),
        method: 'flow_transaction'
      }
    } else {
      // Use Dapper Core API
      console.log('Using Dapper Core API for listing')
      
      listResponse = await dapperClient.listNFT({
        nft_id,
        price,
        currency: 'FLOW',
        seller
      })
    }

    // Invalidate marketplace cache since new listing was created
    marketplaceCacheService.invalidateCache()

    return NextResponse.json(listResponse)
  } catch (error) {
    console.error('Marketplace list error:', error)

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