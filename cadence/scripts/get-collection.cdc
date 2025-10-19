import "DapperCollectibles"
import "NonFungibleToken"

// Script to get NFT collection for an address
access(all) fun main(address: Address): [UInt64] {
    let collection = getAccount(address)
        .capabilities.get<&{NonFungibleToken.CollectionPublic}>(DapperCollectibles.CollectionPublicPath)
        .borrow()
        ?? panic("Could not get collection reference")
    
    return collection.getIDs()
}