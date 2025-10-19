"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import * as fcl from "@onflow/fcl"
import { executeScript, GET_NFTS_SCRIPT, GET_NFT_DETAILS_SCRIPT } from "./scripts"
import { useWallet } from "../wallet-context"
import { subscribeToAllEvents, type BlockchainEvent, flowEventListener } from "./events"
import { initializeEventHandlers } from "./event-handlers"

// Hook to fetch user's NFTs
export function useUserNFTs() {
  const { address } = useWallet()
  const [nfts, setNfts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchNFTs = async () => {
    if (!address) {
      setNfts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Fetching NFTs for address:", address)
      const result = await executeScript(GET_NFTS_SCRIPT, [address])
      console.log("[v0] NFTs fetched:", result)
      setNfts(result as any[])
    } catch (err) {
      console.error("[v0] Error fetching NFTs:", err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNFTs()
  }, [address])

  return { nfts, loading, error, refetch: fetchNFTs }
}

// Hook to fetch NFT details
export function useNFTDetails(ownerAddress: string | null, nftId: string | null) {
  const [nft, setNft] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!ownerAddress || !nftId) {
      setNft(null)
      return
    }

    const fetchNFT = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Fetching NFT details:", { ownerAddress, nftId })
        const result = await executeScript(GET_NFT_DETAILS_SCRIPT, [ownerAddress, nftId])
        console.log("[v0] NFT details fetched:", result)
        setNft(result)
      } catch (err) {
        console.error("[v0] Error fetching NFT details:", err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFT()
  }, [ownerAddress, nftId])

  return { nft, loading, error }
}

// Hook to get Flow account balance
export function useFlowBalance() {
  const { address } = useWallet()
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setBalance("0")
      return
    }

    const fetchBalance = async () => {
      setLoading(true)

      try {
        console.log("[v0] Fetching balance for:", address)
        const account = await fcl.account(address)
        const flowBalance = (account.balance / 100000000).toFixed(2) // Convert from smallest unit
        console.log("[v0] Balance fetched:", flowBalance)
        setBalance(flowBalance)
      } catch (err) {
        console.error("[v0] Error fetching balance:", err)
        setBalance("0")
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [address])

  return { balance, loading }
}

// Enhanced hook for real-time blockchain events with automatic UI updates
export function useBlockchainEvents(callbacks?: {
  onMint?: (event: BlockchainEvent) => void
  onTransfer?: (event: BlockchainEvent) => void
  onSale?: (event: BlockchainEvent) => void
  onListing?: (event: BlockchainEvent) => void
}) {
  const [events, setEvents] = useState<BlockchainEvent[]>([])
  const [latestEvent, setLatestEvent] = useState<BlockchainEvent | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { address } = useWallet()
  const initRef = useRef(false)

  // Initialize event handlers once
  useEffect(() => {
    if (!initRef.current) {
      initializeEventHandlers()
      initRef.current = true
    }
  }, [])

  useEffect(() => {
    const handleEvent = (event: BlockchainEvent) => {
      console.log("[useBlockchainEvents] Blockchain event received:", event)
      setLatestEvent(event)
      setEvents((prev) => [event, ...prev].slice(0, 100)) // Keep last 100 events
    }

    console.log("[useBlockchainEvents] Setting up event subscriptions")
    setIsConnected(true)

    const unsubscribe = subscribeToAllEvents({
      onMint: (event) => {
        handleEvent(event)
        callbacks?.onMint?.(event)
      },
      onTransfer: (event) => {
        handleEvent(event)
        callbacks?.onTransfer?.(event)
      },
      onSale: (event) => {
        handleEvent(event)
        callbacks?.onSale?.(event)
      },
      onListing: (event) => {
        handleEvent(event)
        callbacks?.onListing?.(event)
      },
    })

    return () => {
      console.log("[useBlockchainEvents] Cleaning up event subscriptions")
      unsubscribe()
      setIsConnected(false)
    }
  }, [callbacks])

  return { 
    events, 
    latestEvent, 
    isConnected,
    eventCount: events.length,
    activeSubscriptions: flowEventListener.getActiveSubscriptions()
  }
}

