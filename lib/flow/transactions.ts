import * as fcl from "@onflow/fcl"
import { getContractAddress } from "./config"

// Transaction to set up DapperCollectibles collection for user
export const SETUP_COLLECTION_TRANSACTION = `
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
`

// Transaction to transfer NFT using DapperCollectibles
export const TRANSFER_NFT_TRANSACTION = `
import NonFungibleToken from 0x${getContractAddress("NonFungibleToken").replace("0x", "")}
import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}

transaction(recipient: Address, nftID: UInt64) {
  let senderCollection: &DapperCollectibles.Collection
  let recipientCollection: &{DapperCollectibles.CollectionPublic}
  
  prepare(signer: AuthAccount) {
    // Get sender's collection reference
    self.senderCollection = signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection)
      ?? panic("Could not borrow sender collection")
    
    // Get recipient's collection reference
    self.recipientCollection = getAccount(recipient)
      .getCapability(/public/DapperCollectiblesCollection)
      .borrow<&{DapperCollectibles.CollectionPublic}>()
      ?? panic("Could not borrow recipient collection")
  }
  
  execute {
    // Withdraw NFT from sender and deposit to recipient
    let nft <- self.senderCollection.withdraw(withdrawID: nftID)
    self.recipientCollection.deposit(token: <-nft)
  }
}
`

// Transaction to list NFT for sale using DapperMarket
export const LIST_NFT_TRANSACTION = `
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
`

// Transaction to purchase NFT from DapperMarket
export const PURCHASE_NFT_TRANSACTION = `
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
    // Get buyer's collection reference
    self.buyerCollection = signer.getCapability(/public/DapperCollectiblesCollection)
      .borrow<&{DapperCollectibles.CollectionPublic}>()
      ?? panic("Could not borrow buyer collection")
    
    // Get listing reference
    self.listing = DapperMarket.borrowListing(nftID: nftID, seller: seller)
      ?? panic("Could not borrow listing")
    
    // Get listing price
    let price = self.listing.getPrice()
    
    // Withdraw payment from buyer's Flow token vault
    let mainVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
      ?? panic("Could not borrow Flow token vault")
    
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
  }
}
`

// Transaction to remove NFT listing from marketplace
export const REMOVE_LISTING_TRANSACTION = `
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
`

// Execute a transaction with proper argument handling and authorization
export async function executeTransaction(
  transaction: string,
  args: fcl.ArgumentFunction[] = [],
  options?: { 
    onSealed?: (txId: string) => void
    onStatusUpdate?: (status: any) => void
  },
): Promise<string> {
  try {
    const transactionId = await fcl.mutate({
      cadence: transaction,
      args: args,
      limit: 9999,
      authorizations: [fcl.currentUser().authorization],
    })

    console.log("Transaction submitted:", transactionId)

    // Subscribe to transaction status updates
    if (options?.onStatusUpdate) {
      fcl.tx(transactionId).subscribe(options.onStatusUpdate)
    }

    // Wait for transaction to be sealed
    const txStatus = await fcl.tx(transactionId).onceSealed()
    console.log("Transaction sealed:", txStatus)

    if (options?.onSealed) {
      options.onSealed(transactionId)
    }

    return transactionId
  } catch (error) {
    console.error("Transaction error:", error)
    throw error
  }
}

// Utility functions for common transactions
export async function setupCollection(): Promise<string> {
  return executeTransaction(SETUP_COLLECTION_TRANSACTION)
}

export async function transferNFT(recipient: string, nftID: string): Promise<string> {
  return executeTransaction(TRANSFER_NFT_TRANSACTION, [
    fcl.arg(recipient, fcl.t.Address),
    fcl.arg(nftID, fcl.t.UInt64)
  ])
}

export async function listNFTForSale(nftID: string, price: string): Promise<string> {
  return executeTransaction(LIST_NFT_TRANSACTION, [
    fcl.arg(nftID, fcl.t.UInt64),
    fcl.arg(price, fcl.t.UFix64)
  ])
}

export async function purchaseNFT(nftID: string, seller: string): Promise<string> {
  return executeTransaction(PURCHASE_NFT_TRANSACTION, [
    fcl.arg(nftID, fcl.t.UInt64),
    fcl.arg(seller, fcl.t.Address)
  ])
}

export async function removeListing(nftID: string): Promise<string> {
  return executeTransaction(REMOVE_LISTING_TRANSACTION, [
    fcl.arg(nftID, fcl.t.UInt64)
  ])
}
