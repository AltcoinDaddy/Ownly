// Dapper Core API Client

import type {
  DapperMintRequest,
  DapperMintResponse,
  DapperTransferRequest,
  DapperTransferResponse,
  DapperMarketplaceListRequest,
  DapperMarketplaceBuyRequest,
  DapperMarketplaceResponse,
  DapperMarketplaceListingsResponse,
  DapperUserResponse,
  DapperEventsResponse,
  DapperError
} from './types'
import { DapperErrorType } from './types'
import { DapperAPIError } from './types'
import { 
  getDapperConfig, 
  DAPPER_ENDPOINTS, 
  DAPPER_REQUEST_TIMEOUT,
  DAPPER_RETRY_ATTEMPTS,
  DAPPER_RETRY_DELAY 
} from './config'
import { performanceCollector } from '@/lib/performance/collector'

class DapperClient {
  private config = getDapperConfig()
  private isClientSide = typeof window !== 'undefined'

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Prevent client-side API calls to Dapper
    if (this.isClientSide) {
      throw new Error('Dapper API calls must be made from server-side only. Use API routes instead.')
    }

    const startTime = performance.now()
    const url = `${this.config.baseUrl}${endpoint}`
    const method = options.method || 'GET'
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Environment': this.config.environment
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      signal: AbortSignal.timeout(DAPPER_REQUEST_TIMEOUT)
    }

    let lastError: Error | null = null
    let finalStatusCode = 0
    let requestSize: number | undefined
    let responseSize: number | undefined

    // Calculate request size
    if (options.body) {
      requestSize = new Blob([options.body]).size
    }

    for (let attempt = 1; attempt <= DAPPER_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        finalStatusCode = response.status
        
        // Calculate response size
        const contentLength = response.headers.get('content-length')
        if (contentLength) {
          responseSize = parseInt(contentLength)
        }
        
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          throw new DapperAPIError(errorData)
        }

        const data = await response.json()
        
        // Record successful API call performance
        const responseTime = performance.now() - startTime
        await performanceCollector.recordAPIMetric({
          endpoint: `DapperCore${endpoint}`,
          method: method as any,
          statusCode: finalStatusCode,
          responseTime,
          requestSize,
          responseSize,
          tags: {
            external_api: 'DapperCore',
            api_type: 'external',
            attempt: attempt.toString(),
            success: 'true'
          }
        })
        
        return data as T
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on client errors (4xx) except rate limiting
        if (error instanceof DapperAPIError) {
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            if (error.type !== 'RATE_LIMIT_EXCEEDED') {
              // Record failed API call
              const responseTime = performance.now() - startTime
              await performanceCollector.recordAPIMetric({
                endpoint: `DapperCore${endpoint}`,
                method: method as any,
                statusCode: error.statusCode,
                responseTime,
                requestSize,
                responseSize,
                tags: {
                  external_api: 'DapperCore',
                  api_type: 'external',
                  attempt: attempt.toString(),
                  success: 'false',
                  error: error.message,
                  error_type: error.type
                }
              })
              throw error
            }
          }
        }

        // Wait before retry with exponential backoff
        if (attempt < DAPPER_RETRY_ATTEMPTS) {
          const delay = DAPPER_RETRY_DELAY * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Record final failed attempt
    const responseTime = performance.now() - startTime
    await performanceCollector.recordAPIMetric({
      endpoint: `DapperCore${endpoint}`,
      method: method as any,
      statusCode: finalStatusCode || 500,
      responseTime,
      requestSize,
      responseSize,
      tags: {
        external_api: 'DapperCore',
        api_type: 'external',
        attempt: DAPPER_RETRY_ATTEMPTS.toString(),
        success: 'false',
        error: lastError?.message || 'Unknown error',
        exhausted_retries: 'true'
      }
    })

    throw lastError || new Error('Request failed after all retry attempts')
  }

  private async parseErrorResponse(response: Response): Promise<DapperError> {
    let errorType: DapperErrorType
    let message = 'Unknown error occurred'
    let details: any = null

    try {
      const errorData = await response.json()
      message = errorData.message || errorData.error || message
      details = errorData.details || errorData
    } catch {
      // If we can't parse the error response, use status text
      message = response.statusText || message
    }

    // Map HTTP status codes to error types
    switch (response.status) {
      case 400:
        errorType = DapperErrorType.INVALID_REQUEST
        break
      case 401:
      case 403:
        errorType = DapperErrorType.AUTHENTICATION_ERROR
        break
      case 404:
        errorType = DapperErrorType.NFT_NOT_FOUND
        break
      case 429:
        errorType = DapperErrorType.RATE_LIMIT_EXCEEDED
        break
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = DapperErrorType.SERVER_ERROR
        break
      default:
        errorType = DapperErrorType.NETWORK_ERROR
    }

    return {
      type: errorType,
      message,
      details,
      status_code: response.status,
      retry_after: response.headers.get('Retry-After') 
        ? parseInt(response.headers.get('Retry-After')!) 
        : undefined
    }
  }

  // NFT Minting
  async mintNFT(request: DapperMintRequest): Promise<DapperMintResponse> {
    return this.makeRequest<DapperMintResponse>(DAPPER_ENDPOINTS.MINT, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // NFT Transfer
  async transferNFT(request: DapperTransferRequest): Promise<DapperTransferResponse> {
    return this.makeRequest<DapperTransferResponse>(DAPPER_ENDPOINTS.TRANSFER, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Marketplace Listing
  async listNFT(request: DapperMarketplaceListRequest): Promise<DapperMarketplaceResponse> {
    return this.makeRequest<DapperMarketplaceResponse>(DAPPER_ENDPOINTS.MARKETPLACE_LIST, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Marketplace Purchase
  async buyNFT(request: DapperMarketplaceBuyRequest): Promise<DapperMarketplaceResponse> {
    return this.makeRequest<DapperMarketplaceResponse>(DAPPER_ENDPOINTS.MARKETPLACE_BUY, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Get User NFTs
  async getUserNFTs(address: string): Promise<DapperUserResponse> {
    return this.makeRequest<DapperUserResponse>(`${DAPPER_ENDPOINTS.USER}/${address}`)
  }

  // Get Events
  async getEvents(cursor?: string): Promise<DapperEventsResponse> {
    const params = cursor ? `?cursor=${cursor}` : ''
    return this.makeRequest<DapperEventsResponse>(`${DAPPER_ENDPOINTS.EVENTS}${params}`)
  }

  // Get Marketplace Listings
  async getMarketplaceListings(queryParams?: string): Promise<DapperMarketplaceListingsResponse> {
    const params = queryParams ? `?${queryParams}` : ''
    return this.makeRequest<DapperMarketplaceListingsResponse>(`${DAPPER_ENDPOINTS.MARKETPLACE}${params}`)
  }
}

// Export singleton instance
export const dapperClient = new DapperClient()
export { DapperClient }