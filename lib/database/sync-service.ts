import { Db, Collection } from 'mongodb'
import { getDatabase } from './config'
import { cacheService } from './cache-service'
import {
  SyncStatusDocument,
  TransactionLogDocument,
  COLLECTIONS
} from './schemas'
import * as fcl from '@onflow/fcl'
import { dapperService } from '../dapper/service'
import type { NFT, User } from '../types'

export class SyncService {
  private db: Db | null = null
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false

  private async getDb(): Promise<Db> {
    if (!this.db) {
      this.db = await getDatabase()
    }
    return this.db
  }

  // Start background sync processes
  async startBackgroundSync(): Promise<void> {
    if (this.isRunning) {
      console.log('Background sync already running')
      return
    }

    this.isRunning = true
    console.log('Starting background sync processes...')

    // Start different sync processes with different intervals
    this.startEventSync() // Every 30 seconds
    this.startUserCollectionSync() // Every 5 minutes
    this.startMarketplaceSync() // Every 2 minutes
    this.startCacheCleanup() // Every hour

    console.log('Background sync processes started')
  }

  // Stop all background sync processes
  stopBackgroundSync(): void {
    if (!this.isRunning) return

    this.isRunning = false
    
    // Clear all intervals
    for (const [name, interval] of this.syncIntervals) {
      clearInterval(interval)
      console.log(`Stopped ${name} sync process`)
    }
    
    this.syncIntervals.clear()
    console.log('All background sync processes stopped')
  }

  // Event synchronization - monitors blockchain events
  private startEventSync(): void {
    const syncEvents = async () => {
      try {
        await this.syncBlockchainEvents()
      } catch (error) {
        console.error('Error in event sync:', error)
      }
    }

    // Initial sync
    syncEvents()

    // Set up interval
    const interval = setInterval(syncEvents, 30000) // 30 seconds
    this.syncIntervals.set('events', interval)
  }

  // User collection synchronization
  private startUserCollectionSync(): void {
    const syncUserCollections = async () => {
      try {
        await this.syncStaleUserCollections()
      } catch (error) {
        console.error('Error in user collection sync:', error)
      }
    }

    // Initial sync
    setTimeout(syncUserCollections, 5000) // Start after 5 seconds

    // Set up interval
    const interval = setInterval(syncUserCollections, 5 * 60 * 1000) // 5 minutes
    this.syncIntervals.set('user-collections', interval)
  }

  // Marketplace synchronization
  private startMarketplaceSync(): void {
    const syncMarketplace = async () => {
      try {
        await this.syncMarketplaceData()
      } catch (error) {
        console.error('Error in marketplace sync:', error)
      }
    }

    // Initial sync
    setTimeout(syncMarketplace, 10000) // Start after 10 seconds

    // Set up interval
    const interval = setInterval(syncMarketplace, 2 * 60 * 1000) // 2 minutes
    this.syncIntervals.set('marketplace', interval)
  }

  // Cache cleanup
  private startCacheCleanup(): void {
    const cleanup = async () => {
      try {
        await cacheService.cleanupExpiredCache()
        console.log('Cache cleanup completed')
      } catch (error) {
        console.error('Error in cache cleanup:', error)
      }
    }

    // Set up interval
    const interval = setInterval(cleanup, 60 * 60 * 1000) // 1 hour
    this.syncIntervals.set('cleanup', interval)
  }

  // Sync blockchain events and process unprocessed transactions
  private async syncBlockchainEvents(): Promise<void> {
    const db = await this.getDb()
    const syncCollection: Collection<SyncStatusDocument> = db.collection(COLLECTIONS.SYNC_STATUS)

    // Get last synced block for events
    const eventSyncStatus = await syncCollection.findOne({
      sync_type: 'events',
      target_identifier: 'dapper_collectibles'
    })

    const fromBlock = eventSyncStatus?.last_sync_block || 0
    const currentBlock = await this.getCurrentBlockHeight()

    if (currentBlock <= fromBlock) {
      return // No new blocks to process
    }

    try {
      // Mark sync as in progress
      await syncCollection.updateOne(
        { sync_type: 'events', target_identifier: 'dapper_collectibles' },
        {
          $set: {
            sync_in_progress: true,
            sync_started_at: new Date()
          }
        },
        { upsert: true }
      )

      // Process events from new blocks
      await this.processBlockchainEvents(fromBlock + 1, currentBlock)

      // Process unprocessed transactions
      await this.processUnprocessedTransactions()

      // Update sync status
      await syncCollection.updateOne(
        { sync_type: 'events', target_identifier: 'dapper_collectibles' },
        {
          $set: {
            last_sync_block: currentBlock,
            last_sync_timestamp: new Date(),
            sync_in_progress: false,
            sync_completed_at: new Date(),
            error_count: 0,
            next_sync_at: new Date(Date.now() + 30000) // Next sync in 30 seconds
          }
        }
      )

    } catch (error) {
      console.error('Error syncing blockchain events:', error)
      
      // Update error status
      await syncCollection.updateOne(
        { sync_type: 'events', target_identifier: 'dapper_collectibles' },
        {
          $set: {
            sync_in_progress: false,
            last_error: error instanceof Error ? error.message : 'Unknown error',
            error_count: (eventSyncStatus?.error_count || 0) + 1,
            next_sync_at: new Date(Date.now() + 60000) // Retry in 1 minute
          }
        }
      )
    }
  }

