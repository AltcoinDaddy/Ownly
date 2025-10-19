import "NonFungibleToken"
import "ViewResolver"

access(all) contract DapperCollectibles: NonFungibleToken {
    
    access(all) var totalSupply: UInt64
    
    access(all) event ContractInitialized()
    access(all) event CollectibleMinted(id: UInt64, recipient: Address, metadata: {String: String})

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let thumbnail: String
        access(all) let creator: Address
        access(all) let metadata: {String: String}

        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String,
            creator: Address,
            metadata: {String: String}
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
            self.creator = creator
            self.metadata = metadata
        }

        access(all) view fun getViews(): [Type] {
            return []
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-create Collection()
        }
    }

    access(all) resource interface CollectionPublic {
        access(all) fun borrowCollectible(id: UInt64): &DapperCollectibles.NFT?
    }

    access(all) resource Collection: NonFungibleToken.Collection, CollectionPublic {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @DapperCollectibles.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            destroy oldToken
        }

        access(all) view fun getLength(): Int {
            return self.ownedNFTs.length
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) fun forEachID(_ f: fun (UInt64): Bool): Void {
            self.ownedNFTs.forEachKey(f)
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id]
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@DapperCollectibles.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@DapperCollectibles.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-create Collection()
        }

        access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}? {
            if let nftRef = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return nftRef as &{ViewResolver.Resolver}
            }
            return nil
        }

        access(all) fun borrowCollectible(id: UInt64): &DapperCollectibles.NFT? {
            if let nftRef = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return nftRef as! &DapperCollectibles.NFT
            }
            return nil
        }
    }

    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    access(all) fun mintNFT(
        recipient: &{NonFungibleToken.CollectionPublic},
        name: String,
        description: String,
        thumbnail: String,
        metadata: {String: String}
    ): UInt64 {
        let newNFT <- create NFT(
            id: DapperCollectibles.totalSupply,
            name: name,
            description: description,
            thumbnail: thumbnail,
            creator: recipient.owner!.address,
            metadata: metadata
        )

        let id = newNFT.id
        emit CollectibleMinted(id: id, recipient: recipient.owner!.address, metadata: metadata)
        
        recipient.deposit(token: <-newNFT)
        DapperCollectibles.totalSupply = DapperCollectibles.totalSupply + 1

        return id
    }

    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return []
    }

    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        return nil
    }

    init() {
        self.totalSupply = 0
        self.CollectionStoragePath = /storage/DapperCollectiblesCollection
        self.CollectionPublicPath = /public/DapperCollectiblesCollection

        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)
        
        let collectionCap = self.account.capabilities.storage.issue<&DapperCollectibles.Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        emit ContractInitialized()
    }
}