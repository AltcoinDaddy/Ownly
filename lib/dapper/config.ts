// Dapper Core API Configuration

import type { DapperConfig } from './types'

export function getDapperConfig(): DapperConfig {
  const baseUrl = process.env.NEXT_PUBLIC_DAPPER_API_URL || process.env.DAPPER_API_URL
  const apiKey = process.env.DAPPER_API_KEY
  const environment = (process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet') as 'testnet' | 'mainnet'

  if (!baseUrl) {
    throw new Error('DAPPER_API_URL environment variable is required')
  }

  if (!apiKey) {
    throw new Error('DAPPER_API_KEY environment variable is required')
  }

  return {
    baseUrl: baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl,
    apiKey,
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