import * as fcl from "@onflow/fcl"
import { getContractAddress } from "./config"
import { performanceCollector } from '@/lib/performance/collector'

export interface BlockchainEvent {
  type: string
  transactionId: string
  blockHeight: number
  data: any
  timestamp: Date
  eventIndex?: number
}

export type EventCallback = (event: BlockchainEvent) => void

// Event types for DapperCollectibles contract
export const EVENT_TYPES = {
  COLLECTIBLE_MINTED: "CollectibleMinted",
  COLLECTIBLE_TRANSFERRED: "CollectibleTransferred",
  SALE_COMPLETED: "SaleCompleted",
  LISTING_CREATED: "ListingCreated",
  LISTING_REMOVED: "ListingRemoved",
}

// Event queue for processing events in order
export class EventQueue {
  private queue: BlockchainEvent[] = []
  private processing = false
  private processors: Map<string, EventCallback> = new Map()

  addProcessor(eventType: string, callback: EventCallback) {
    this.processors.set(eventType, callback)
  }

  removeProcessor(eventType: string) {
    this.processors.delete(eventType)
  }

  async enqueue(event: BlockchainEvent) {
    const queueSizeBefore = this.queue.length
    this.queue.push(event)
    
    // Record queue size metric
    await performanceCollector.recordEventMetric({
      eventType: 'queue_enqueue',
      processingTime: 0,
      queueSize: queueSizeBefore + 1,
      eventSource: 'internal',
      tags: {
        event_type: event.type,
        operation: 'enqueue'
      }
    })
    
    if (!this.processing) {
      await this.processQueue()
    }
  }

  private async processQueue() {
    this.processing = true
    
    while (this.queue.length > 0) {
      const event = this.queue.shift()
      if (event) {
        const processor = this.processors.get(event.type)
        if (processor) {
          const startTime = performance.now()
          try {
            await processor(event)
            const processingTime = performance.now() - startTime
            
            // Record successful event processing
            await performanceCollector.recordEventMetric({
              eventType: event.type,
              processingTime,
              queueSize: this.queue.length,
              eventSource: this.getEventSource(event),
              blockHeight: event.blockHeight,
              transactionId: event.transactionId,
              tags: {
                success: 'true',
                processor: event.type
              }
            })
          } catch (error) {
            const processingTime = performance.now() - startTime
            
            // Record failed event processing
            await performanceCollector.recordEventMetric({
              eventType: event.type,
              processingTime,
              queueSize: this.queue.length,
              eventSource: this.getEventSource(event),
              blockHeight: event.blockHeight,
              transactionId: event.transactionId,
              tags: {
                success: 'false',
                processor: event.type,
                error: error instanceof Error ? error.message : 'unknown'
              }
            })
            
            console.error(`[EventQueue] Error processing event ${event.type}:`, error)
          }
        }
      }
    }
    
    this.processing = false
  }

  private getEventSource(event: BlockchainEvent): 'flow' | 'dapper' | 'internal' {
    if (event.transactionId) return 'flow'
    if (event.type.includes('Dapper')) return 'dapper'
    return 'internal'
  }

  getQueueSize(): number {
    return this.queue.length
  }
}

// Global event queue instance
export const eventQueue = new EventQueue()

// Integration with event handlers
let eventHandlerRegistry: any = null

// Lazy load event handlers to avoid circular dependencies
async function getEventHandlerRegistry() {
  if (!eventHandlerRegistry) {
    const { eventHandlerRegistry: registry } = await import("./event-handlers")
    eventHandlerRegistry = registry
  }
  return eventHandlerRegistry
}

// Process event through handlers
export async function processEventThroughHandlers(event: BlockchainEvent): Promise<void> {
  try {
    const registry = await getEventHandlerRegistry()
    await registry.processEvent(event)
  } catch (error) {
    console.error("[FlowEvents] Error processing event through handlers:", error)
  }
}

