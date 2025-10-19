# MongoDB Caching Layer

This directory contains the MongoDB-based caching implementation for Ownly, providing persistent caching, background synchronization, and intelligent cache invalidation strategies.

## Architecture Overview

The caching layer consists of several key components:

- **Database Configuration** (`config.ts`) - MongoDB connection management
- **Schemas** (`schemas.ts`) - Database schemas and indexes for optimal performance
- **Cache Service** (`cache-service.ts`) - Core caching operations for NFTs, users, and transactions
- **Sync Service** (`sync-service.ts`) - Background synchronization with blockchain data
- **Enhanced Cache** (`enhanced-cache.ts`) - High-level caching interface with multi-level strategies
- **Database Initialization** (`init.ts`) - Database setup and index creation

## Features

### Multi-Level Caching Strategy
- **MongoDB Persistent Cache** - Long-term storage with TTL-based expiration
- **In-Memory Cache** - Fast access for frequently requested data (marketplace listings)
- **Smart Cache Invalidation** - Event-driven cache updates based on blockchain events

### Background Synchronization
- **Event Monitoring** - Continuous monitoring of Flow blockchain events
- **Automatic Cache Updates** - Real-time cache invalidation when blockchain state changes
- **Batch Processing** - Efficient processing of multiple transactions
- **Error Recovery** - Retry mechanisms with exponential backoff

### Performance Optimization
- **Indexed Collections** - Optimized database queries with proper indexing
- **Cache Warming** - Proactive caching of frequently accessed data
- **TTL Management** - Automatic cleanup of expired cache entries
- **Connection Pooling** - Efficient database connection management

## Database Collections

### NFT Cache (`nft_cache`)
Stores cached NFT metadata and ownership information:
```typescript
{
  nft_id: string,
  metadata: { name, description, image, attributes },
  owner_address: string,
  creator_address: string,
  block_height: number,
  cache_expires_at: Date,
  is_listed: boolean,
  listing_price?: number
}
```

### User Cache (`user_cache`)
Stores user profiles and collection statistics:
```typescript
{
  flow_address: string,
  profile: { username, display_name, avatar, verified },
  collection_stats: { nfts_owned, nfts_created, total_value },
  owned_nfts: string[],
  cache_expires_at: Date
}
```

### Transaction Log (`transaction_log`)
Tracks blockchain events and processing status:
```typescript
{
  transaction_hash: string,
  block_height: number,
  event_type: 'mint' | 'transfer' | 'sale' | 'listing',
  event_data: { nft_id, from_address, to_address, price },
  processed: boolean
}
```

### Marketplace Cache (`marketplace_cache`)
Stores marketplace listings and sales data:
```typescript
{
  listing_id: string,
  nft_id: string,
  seller_address: string,
  price: number,
  status: 'active' | 'sold' | 'cancelled',
  cache_expires_at: Date
}
```

### Sync Status (`sync_status`)
Tracks background synchronization processes:
```typescript
{
  sync_type: 'nft_collection' | 'marketplace' | 'events',
  target_identifier: string,
  last_sync_block: number,
  sync_in_progress: boolean,
  error_count: number
}
```

## Configuration

### Environment Variables
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=ownly_cache

# Cache Configuration
CACHE_TTL_MINUTES=10
MARKETPLACE_CACHE_TTL_MINUTES=2
SYNC_INTERVAL_SECONDS=30
```

### Database Indexes
The system automatically creates optimized indexes for:
- NFT queries by ID, owner, and collection
- User queries by Flow address
- Transaction queries by hash and block height
- Marketplace queries by status and price
- TTL indexes for automatic cache expiration

## Usage Examples

### Basic Caching Operations
```typescript
import { enhancedCacheService } from '@/lib/database'

// Get NFT with caching
const nft = await enhancedCacheService.getNFT('nft_123', true)

// Get user collection with caching
const nfts = await enhancedCacheService.getUserCollection('0x123...', true)

// Invalidate cache on blockchain event
await enhancedCacheService.invalidateByEvent('CollectibleTransferred', {
  nftId: 'nft_123',
  from: '0x123...',
  to: '0x456...'
})
```

### Cache Management API
```bash
# Initialize database
POST /api/cache/init

# Get cache statistics
GET /api/cache/manage

# Invalidate user cache
POST /api/cache/manage
{
  "action": "invalidate_user",
  "data": { "address": "0x123..." }
}

# Warm cache for multiple users
POST /api/cache/manage
{
  "action": "warm_cache",
  "data": { "addresses": ["0x123...", "0x456..."] }
}
```

## Background Sync Processes

### Event Synchronization (30 seconds)
- Monitors Flow blockchain for new events
- Processes CollectibleMinted, CollectibleTransferred events
- Updates cache based on blockchain state changes

### User Collection Sync (5 minutes)
- Refreshes stale user collection data
- Updates NFT ownership information
- Maintains collection statistics

### Marketplace Sync (2 minutes)
- Updates marketplace listings
- Processes sale and listing events
- Maintains marketplace cache consistency

### Cache Cleanup (1 hour)
- Removes expired cache entries
- Optimizes database performance
- Maintains storage efficiency

## Error Handling and Recovery

### Retry Mechanisms
- Exponential backoff for failed operations
- Circuit breaker pattern for external API calls
- Graceful degradation when cache is unavailable

### Monitoring and Logging
- Comprehensive error logging
- Performance metrics tracking
- Health check endpoints for monitoring

### Failover Strategies
- Falls back to direct API calls when cache fails
- Maintains service availability during cache outages
- Automatic recovery and reconnection

## Performance Considerations

### Query Optimization
- Compound indexes for complex queries
- Projection queries to reduce data transfer
- Aggregation pipelines for analytics

### Memory Management
- Connection pooling to limit resource usage
- TTL-based automatic cleanup
- Batch processing to reduce overhead

### Scalability
- Horizontal scaling support with replica sets
- Sharding strategies for large datasets
- Load balancing for high availability

## Maintenance

### Database Maintenance
```bash
# Check database health
GET /api/cache/init

# Get database statistics
GET /api/cache/manage

# Manual cache cleanup
POST /api/cache/manage { "action": "cleanup" }
```

### Monitoring
- Monitor cache hit rates
- Track sync process performance
- Alert on error thresholds
- Monitor database storage usage

## Integration with Existing Services

The MongoDB caching layer integrates seamlessly with:
- **Dapper Core API** - Caches API responses
- **Flow Blockchain** - Syncs with on-chain events
- **Marketplace Service** - Enhances existing in-memory cache
- **User Collection Service** - Provides persistent user data storage

This implementation satisfies requirements 7.2, 7.3, and 7.6 by providing efficient backend data management, secure blockchain interactions, and fast UI loads while maintaining decentralized ownership verification.