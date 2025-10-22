// Dapper Core API Configuration

import type { DapperConfig } from './types'

export function getDapperConfig(): DapperConfig {
  const baseUrl = process.env.NEXT_PUBLIC_DAPPER_API_URL || process.env.DAPPER_API_URL
  const apiKey = process.env.DAPPER_API_KEY
  const environment = (process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet') as 'testnet' | 'mainnet'

  // Check if we're running on the client side
  const isClientSide = typeof window !== 'undefined'
  
  if (!baseUrl) {
    if (isClientSide) {
      // On client side, use a default URL if not provided
      console.warn('DAPPER_API_URL not available on client side, using default')
    } else {
      throw new Error('DAPPER_API_URL environment variable is required')
    }
  }

  if (!apiKey) {
    if (isClientSide) {
      // On client side, use a placeholder key
      console.warn('DAPPER_API_KEY not available on client side, using placeholder')
    } else {
      throw new Error('DAPPER_API_KEY environment variable is required')
    }
  }

  return {
    baseUrl: (baseUrl || 'https://api.dapper.com').endsWith('/') 
      ? (baseUrl || 'https://api.dapper.com').slice(0, -1) 
      : (baseUrl || 'https://api.dapper.com'),
    apiKey: apiKey || 'client-side-placeholder',
    environment
  }
}

export const DAPPER_ENDPOINTS = {
  MINT: '/v1/nft/mint',
  TRANSFER: '/v1/nft/transfer',
  MARKETPLACE_LIST: '/v1/marketplace/list',
  MARKETPLACE_BUY: '/v1/marketplace/buy',
  MARKETPLACE: '/v1/marketplace',
  USER: '/v1/user',
  EVENTS: '/v1/events'
} as const

export const DAPPER_COLLECTION_ID = 'ownly_collectibles'

// Request timeout configuration
export const DAPPER_REQUEST_TIMEOUT = 30000 // 30 seconds
export const DAPPER_RETRY_ATTEMPTS = 3
export const DAPPER_RETRY_DELAY = 1000 // 1 second base delay