  // Sync stale user collections
  private async syncStaleUserCollections(): Promise<void> {
    const db = await this.getDb()
    const userCollection = db.collection(COLLECTIONS.USER_CACHE)

    // Find users with stale cache (older than 10 minutes)
    const staleUsers = await userCollection.find({
      cache_expires_at: { $lt: new Date() },
      sync_in_progress: { $ne: true }
    }).limit(10).toArray()

    for (const user of staleUsers) {
      try {
        // Mark as sync in progress
        await userCollection.updateOne(
          { _id: user._id },
          { $set: { sync_in_progress: true } }
        )

        // Fetch fresh user data
        await this.refreshUserCollection(user.flow_address)

      } catch (error) {
        console.error(`Error syncing user ${user.flow_address}:`, error)
        
        // Reset sync flag on error
        await userCollection.updateOne(
          { _id: user._id },
          { $set: { sync_in_progress: false } }
        )
      }
    }
  }

  // Sync marketplace data
  private async syncMarketplaceData(): Promise<void> {
    try {
      // Fetch fresh marketplace listings
      const listings = await dapperService.getMarketplaceListings()
      
      // Update cache with fresh data
      // This would integrate with the marketplace cache service
      console.log(`Synced ${listings.listings?.length || 0} marketplace listings`)
      
    } catch (error) {
      console.error('Error syncing marketplace data:', error)
    }
  }

  // Process blockchain events for specific block range
  private async processBlockchainEvents(fromBlock: number, toBlock: number): Promise<void> {
    try {
      // Subscribe to Flow events for the block range
      const events = await fcl.send([
        fcl.getEventsAtBlockHeightRange(
          'A.DapperCollectibles.CollectibleMinted',
          fromBlock,
          toBlock
        )
      ]).then(fcl.decode)

      for (const event of events) {
        await this.processEvent(event)
      }

    } catch (error) {
      console.error('Error processing blockchain events:', error)
      throw error
    }
  }

  // Process individual blockchain event
  private async processEvent(event: any): Promise<void> {
    const { type, transactionId, data, blockHeight } = event

    // Log the transaction
    await cacheService.logTransaction(
      transactionId,
      blockHeight,
      this.mapEventTypeToTransactionType(type),
      event.contractAddress || '',
      {
        nft_id: data.id?.toString(),
        from_address: data.from,
        to_address: data.to,
        price: data.price ? parseFloat(data.price) : undefined,
        currency: data.currency
      }
    )

    // Invalidate relevant caches
    if (data.to) {
      await cacheService.invalidateCacheByAddress(data.to)
    }
    if (data.from && data.from !== data.to) {
      await cacheService.invalidateCacheByAddress(data.from)
    }
    if (data.id) {
      await cacheService.invalidateNFTCache(data.id.toString())
    }
  }

  // Process unprocessed transactions from the log
  private async processUnprocessedTransactions(): Promise<void> {
    const unprocessed = await cacheService.getUnprocessedTransactions(20)

    for (const transaction of unprocessed) {
      try {
        await this.processTransactionLog(transaction)
        await cacheService.markTransactionProcessed(transaction.transaction_hash)
      } catch (error) {
        console.error(`Error processing transaction ${transaction.transaction_hash}:`, error)
        
        // Increment processing attempts
        const db = await this.getDb()
        await db.collection(COLLECTIONS.TRANSACTION_LOG).updateOne(
          { transaction_hash: transaction.transaction_hash },
          {
            $inc: { processing_attempts: 1 },
            $set: { last_processing_attempt: new Date() }
          }
        )
      }
    }
  }

  // Process individual transaction log entry
  private async processTransactionLog(transaction: TransactionLogDocument): Promise<void> {
    const { event_type, event_data } = transaction

    switch (event_type) {
      case 'mint':
        if (event_data.nft_id && event_data.to_address) {
          await this.refreshNFTData(event_data.nft_id)
          await this.refreshUserCollection(event_data.to_address)
        }
        break

      case 'transfer':
        if (event_data.nft_id) {
          await this.refreshNFTData(event_data.nft_id)
          if (event_data.from_address) {
            await this.refreshUserCollection(event_data.from_address)
          }
          if (event_data.to_address) {
            await this.refreshUserCollection(event_data.to_address)
          }
        }
        break

      case 'sale':
        if (event_data.nft_id) {
          await this.refreshNFTData(event_data.nft_id)
          await cacheService.invalidateMarketplaceCache()
        }
        break
    }
  }

  // Refresh NFT data from blockchain
  private async refreshNFTData(nftId: string): Promise<void> {
    try {
      // This would fetch fresh NFT data from Dapper API or Flow blockchain
      // For now, we'll invalidate the cache to force refresh on next request
      await cacheService.invalidateNFTCache(nftId)
    } catch (error) {
      console.error(`Error refreshing NFT ${nftId}:`, error)
    }
  }

  // Refresh user collection data
  private async refreshUserCollection(address: string): Promise<void> {
    try {
      // This would fetch fresh user collection data
      // For now, we'll invalidate the cache to force refresh on next request
      await cacheService.invalidateCacheByAddress(address)
    } catch (error) {
      console.error(`Error refreshing user collection ${address}:`, error)
    }
  }

  // Helper methods
  private async getCurrentBlockHeight(): Promise<number> {
    try {
      const block = await fcl.send([fcl.getBlock(true)]).then(fcl.decode)
      return block.height
    } catch (error) {
      console.error('Error getting current block height:', error)
      return 0
    }
  }

  private mapEventTypeToTransactionType(eventType: string): TransactionLogDocument['event_type'] {
    if (eventType.includes('Minted')) return 'mint'
    if (eventType.includes('Transferred')) return 'transfer'
    if (eventType.includes('Sale') || eventType.includes('Purchased')) return 'sale'
    if (eventType.includes('Listed')) return 'listing'
    return 'transfer' // Default fallback
  }
}

// Export singleton instance
export const syncService = new SyncService()