// Flow Marketplace Service - Integrates Flow transactions with marketplace operations
import * as fcl from "@onflow/fcl"
import { 
  listNFTForSale, 
  purchaseNFT, 
  removeListing,
  executeTransaction 
} from "./transactions"
import { executeScript } from "./scripts"
import { getContractAddress } from "./config"

export interface MarketplaceListing {
  nftID: string
  seller: string
  price: string
  currency: string
  status: 'active' | 'sold' | 'cancelled'
  createdAt: string
}

export interface TransactionResult {
  transactionId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

// Script to get all marketplace listings
const GET_MARKETPLACE_LISTINGS_SCRIPT = `
import DapperMarket from 0x${getContractAddress("DapperMarket").replace("0x", "")}
import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}
import MetadataViews from 0x${getContractAddress("MetadataViews").replace("0x", "")}

pub fun main(): [ListingData] {
  let listings: [ListingData] = []
  
  // Get all active listings from DapperMarket
  let listingIDs = DapperMarket.getListingIDs()
  
  for listingID in listingIDs {
    if let listing = DapperMarket.borrowListing(listingID: listingID) {
      // Get NFT metadata
      let nftRef = listing.borrowNFT()
      var name = ""
      var description = ""
      var thumbnail = ""
      
      if let display = nftRef.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
        name = display.name
        description = display.description
        thumbnail = display.thumbnail.uri()
      }
      
      listings.append(ListingData(
        listingID: listingID,
        nftID: listing.getNFTID(),
        seller: listing.getSeller(),
        price: listing.getPrice(),
        currency: "FLOW",
        status: "active",
        createdAt: listing.getCreatedAt(),
        nftMetadata: NFTMetadata(
          name: name,
          description: description,
          image: thumbnail,
          collectionId: "ownly_collectibles"
        )
      ))
    }
  }
  
  return listings
}

pub struct ListingData {
  pub let listingID: UInt64
  pub let nftID: UInt64
  pub let seller: Address
  pub let price: UFix64
  pub let currency: String
  pub let status: String
  pub let createdAt: UFix64
  pub let nftMetadata: NFTMetadata
  
  init(
    listingID: UInt64,
    nftID: UInt64,
    seller: Address,
    price: UFix64,
    currency: String,
    status: String,
    createdAt: UFix64,
    nftMetadata: NFTMetadata
  ) {
    self.listingID = listingID
    self.nftID = nftID
    self.seller = seller
    self.price = price
    self.currency = currency
    self.status = status
    self.createdAt = createdAt
    self.nftMetadata = nftMetadata
  }
}

pub struct NFTMetadata {
  pub let name: String
  pub let description: String
  pub let image: String
  pub let collectionId: String
  
  init(name: String, description: String, image: String, collectionId: String) {
    self.name = name
    self.description = description
    self.image = image
    self.collectionId = collectionId
  }
}
`

// Script to get specific listing details
const GET_LISTING_DETAILS_SCRIPT = `
import DapperMarket from 0x${getContractAddress("DapperMarket").replace("0x", "")}
import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}
import MetadataViews from 0x${getContractAddress("MetadataViews").replace("0x", "")}

pub fun main(listingID: UInt64): ListingDetails? {
  if let listing = DapperMarket.borrowListing(listingID: listingID) {
    // Get NFT metadata
    let nftRef = listing.borrowNFT()
    var name = ""
    var description = ""
    var thumbnail = ""
    
    if let display = nftRef.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
      name = display.name
      description = display.description
      thumbnail = display.thumbnail.uri()
    }
    
    return ListingDetails(
      listingID: listingID,
      nftID: listing.getNFTID(),
      seller: listing.getSeller(),
      price: listing.getPrice(),
      currency: "FLOW",
      status: "active",
      createdAt: listing.getCreatedAt(),
      nftName: name,
      nftDescription: description,
      nftImage: thumbnail
    )
  }
  
  return nil
}

pub struct ListingDetails {
  pub let listingID: UInt64
  pub let nftID: UInt64
  pub let seller: Address
  pub let price: UFix64
  pub let currency: String
  pub let status: String
  pub let createdAt: UFix64
  pub let nftName: String
  pub let nftDescription: String
  pub let nftImage: String
  
  init(
    listingID: UInt64,
    nftID: UInt64,
    seller: Address,
    price: UFix64,
    currency: String,
    status: String,
    createdAt: UFix64,
    nftName: String,
    nftDescription: String,
    nftImage: String
  ) {
    self.listingID = listingID
    self.nftID = nftID
    self.seller = seller
    self.price = price
    self.currency = currency
    self.status = status
    self.createdAt = createdAt
    self.nftName = nftName
    self.nftDescription = nftDescription
    self.nftImage = nftImage
  }
}
`

class FlowMarketplaceService {
  // List NFT for sale on Flow marketplace
  async listNFTForSale(
    nftID: string, 
    price: string,
    onStatusUpdate?: (status: any) => void
  ): Promise<TransactionResult> {
    try {
      console.log(`[Flow] Listing NFT ${nftID} for ${price} FLOW`)
      
      const transactionId = await executeTransaction(
        `
        import NonFungibleToken from 0x${getContractAddress("NonFungibleToken").replace("0x", "")}
        import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}
        import DapperMarket from 0x${getContractAddress("DapperMarket").replace("0x", "")}
        import FungibleToken from 0x${getContractAddress("FungibleToken").replace("0x", "")}
        import FlowToken from 0x${getContractAddress("FlowToken").replace("0x", "")}

        transaction(nftID: UInt64, price: UFix64) {
          let sellerCollection: &DapperCollectibles.Collection
          let paymentReceiver: Capability<&{FungibleToken.Receiver}>
          
          prepare(signer: AuthAccount) {
            // Get seller's collection reference
            self.sellerCollection = signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection)
              ?? panic("Could not borrow seller collection")
            
            // Get payment receiver capability
            self.paymentReceiver = signer.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            
            // Verify NFT exists in collection
            let nftRef = self.sellerCollection.borrowCollectible(id: nftID)
              ?? panic("NFT does not exist in collection")
          }
          
          execute {
            // Create listing on DapperMarket
            DapperMarket.createListing(
              nftID: nftID,
              price: price,
              seller: signer.address,
              paymentReceiver: self.paymentReceiver
            )
          }
        }
        `,
        [
          fcl.arg(nftID, fcl.t.UInt64),
          fcl.arg(price, fcl.t.UFix64)
        ],
        { onStatusUpdate }
      )

      return {
        transactionId,
        status: 'completed'
      }
    } catch (error) {
      console.error('[Flow] List NFT error:', error)
      return {
        transactionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to list NFT'
      }
    }
  }

