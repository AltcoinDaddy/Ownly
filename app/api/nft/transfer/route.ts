// NFT Transfer API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { dapperClient } from '@/lib/dapper/client'
import { DapperAPIError } from '@/lib/dapper/types'

export async function POST(request: NextRequest) {
  try {
    const { nft_id, from, to } = await request.json()

    // Validate required fields
    if (!nft_id) {
      return NextResponse.json(
        { error: 'nft_id is required' },
        { status: 400 }
      )
    }

    if (!from) {
      return NextResponse.json(
        { error: 'from address is required' },
        { status: 400 }
      )
    }

    if (!to) {
      return NextResponse.json(
        { error: 'to address is required' },
        { status: 400 }
      )
    }

    // Validate Flow address formats
    if (!/^0x[a-fA-F0-9]{16}$/.test(from)) {
      return NextResponse.json(
        { error: 'Invalid from Flow address format' },
        { status: 400 }
      )
    }

    if (!/^0x[a-fA-F0-9]{16}$/.test(to)) {
      return NextResponse.json(
        { error: 'Invalid to Flow address format' },
        { status: 400 }
      )
    }

    // Call Dapper Core API
    const transferResponse = await dapperClient.transferNFT({
      nft_id,
      from,
      to
    })

    return NextResponse.json(transferResponse)
  } catch (error) {
    console.error('NFT transfer error:', error)

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