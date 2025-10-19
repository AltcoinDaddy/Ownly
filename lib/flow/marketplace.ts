import { executeTransaction, executeScript } from "./transactions"
import { LIST_NFT_TRANSACTION, BUY_NFT_TRANSACTION, TRANSFER_NFT_TRANSACTION } from "./transactions"
import { GET_MARKETPLACE_LISTINGS_SCRIPT } from "./scripts"

export interface MarketplaceListing {
  listingID: string
  nftID: string
  price: string
  seller: string
  nftDetails?: {
    name: string
    description: string
    thumbnail: string
  }
}

// List an NFT for sale
export async function listNFTForSale(nftID: string, price: string): Promise<string> {
  try {
    console.log("[v0] Listing NFT for sale:", { nftID, price })

    const txId = await executeTransaction(LIST_NFT_TRANSACTION, [nftID, price], {
      onSealed: (txId) => {
        console.log("[v0] List transaction sealed:", txId)
      },
    })

    return txId
  } catch (error) {
    console.error("[v0] Error listing NFT:", error)
    throw error
  }
}

// Buy an NFT from marketplace
export async function buyNFT(listingResourceID: string, storefrontAddress: string): Promise<string> {
  try {
    console.log("[v0] Buying NFT:", { listingResourceID, storefrontAddress })

    const txId = await executeTransaction(BUY_NFT_TRANSACTION, [listingResourceID, storefrontAddress], {
      onSealed: (txId) => {
        console.log("[v0] Buy transaction sealed:", txId)
      },
    })

    return txId
  } catch (error) {
    console.error("[v0] Error buying NFT:", error)
    throw error
  }
}

// Transfer NFT to another address
export async function transferNFT(recipient: string, nftID: string): Promise<string> {
  try {
    console.log("[v0] Transferring NFT:", { recipient, nftID })

    const txId = await executeTransaction(TRANSFER_NFT_TRANSACTION, [recipient, nftID], {
      onSealed: (txId) => {
        console.log("[v0] Transfer transaction sealed:", txId)
      },
    })

    return txId
  } catch (error) {
    console.error("[v0] Error transferring NFT:", error)
    throw error
  }
}

// Get all marketplace listings
export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  try {
    console.log("[v0] Fetching marketplace listings...")

    const listings = await executeScript<MarketplaceListing[]>(GET_MARKETPLACE_LISTINGS_SCRIPT)

    console.log("[v0] Marketplace listings fetched:", listings)

    return listings
  } catch (error) {
    console.error("[v0] Error fetching marketplace listings:", error)
    return []
  }
}
