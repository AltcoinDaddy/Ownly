"use client"

import { useState, useEffect } from "react"
import * as fcl from "@onflow/fcl"
import { executeScript, GET_NFTS_SCRIPT, GET_NFT_DETAILS_SCRIPT } from "./scripts"
import { useWallet } from "../wallet-context"
import { subscribeToAllEvents, type BlockchainEvent } from "./events"

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

// Hook to listen to blockchain events
export function useBlockchainEvents(callbacks?: {
  onMint?: (event: BlockchainEvent) => void
  onTransfer?: (event: BlockchainEvent) => void
  onSale?: (event: BlockchainEvent) => void
  onListing?: (event: BlockchainEvent) => void
}) {
  const [events, setEvents] = useState<BlockchainEvent[]>([])
  const [latestEvent, setLatestEvent] = useState<BlockchainEvent | null>(null)

  useEffect(() => {
    const handleEvent = (event: BlockchainEvent) => {
      console.log("[v0] Blockchain event received:", event)
      setLatestEvent(event)
      setEvents((prev) => [event, ...prev].slice(0, 50)) // Keep last 50 events
    }

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
      unsubscribe()
    }
  }, [callbacks])

  return { events, latestEvent }
}
