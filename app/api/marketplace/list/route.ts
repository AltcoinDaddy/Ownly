// Marketplace Listing API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { dapperClient } from '@/lib/dapper/client'
import { DapperAPIError } from '@/lib/dapper/types'

export async function POST(request: NextRequest) {
  try {
    const { nft_id, price, seller } = await request.json()

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

    // Call Dapper Core API
    const listResponse = await dapperClient.listNFT({
      nft_id,
      price,
      currency: 'FLOW',
      seller
    })

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}