// Hook for real-time NFT gallery updates
export function useRealTimeNFTGallery() {
  const { address } = useWallet()
  const { nfts, loading, error, refetch } = useUserNFTs()
  const [realTimeUpdates, setRealTimeUpdates] = useState(0)

  // Listen for NFT events that affect this user's gallery
  const { latestEvent } = useBlockchainEvents({
    onMint: (event) => {
      // If this user minted an NFT, refresh their gallery
      if (address && event.data.recipient === address) {
        console.log("[useRealTimeNFTGallery] User minted NFT, refreshing gallery")
        refetch()
        setRealTimeUpdates(prev => prev + 1)
      }
    },
    onTransfer: (event) => {
      // If this user received or sent an NFT, refresh their gallery
      if (address && (event.data.to === address || event.data.from === address)) {
        console.log("[useRealTimeNFTGallery] User involved in transfer, refreshing gallery")
        refetch()
        setRealTimeUpdates(prev => prev + 1)
      }
    },
    onSale: (event) => {
      // If this user bought or sold an NFT, refresh their gallery
      if (address && (event.data.buyer === address || event.data.seller === address)) {
        console.log("[useRealTimeNFTGallery] User involved in sale, refreshing gallery")
        refetch()
        setRealTimeUpdates(prev => prev + 1)
      }
    }
  })

  return {
    nfts,
    loading,
    error,
    refetch,
    realTimeUpdates,
    lastUpdate: latestEvent?.timestamp
  }
}

// Hook for real-time marketplace updates
export function useRealTimeMarketplace() {
  const [marketplaceUpdates, setMarketplaceUpdates] = useState(0)
  const [lastMarketplaceEvent, setLastMarketplaceEvent] = useState<BlockchainEvent | null>(null)

  // Listen for marketplace events
  const { latestEvent } = useBlockchainEvents({
    onSale: (event) => {
      console.log("[useRealTimeMarketplace] Sale completed, updating marketplace")
      setLastMarketplaceEvent(event)
      setMarketplaceUpdates(prev => prev + 1)
    },
    onListing: (event) => {
      console.log("[useRealTimeMarketplace] New listing created, updating marketplace")
      setLastMarketplaceEvent(event)
      setMarketplaceUpdates(prev => prev + 1)
    }
  })

  return {
    marketplaceUpdates,
    lastMarketplaceEvent,
    lastUpdate: lastMarketplaceEvent?.timestamp
  }
}

// Hook for event notifications
export function useEventNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: string
    message: string
    timestamp: Date
    read: boolean
  }>>([])

  const { latestEvent } = useBlockchainEvents({
    onMint: (event) => {
      const notification = {
        id: `mint-${event.transactionId}`,
        type: 'mint',
        message: `New NFT minted: ${event.data.nftId}`,
        timestamp: event.timestamp,
        read: false
      }
      setNotifications(prev => [notification, ...prev].slice(0, 50))
    },
    onTransfer: (event) => {
      const notification = {
        id: `transfer-${event.transactionId}`,
        type: 'transfer',
        message: `NFT ${event.data.nftId} transferred from ${event.data.from} to ${event.data.to}`,
        timestamp: event.timestamp,
        read: false
      }
      setNotifications(prev => [notification, ...prev].slice(0, 50))
    },
    onSale: (event) => {
      const notification = {
        id: `sale-${event.transactionId}`,
        type: 'sale',
        message: `NFT ${event.data.nftId} sold for ${event.data.price} ${event.data.currency}`,
        timestamp: event.timestamp,
        read: false
      }
      setNotifications(prev => [notification, ...prev].slice(0, 50))
    },
    onListing: (event) => {
      const notification = {
        id: `listing-${event.transactionId}`,
        type: 'listing',
        message: `NFT ${event.data.nftId} listed for ${event.data.price} ${event.data.currency}`,
        timestamp: event.timestamp,
        read: false
      }
      setNotifications(prev => [notification, ...prev].slice(0, 50))
    }
  })

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  }
}