  // Purchase NFT from Flow marketplace
  async purchaseNFT(
    nftID: string, 
    seller: string,
    onStatusUpdate?: (status: any) => void
  ): Promise<TransactionResult> {
    try {
      console.log(`[Flow] Purchasing NFT ${nftID} from ${seller}`)
      
      // Check if buyer has sufficient balance first
      const currentUser = await fcl.currentUser().snapshot()
      if (!currentUser.addr) {
        throw new Error('Wallet not connected')
      }

      const transactionId = await executeTransaction(
        `
        import NonFungibleToken from 0x${getContractAddress("NonFungibleToken").replace("0x", "")}
        import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}
        import DapperMarket from 0x${getContractAddress("DapperMarket").replace("0x", "")}
        import FungibleToken from 0x${getContractAddress("FungibleToken").replace("0x", "")}
        import FlowToken from 0x${getContractAddress("FlowToken").replace("0x", "")}

        transaction(nftID: UInt64, seller: Address) {
          let paymentVault: @FlowToken.Vault
          let buyerCollection: &{DapperCollectibles.CollectionPublic}
          let listing: &DapperMarket.Listing
          
          prepare(signer: AuthAccount) {
            // Ensure buyer has collection set up
            if signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection) == nil {
              // Create new collection
              let collection <- DapperCollectibles.createEmptyCollection()
              signer.save(<-collection, to: /storage/DapperCollectiblesCollection)
              signer.link<&{DapperCollectibles.CollectionPublic}>(
                /public/DapperCollectiblesCollection,
                target: /storage/DapperCollectiblesCollection
              )
            }
            
            // Get buyer's collection reference
            self.buyerCollection = signer.getCapability(/public/DapperCollectiblesCollection)
              .borrow<&{DapperCollectibles.CollectionPublic}>()
              ?? panic("Could not borrow buyer collection")
            
            // Get listing reference
            self.listing = DapperMarket.borrowListing(nftID: nftID, seller: seller)
              ?? panic("Could not find listing for this NFT")
            
            // Get listing price
            let price = self.listing.getPrice()
            
            // Withdraw payment from buyer's Flow token vault
            let mainVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow Flow token vault")
            
            // Check sufficient balance
            if mainVault.balance < price {
              panic("Insufficient FLOW balance for purchase")
            }
            
            self.paymentVault <- mainVault.withdraw(amount: price) as! @FlowToken.Vault
          }
          
          execute {
            // Purchase NFT from DapperMarket
            let nft <- DapperMarket.purchase(
              nftID: nftID,
              seller: seller,
              payment: <-self.paymentVault
            )
            
            // Deposit NFT to buyer's collection
            self.buyerCollection.deposit(token: <-nft)
            
            log("NFT purchase completed successfully")
          }
        }
        `,
        [
          fcl.arg(nftID, fcl.t.UInt64),
          fcl.arg(seller, fcl.t.Address)
        ],
        { onStatusUpdate }
      )

      return {
        transactionId,
        status: 'completed'
      }
    } catch (error) {
      console.error('[Flow] Purchase NFT error:', error)
      
      // Parse specific error messages
      let errorMessage = 'Failed to purchase NFT'
      if (error instanceof Error) {
        if (error.message.includes('Insufficient FLOW balance')) {
          errorMessage = 'Insufficient FLOW balance for this purchase'
        } else if (error.message.includes('Could not find listing')) {
          errorMessage = 'This NFT is no longer available for purchase'
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user'
        } else {
          errorMessage = error.message
        }
      }
      
      return {
        transactionId: '',
        status: 'failed',
        error: errorMessage
      }
    }
  }

