import { Db, Collection } from 'mongodb'
import { getDatabase } from './config'
import {
  NFTCacheDocument,
  UserCacheDocument,
  TransactionLogDocument,
  MarketplaceCacheDocument,
  SyncStatusDocument,
  COLLECTIONS
} from './schemas'
import type { NFT, User } from '../types'

export class CacheService {
  private db: Db | null = null

  private async getDb(): Promise<Db> {
    if (!this.db) {
      this.db = await getDatabase()
    }
    return this.db
  }

  // NFT Cache Operations
  async cacheNFT(nft: NFT, blockHeight: number): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<NFTCacheDocument> = db.collection(COLLECTIONS.NFT_CACHE)

    const cacheDoc: NFTCacheDocument = {
      nft_id: nft.id,
      token_id: nft.id,
      contract_address: nft.contract_address || '',
      collection_id: nft.collection_id || 'ownly_collectibles',
      metadata: {
        name: nft.name,
        description: nft.description,
        image: nft.image,
        metadata_url: nft.metadata_url || '',
        attributes: nft.attributes,
        rarity: nft.rarity,
        category: nft.category
      },
      owner_address: nft.owner,
      creator_address: nft.creator || nft.owner,
      minted_at: new Date(nft.minted_at || Date.now()),
      transaction_hash: nft.transaction_hash || '',
      block_height: blockHeight,
      last_updated: new Date(),
      cache_expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      is_listed: nft.is_listed || false,
      listing_price: nft.listing_price,
      listing_currency: nft.listing_currency
    }

