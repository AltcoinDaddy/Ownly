import "DapperCollectibles"
import "NonFungibleToken"

// Transaction to mint test NFTs for testing
transaction(recipient: Address, name: String, description: String, thumbnail: String) {
    let recipientCollection: &{NonFungibleToken.CollectionPublic}

    prepare(acct: auth(Storage) &Account) {
        self.recipientCollection = getAccount(recipient)
            .capabilities.get<&{NonFungibleToken.CollectionPublic}>(DapperCollectibles.CollectionPublicPath)
            .borrow()
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