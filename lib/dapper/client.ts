// Dapper Core API Client

import type {
  DapperMintRequest,
  DapperMintResponse,
  DapperTransferRequest,
  DapperTransferResponse,
  DapperMarketplaceListRequest,
  DapperMarketplaceBuyRequest,
  DapperMarketplaceResponse,
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

class DapperClient {
  private config = getDapperConfig()

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    
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

    for (let attempt = 1; attempt <= DAPPER_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          throw new DapperAPIError(errorData)
        }

        const data = await response.json()
        return data as T
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on client errors (4xx) except rate limiting
        if (error instanceof DapperAPIError) {
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            if (error.type !== 'RATE_LIMIT_EXCEEDED') {
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
}

// Export singleton instance
export const dapperClient = new DapperClient()
export { DapperClient }