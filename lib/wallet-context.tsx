"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import * as fcl from "@onflow/fcl"
import type { User } from "./types"
import { SafeLocalStorage } from "./hydration/safe-local-storage"
import { useHydrated } from "./hydration/use-hydrated"
import "./flow/config" // Initialize FCL config

interface WalletContextType {
  isConnected: boolean
  user: User | null
  flowUser: any | null
  connect: () => Promise<void>
  disconnect: () => void
  address: string | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isHydrated } = useHydrated()
  
  // Initialize with consistent state between server and client
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [flowUser, setFlowUser] = useState<any | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  // Load persisted user data after hydration
  useEffect(() => {
    if (!isHydrated) return

    const savedUser = SafeLocalStorage.getItem("ownly_user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        console.warn("Failed to parse saved user data:", error)
        SafeLocalStorage.removeItem("ownly_user")
      }
    }
  }, [isHydrated])

  // Set up FCL subscription only after hydration
  useEffect(() => {
    if (!isHydrated) return

    const unsubscribe = fcl.currentUser.subscribe((user: any) => {
      console.log("[v0] FCL user state changed:", user)
      setFlowUser(user)

      if (user?.addr) {
        setAddress(user.addr)
        setIsConnected(true)

        // Create or update local user profile
        const localUser: User = {
          id: user.addr,
          username: user.addr.slice(0, 8),
          displayName: user.addr.slice(0, 8),
          avatar: `/placeholder.svg?height=100&width=100&query=avatar`,
          bio: "Flow blockchain user",
          walletAddress: user.addr,
          verified: false,
          joinedAt: new Date().toISOString(),
          nftsOwned: 0,
          nftsCreated: 0,
        }

        setUser(localUser)
        SafeLocalStorage.setItem("ownly_user", JSON.stringify(localUser))
      } else {
        setAddress(null)
        setIsConnected(false)
        setUser(null)
        SafeLocalStorage.removeItem("ownly_user")
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isHydrated])

  const connect = async () => {
    // Guard against FCL operations during SSR
    if (!isHydrated) {
      console.warn("Cannot connect wallet before hydration")
      return
    }

    try {
      console.log("[v0] Initiating FCL authentication...")
      await fcl.authenticate()
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    }
  }

  const disconnect = () => {
    // Guard against FCL operations during SSR
    if (!isHydrated) {
      console.warn("Cannot disconnect wallet before hydration")
      return
    }

    console.log("[v0] Disconnecting wallet...")
    fcl.unauthenticate()
    setUser(null)
    setIsConnected(false)
    setAddress(null)
    SafeLocalStorage.removeItem("ownly_user")
  }

  return (
    <WalletContext.Provider value={{ isConnected, user, flowUser, connect, disconnect, address }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
