import DapperCollectibles from "DapperCollectibles"
import DapperMarket from "DapperMarket"
import NonFungibleToken from "NonFungibleToken"

// Script to set up test accounts with collections and market
transaction {
    prepare(acct: AuthAccount) {
        // Create NFT collection if it doesn't exist
        if acct.borrow<&DapperCollectibles.Collection>(from: DapperCollectibles.CollectionStoragePath) == nil {
            let collection <- DapperCollectibles.createEmptyCollection()
            acct.save(<-collection, to: DapperCollectibles.CollectionStoragePath)
            
            acct.link<&DapperCollectibles.Collection{NonFungibleToken.CollectionPublic, DapperCollectibles.CollectionPublic}>(
                DapperCollectibles.CollectionPublicPath,
                target: DapperCollectibles.CollectionStoragePath
            )
        }

        // Create market if it doesn't exist
        if acct.borrow<&DapperMarket.Market>(from: DapperMarket.MarketStoragePath) == nil {
            let market <- DapperMarket.createMarket()
            acct.save(<-market, to: DapperMarket.MarketStoragePath)
            
            acct.link<&DapperMarket.Market{DapperMarket.MarketPublic}>(
                DapperMarket.MarketPublicPath,
                target: DapperMarket.MarketStoragePath
            )
        }
    }
}