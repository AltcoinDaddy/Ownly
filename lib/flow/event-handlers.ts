import { BlockchainEvent, EVENT_TYPES } from "./events"

// Event handler interface
export interface EventHandler {
  handle(event: BlockchainEvent): Promise<void>
}

// Handler for CollectibleMinted events
export class CollectibleMintedHandler implements EventHandler {
  async handle(event: BlockchainEvent): Promise<void> {
    if (event.type !== EVENT_TYPES.COLLECTIBLE_MINTED) {
      return
    }

    console.log("[CollectibleMintedHandler] Processing mint event:", event)

    try {
      const { nftId, recipient, collectionId, metadataUrl, creator } = event.data

      // Validate required data
      if (!nftId || !recipient) {
        console.error("[CollectibleMintedHandler] Missing required data:", event.data)
        return
      }

      // Process the mint event
      await this.processMintEvent({
        nftId,
        recipient,
        collectionId,
        metadataUrl,
        creator,
        transactionId: event.transactionId,
        blockHeight: event.blockHeight,
        timestamp: event.timestamp
      })

      console.log("[CollectibleMintedHandler] Successfully processed mint event for NFT:", nftId)
    } catch (error) {
      console.error("[CollectibleMintedHandler] Error processing mint event:", error)
      throw error
    }
  }

  private async processMintEvent(data: {
    nftId: string
    recipient: string
    collectionId?: string
    metadataUrl?: string
    creator?: string
    transactionId: string
    blockHeight: number
    timestamp: Date
  }): Promise<void> {
    // Update local cache/state with new NFT
    console.log("[CollectibleMintedHandler] New NFT minted:", {
      id: data.nftId,
      owner: data.recipient,
      collection: data.collectionId,
      metadata: data.metadataUrl,
      creator: data.creator,
      mintedAt: data.timestamp
    })

    // Trigger UI updates for the recipient
    this.notifyUIUpdate("mint", {
      nftId: data.nftId,
      owner: data.recipient,
      type: "mint",
      transactionId: data.transactionId
    })

    // If this is an Ownly collectible, update our collection cache
    if (data.collectionId === "ownly_collectibles") {
      await this.updateOwnlyCollectionCache(data)
    }
  }

  private async updateOwnlyCollectionCache(data: any): Promise<void> {
    // This would update a local cache or database
    // For now, just log the action
    console.log("[CollectibleMintedHandler] Updating Ownly collection cache for NFT:", data.nftId)
  }

  private notifyUIUpdate(eventType: string, data: any): void {
    // Dispatch custom event for UI components to listen to
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nft-event", {
        detail: { eventType, data }
      }))
    }
  }
}

// Handler for CollectibleTransferred events
export class CollectibleTransferredHandler implements EventHandler {
  async handle(event: BlockchainEvent): Promise<void> {
    if (event.type !== EVENT_TYPES.COLLECTIBLE_TRANSFERRED) {
      return
    }

    console.log("[CollectibleTransferredHandler] Processing transfer event:", event)

    try {
      const { nftId, from, to, collectionId } = event.data

      // Validate required data
      if (!nftId || !from || !to) {
        console.error("[CollectibleTransferredHandler] Missing required data:", event.data)
        return
      }

      // Process the transfer event
      await this.processTransferEvent({
        nftId,
        from,
        to,
        collectionId,
        transactionId: event.transactionId,
        blockHeight: event.blockHeight,
        timestamp: event.timestamp
      })

      console.log("[CollectibleTransferredHandler] Successfully processed transfer event for NFT:", nftId)
    } catch (error) {
      console.error("[CollectibleTransferredHandler] Error processing transfer event:", error)
      throw error
    }
  }

  private async processTransferEvent(data: {
    nftId: string
    from: string
    to: string
    collectionId?: string
    transactionId: string
    blockHeight: number
    timestamp: Date
  }): Promise<void> {
    console.log("[CollectibleTransferredHandler] NFT transferred:", {
      id: data.nftId,
      from: data.from,
      to: data.to,
      collection: data.collectionId,
      transferredAt: data.timestamp
    })

    // Update ownership in local cache
    await this.updateOwnershipCache(data.nftId, data.from, data.to)

    // Notify both sender and receiver UIs
    this.notifyUIUpdate("transfer", {
      nftId: data.nftId,
      from: data.from,
      to: data.to,
      type: "transfer",
      transactionId: data.transactionId
    })

    // Update user collections for both parties
    await this.updateUserCollections(data.from, data.to, data.nftId)
  }

