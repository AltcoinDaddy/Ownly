export interface NFT {
  id: string
  name: string
  description: string
  image: string
  price: number
  currency: string
  owner: User
  creator: User
  category: string
  rarity: "common" | "rare" | "epic" | "legendary"
  mintedAt: string
  views: number
  likes: number
  blockchain: string
  tokenId: string
  royalty: number
  // Enhanced fields for Ownly collectibles
  metadata_url?: string
  collection_id?: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  animation_url?: string
  external_url?: string
}

// Enhanced NFT metadata for minting
export interface OwnlyNFTData {
  name: string
  description: string
  category: string
  creator: string
  image_url: string
  metadata_url: string
  collection_id: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  animation_url?: string
  external_url?: string
}

// Minting form data structure
export interface MintFormData {
  name: string
  description: string
  category: string
  file: File | null
  attributes: Array<{ trait_type: string; value: string }>
  external_url?: string
}

export interface User {
  id: string
  username: string
  displayName: string
  avatar: string
  bio: string
  walletAddress: string
  verified: boolean
  joinedAt: string
  nftsOwned: number
  nftsCreated: number
}

export interface Transaction {
  id: string
  type: "mint" | "sale" | "transfer" | "offer"
  nft: NFT
  from: User
  to: User
  price?: number
  currency?: string
  timestamp: string
  txHash: string
  status: "pending" | "completed" | "failed"
}

export interface Collection {
  id: string
  name: string
  description: string
  image: string
  creator: User
  nfts: NFT[]
  floorPrice: number
  volume: number
  items: number
}
