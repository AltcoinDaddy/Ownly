"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useWallet } from "../wallet-context"
import { useBlockchainEvents, useEventNotifications } from "./hooks"
import { BlockchainEvent } from "./events"

interface EventContextType {
  // Event state
  latestEvent: BlockchainEvent | null
  events: BlockchainEvent[]
  isConnected: boolean
  
  // Notifications
  notifications: Array<{
    id: string
    type: string
    message: string
    timestamp: Date
    read: boolean
  }>
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  
  // Gallery updates
  galleryUpdateCount: number
  marketplaceUpdateCount: number
  
  // Event handlers
  onNFTMinted: (nftId: string, recipient: string) => void
  onNFTTransferred: (nftId: string, from: string, to: string) => void
  onNFTSold: (nftId: string, seller: string, buyer: string, price: number) => void
  onNFTListed: (nftId: string, seller: string, price: number) => void
}

const EventContext = createContext<EventContextType | undefined>(undefined)

interface EventProviderProps {
  children: ReactNode
}

export function EventProvider({ children }: EventProviderProps) {
  const { address, isConnected: walletConnected } = useWallet()
  const [galleryUpdateCount, setGalleryUpdateCount] = useState(0)
  const [marketplaceUpdateCount, setMarketplaceUpdateCount] = useState(0)

  // Use blockchain events hook
  const { events, latestEvent, isConnected } = useBlockchainEvents({
    onMint: (event) => {
      console.log("[EventProvider] Mint event received:", event)
      if (address && event.data.recipient === address) {
        setGalleryUpdateCount(prev => prev + 1)
      }
    },
    onTransfer: (event) => {
      console.log("[EventProvider] Transfer event received:", event)
      if (address && (event.data.to === address || event.data.from === address)) {
        setGalleryUpdateCount(prev => prev + 1)
      }
    },
    onSale: (event) => {
      console.log("[EventProvider] Sale event received:", event)
      setMarketplaceUpdateCount(prev => prev + 1)
      if (address && (event.data.buyer === address || event.data.seller === address)) {
        setGalleryUpdateCount(prev => prev + 1)
      }
    },
    onListing: (event) => {
      console.log("[EventProvider] Listing event received:", event)
      setMarketplaceUpdateCount(prev => prev + 1)
    }
  })

  // Use event notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useEventNotifications()

  // Event handler functions for UI components
  const onNFTMinted = (nftId: string, recipient: string) => {
    console.log("[EventProvider] NFT minted notification:", { nftId, recipient })
    if (address === recipient) {
      setGalleryUpdateCount(prev => prev + 1)
    }
  }

  const onNFTTransferred = (nftId: string, from: string, to: string) => {
    console.log("[EventProvider] NFT transferred notification:", { nftId, from, to })
    if (address === from || address === to) {
      setGalleryUpdateCount(prev => prev + 1)
    }
  }

  const onNFTSold = (nftId: string, seller: string, buyer: string, price: number) => {
    console.log("[EventProvider] NFT sold notification:", { nftId, seller, buyer, price })
    setMarketplaceUpdateCount(prev => prev + 1)
    if (address === seller || address === buyer) {
      setGalleryUpdateCount(prev => prev + 1)
    }
  }

  const onNFTListed = (nftId: string, seller: string, price: number) => {
    console.log("[EventProvider] NFT listed notification:", { nftId, seller, price })
    setMarketplaceUpdateCount(prev => prev + 1)
  }

  // Reset counters when wallet disconnects
  useEffect(() => {
    if (!walletConnected) {
      setGalleryUpdateCount(0)
      setMarketplaceUpdateCount(0)
    }
  }, [walletConnected])

  const contextValue: EventContextType = {
    // Event state
    latestEvent,
    events,
    isConnected,
    
    // Notifications
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    
    // Update counts
    galleryUpdateCount,
    marketplaceUpdateCount,
    
    // Event handlers
    onNFTMinted,
    onNFTTransferred,
    onNFTSold,
    onNFTListed
  }

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventProvider")
  }
  return context
}

// Custom hooks for specific event types
export function useNFTEvents() {
  const { latestEvent, galleryUpdateCount } = useEvents()
  
  return {
    latestNFTEvent: latestEvent,
    galleryUpdateCount,
    isNFTEvent: latestEvent?.type.includes("COLLECTIBLE") || false
  }
}

export function useMarketplaceEvents() {
  const { latestEvent, marketplaceUpdateCount } = useEvents()
  
  return {
    latestMarketplaceEvent: latestEvent,
    marketplaceUpdateCount,
    isMarketplaceEvent: latestEvent?.type.includes("SALE") || latestEvent?.type.includes("LISTING") || false
  }
}

export function useNotificationEvents() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useEvents()
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    hasUnread: unreadCount > 0
  }
}