// Enhanced event listener service for DapperCollectibles contract
export class FlowEventListener {
  private subscriptions: Map<string, () => void> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  // Subscribe to NFT minting events from DapperCollectibles contract
  subscribeToMintEvents(callback: EventCallback): () => void {
    const dapperCollectiblesAddress = getContractAddress("DapperCollectibles")
    const eventName = `A.${dapperCollectiblesAddress.replace("0x", "")}.DapperCollectibles.CollectibleMinted`

    console.log("[FlowEventListener] Subscribing to mint events:", eventName)

    const unsubscribe = fcl.events(eventName).subscribe({
      next: (event: any) => {
        console.log("[FlowEventListener] Mint event received:", event)
        
        const blockchainEvent: BlockchainEvent = {
          type: EVENT_TYPES.COLLECTIBLE_MINTED,
          transactionId: event.transactionId,
          blockHeight: event.blockHeight,
          eventIndex: event.eventIndex,
          data: this.parseMintEventData(event.data),
          timestamp: new Date(),
        }

        // Add to event queue for ordered processing
        eventQueue.enqueue(blockchainEvent)
        
        // Process through event handlers
        processEventThroughHandlers(blockchainEvent)
        
        callback(blockchainEvent)
      },
      error: (error: any) => {
        console.error("[FlowEventListener] Mint event subscription error:", error)
        this.handleSubscriptionError("mint", () => this.subscribeToMintEvents(callback))
      }
    })

    this.subscriptions.set("mint", unsubscribe)
    this.reconnectAttempts = 0 // Reset on successful subscription
    return unsubscribe
  }

  // Subscribe to NFT transfer events from DapperCollectibles contract
  subscribeToTransferEvents(callback: EventCallback): () => void {
    const dapperCollectiblesAddress = getContractAddress("DapperCollectibles")
    const eventName = `A.${dapperCollectiblesAddress.replace("0x", "")}.DapperCollectibles.CollectibleTransferred`

    console.log("[FlowEventListener] Subscribing to transfer events:", eventName)

    const unsubscribe = fcl.events(eventName).subscribe({
      next: (event: any) => {
        console.log("[FlowEventListener] Transfer event received:", event)
        
        const blockchainEvent: BlockchainEvent = {
          type: EVENT_TYPES.COLLECTIBLE_TRANSFERRED,
          transactionId: event.transactionId,
          blockHeight: event.blockHeight,
          eventIndex: event.eventIndex,
          data: this.parseTransferEventData(event.data),
          timestamp: new Date(),
        }

        // Add to event queue for ordered processing
        eventQueue.enqueue(blockchainEvent)
        
        // Process through event handlers
        processEventThroughHandlers(blockchainEvent)
        
        callback(blockchainEvent)
      },
      error: (error: any) => {
        console.error("[FlowEventListener] Transfer event subscription error:", error)
        this.handleSubscriptionError("transfer", () => this.subscribeToTransferEvents(callback))
      }
    })

    this.subscriptions.set("transfer", unsubscribe)
    this.reconnectAttempts = 0 // Reset on successful subscription
    return unsubscribe
  }

  // Parse mint event data to extract relevant information
  private parseMintEventData(eventData: any): any {
    try {
      return {
        nftId: eventData.id?.value || eventData.id,
        recipient: eventData.to?.value || eventData.to,
        collectionId: eventData.collectionId?.value || eventData.collectionId,
        metadataUrl: eventData.metadataUrl?.value || eventData.metadataUrl,
        creator: eventData.creator?.value || eventData.creator,
        rawData: eventData
      }
    } catch (error) {
      console.error("[FlowEventListener] Error parsing mint event data:", error)
      return { rawData: eventData }
    }
  }

  // Parse transfer event data to extract relevant information
  private parseTransferEventData(eventData: any): any {
    try {
      return {
        nftId: eventData.id?.value || eventData.id,
        from: eventData.from?.value || eventData.from,
        to: eventData.to?.value || eventData.to,
        collectionId: eventData.collectionId?.value || eventData.collectionId,
        rawData: eventData
      }
    } catch (error) {
      console.error("[FlowEventListener] Error parsing transfer event data:", error)
      return { rawData: eventData }
    }
  }

