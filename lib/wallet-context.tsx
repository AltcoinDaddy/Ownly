"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import * as fcl from "@onflow/fcl"
import type { User } from "./types"
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
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [flowUser, setFlowUser] = useState<any | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = fcl.currentUser.subscribe((user: any) => {
      console.log("[v0] FCL user state changed:", user)
      setFlowUser(user)

      if (user?.addr) {
        setAddress(user.addr)
        setIsConnected(true)

        // Create or update local user profile
        const localUser: User = {
          id: user.addr,
          address: user.addr,
          username: user.addr.slice(0, 8),
          avatar: `/placeholder.svg?height=100&width=100&query=avatar`,
          bio: "Flow blockchain user",
          joinedDate: new Date().toISOString(),
          verified: false,
          followers: 0,
          following: 0,
        }

        setUser(localUser)
        localStorage.setItem("ownly_user", JSON.stringify(localUser))
      } else {
        setAddress(null)
        setIsConnected(false)
        setUser(null)
        localStorage.removeItem("ownly_user")
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const connect = async () => {
    try {
      console.log("[v0] Initiating FCL authentication...")
      await fcl.authenticate()
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    }
  }

  const disconnect = () => {
    console.log("[v0] Disconnecting wallet...")
    fcl.unauthenticate()
    setUser(null)
    setIsConnected(false)
    setAddress(null)
    localStorage.removeItem("ownly_user")
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
