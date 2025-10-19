// Enhanced NFT Minting API endpoint with IPFS integration
import { NextRequest, NextResponse } from 'next/server'
import { dapperClient } from '@/lib/dapper/client'
import { DapperAPIError, DapperErrorType } from '@/lib/dapper/types'
import { DAPPER_COLLECTION_ID } from '@/lib/dapper/config'
import { 
  uploadToIPFS, 
  createOwnlyMetadata, 
  processUploadedFile,
  validateMetadata,
  type OwnlyNFTMetadata 
} from '@/lib/flow/ipfs'
import { OWNLY_COLLECTION_ID } from '@/lib/flow/config'

// Request body interface for minting
interface MintRequestBody {
  // Option 1: Direct metadata_url (existing functionality)
  metadata_url?: string
  recipient: string
  
  // Option 2: Full metadata with file upload (new functionality)
  name?: string
  description?: string
  category?: string
  creator?: string
  file_data?: string // Base64 encoded file
  file_name?: string
  file_type?: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  external_url?: string
}

interface MintResponse {
  success: boolean
  nft_id?: string
  transaction_hash?: string
  status?: 'pending' | 'completed' | 'failed'
  metadata_url?: string
  image_url?: string
  created_at?: string
  error?: string
  type?: string
  details?: any
}

// Validate Flow address format
function validateFlowAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{16}$/.test(address)
}

// Convert base64 to File object
function base64ToFile(base64Data: string, fileName: string, fileType: string): File {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:[^;]+;base64,/, '')
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new File([byteArray], fileName, { type: fileType })
}

export async function POST(request: NextRequest) {
  try {
    const body: MintRequestBody = await request.json()
    const { recipient } = body

    // Validate recipient address
    if (!recipient) {
      return NextResponse.json({
        success: false,
        error: 'Recipient address is required',
        type: 'VALIDATION_ERROR'
      } as MintResponse, { status: 400 })
    }

    if (!validateFlowAddress(recipient)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid recipient Flow address format. Expected format: 0x followed by 16 hexadecimal characters',
        type: 'VALIDATION_ERROR'
      } as MintResponse, { status: 400 })
    }

    let metadata_url: string
    let image_url: string | undefined

    // Check if metadata_url is provided directly (existing flow)
    if (body.metadata_url) {
      metadata_url = body.metadata_url
      
      // Validate metadata URL format
      if (!metadata_url.startsWith('https://') && !metadata_url.startsWith('ipfs://')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid metadata URL format. Must be HTTPS or IPFS URL',
          type: 'VALIDATION_ERROR'
        } as MintResponse, { status: 400 })
      }
    } 
    // New flow: Upload to IPFS with full metadata
    else if (body.name && body.description && body.category && body.file_data) {
      const { name, description, category, creator, file_data, file_name, file_type, attributes, external_url } = body

      // Validate required fields for new flow
      const metadataValidation = validateMetadata({
        name,
        description,
        category,
        creator: creator || recipient, // Default creator to recipient if not provided
        collection_id: OWNLY_COLLECTION_ID,
        attributes,
        external_url
      })

      if (metadataValidation.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Metadata validation failed: ${metadataValidation.map(e => e.message).join(', ')}`,
          type: 'VALIDATION_ERROR',
          details: metadataValidation
        } as MintResponse, { status: 400 })
      }

      try {
        // Convert base64 to File
        if (!file_name || !file_type) {
          return NextResponse.json({
            success: false,
            error: 'File name and type are required when uploading file data',
            type: 'VALIDATION_ERROR'
          } as MintResponse, { status: 400 })
        }

        const file = base64ToFile(file_data, file_name, file_type)
        
        // Process and validate the file
        const { processedFile } = await processUploadedFile(file)

        // Create metadata structure
        const metadata = createOwnlyMetadata({
          name,
          description,
          category,
          creator: creator || recipient,
          image: processedFile,
          attributes,
          external_url
        })

        // Upload to IPFS
        console.log('[MINT API] Uploading metadata to IPFS...')
        const ipfsResult = await uploadToIPFS(metadata)
        metadata_url = ipfsResult.metadataUrl
        image_url = ipfsResult.imageUrl

        console.log('[MINT API] IPFS upload successful:', { metadata_url, image_url })
      } catch (ipfsError) {
        console.error('[MINT API] IPFS upload failed:', ipfsError)
        return NextResponse.json({
          success: false,
          error: `IPFS upload failed: ${ipfsError instanceof Error ? ipfsError.message : 'Unknown error'}`,
          type: 'IPFS_ERROR'
        } as MintResponse, { status: 500 })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Either metadata_url or complete metadata (name, description, category, file_data) must be provided',
        type: 'VALIDATION_ERROR'
      } as MintResponse, { status: 400 })
    }

    // Call Dapper Core API to mint NFT
    console.log('[MINT API] Calling Dapper Core API...')
    const mintResponse = await dapperClient.mintNFT({
      metadata_url,
      recipient,
      collection_id: DAPPER_COLLECTION_ID
    })

    console.log('[MINT API] Dapper Core API response:', mintResponse)

    // Return successful response
    return NextResponse.json({
      success: true,
      nft_id: mintResponse.nft_id,
      transaction_hash: mintResponse.transaction_hash,
      status: mintResponse.status,
      metadata_url,
      image_url,
      created_at: mintResponse.created_at
    } as MintResponse)

  } catch (error) {
    console.error('[MINT API] Error:', error)

    // Handle Dapper API errors
    if (error instanceof DapperAPIError) {
      let errorMessage = error.message
      let errorType = error.type

      // Provide more user-friendly error messages
      switch (error.type) {
        case DapperErrorType.AUTHENTICATION_ERROR:
          errorMessage = 'Authentication failed. Please check API configuration.'
          break
        case DapperErrorType.INSUFFICIENT_FUNDS:
          errorMessage = 'Insufficient funds to complete the minting transaction.'
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
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        type: errorType,
        details: error.details,
        ...(error.retryAfter && { retry_after: error.retryAfter })
      } as MintResponse, { status: error.statusCode || 500 })
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      error: 'Internal server error occurred during minting',
      type: 'INTERNAL_ERROR'
    } as MintResponse, { status: 500 })
  }
}