// Dapper Core API Types and Interfaces

export interface DapperConfig {
  baseUrl: string
  apiKey: string
  environment: 'testnet' | 'mainnet'
}

export interface DapperMintRequest {
  metadata_url: string
  recipient: string
  collection_id: string
}

export interface DapperMintResponse {
  nft_id: string
  transaction_hash: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface DapperTransferRequest {
  nft_id: string
  from: string
  to: string
}

export interface DapperTransferResponse {
  transaction_hash: string
  status: 'pending' | 'completed' | 'failed'
  transferred_at: string
}

export interface DapperMarketplaceListRequest {
  nft_id: string
  price: number
  currency: 'FLOW'
  seller: string
}

export interface DapperMarketplaceBuyRequest {
  nft_id: string
  buyer: string
}

export interface DapperMarketplaceResponse {
  transaction_hash: string
  status: 'pending' | 'completed' | 'failed'
  processed_at: string
}

export interface DapperUserResponse {
  address: string
  nfts: Array<{
    nft_id: string
    metadata_url: string
    collection_id: string
    owned_at: string
  }>
}

export interface DapperEventsResponse {
  events: Array<{
    event_type: string
    nft_id?: string
    transaction_hash: string
    block_height: number
    timestamp: string
    data: any
  }>
  cursor?: string
}

export interface DapperMarketplaceListingsResponse {
  listings: Array<{
    listing_id: string
    nft_id: string
    price: number
    currency: 'FLOW'
    seller: string
    status: 'active' | 'sold' | 'cancelled'
    created_at: string
    nft_metadata?: {
      name: string
      description: string
      image: string
      metadata_url: string
      collection_id: string
      creator: string
    }
  }>
  pagination: {
    cursor?: string
    has_more: boolean
    total_count?: number
  }
}

// Error Types
export enum DapperErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NFT_NOT_FOUND = 'NFT_NOT_FOUND',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface DapperError {
  type: DapperErrorType
  message: string
  details?: any
  retry_after?: number
  status_code?: number
}

export class DapperAPIError extends Error {
  public readonly type: DapperErrorType
  public readonly details?: any
  public readonly retryAfter?: number
  public readonly statusCode?: number

  constructor(error: DapperError) {
    super(error.message)
    this.name = 'DapperAPIError'
    this.type = error.type
    this.details = error.details
    this.retryAfter = error.retry_after
    this.statusCode = error.status_code
  }
}