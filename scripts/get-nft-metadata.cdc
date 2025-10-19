import DapperCollectibles from "DapperCollectibles"
import NonFungibleToken from "NonFungibleToken"

// Script to get NFT metadata
pub struct NFTData {
    pub let id: UInt64
    pub let name: String
    pub let description: String
    pub let thumbnail: String
    pub let creator: Address
    pub let metadata: {String: String}

    init(id: UInt64, name: String, description: String, thumbnail: String, creator: Address, metadata: {String: String}) {
        self.id = id
        self.name = name
        self.description = description
        self.thumbnail = thumbnail
        self.creator = creator
        self.metadata = metadata
    }
}

pub fun main(address: Address, nftID: UInt64): NFTData? {
    let collection = getAccount(address)
        .getCapability(DapperCollectibles.CollectionPublicPath)
        .borrow<&DapperCollectibles.Collection{DapperCollectibles.CollectionPublic}>()
        ?? panic("Could not get collection reference")
    
    if let nft = collection.borrowCollectible(id: nftID) {
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