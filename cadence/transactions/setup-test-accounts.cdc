import "DapperCollectibles"
import "DapperMarket"
import "NonFungibleToken"

// Transaction to set up test accounts with collections and market
transaction {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Create NFT collection if it doesn't exist
        if acct.storage.borrow<&DapperCollectibles.Collection>(from: DapperCollectibles.CollectionStoragePath) == nil {
            let collection <- DapperCollectibles.createEmptyCollection(nftType: Type<@DapperCollectibles.NFT>())
            acct.storage.save(<-collection, to: DapperCollectibles.CollectionStoragePath)
            
            let collectionCap = acct.capabilities.storage.issue<&DapperCollectibles.Collection>(DapperCollectibles.CollectionStoragePath)
            acct.capabilities.publish(collectionCap, at: DapperCollectibles.CollectionPublicPath)
        }

        // Create market if it doesn't exist
        if acct.storage.borrow<&DapperMarket.Market>(from: DapperMarket.MarketStoragePath) == nil {
            let market <- DapperMarket.createMarket()
            acct.storage.save(<-market, to: DapperMarket.MarketStoragePath)
            
            let marketCap = acct.capabilities.storage.issue<&DapperMarket.Market>(DapperMarket.MarketStoragePath)
            acct.capabilities.publish(marketCap, at: DapperMarket.MarketPublicPath)
        }
    }
}