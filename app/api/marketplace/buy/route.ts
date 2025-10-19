// Marketplace Purchase API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { dapperClient } from '@/lib/dapper/client'
import { DapperAPIError } from '@/lib/dapper/types'

export async function POST(request: NextRequest) {
  try {
    const { nft_id, buyer } = await request.json()

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

    // Call Dapper Core API
    const buyResponse = await dapperClient.buyNFT({
      nft_id,
      buyer
    })

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}