  private async updateOwnershipCache(nftId: string, from: string, to: string): Promise<void> {
    console.log("[CollectibleTransferredHandler] Updating ownership cache:", { nftId, from, to })
    // This would update local cache/database with new ownership
  }

  private async updateUserCollections(from: string, to: string, nftId: string): Promise<void> {
    console.log("[CollectibleTransferredHandler] Updating user collections:", { from, to, nftId })
    // This would update user collection caches
  }

  private notifyUIUpdate(eventType: string, data: any): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nft-event", {
        detail: { eventType, data }
      }))
    }
  }
}

// Handler for marketplace sale events
export class MarketplaceSaleHandler implements EventHandler {
  async handle(event: BlockchainEvent): Promise<void> {
    if (event.type !== EVENT_TYPES.SALE_COMPLETED) {
      return
    }

    console.log("[MarketplaceSaleHandler] Processing sale event:", event)

    try {
      const { nftId, seller, buyer, price, currency } = event.data

      // Validate required data
      if (!nftId || !seller || !buyer || !price) {
        console.error("[MarketplaceSaleHandler] Missing required data:", event.data)
        return
      }

      // Process the sale event
      await this.processSaleEvent({
        nftId,
        seller,
        buyer,
        price,
        currency: currency || "FLOW",
        transactionId: event.transactionId,
        blockHeight: event.blockHeight,
        timestamp: event.timestamp
      })

      console.log("[MarketplaceSaleHandler] Successfully processed sale event for NFT:", nftId)
    } catch (error) {
      console.error("[MarketplaceSaleHandler] Error processing sale event:", error)
      throw error
    }
  }

  private async processSaleEvent(data: {
    nftId: string
    seller: string
    buyer: string
    price: number
    currency: string
    transactionId: string
    blockHeight: number
    timestamp: Date
  }): Promise<void> {
    console.log("[MarketplaceSaleHandler] NFT sale completed:", {
      id: data.nftId,
      seller: data.seller,
      buyer: data.buyer,
      price: data.price,
      currency: data.currency,
      soldAt: data.timestamp
    })

    // Update marketplace listings (remove sold item)
    await this.updateMarketplaceListings(data.nftId)

    // Update ownership records
    await this.updateOwnershipRecords(data.nftId, data.seller, data.buyer)

    // Record transaction history
    await this.recordTransactionHistory(data)

    // Notify UI components
    this.notifyUIUpdate("sale", {
      nftId: data.nftId,
      seller: data.seller,
      buyer: data.buyer,
      price: data.price,
      currency: data.currency,
      type: "sale",
      transactionId: data.transactionId
    })
  }

  private async updateMarketplaceListings(nftId: string): Promise<void> {
    console.log("[MarketplaceSaleHandler] Removing NFT from marketplace listings:", nftId)
    // This would remove the NFT from active marketplace listings
  }

  private async updateOwnershipRecords(nftId: string, seller: string, buyer: string): Promise<void> {
    console.log("[MarketplaceSaleHandler] Updating ownership records:", { nftId, seller, buyer })
    // This would update ownership in local cache/database
  }

  private async recordTransactionHistory(data: any): Promise<void> {
    console.log("[MarketplaceSaleHandler] Recording transaction history:", data)
    // This would record the sale in transaction history
  }

  private notifyUIUpdate(eventType: string, data: any): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("marketplace-event", {
        detail: { eventType, data }
      }))
    }
  }
}

