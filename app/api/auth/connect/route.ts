// Authentication endpoint for wallet connection
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Flow address is required' },
        { status: 400 }
      )
    }

    // Validate Flow address format (basic validation)
    if (!/^0x[a-fA-F0-9]{16}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Flow address format' },
        { status: 400 }
      )
    }

    // For now, just return success - wallet connection is handled client-side
    return NextResponse.json({
      success: true,
      address,
      connected_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth connect error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}