    await collection.replaceOne(
      { nft_id: nft.id },
      cacheDoc,
      { upsert: true }
    )
  }

  async getCachedNFT(nftId: string): Promise<NFT | null> {
    const db = await this.getDb()
    const collection: Collection<NFTCacheDocument> = db.collection(COLLECTIONS.NFT_CACHE)

    const cached = await collection.findOne({
      nft_id: nftId,
      cache_expires_at: { $gt: new Date() }
    })

    if (!cached) return null

    return this.convertCachedNFTToNFT(cached)
  }

  async getCachedNFTsByOwner(ownerAddress: string): Promise<NFT[]> {
    const db = await this.getDb()
    const collection: Collection<NFTCacheDocument> = db.collection(COLLECTIONS.NFT_CACHE)

    const cached = await collection.find({
      owner_address: ownerAddress,
      cache_expires_at: { $gt: new Date() }
    }).toArray()

    return cached.map(doc => this.convertCachedNFTToNFT(doc))
  }

  async invalidateNFTCache(nftId: string): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<NFTCacheDocument> = db.collection(COLLECTIONS.NFT_CACHE)

    await collection.updateOne(
      { nft_id: nftId },
      { $set: { cache_expires_at: new Date() } }
    )
  }

  // User Cache Operations
  async cacheUser(user: User, nftIds: string[]): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<UserCacheDocument> = db.collection(COLLECTIONS.USER_CACHE)

    const cacheDoc: UserCacheDocument = {
      flow_address: user.flow_address,
      profile: {
        username: user.username,
        display_name: user.display_name,
        avatar: user.avatar,
        bio: user.bio,
        verified: user.verified || false,
        joined_at: new Date(user.joined_at || Date.now())
      },
      collection_stats: {
        nfts_owned: user.nfts_owned || nftIds.length,
        nfts_created: user.nfts_created || 0,
        total_value: user.total_value,
        last_activity: new Date()
      },
      owned_nfts: nftIds,
      created_nfts: [], // Will be populated by separate query
      last_sync: new Date(),
      cache_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      sync_in_progress: false
    }

    await collection.replaceOne(
      { flow_address: user.flow_address },
      cacheDoc,
      { upsert: true }
    )
  }

  async getCachedUser(flowAddress: string): Promise<User | null> {
    const db = await this.getDb()
    const collection: Collection<UserCacheDocument> = db.collection(COLLECTIONS.USER_CACHE)

    const cached = await collection.findOne({
      flow_address: flowAddress,
      cache_expires_at: { $gt: new Date() }
    })

    if (!cached) return null

    return this.convertCachedUserToUser(cached)
  }

  async invalidateUserCache(flowAddress: string): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<UserCacheDocument> = db.collection(COLLECTIONS.USER_CACHE)

    await collection.updateOne(
      { flow_address: flowAddress },
      { $set: { cache_expires_at: new Date() } }
    )
  }

  // Transaction Log Operations
  async logTransaction(
    transactionHash: string,
    blockHeight: number,
    eventType: TransactionLogDocument['event_type'],
    contractAddress: string,
    eventData: TransactionLogDocument['event_data']
  ): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<TransactionLogDocument> = db.collection(COLLECTIONS.TRANSACTION_LOG)

    const addressesInvolved = [
      eventData.from_address,
      eventData.to_address
    ].filter(Boolean) as string[]

    const logDoc: TransactionLogDocument = {
      transaction_hash: transactionHash,
      block_height: blockHeight,
      event_type: eventType,
      contract_address: contractAddress,
      event_data: eventData,
      addresses_involved: addressesInvolved,
      processed: false,
      processing_attempts: 0,
      created_at: new Date(),
      updated_at: new Date()
    }

    await collection.replaceOne(
      { transaction_hash: transactionHash },
      logDoc,
      { upsert: true }
    )
  }

  async getUnprocessedTransactions(limit = 50): Promise<TransactionLogDocument[]> {
    const db = await this.getDb()
    const collection: Collection<TransactionLogDocument> = db.collection(COLLECTIONS.TRANSACTION_LOG)

    return await collection.find({
      processed: false,
      processing_attempts: { $lt: 3 }
    })
    .sort({ created_at: 1 })
    .limit(limit)
    .toArray()
  }

  async markTransactionProcessed(transactionHash: string): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<TransactionLogDocument> = db.collection(COLLECTIONS.TRANSACTION_LOG)

    await collection.updateOne(
      { transaction_hash: transactionHash },
      {
        $set: {
          processed: true,
          updated_at: new Date()
        }
      }
    )
  }

  // Cache Invalidation Strategies
  async invalidateCacheByAddress(address: string): Promise<void> {
    await Promise.all([
      this.invalidateUserCache(address),
      this.invalidateNFTCacheByOwner(address)
    ])
  }

  async invalidateNFTCacheByOwner(ownerAddress: string): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<NFTCacheDocument> = db.collection(COLLECTIONS.NFT_CACHE)

    await collection.updateMany(
      { owner_address: ownerAddress },
      { $set: { cache_expires_at: new Date() } }
    )
  }

  async invalidateMarketplaceCache(): Promise<void> {
    const db = await this.getDb()
    const collection: Collection<MarketplaceCacheDocument> = db.collection(COLLECTIONS.MARKETPLACE_CACHE)

    await collection.updateMany(
      {},
      { $set: { cache_expires_at: new Date() } }
    )
  }

  // Cleanup expired cache entries
  async cleanupExpiredCache(): Promise<void> {
    const db = await this.getDb()
    const now = new Date()

    await Promise.all([
      db.collection(COLLECTIONS.NFT_CACHE).deleteMany({ cache_expires_at: { $lt: now } }),
      db.collection(COLLECTIONS.USER_CACHE).deleteMany({ cache_expires_at: { $lt: now } }),
      db.collection(COLLECTIONS.MARKETPLACE_CACHE).deleteMany({ cache_expires_at: { $lt: now } })
    ])
  }

  // Helper methods to convert cached documents to domain objects
  private convertCachedNFTToNFT(cached: NFTCacheDocument): NFT {
    return {
      id: cached.nft_id,
      name: cached.metadata.name,
      description: cached.metadata.description,
      image: cached.metadata.image,
      metadata_url: cached.metadata.metadata_url,
      owner: cached.owner_address,
      creator: cached.creator_address,
      minted_at: cached.minted_at.toISOString(),
      transaction_hash: cached.transaction_hash,
      attributes: cached.metadata.attributes,
      rarity: cached.metadata.rarity,
      category: cached.metadata.category,
      collection_id: cached.collection_id,
      contract_address: cached.contract_address,
      is_listed: cached.is_listed,
      listing_price: cached.listing_price,
      listing_currency: cached.listing_currency
    }
  }

  private convertCachedUserToUser(cached: UserCacheDocument): User {
    return {
      id: cached.flow_address,
      flow_address: cached.flow_address,
      username: cached.profile.username || '',
      display_name: cached.profile.display_name || '',
      avatar: cached.profile.avatar || '',
      bio: cached.profile.bio || '',
      verified: cached.profile.verified,
      joined_at: cached.profile.joined_at.toISOString(),
      nfts_owned: cached.collection_stats.nfts_owned,
      nfts_created: cached.collection_stats.nfts_created,
      total_value: cached.collection_stats.total_value
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()