// Handler for marketplace listing events
export class MarketplaceListingHandler implements EventHandler {
  async handle(event: BlockchainEvent): Promise<void> {
    if (event.type !== EVENT_TYPES.LISTING_CREATED) {
      return
    }

    console.log("[MarketplaceListingHandler] Processing listing event:", event)

    try {
      const { nftId, seller, price, currency, listingId } = event.data

      // Validate required data
      if (!nftId || !seller || !price) {
        console.error("[MarketplaceListingHandler] Missing required data:", event.data)
        return
      }

      // Process the listing event
      await this.processListingEvent({
        nftId,
        seller,
        price,
        currency: currency || "FLOW",
        listingId,
        transactionId: event.transactionId,
        blockHeight: event.blockHeight,
        timestamp: event.timestamp
      })

      console.log("[MarketplaceListingHandler] Successfully processed listing event for NFT:", nftId)
    } catch (error) {
      console.error("[MarketplaceListingHandler] Error processing listing event:", error)
      throw error
    }
  }

  private async processListingEvent(data: {
    nftId: string
    seller: string
    price: number
    currency: string
    listingId?: string
    transactionId: string
    blockHeight: number
    timestamp: Date
  }): Promise<void> {
    console.log("[MarketplaceListingHandler] New NFT listing created:", {
      id: data.nftId,
      seller: data.seller,
      price: data.price,
      currency: data.currency,
      listingId: data.listingId,
      listedAt: data.timestamp
    })

    // Add to marketplace listings
    await this.addToMarketplaceListings(data)

    // Update NFT status to "for sale"
    await this.updateNFTStatus(data.nftId, "for_sale")

    // Notify UI components
    this.notifyUIUpdate("listing", {
      nftId: data.nftId,
      seller: data.seller,
      price: data.price,
      currency: data.currency,
      listingId: data.listingId,
      type: "listing",
      transactionId: data.transactionId
    })
  }

  private async addToMarketplaceListings(data: any): Promise<void> {
    console.log("[MarketplaceListingHandler] Adding NFT to marketplace listings:", data.nftId)
    // This would add the NFT to active marketplace listings
  }

  private async updateNFTStatus(nftId: string, status: string): Promise<void> {
    console.log("[MarketplaceListingHandler] Updating NFT status:", { nftId, status })
    // This would update NFT status in local cache
  }

  private notifyUIUpdate(eventType: string, data: any): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("marketplace-event", {
        detail: { eventType, data }
      }))
    }
  }
}

// Event handler registry
export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler[]> = new Map()

  registerHandler(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
    console.log(`[EventHandlerRegistry] Registered handler for ${eventType}`)
  }

  async processEvent(event: BlockchainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || []
    
    if (handlers.length === 0) {
      console.warn(`[EventHandlerRegistry] No handlers registered for event type: ${event.type}`)
      return
    }

    console.log(`[EventHandlerRegistry] Processing event ${event.type} with ${handlers.length} handlers`)

    // Process all handlers for this event type
    const promises = handlers.map(handler => handler.handle(event))
    
    try {
      await Promise.all(promises)
      console.log(`[EventHandlerRegistry] Successfully processed event ${event.type}`)
    } catch (error) {
      console.error(`[EventHandlerRegistry] Error processing event ${event.type}:`, error)
      throw error
    }
  }

  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0
  }
}

// Global event handler registry
export const eventHandlerRegistry = new EventHandlerRegistry()

// Initialize default handlers
export function initializeEventHandlers(): void {
  console.log("[EventHandlers] Initializing default event handlers")

  // Register CollectibleMinted handler
  eventHandlerRegistry.registerHandler(
    EVENT_TYPES.COLLECTIBLE_MINTED,
    new CollectibleMintedHandler()
  )

  // Register CollectibleTransferred handler
  eventHandlerRegistry.registerHandler(
    EVENT_TYPES.COLLECTIBLE_TRANSFERRED,
    new CollectibleTransferredHandler()
  )

  // Register marketplace sale handler
  eventHandlerRegistry.registerHandler(
    EVENT_TYPES.SALE_COMPLETED,
    new MarketplaceSaleHandler()
  )

  // Register marketplace listing handler
  eventHandlerRegistry.registerHandler(
    EVENT_TYPES.LISTING_CREATED,
    new MarketplaceListingHandler()
  )

  console.log("[EventHandlers] Default event handlers initialized")
}