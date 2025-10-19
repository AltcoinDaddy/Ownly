// Database configuration and connection
export { dbConnection, getDatabase, type DatabaseConfig } from './config'

// Database schemas and types
export {
  type NFTCacheDocument,
  type UserCacheDocument,
  type TransactionLogDocument,
  type MarketplaceCacheDocument,
  type SyncStatusDocument,
  COLLECTIONS,
  COLLECTION_INDEXES
} from './schemas'

// Core cache service
export { cacheService, CacheService } from './cache-service'

// Background sync service
export { syncService, SyncService } from './sync-service'

// Enhanced cache service (main interface)
export { enhancedCacheService, EnhancedCacheService } from './enhanced-cache'

// Database initialization
export { dbInitializer, initializeDatabase, DatabaseInitializer } from './init'

// Re-export types from main types file
export type { NFT, User } from '../types'