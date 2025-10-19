import "NonFungibleToken"
import "DapperCollectibles"

access(all) contract DapperMarket {
    
    access(all) event ListingCreated(id: UInt64, nftID: UInt64, seller: Address, price: UFix64)
    access(all) event ListingRemoved(id: UInt64, nftID: UInt64, seller: Address)
    access(all) event NFTPurchased(id: UInt64, nftID: UInt64, seller: Address, buyer: Address, price: UFix64)

    access(all) let MarketStoragePath: StoragePath
    access(all) let MarketPublicPath: PublicPath

    access(all) var nextListingID: UInt64

    access(all) struct ListingDetails {
        access(all) let listingID: UInt64
        access(all) let nftID: UInt64
        access(all) let seller: Address
        access(all) let price: UFix64

        init(listingID: UInt64, nftID: UInt64, seller: Address, price: UFix64) {
            self.listingID = listingID
            self.nftID = nftID
            self.seller = seller
            self.price = price
        }
    }

    access(all) resource Listing {
        access(all) let listingID: UInt64
        access(all) let nftID: UInt64
        access(all) let price: UFix64
        access(all) var nft: @DapperCollectibles.NFT?

        init(nft: @DapperCollectibles.NFT, price: UFix64) {
            self.listingID = DapperMarket.nextListingID
            self.nftID = nft.id
            self.nft <- nft
            self.price = price
            DapperMarket.nextListingID = DapperMarket.nextListingID + 1
        }

        access(all) fun withdrawNFT(): @DapperCollectibles.NFT {
            let nft <- self.nft <- nil
            return <-nft!
        }
    }

    access(all) resource interface MarketPublic {
        access(all) view fun getListingIDs(): [UInt64]
        access(all) fun getListingDetails(listingID: UInt64): ListingDetails?
        access(all) fun purchase(listingID: UInt64, recipient: &{NonFungibleToken.CollectionPublic})
    }

    access(all) resource Market: MarketPublic {
        access(all) var listings: @{UInt64: Listing}

        init() {
            self.listings <- {}
        }

        access(all) fun createListing(nft: @DapperCollectibles.NFT, price: UFix64): UInt64 {
            let listing <- create Listing(nft: <-nft, price: price)
            let listingID = listing.listingID
            let nftID = listing.nftID
            
            emit ListingCreated(
                id: listingID,
                nftID: nftID,
                seller: self.owner!.address,
                price: price
            )

            let oldListing <- self.listings[listingID] <- listing
            destroy oldListing
            return listingID
        }

        access(all) fun removeListing(listingID: UInt64): @DapperCollectibles.NFT {
            let listing <- self.listings.remove(key: listingID) ?? panic("Listing not found")
            let nftID = listing.nftID

            emit ListingRemoved(
                id: listingID,
                nftID: nftID,
                seller: self.owner!.address
            )

            let nft <- listing.withdrawNFT()
            destroy listing
            return <-nft
        }

        access(all) view fun getListingIDs(): [UInt64] {
            return self.listings.keys
        }

        access(all) fun getListingDetails(listingID: UInt64): ListingDetails? {
            if self.listings.containsKey(listingID) {
                let listingRef = &self.listings[listingID] as &Listing?
                if let listing = listingRef {
                    // Get owner address outside of view context
                    let ownerAddress = self.owner?.address ?? panic("No owner")
                    return ListingDetails(
                        listingID: listing.listingID,
                        nftID: listing.nftID,
                        seller: ownerAddress,
                        price: listing.price
                    )
                }
            }
            return nil
        }

        access(all) fun purchase(listingID: UInt64, recipient: &{NonFungibleToken.CollectionPublic}) {
            let listing <- self.listings.remove(key: listingID) ?? panic("Listing not found")
            let price = listing.price
            let nftID = listing.nftID

            emit NFTPurchased(
                id: listingID,
                nftID: nftID,
                seller: self.owner!.address,
                buyer: recipient.owner!.address,
                price: price
            )

            let nft <- listing.withdrawNFT()
            destroy listing
            recipient.deposit(token: <-nft)
        }
    }

    access(all) fun createMarket(): @Market {
        return <- create Market()
    }

    init() {
        self.nextListingID = 1
        self.MarketStoragePath = /storage/DapperMarket
        self.MarketPublicPath = /public/DapperMarket

        let market <- create Market()
        self.account.storage.save(<-market, to: self.MarketStoragePath)
        
        let marketCap = self.account.capabilities.storage.issue<&Market>(self.MarketStoragePath)
        self.account.capabilities.publish(marketCap, at: self.MarketPublicPath)
    }
}