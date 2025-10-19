import { ObjectId } from 'mongodb'

// NFT Cache Schema - stores cached NFT data from blockchain
export interface NFTCacheDocument {
  _id?: ObjectId
  nft_id: string
  token_id: string
  contract_address: string
  collection_id: string
  metadata: {
    name: string
    description: string
    image: string
    metadata_url: string
    attributes?: Array<{
      trait_type: string
      value: string | number
    }>
    rarity?: string
    category?: string
  }
  owner_address: string
  creator_address: string
  minted_at: Date
  transaction_hash: string
  block_height: number
  last_updated: Date
  cache_expires_at: Date
  is_listed: boolean
  listing_price?: number
  listing_currency?: string
  listing_expires_at?: Date
}

// User Cache Schema - stores cached user profile and collection data
export interface UserCacheDocument {
  _id?: ObjectId
  flow_address: string
  profile: {
    username?: string
    display_name?: string
    avatar?: string
    bio?: string
    verified: boolean
    joined_at: Date
  }
  collection_stats: {
    nfts_owned: number
    nfts_created: number
    total_value?: number
    last_activity: Date
  }
  owned_nfts: string[] // Array of NFT IDs
  created_nfts: string[] // Array of NFT IDs created by this user
  last_sync: Date
  cache_expires_at: Date
  sync_in_progress: boolean
}

// Transaction Log Schema - tracks blockchain events and transactions
export interface TransactionLogDocument {
  _id?: ObjectId
  transaction_hash: string
  block_height: number
  event_type: 'mint' | 'transfer' | 'sale' | 'listing' | 'delisting'
  contract_address: string
  event_data: {
    nft_id?: string
    from_address?: string
    to_address?: string
    price?: number
    currency?: string
    listing_id?: string
  }
  addresses_involved: string[] // For efficient querying by address
  processed: boolean
  processing_attempts: number
  last_processing_attempt?: Date
  created_at: Date
  updated_at: Date
}

// Marketplace Cache Schema - stores marketplace listings and sales data
export interface MarketplaceCacheDocument {
  _id?: ObjectId
  listing_id: string
  nft_id: string
  seller_address: string
  price: number
  currency: string
  status: 'active' | 'sold' | 'cancelled' | 'expired'
  listed_at: Date
  expires_at?: Date
  sold_at?: Date
  buyer_address?: string
  transaction_hash?: string
  last_updated: Date
  cache_expires_at: Date
}

// Sync Status Schema - tracks background sync processes
export interface SyncStatusDocument {
  _id?: ObjectId
  sync_type: 'nft_collection' | 'marketplace' | 'events' | 'user_profile'
  target_identifier: string // address, contract, etc.
  last_sync_block: number
  last_sync_timestamp: Date
  sync_in_progress: boolean
  sync_started_at?: Date
  sync_completed_at?: Date
  error_count: number
  last_error?: string
  next_sync_at: Date
}

// Collection indexes for optimal query performance
export const COLLECTION_INDEXES = {
  nft_cache: [
    { key: { nft_id: 1 }, unique: true },
    { key: { owner_address: 1 } },
    { key: { contract_address: 1, token_id: 1 } },
    { key: { collection_id: 1 } },
    { key: { cache_expires_at: 1 }, expireAfterSeconds: 0 },
    { key: { is_listed: 1, listing_price: 1 } },
    { key: { block_height: 1 } }
  ],
  user_cache: [
    { key: { flow_address: 1 }, unique: true },
    { key: { cache_expires_at: 1 }, expireAfterSeconds: 0 },
    { key: { 'profile.verified': 1 } },
    { key: { 'collection_stats.nfts_owned': 1 } }
  ],
  transaction_log: [
    { key: { transaction_hash: 1 }, unique: true },
    { key: { block_height: 1 } },
    { key: { event_type: 1 } },
    { key: { addresses_involved: 1 } },
    { key: { processed: 1 } },
    { key: { created_at: 1 } }
  ],
  marketplace_cache: [
    { key: { listing_id: 1 }, unique: true },
    { key: { nft_id: 1 } },
    { key: { seller_address: 1 } },
    { key: { status: 1, price: 1 } },
    { key: { cache_expires_at: 1 }, expireAfterSeconds: 0 }
  ],
  sync_status: [
    { key: { sync_type: 1, target_identifier: 1 }, unique: true },
    { key: { next_sync_at: 1 } },
    { key: { sync_in_progress: 1 } }
  ]
}

// Collection names
export const COLLECTIONS = {
  NFT_CACHE: 'nft_cache',
  USER_CACHE: 'user_cache',
  TRANSACTION_LOG: 'transaction_log',
  MARKETPLACE_CACHE: 'marketplace_cache',
  SYNC_STATUS: 'sync_status'
} as const