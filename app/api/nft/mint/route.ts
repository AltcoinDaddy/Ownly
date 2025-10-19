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
import { ErrorHandler, ErrorFactory, ErrorLogger } from '@/lib/errors'
import { trackAPIPerformance, measureOperation, trackExternalAPICall } from '@/lib/performance/middleware'

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

export const POST = trackAPIPerformance(async function POST(request: NextRequest) {
  return ErrorHandler.handleAsync(async () => {
    const body: MintRequestBody = await request.json()
    const { recipient } = body

    // Validate recipient address
    if (!recipient) {
      throw ErrorFactory.createError(
        'MISSING_REQUIRED_FIELD' as any,
        'VALIDATION' as any,
        'MEDIUM' as any,
        'Recipient address is required',
        'Please provide a recipient address',
        {
          context: { field: 'recipient' },
          actionable: true,
          suggestedActions: ['Enter a valid Flow address']
        }
      )
    }

    if (!validateFlowAddress(recipient)) {
      throw ErrorFactory.invalidAddress(recipient, { 
        endpoint: '/api/nft/mint',
        operation: 'mint'
      })
    }

    let metadata_url: string
    let image_url: string | undefined

    // Check if metadata_url is provided directly (existing flow)
    if (body.metadata_url) {
      metadata_url = body.metadata_url
      
      // Validate metadata URL format
      if (!metadata_url.startsWith('https://') && !metadata_url.startsWith('ipfs://')) {
        throw ErrorFactory.createError(
          'INVALID_METADATA' as any,
          'VALIDATION' as any,
          'MEDIUM' as any,
          'Invalid metadata URL format',
          'Metadata URL must be a valid HTTPS or IPFS URL',
          {
            context: { metadata_url, endpoint: '/api/nft/mint' },
            actionable: true,
            suggestedActions: ['Use a valid HTTPS or IPFS URL for metadata']
          }
        )
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
        throw ErrorFactory.createError(
          'INVALID_METADATA' as any,
          'VALIDATION' as any,
          'MEDIUM' as any,
          `Metadata validation failed: ${metadataValidation.map(e => e.message).join(', ')}`,
          'Please check your NFT metadata and fix the validation errors',
          {
            context: { 
              validationErrors: metadataValidation,
              endpoint: '/api/nft/mint'
            },
            actionable: true,
            suggestedActions: metadataValidation.map(e => `Fix: ${e.message}`)
          }
        )
      }

      try {
        // Convert base64 to File
        if (!file_name || !file_type) {
          throw ErrorFactory.createError(
            'MISSING_REQUIRED_FIELD' as any,
            'VALIDATION' as any,
            'MEDIUM' as any,
            'File name and type are required when uploading file data',
            'Please provide both file name and file type',
            {
              context: { file_name, file_type, endpoint: '/api/nft/mint' },
              actionable: true,
              suggestedActions: ['Include file_name and file_type in your request']
            }
          )
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

        // Upload to IPFS with performance tracking
        console.log('[MINT API] Uploading metadata to IPFS...')
        const ipfsResult = await measureOperation('ipfs_upload', async () => {
          return uploadToIPFS(metadata)
        }, { file_type: file_type, file_size: file.size.toString() })
        
        metadata_url = ipfsResult.metadataUrl
        image_url = ipfsResult.imageUrl

        console.log('[MINT API] IPFS upload successful:', { metadata_url, image_url })
      } catch (ipfsError) {
        console.error('[MINT API] IPFS upload failed:', ipfsError)
        throw ErrorFactory.ipfsUploadFailed(
          ipfsError instanceof Error ? ipfsError : new Error('Unknown IPFS error'),
          {
            endpoint: '/api/nft/mint',
            operation: 'ipfs_upload',
            file_name,
            file_type
          }
        )
      }
    } else {
      throw ErrorFactory.createError(
        'MISSING_REQUIRED_FIELD' as any,
        'VALIDATION' as any,
        'MEDIUM' as any,
        'Either metadata_url or complete metadata must be provided',
        'Please provide either a metadata_url or complete metadata (name, description, category, file_data)',
        {
          context: { endpoint: '/api/nft/mint' },
          actionable: true,
          suggestedActions: [
            'Provide a metadata_url for existing metadata',
            'Or provide name, description, category, and file_data for new metadata'
          ]
        }
      )
    }

    // Call Dapper Core API to mint NFT with performance tracking
    console.log('[MINT API] Calling Dapper Core API...')
    const mintResponse = await trackExternalAPICall(
      'DapperCore',
      '/v1/nft/mint',
      'POST',
      () => ErrorHandler.handleApiCall(
        () => dapperClient.mintNFT({
          metadata_url,
          recipient,
          collection_id: DAPPER_COLLECTION_ID
        }),
        '/v1/nft/mint',
        {
          endpoint: '/api/nft/mint',
          operation: 'mint',
          recipient,
          metadata_url
        }
      )
    )

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

  }, {
    context: {
      endpoint: '/api/nft/mint',
      operation: 'mint_nft',
      recipient: body?.recipient
    },
    logError: true,
    showToUser: false // API errors should be handled by the client
  }).catch((error) => {
    // Convert OwnlyError to API response
    if (error.code) {
      return NextResponse.json({
        success: false,
        error: error.userMessage,
        type: error.code,
        details: error.context,
        retryable: error.retryable,
        ...(error.retryAfter && { retry_after: error.retryAfter })
      } as MintResponse, { 
        status: error.severity === 'CRITICAL' ? 500 : 
               error.severity === 'HIGH' ? 400 : 
               error.category === 'VALIDATION' ? 400 : 500 
      })
    }

    // Fallback for unexpected errors
    return NextResponse.json({
      success: false,
      error: 'Internal server error occurred during minting',
      type: 'SYSTEM_ERROR'
    } as MintResponse, { status: 500 })
  })
})