  // Handle subscription errors with exponential backoff reconnection
  private handleSubscriptionError(subscriptionType: string, resubscribeFn: () => void) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[FlowEventListener] Max reconnection attempts reached for ${subscriptionType} events`)
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[FlowEventListener] Attempting to reconnect ${subscriptionType} events in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      try {
        resubscribeFn()
      } catch (error) {
        console.error(`[FlowEventListener] Reconnection failed for ${subscriptionType}:`, error)
      }
    }, delay)
  }

  // Unsubscribe from all events
  unsubscribeAll(): void {
    console.log("[FlowEventListener] Unsubscribing from all events")
    this.subscriptions.forEach((unsubscribe, type) => {
      try {
        unsubscribe()
        console.log(`[FlowEventListener] Unsubscribed from ${type} events`)
      } catch (error) {
        console.error(`[FlowEventListener] Error unsubscribing from ${type} events:`, error)
      }
    })
    this.subscriptions.clear()
    this.reconnectAttempts = 0
  }

  // Get active subscription count
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }
}

// Global event listener instance
export const flowEventListener = new FlowEventListener()

// Legacy function for backward compatibility
export function subscribeToMintEvents(callback: EventCallback): () => void {
  return flowEventListener.subscribeToMintEvents(callback)
}

// Legacy function for backward compatibility
export function subscribeToTransferEvents(callback: EventCallback): () => void {
  return flowEventListener.subscribeToTransferEvents(callback)
}

// Enhanced marketplace event subscriptions for DapperMarket contract
export function subscribeToMarketplaceEvents(callbacks: {
  onSale?: EventCallback
  onListing?: EventCallback
}): () => void {
  const dapperMarketAddress = getContractAddress("DapperMarket")
  const unsubscribers: Array<() => void> = []

  // Subscribe to sale completion events
  if (callbacks.onSale) {
    const saleEventName = `A.${dapperMarketAddress.replace("0x", "")}.DapperMarket.SaleCompleted`
    console.log("[FlowEventListener] Subscribing to marketplace sale events:", saleEventName)

    const saleUnsubscribe = fcl.events(saleEventName).subscribe({
      next: (event: any) => {
        console.log("[FlowEventListener] Sale event received:", event)
        
        const blockchainEvent: BlockchainEvent = {
          type: EVENT_TYPES.SALE_COMPLETED,
          transactionId: event.transactionId,
          blockHeight: event.blockHeight,
          eventIndex: event.eventIndex,
          data: parseMarketplaceEventData(event.data, "sale"),
          timestamp: new Date(),
        }

        eventQueue.enqueue(blockchainEvent)
        
        // Process through event handlers
        processEventThroughHandlers(blockchainEvent)
        
        callbacks.onSale!(blockchainEvent)
      },
      error: (error: any) => {
        console.error("[FlowEventListener] Sale event subscription error:", error)
      }
    })
    unsubscribers.push(saleUnsubscribe)
  }

  // Subscribe to listing creation events
  if (callbacks.onListing) {
    const listingEventName = `A.${dapperMarketAddress.replace("0x", "")}.DapperMarket.ListingCreated`
    console.log("[FlowEventListener] Subscribing to marketplace listing events:", listingEventName)

    const listingUnsubscribe = fcl.events(listingEventName).subscribe({
      next: (event: any) => {
        console.log("[FlowEventListener] Listing event received:", event)
        
        const blockchainEvent: BlockchainEvent = {
          type: EVENT_TYPES.LISTING_CREATED,
          transactionId: event.transactionId,
          blockHeight: event.blockHeight,
          eventIndex: event.eventIndex,
          data: parseMarketplaceEventData(event.data, "listing"),
          timestamp: new Date(),
        }

        eventQueue.enqueue(blockchainEvent)
        
        // Process through event handlers
        processEventThroughHandlers(blockchainEvent)
        
        callbacks.onListing!(blockchainEvent)
      },
      error: (error: any) => {
        console.error("[FlowEventListener] Listing event subscription error:", error)
      }
    })
    unsubscribers.push(listingUnsubscribe)
  }

  // Return function to unsubscribe from all marketplace events
  return () => {
    console.log("[FlowEventListener] Unsubscribing from marketplace events")
    unsubscribers.forEach(unsub => unsub())
  }
}

// Parse marketplace event data
function parseMarketplaceEventData(eventData: any, eventType: "sale" | "listing"): any {
  try {
    if (eventType === "sale") {
      return {
        nftId: eventData.nftId?.value || eventData.nftId,
        seller: eventData.seller?.value || eventData.seller,
        buyer: eventData.buyer?.value || eventData.buyer,
        price: eventData.price?.value || eventData.price,
        currency: eventData.currency?.value || eventData.currency || "FLOW",
        rawData: eventData
      }
    } else {
      return {
        nftId: eventData.nftId?.value || eventData.nftId,
        seller: eventData.seller?.value || eventData.seller,
        price: eventData.price?.value || eventData.price,
        currency: eventData.currency?.value || eventData.currency || "FLOW",
        listingId: eventData.listingId?.value || eventData.listingId,
        rawData: eventData
      }
    }
  } catch (error) {
    console.error(`[FlowEventListener] Error parsing ${eventType} event data:`, error)
    return { rawData: eventData }
  }
}

// Legacy functions for backward compatibility
export function subscribeToSaleEvents(callback: EventCallback): () => void {
  return subscribeToMarketplaceEvents({ onSale: callback })
}

export function subscribeToListingEvents(callback: EventCallback): () => void {
  return subscribeToMarketplaceEvents({ onListing: callback })
}

// Enhanced subscription to all events with improved error handling
export function subscribeToAllEvents(callbacks: {
  onMint?: EventCallback
  onTransfer?: EventCallback
  onSale?: EventCallback
  onListing?: EventCallback
}): () => void {
  const unsubscribers: Array<() => void> = []

  console.log("[FlowEventListener] Setting up comprehensive event subscriptions")

  // Subscribe to DapperCollectibles events
  if (callbacks.onMint) {
    unsubscribers.push(flowEventListener.subscribeToMintEvents(callbacks.onMint))
  }

  if (callbacks.onTransfer) {
    unsubscribers.push(flowEventListener.subscribeToTransferEvents(callbacks.onTransfer))
  }

  // Subscribe to DapperMarket events
  if (callbacks.onSale || callbacks.onListing) {
    unsubscribers.push(subscribeToMarketplaceEvents({
      onSale: callbacks.onSale,
      onListing: callbacks.onListing
    }))
  }

  // Set up event queue processors
  if (callbacks.onMint) {
    eventQueue.addProcessor(EVENT_TYPES.COLLECTIBLE_MINTED, callbacks.onMint)
  }
  if (callbacks.onTransfer) {
    eventQueue.addProcessor(EVENT_TYPES.COLLECTIBLE_TRANSFERRED, callbacks.onTransfer)
  }
  if (callbacks.onSale) {
    eventQueue.addProcessor(EVENT_TYPES.SALE_COMPLETED, callbacks.onSale)
  }
  if (callbacks.onListing) {
    eventQueue.addProcessor(EVENT_TYPES.LISTING_CREATED, callbacks.onListing)
  }

  // Return function to unsubscribe from all
  return () => {
    console.log("[FlowEventListener] Unsubscribing from all events and clearing processors")
    unsubscribers.forEach((unsub) => {
      try {
        unsub()
      } catch (error) {
        console.error("[FlowEventListener] Error during unsubscribe:", error)
      }
    })
    
    // Clear event queue processors
    Object.values(EVENT_TYPES).forEach(eventType => {
      eventQueue.removeProcessor(eventType)
    })
  }
}

// Get past events from a block range
export async function getPastEvents(
  eventType: string,
  startBlock: number,
  endBlock: number,
): Promise<BlockchainEvent[]> {
  try {
    console.log("[v0] Fetching past events:", { eventType, startBlock, endBlock })

    // This would use Flow Access API to query past events
    // For now, return empty array as this requires backend indexing
    const events: BlockchainEvent[] = []

    console.log("[v0] Past events fetched:", events)

    return events
  } catch (error) {
    console.error("[v0] Error fetching past events:", error)
    return []
  }
}
