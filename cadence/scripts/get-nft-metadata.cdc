import "DapperCollectibles"
import "NonFungibleToken"

// Script to get NFT metadata
access(all) struct NFTData {
    access(all) let id: UInt64
    access(all) let name: String
    access(all) let description: String
    access(all) let thumbnail: String
    access(all) let creator: Address
    access(all) let metadata: {String: String}

    init(id: UInt64, name: String, description: String, thumbnail: String, creator: Address, metadata: {String: String}) {
        self.id = id
        self.name = name
        self.description = description
        self.thumbnail = thumbnail
        self.creator = creator
        self.metadata = metadata
    }
}

access(all) fun main(address: Address, nftID: UInt64): NFTData? {
    let account = getAccount(address)
    
    // Get the collection capability
    let collectionRef = account.capabilities.get<&{DapperCollectibles.CollectionPublic}>(DapperCollectibles.CollectionPublicPath)
        .borrow()
        ?? panic("Could not get collection reference")
    
    if let nft = collectionRef.borrowCollectible(id: nftID) {
        return NFTData(
            id: nft.id,
            name: nft.name,
            description: nft.description,
            thumbnail: nft.thumbnail,
            creator: nft.creator,
            metadata: nft.metadata
        )
    }
    
    return nil
}