// NFT Transfer API endpoint with Dapper Core integration
import { NextRequest, NextResponse } from 'next/server'
import { dapperClient } from '@/lib/dapper/client'
import { DapperAPIError, DapperErrorType } from '@/lib/dapper/types'

// Request body interface for transfer
interface TransferRequestBody {
  nft_id: string
  from: string
  to: string
}

interface TransferResponse {
  success: boolean
  transaction_hash?: string
  status?: 'pending' | 'completed' | 'failed'
  transferred_at?: string
  error?: string
  type?: string
  details?: any
  retry_after?: number
}

// Validate Flow address format
function validateFlowAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{16}$/.test(address)
}

// Validate NFT ID format (assuming it's a numeric string or UUID)
function validateNFTId(nftId: string): boolean {
  // Accept numeric strings or UUIDs
  return /^\d+$/.test(nftId) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nftId)
}

export async function POST(request: NextRequest) {
  try {
    const body: TransferRequestBody = await request.json()
    const { nft_id, from, to } = body

    // Validate required fields
    if (!nft_id) {
      return NextResponse.json({
        success: false,
        error: 'NFT ID is required',
        type: 'VALIDATION_ERROR'
      } as TransferResponse, { status: 400 })
    }

    if (!from) {
      return NextResponse.json({
        success: false,
        error: 'From address is required',
        type: 'VALIDATION_ERROR'
      } as TransferResponse, { status: 400 })
    }

    if (!to) {
      return NextResponse.json({
        success: false,
        error: 'To address is required',
        type: 'VALIDATION_ERROR'
      } as TransferResponse, { status: 400 })
    }

    // Validate NFT ID format
    if (!validateNFTId(nft_id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid NFT ID format',
        type: 'VALIDATION_ERROR'
      } as TransferResponse, { status: 400 })
    }

    // Validate from address format
    if (!validateFlowAddress(from)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid from address format. Expected format: 0x followed by 16 hexadecimal characters',
        type: 'VALIDATION_ERROR'
      } as TransferResponse, { status: 400 })
    }

    // Validate to address format
    if (!validateFlowAddress(to)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid to address format. Expected format: 0x followed by 16 hexadecimal characters',
        type: 'VALIDATION_ERROR'
      } as TransferResponse, { status: 400 })
    }

    // Prevent self-transfer
    if (from.toLowerCase() === to.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'Cannot transfer NFT to the same address',
        type: 'VALIDATION_ERROR'
      } as TransferResponse, { status: 400 })
    }

    // Call Dapper Core API to transfer NFT
    console.log('[TRANSFER API] Calling Dapper Core API...', { nft_id, from, to })
    const transferResponse = await dapperClient.transferNFT({
      nft_id,
      from,
      to
    })

    console.log('[TRANSFER API] Dapper Core API response:', transferResponse)

    // Return successful response
    return NextResponse.json({
      success: true,
      transaction_hash: transferResponse.transaction_hash,
      status: transferResponse.status,
      transferred_at: transferResponse.transferred_at
    } as TransferResponse)

  } catch (error) {
    console.error('[TRANSFER API] Error:', error)

    // Handle Dapper API errors
    if (error instanceof DapperAPIError) {
      let errorMessage = error.message
      let errorType = error.type

      // Provide more user-friendly error messages
      switch (error.type) {
        case DapperErrorType.AUTHENTICATION_ERROR:
          errorMessage = 'Authentication failed. Please check API configuration.'
          break
        case DapperErrorType.NFT_NOT_FOUND:
          errorMessage = 'NFT not found or not owned by the specified address.'
          break
        case DapperErrorType.INSUFFICIENT_FUNDS:
          errorMessage = 'Insufficient funds to complete the transfer transaction.'
          break
        case DapperErrorType.RATE_LIMIT_EXCEEDED:
          errorMessage = 'Rate limit exceeded. Please try again later.'
          break
        case DapperErrorType.SERVER_ERROR:
          errorMessage = 'Dapper Core API is temporarily unavailable. Please try again later.'
          break
        case DapperErrorType.NETWORK_ERROR:
          errorMessage = 'Network error occurred. Please check your connection and try again.'
          break
        case DapperErrorType.TRANSACTION_FAILED:
          errorMessage = 'Transfer transaction failed. Please verify ownership and try again.'
          break
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        type: errorType,
        details: error.details,
        ...(error.retryAfter && { retry_after: error.retryAfter })
      } as TransferResponse, { status: error.statusCode || 500 })
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      error: 'Internal server error occurred during transfer',
      type: 'INTERNAL_ERROR'
    } as TransferResponse, { status: 500 })
  }
}