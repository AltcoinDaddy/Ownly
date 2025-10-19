import * as fcl from "@onflow/fcl"
import { getContractAddress, resolveContractAddress } from "./config"

// Script to get all NFTs owned by an address from DapperCollectibles contract
export const GET_USER_NFTS_SCRIPT = `
import NonFungibleToken from 0x${getContractAddress("NonFungibleToken").replace("0x", "")}
import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}
import MetadataViews from 0x${getContractAddress("MetadataViews").replace("0x", "")}

pub fun main(address: Address): [NFTData] {
  let account = getAccount(address)
  
  // Get reference to the user's DapperCollectibles collection
  let collectionRef = account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>()
  
  if collectionRef == nil {
    return []
  }
  
  let ids = collectionRef!.getIDs()
  let nftData: [NFTData] = []
  
  for id in ids {
    if let nft = collectionRef!.borrowCollectible(id: id) {
      if let display = nft.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
        nftData.append(NFTData(
          id: id,
          name: display.name,
          description: display.description,
          thumbnail: display.thumbnail.uri(),
          owner: address,
          collectionId: "ownly_collectibles"
        ))
      }
    }
  }
  
  return nftData
}

pub struct NFTData {
  pub let id: UInt64
  pub let name: String
  pub let description: String
  pub let thumbnail: String
  pub let owner: Address
  pub let collectionId: String
  
  init(id: UInt64, name: String, description: String, thumbnail: String, owner: Address, collectionId: String) {
    self.id = id
    self.name = name
    self.description = description
    self.thumbnail = thumbnail
    self.owner = owner
    self.collectionId = collectionId
  }
}
`

// Script to get detailed NFT metadata and information
export const GET_NFT_DETAILS_SCRIPT = `
import NonFungibleToken from 0x${getContractAddress("NonFungibleToken").replace("0x", "")}
import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}
import MetadataViews from 0x${getContractAddress("MetadataViews").replace("0x", "")}

pub fun main(address: Address, nftID: UInt64): NFTDetails? {
  let account = getAccount(address)
  
  // Get reference to the user's DapperCollectibles collection
  let collectionRef = account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>()
  
  if collectionRef == nil {
    return nil
  }
  
  if let nft = collectionRef!.borrowCollectible(id: nftID) {
    var name = ""
    var description = ""
    var thumbnail = ""
    var externalURL = ""
    var royalties: [MetadataViews.Royalty] = []
    var traits: {String: AnyStruct} = {}
    
    // Get Display metadata
    if let display = nft.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
      name = display.name
      description = display.description
      thumbnail = display.thumbnail.uri()
    }
    
    // Get ExternalURL metadata
    if let extURL = nft.resolveView(Type<MetadataViews.ExternalURL>()) as? MetadataViews.ExternalURL {
      externalURL = extURL.url
    }
    
    // Get Royalties metadata
    if let royaltiesView = nft.resolveView(Type<MetadataViews.Royalties>()) as? MetadataViews.Royalties {
      royalties = royaltiesView.getRoyalties()
    }
    
    // Get Traits metadata
    if let traitsView = nft.resolveView(Type<MetadataViews.Traits>()) as? MetadataViews.Traits {
      for trait in traitsView.traits {
        traits[trait.name] = trait.value
      }
    }
    
    return NFTDetails(
      id: nftID,
      name: name,
      description: description,
      thumbnail: thumbnail,
      externalURL: externalURL,
      owner: address,
      royalties: royalties,
      traits: traits,
      collectionId: "ownly_collectibles"
    )
  }
  
  return nil
}

pub struct NFTDetails {
  pub let id: UInt64
  pub let name: String
  pub let description: String
  pub let thumbnail: String
  pub let externalURL: String
  pub let owner: Address
  pub let royalties: [MetadataViews.Royalty]
  pub let traits: {String: AnyStruct}
  pub let collectionId: String
  
  init(
    id: UInt64, 
    name: String, 
    description: String, 
    thumbnail: String, 
    externalURL: String,
    owner: Address, 
    royalties: [MetadataViews.Royalty],
    traits: {String: AnyStruct},
    collectionId: String
  ) {
    self.id = id
    self.name = name
    self.description = description
    self.thumbnail = thumbnail
    self.externalURL = externalURL
    self.owner = owner
    self.royalties = royalties
    self.traits = traits
    self.collectionId = collectionId
  }
}
`

// Script to check if user has DapperCollectibles collection set up
export const CHECK_COLLECTION_SCRIPT = `
import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}

pub fun main(address: Address): Bool {
  let account = getAccount(address)
  
  return account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>() != nil
}
`

// Script to get collection info and stats
export const GET_COLLECTION_INFO_SCRIPT = `
import DapperCollectibles from 0x${getContractAddress("DapperCollectibles").replace("0x", "")}

pub fun main(address: Address): CollectionInfo? {
  let account = getAccount(address)
  
  if let collectionRef = account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>() {
    
    let ids = collectionRef.getIDs()
    
    return CollectionInfo(
      address: address,
      totalNFTs: UInt64(ids.length),
      nftIDs: ids
    )
  }
  
  return nil
}

pub struct CollectionInfo {
  pub let address: Address
  pub let totalNFTs: UInt64
  pub let nftIDs: [UInt64]
  
  init(address: Address, totalNFTs: UInt64, nftIDs: [UInt64]) {
    self.address = address
    self.totalNFTs = totalNFTs
    self.nftIDs = nftIDs
  }
}
`

// Execute a script with proper argument handling
export async function executeScript<T>(script: string, args: fcl.ArgumentFunction[] = []): Promise<T> {
  try {
    const response = await fcl.query({
      cadence: script,
      args: args,
    })
    return response as T
  } catch (error) {
    console.error("Script execution error:", error)
    throw error
  }
}

// Utility functions for common script executions
export async function getUserNFTs(address: string): Promise<any[]> {
  return executeScript(GET_USER_NFTS_SCRIPT, [fcl.arg(address, fcl.t.Address)])
}

export async function getNFTDetails(address: string, nftID: string): Promise<any | null> {
  return executeScript(GET_NFT_DETAILS_SCRIPT, [
    fcl.arg(address, fcl.t.Address),
    fcl.arg(nftID, fcl.t.UInt64)
  ])
}

export async function checkUserCollection(address: string): Promise<boolean> {
  return executeScript(CHECK_COLLECTION_SCRIPT, [fcl.arg(address, fcl.t.Address)])
}

export async function getCollectionInfo(address: string): Promise<any | null> {
  return executeScript(GET_COLLECTION_INFO_SCRIPT, [fcl.arg(address, fcl.t.Address)])
}
