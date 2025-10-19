// Transaction History Service - Fetches and manages NFT transaction history

import * as fcl from "@onflow/fcl"
import { dapperService, DapperService } from "@/lib/dapper/service"
import type { Transaction, NFT, User } from "@/lib/types"
import type { EnrichedNFT } from "./collection-service"

export interface TransactionFilter {
  type?: 'mint' | 'sale' | 'transfer' | 'offer'
  status?: 'pending' | 'completed' | 'failed'
  nftId?: string
  address?: string
  fromBlock?: number
  toBlock?: number
}

export interface TransactionQueryResult {
  transactions: Transaction[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
}

class TransactionService {
  private cache = new Map<string, { data: Transaction[]; timestamp: number }>()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes for transaction data

  // Get transaction history for a user
  async getUserTransactions(
    address: string, 
    filter?: TransactionFilter,
    limit = 50,
    cursor?: string
  ): Promise<TransactionQueryResult> {
    const formattedAddress = dapperService.formatFlowAddress(address)
    const cacheKey = `${formattedAddress}-${JSON.stringify(filter)}-${limit}-${cursor}`

    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        transactions: cached.data,
        totalCount: cached.data.length,
        hasMore: false
      }
    }

    try {
      // Get transactions from Flow events and Dapper API
      const [flowEvents, dapperTransactions] = await Promise.all([
        this.getFlowEvents(formattedAddress, filter),
        this.getDapperTransactions(formattedAddress, filter)
      ])

      // Merge and deduplicate transactions
      const mergedTransactions = this.mergeTransactions(flowEvents, dapperTransactions)
      
      // Apply additional filtering and sorting
      const filteredTransactions = this.filterAndSortTransactions(mergedTransactions, filter)
      
      // Apply pagination
      const startIndex = cursor ? parseInt(cursor) : 0
      const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + limit)
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: paginatedTransactions,
        timestamp: Date.now()
      })

      return {
        transactions: paginatedTransactions,
        totalCount: filteredTransactions.length,
        hasMore: startIndex + limit < filteredTransactions.length,
        nextCursor: startIndex + limit < filteredTransactions.length ? 
          (startIndex + limit).toString() : undefined
      }

    } catch (error) {
      console.error('Error fetching user transactions:', error)
      throw new Error('Failed to fetch transaction history')
    }
  }

  // Get transactions for a specific NFT
  async getNFTTransactions(nftId: string, limit = 20): Promise<Transaction[]> {
    const cacheKey = `nft-${nftId}-${limit}`
    
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      // Get NFT-specific events from Flow blockchain
      const events = await this.getNFTEvents(nftId)
      
      // Convert events to transaction objects
      const transactions = await this.convertEventsToTransactions(events)
      
      // Sort by timestamp (newest first)
      transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      const limitedTransactions = transactions.slice(0, limit)
      
      this.cache.set(cacheKey, {
        data: limitedTransactions,
        timestamp: Date.now()
      })

      return limitedTransactions

    } catch (error) {
      console.error('Error fetching NFT transactions:', error)
      return []
    }
  }

  // Transfer NFT to another address
  async transferNFT(nftId: string, recipientAddress: string, fromAddress?: string): Promise<string> {
    try {
      // Validate recipient address
      if (!DapperService.isValidFlowAddress(recipientAddress)) {
        throw new Error('Invalid recipient address format')
      }

      const formattedRecipient = DapperService.formatFlowAddress(recipientAddress)

      // Get current user address if not provided
      const currentUser = await fcl.currentUser.snapshot()
      const from = fromAddress || currentUser?.addr
      
      if (!from) {
        throw new Error('No wallet connected')
      }

      // Call API endpoint for transfer
      const response = await fetch('/api/nft/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nft_id: nftId,
          from: DapperService.formatFlowAddress(from),
          to: formattedRecipient
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transfer failed')
      }

      const result = await response.json()

      // Clear relevant caches
      this.clearTransactionCache()

      return result.transaction_hash || result.txHash || 'pending'

    } catch (error) {
      console.error('NFT transfer failed:', error)
      throw new Error(error instanceof Error ? error.message : 'Transfer failed')
    }
  }

  // List NFT for sale
  async listNFTForSale(
    nftId: string, 
    price: number, 
    currency: string = 'FLOW',
    duration?: number
  ): Promise<string> {
    try {
      // Get current user address
      const currentUser = await fcl.currentUser.snapshot()
      const seller = currentUser?.addr
      
      if (!seller) {
        throw new Error('No wallet connected')
      }

      // Call API endpoint for listing
      const response = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nft_id: nftId,
          price,
          currency,
          seller: DapperService.formatFlowAddress(seller),
          duration_days: duration
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Listing failed')
      }

      const result = await response.json()

      // Clear relevant caches
      this.clearTransactionCache()

      return result.transaction_hash || result.txHash || 'pending'

    } catch (error) {
      console.error('NFT listing failed:', error)
      throw new Error(error instanceof Error ? error.message : 'Listing failed')
    }
  }

  // Get Flow blockchain events
  private async getFlowEvents(address: string, filter?: TransactionFilter): Promise<any[]> {
    try {
      // Query Flow events using FCL
      const events = await fcl.send([
        fcl.script`
          import DapperCollectibles from 0xDapperCollectibles

          pub fun main(address: Address): [AnyStruct] {
            // Query events related to the address
            // This is a simplified version - in practice you'd query specific event types
            return []
          }
        `,
        fcl.args([fcl.arg(address, fcl.t.Address)])
      ]).then(fcl.decode)

      return events || []

    } catch (error) {
      console.warn('Failed to fetch Flow events:', error)
      return []
    }
  }

  // Get transactions from Dapper API
  private async getDapperTransactions(address: string, filter?: TransactionFilter): Promise<any[]> {
    try {
      // This would call a Dapper API endpoint for transaction history
      // For now, return empty array as this endpoint may not be available
      return []

    } catch (error) {
      console.warn('Failed to fetch Dapper transactions:', error)
      return []
    }
  }

  // Get events for a specific NFT
  private async getNFTEvents(nftId: string): Promise<any[]> {
    try {
      // Query Flow events for specific NFT
      const events = await fcl.send([
        fcl.script`
          import DapperCollectibles from 0xDapperCollectibles

          pub fun main(nftId: UInt64): [AnyStruct] {
            // Query events for specific NFT ID
            return []
          }
        `,
        fcl.args([fcl.arg(parseInt(nftId), fcl.t.UInt64)])
      ]).then(fcl.decode)

      return events || []

    } catch (error) {
      console.warn('Failed to fetch NFT events:', error)
      return []
    }
  }

  // Convert Flow events to Transaction objects
  private async convertEventsToTransactions(events: any[]): Promise<Transaction[]> {
    const transactions: Transaction[] = []

    for (const event of events) {
      try {
        // Parse event data and create Transaction object
        const transaction: Transaction = {
          id: event.transactionId || `${event.blockHeight}-${event.eventIndex}`,
          type: this.getTransactionType(event.type),
          nft: await this.createNFTFromEvent(event),
          from: await this.createUserFromAddress(event.from),
          to: await this.createUserFromAddress(event.to),
          price: event.price,
          currency: event.currency || 'FLOW',
          timestamp: new Date(event.blockTimestamp * 1000).toISOString(),
          txHash: event.transactionId,
          status: 'completed'
        }

        transactions.push(transaction)

      } catch (error) {
        console.warn('Failed to convert event to transaction:', error)
      }
    }

    return transactions
  }

  // Merge transactions from different sources
  private mergeTransactions(flowEvents: any[], dapperTransactions: any[]): Transaction[] {
    const transactionMap = new Map<string, Transaction>()

    // Add Flow events
    flowEvents.forEach(event => {
      const txId = event.transactionId || event.id
      if (txId && !transactionMap.has(txId)) {
        // Convert to Transaction object
        // This is simplified - in practice you'd have proper conversion logic
      }
    })

    // Add Dapper transactions
    dapperTransactions.forEach(tx => {
      if (tx.id && !transactionMap.has(tx.id)) {
        transactionMap.set(tx.id, tx)
      }
    })

    return Array.from(transactionMap.values())
  }

  // Filter and sort transactions
  private filterAndSortTransactions(transactions: Transaction[], filter?: TransactionFilter): Transaction[] {
    let filtered = transactions

    if (filter?.type) {
      filtered = filtered.filter(tx => tx.type === filter.type)
    }

    if (filter?.status) {
      filtered = filtered.filter(tx => tx.status === filter.status)
    }

    if (filter?.nftId) {
      filtered = filtered.filter(tx => tx.nft.id === filter.nftId)
    }

    if (filter?.address) {
      const formattedAddress = DapperService.formatFlowAddress(filter.address)
      filtered = filtered.filter(tx => 
        tx.from.walletAddress === formattedAddress || 
        tx.to.walletAddress === formattedAddress
      )
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  // Helper methods
  private getTransactionType(eventType: string): Transaction['type'] {
    if (eventType.includes('Mint')) return 'mint'
    if (eventType.includes('Sale') || eventType.includes('Purchase')) return 'sale'
    if (eventType.includes('Transfer')) return 'transfer'
    if (eventType.includes('Offer')) return 'offer'
    return 'transfer' // default
  }

  private async createNFTFromEvent(event: any): Promise<NFT> {
    // This would create an NFT object from event data
    // Simplified implementation
    return {
      id: event.nftId?.toString() || '0',
      name: 'NFT',
      description: '',
      image: '',
      price: 0,
      currency: 'FLOW',
      owner: {} as User,
      creator: {} as User,
      category: '',
      rarity: 'common',
      mintedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      blockchain: 'Flow',
      tokenId: event.nftId?.toString() || '0',
      royalty: 0
    }
  }

  private async createUserFromAddress(address: string): Promise<User> {
    // This would fetch user data from address
    // Simplified implementation
    return {
      id: address,
      username: address.slice(0, 8),
      displayName: address.slice(0, 8),
      avatar: '',
      bio: '',
      walletAddress: address,
      verified: false,
      joinedAt: new Date().toISOString(),
      nftsOwned: 0,
      nftsCreated: 0
    }
  }

  // Clear transaction cache
  clearTransactionCache(address?: string): void {
    if (address) {
      const formattedAddress = DapperService.formatFlowAddress(address)
      // Clear cache entries for specific address
      for (const key of this.cache.keys()) {
        if (key.startsWith(formattedAddress)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.CACHE_TTL
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService()
export { TransactionService }