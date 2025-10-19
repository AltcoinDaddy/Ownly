import DapperCollectibles from "DapperCollectibles"
import NonFungibleToken from "NonFungibleToken"

// Script to mint test NFTs for testing
transaction(recipient: Address, name: String, description: String, thumbnail: String) {
    let recipientCollection: &DapperCollectibles.Collection{NonFungibleToken.CollectionPublic}

    prepare(acct: AuthAccount) {
        self.recipientCollection = getAccount(recipient)
            .getCapability(DapperCollectibles.CollectionPublicPath)
            .borrow<&DapperCollectibles.Collection{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")
    }

    execute {
        let metadata: {String: String} = {
            "name": name,
            "description": description,
            "thumbnail": thumbnail,
            "creator": recipient.toString(),
            "collection": "ownly_collectibles"
        }

        DapperCollectibles.mintNFT(
            recipient: self.recipientCollection,
            name: name,
            description: description,
            thumbnail: thumbnail,
            metadata: metadata
        )
    }
}