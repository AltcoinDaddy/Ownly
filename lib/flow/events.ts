import * as fcl from "@onflow/fcl"
import { getContractAddress } from "./config"

export interface BlockchainEvent {
  type: string
  transactionId: string
  blockHeight: number
  data: any
  timestamp: Date
}

export type EventCallback = (event: BlockchainEvent) => void

// Event types
export const EVENT_TYPES = {
  COLLECTIBLE_MINTED: "CollectibleMinted",
  COLLECTIBLE_TRANSFERRED: "CollectibleTransferred",
  SALE_COMPLETED: "SaleCompleted",
  LISTING_CREATED: "ListingCreated",
  LISTING_REMOVED: "ListingRemoved",
}

// Subscribe to NFT minting events
export function subscribeToMintEvents(callback: EventCallback): () => void {
  const dapperCoreAddress = getContractAddress("DapperCore")
  const eventName = `A.${dapperCoreAddress.replace("0x", "")}.DapperCore.CollectibleMinted`

  console.log("[v0] Subscribing to mint events:", eventName)

  const unsubscribe = fcl.events(eventName).subscribe((event: any) => {
    console.log("[v0] Mint event received:", event)

    const blockchainEvent: BlockchainEvent = {
      type: EVENT_TYPES.COLLECTIBLE_MINTED,
      transactionId: event.transactionId,
      blockHeight: event.blockHeight,
      data: event.data,
      timestamp: new Date(),
    }

    callback(blockchainEvent)
  })

  return unsubscribe
}

// Subscribe to NFT transfer events
export function subscribeToTransferEvents(callback: EventCallback): () => void {
  const dapperCoreAddress = getContractAddress("DapperCore")
  const eventName = `A.${dapperCoreAddress.replace("0x", "")}.DapperCore.CollectibleTransferred`

  console.log("[v0] Subscribing to transfer events:", eventName)

  const unsubscribe = fcl.events(eventName).subscribe((event: any) => {
    console.log("[v0] Transfer event received:", event)

    const blockchainEvent: BlockchainEvent = {
      type: EVENT_TYPES.COLLECTIBLE_TRANSFERRED,
      transactionId: event.transactionId,
      blockHeight: event.blockHeight,
      data: event.data,
      timestamp: new Date(),
    }

    callback(blockchainEvent)
  })

  return unsubscribe
}

// Subscribe to marketplace sale events
export function subscribeToSaleEvents(callback: EventCallback): () => void {
  const storefrontAddress = getContractAddress("NFTStorefront")
  const eventName = `A.${storefrontAddress.replace("0x", "")}.NFTStorefront.ListingCompleted`

  console.log("[v0] Subscribing to sale events:", eventName)

  const unsubscribe = fcl.events(eventName).subscribe((event: any) => {
    console.log("[v0] Sale event received:", event)

    const blockchainEvent: BlockchainEvent = {
      type: EVENT_TYPES.SALE_COMPLETED,
      transactionId: event.transactionId,
      blockHeight: event.blockHeight,
      data: event.data,
      timestamp: new Date(),
    }

    callback(blockchainEvent)
  })

  return unsubscribe
}

// Subscribe to listing creation events
export function subscribeToListingEvents(callback: EventCallback): () => void {
  const storefrontAddress = getContractAddress("NFTStorefront")
  const eventName = `A.${storefrontAddress.replace("0x", "")}.NFTStorefront.ListingAvailable`

  console.log("[v0] Subscribing to listing events:", eventName)

  const unsubscribe = fcl.events(eventName).subscribe((event: any) => {
    console.log("[v0] Listing event received:", event)

    const blockchainEvent: BlockchainEvent = {
      type: EVENT_TYPES.LISTING_CREATED,
      transactionId: event.transactionId,
      blockHeight: event.blockHeight,
      data: event.data,
      timestamp: new Date(),
    }

    callback(blockchainEvent)
  })

  return unsubscribe
}

// Subscribe to all events
export function subscribeToAllEvents(callbacks: {
  onMint?: EventCallback
  onTransfer?: EventCallback
  onSale?: EventCallback
  onListing?: EventCallback
}): () => void {
  const unsubscribers: Array<() => void> = []

  if (callbacks.onMint) {
    unsubscribers.push(subscribeToMintEvents(callbacks.onMint))
  }

  if (callbacks.onTransfer) {
    unsubscribers.push(subscribeToTransferEvents(callbacks.onTransfer))
  }

  if (callbacks.onSale) {
    unsubscribers.push(subscribeToSaleEvents(callbacks.onSale))
  }

  if (callbacks.onListing) {
    unsubscribers.push(subscribeToListingEvents(callbacks.onListing))
  }

  // Return function to unsubscribe from all
  return () => {
    console.log("[v0] Unsubscribing from all events")
    unsubscribers.forEach((unsub) => unsub())
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
