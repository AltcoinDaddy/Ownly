import DapperCollectibles from "DapperCollectibles"
import NonFungibleToken from "NonFungibleToken"

// Script to get NFT collection for an address
pub fun main(address: Address): [UInt64] {
    let collection = getAccount(address)
        .getCapability(DapperCollectibles.CollectionPublicPath)
        .borrow<&DapperCollectibles.Collection{DapperCollectibles.CollectionPublic}>()
        ?? panic("Could not get collection reference")
    
    return collection.getIDs()
}