// Dapper Service - High-level operations for the application

import { dapperClient } from './client'
import type {
  DapperMintRequest,
  DapperTransferRequest,
  DapperMarketplaceListRequest,
  DapperMarketplaceBuyRequest
} from './types'
import { DAPPER_COLLECTION_ID } from './config'

export class DapperService {
  // Mint NFT with Ownly collection defaults
  async mintOwnlyNFT(metadataUrl: string, recipient: string) {
    const request: DapperMintRequest = {
      metadata_url: metadataUrl,
      recipient,
      collection_id: DAPPER_COLLECTION_ID
    }

    return dapperClient.mintNFT(request)
  }

  // Transfer NFT
  async transferNFT(nftId: string, from: string, to: string) {
    const request: DapperTransferRequest = {
      nft_id: nftId,
      from,
      to
    }

    return dapperClient.transferNFT(request)
  }

  // List NFT for sale
  async listNFTForSale(nftId: string, price: number, seller: string) {
    const request: DapperMarketplaceListRequest = {
      nft_id: nftId,
      price,
      currency: 'FLOW',
      seller
    }

    return dapperClient.listNFT(request)
  }

  // Buy NFT from marketplace
  async buyNFT(nftId: string, buyer: string) {
    const request: DapperMarketplaceBuyRequest = {
      nft_id: nftId,
      buyer
    }

    return dapperClient.buyNFT(request)
  }

  // Get user's NFT collection
  async getUserCollection(address: string) {
    return dapperClient.getUserNFTs(address)
  }

  // Get recent events
  async getRecentEvents(cursor?: string) {
    return dapperClient.getEvents(cursor)
  }

  // Get marketplace listings with filtering and pagination
  async getMarketplaceListings(options?: {
    cursor?: string
    limit?: number
    category?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const queryParams = new URLSearchParams()
    
    if (options?.cursor) queryParams.append('cursor', options.cursor)
    if (options?.limit) queryParams.append('limit', options.limit.toString())
    if (options?.category) queryParams.append('category', options.category)
    if (options?.minPrice) queryParams.append('min_price', options.minPrice.toString())
    if (options?.maxPrice) queryParams.append('max_price', options.maxPrice.toString())
    if (options?.sortBy) queryParams.append('sort_by', options.sortBy)
    if (options?.sortOrder) queryParams.append('sort_order', options.sortOrder)

    return dapperClient.getMarketplaceListings(queryParams.toString())
  }

  // Validate Flow address format
  static isValidFlowAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{16}$/.test(address)
  }

  // Format Flow address (ensure 0x prefix)
  static formatFlowAddress(address: string): string {
    if (!address) return ''
    return address.startsWith('0x') ? address : `0x${address}`
  }
}

// Export singleton instance
export const dapperService = new DapperService()