  // Remove NFT listing from marketplace
  async removeListing(
    nftID: string,
    onStatusUpdate?: (status: any) => void
  ): Promise<TransactionResult> {
    try {
      console.log(`[Flow] Removing listing for NFT ${nftID}`)
      
      const transactionId = await executeTransaction(
        `
        import DapperMarket from 0x${getContractAddress("DapperMarket").replace("0x", "")}

        transaction(nftID: UInt64) {
          prepare(signer: AuthAccount) {
            // Verify signer is the seller
            let listing = DapperMarket.borrowListing(nftID: nftID, seller: signer.address)
              ?? panic("No listing found or not authorized")
          }
          
          execute {
            // Remove listing from DapperMarket
            DapperMarket.removeListing(nftID: nftID, seller: signer.address)
          }
        }
        `,
        [fcl.arg(nftID, fcl.t.UInt64)],
        { onStatusUpdate }
      )

      return {
        transactionId,
        status: 'completed'
      }
    } catch (error) {
      console.error('[Flow] Remove listing error:', error)
      return {
        transactionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to remove listing'
      }
    }
  }

  // Get all marketplace listings from Flow
  async getMarketplaceListings(): Promise<any[]> {
    try {
      console.log('[Flow] Fetching marketplace listings')
      const listings = await executeScript(GET_MARKETPLACE_LISTINGS_SCRIPT)
      return listings || []
    } catch (error) {
      console.error('[Flow] Get listings error:', error)
      return []
    }
  }

  // Get specific listing details
  async getListingDetails(listingID: string): Promise<any | null> {
    try {
      console.log(`[Flow] Fetching listing details for ${listingID}`)
      const listing = await executeScript(GET_LISTING_DETAILS_SCRIPT, [
        fcl.arg(listingID, fcl.t.UInt64)
      ])
      return listing
    } catch (error) {
      console.error('[Flow] Get listing details error:', error)
      return null
    }
  }

  // Check if user has sufficient FLOW balance for purchase
  async checkFlowBalance(address: string, requiredAmount: string): Promise<boolean> {
    try {
      const balance = await executeScript(`
        import FlowToken from 0x${getContractAddress("FlowToken").replace("0x", "")}
        import FungibleToken from 0x${getContractAddress("FungibleToken").replace("0x", "")}

        pub fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vaultRef = account.getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow Balance reference to the Vault")
          
          return vaultRef.balance
        }
      `, [fcl.arg(address, fcl.t.Address)])

      const required = parseFloat(requiredAmount)
      const available = parseFloat(balance.toString())
      
      return available >= required
    } catch (error) {
      console.error('[Flow] Check balance error:', error)
      return false
    }
  }

  // Setup user's collection if not already set up
  async setupUserCollection(onStatusUpdate?: (status: any) => void): Promise<TransactionResult> {
    try {
      console.log('[Flow] Setting up user collection')
      
      const transactionId = await executeTransaction(
        `
        import NonFungibleToken from 0x${getContractAddress("NonFungibleToken").replace("0x", "")}
        import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}

        transaction() {
          prepare(signer: AuthAccount) {
            // Check if collection already exists
            if signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection) == nil {
              // Create new collection
              let collection <- DapperCollectibles.createEmptyCollection()
              
              // Save collection to storage
              signer.save(<-collection, to: /storage/DapperCollectiblesCollection)
              
              // Create public capability
              signer.link<&{DapperCollectibles.CollectionPublic}>(
                /public/DapperCollectiblesCollection,
                target: /storage/DapperCollectiblesCollection
              )
            }
          }
        }
        `,
        [],
        { onStatusUpdate }
      )

      return {
        transactionId,
        status: 'completed'
      }
    } catch (error) {
      console.error('[Flow] Setup collection error:', error)
      return {
        transactionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to setup collection'
      }
    }
  }
}

// Export singleton instance
export const flowMarketplaceService = new FlowMarketplaceService()
export { FlowMarketplaceService }