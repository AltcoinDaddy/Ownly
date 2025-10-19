import * as fcl from "@onflow/fcl"
import { executeScript, GET_NFTS_SCRIPT, GET_NFT_DETAILS_SCRIPT } from "./scripts"
import type { NFT } from "../types"

export interface FlowNFT {
  id: string
  name: string
  description: string
  thumbnail: string
  owner: string
  ipfsHash?: string
  royalties?: Array<{
    receiver: string
    cut: number
    description: string
  }>
}

// Get all NFTs owned by an address
export async function getUserNFTs(address: string): Promise<FlowNFT[]> {
  try {
    console.log("[v0] Fetching NFTs for address:", address)

    const nfts = await executeScript<FlowNFT[]>(GET_NFTS_SCRIPT, [address])

    console.log("[v0] NFTs fetched:", nfts)

    return nfts
  } catch (error) {
    console.error("[v0] Error fetching user NFTs:", error)
    return []
  }
}

// Get details for a specific NFT
export async function getNFTDetails(ownerAddress: string, nftID: string): Promise<FlowNFT | null> {
  try {
    console.log("[v0] Fetching NFT details:", { ownerAddress, nftID })

    const nft = await executeScript<FlowNFT | null>(GET_NFT_DETAILS_SCRIPT, [ownerAddress, nftID])

    console.log("[v0] NFT details fetched:", nft)

    return nft
  } catch (error) {
    console.error("[v0] Error fetching NFT details:", error)
    return null
  }
}

// Get account info
export async function getAccountInfo(address: string) {
  try {
    console.log("[v0] Fetching account info for:", address)

    const account = await fcl.account(address)

    console.log("[v0] Account info fetched:", account)

    return {
      address: account.address,
      balance: (account.balance / 100000000).toFixed(2), // Convert from smallest unit
      code: account.code,
      keys: account.keys,
    }
  } catch (error) {
    console.error("[v0] Error fetching account info:", error)
    throw error
  }
}

// Convert Flow NFT to app NFT format
export function convertFlowNFTToAppNFT(flowNFT: FlowNFT, category = "Art"): NFT {
  return {
    id: flowNFT.id,
    title: flowNFT.name,
    image: flowNFT.thumbnail,
    price: "0", // Price would come from marketplace listing
    creator: {
      name: flowNFT.owner.slice(0, 8),
      avatar: `/placeholder.svg?height=40&width=40&query=avatar`,
      verified: false,
    },
    owner: {
      name: flowNFT.owner.slice(0, 8),
      address: flowNFT.owner,
    },
    category,
    rarity: "common",
    views: 0,
    likes: 0,
    description: flowNFT.description,
    blockchain: "Flow",
    tokenId: flowNFT.id,
    contractAddress: flowNFT.owner,
    mintDate: new Date().toISOString(),
    royalty: flowNFT.royalties?.[0]?.cut ? flowNFT.royalties[0].cut * 100 : 5,
  }
}
