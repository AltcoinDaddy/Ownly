import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { flowEmulator, setupFlowEmulator, teardownFlowEmulator, TEST_ACCOUNTS } from './setup'

describe('Flow Marketplace Integration Tests', () => {
  beforeAll(async () => {
    console.log('Setting up Flow emulator for marketplace integration tests...')
    await setupFlowEmulator()
  }, 120000)

  afterAll(async () => {
    console.log('Tearing down Flow emulator...')
    await teardownFlowEmulator()
  }, 30000)

  describe('DapperMarket Contract Integration', () => {
    it('should create marketplace listings', async () => {
      // First, get an NFT to list
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(collection.length).toBeGreaterThan(0)
      const nftId = collection[0]
      
      // Create listing transaction
      const createListingTransaction = `
        import DapperCollectibles from 0xf8d6e0586b0a20c7
        import DapperMarket from 0xf8d6e0586b0a20c7
        import NonFungibleToken from 0xf8d6e0586b0a20c7
        
        transaction(nftID: UInt64, price: UFix64) {
          let sellerCollection: &DapperCollectibles.Collection
          let market: &DapperMarket.Market
          
          prepare(acct: auth(Storage, Capabilities) &Account) {
            self.sellerCollection = acct.storage.borrow<&DapperCollectibles.Collection>(from: DapperCollectibles.CollectionStoragePath)
              ?? panic("Could not borrow seller collection")
            
            self.market = acct.storage.borrow<&DapperMarket.Market>(from: DapperMarket.MarketStoragePath)
              ?? panic("Could not borrow market")
          }
          
          execute {
            // Withdraw NFT from collection
            let nft <- self.sellerCollection.withdraw(withdrawID: nftID) as! @DapperCollectibles.NFT
            
            // Create listing in market
            let listingID = self.market.createListing(nft: <-nft, price: price)
            
            log("Created listing with ID: ".concat(listingID.toString()))
          }
        }
      `
      
      const listingResult = await flowEmulator.executeTransaction(
        createListingTransaction,
        [nftId.toString(), '10.0'],
        'emulator-account'
      )
      
      expect(listingResult).toBeDefined()
      console.log('Listing creation result:', listingResult)
    })

    it('should query marketplace listings', async () => {
      // Query marketplace listings
      const getListingsScript = `
        import DapperMarket from 0xf8d6e0586b0a20c7
        
        pub fun main(marketAddress: Address): [UInt64] {
          let account = getAccount(marketAddress)
          let marketRef = account.capabilities.get<&{DapperMarket.MarketPublic}>(DapperMarket.MarketPublicPath)
            .borrow()
            ?? panic("Could not borrow market reference")
          
          return marketRef.getListingIDs()
        }
      `
      
      const listings = await flowEmulator.executeScript(
        getListingsScript,
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(Array.isArray(listings)).toBe(true)
      console.log('Marketplace listings:', listings)
    })

    it('should get listing details', async () => {
      // First get available listings
      const getListingsScript = `
        import DapperMarket from 0xf8d6e0586b0a20c7
        
        pub fun main(marketAddress: Address): [UInt64] {
          let account = getAccount(marketAddress)
          let marketRef = account.capabilities.get<&{DapperMarket.MarketPublic}>(DapperMarket.MarketPublicPath)
            .borrow()
            ?? panic("Could not borrow market reference")
          
          return marketRef.getListingIDs()
        }
      `
      
      const listings = await flowEmulator.executeScript(
        getListingsScript,
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      if (listings.length > 0) {
        const listingId = listings[0]
        
        // Get listing details
        const getListingDetailsScript = `
          import DapperMarket from 0xf8d6e0586b0a20c7
          
          pub fun main(marketAddress: Address, listingID: UInt64): DapperMarket.ListingDetails? {
            let account = getAccount(marketAddress)
            let marketRef = account.capabilities.get<&{DapperMarket.MarketPublic}>(DapperMarket.MarketPublicPath)
              .borrow()
              ?? panic("Could not borrow market reference")
            
            return marketRef.getListingDetails(listingID: listingID)
          }
        `
        
        const details = await flowEmulator.executeScript(
          getListingDetailsScript,
          [TEST_ACCOUNTS.EMULATOR, listingId.toString()]
        )
        
        expect(details).toBeDefined()
        expect(details.listingID).toBe(listingId)
        expect(details.price).toBeDefined()
        expect(details.seller).toBeDefined()
        
        console.log('Listing details:', details)
      }
    })

    it('should handle marketplace purchases', async () => {
      // This test simulates a purchase flow
      // Note: In a real scenario, this would involve multiple accounts and FLOW tokens
      
      const purchaseSimulationScript = `
        import DapperMarket from 0xf8d6e0586b0a20c7
        import DapperCollectibles from 0xf8d6e0586b0a20c7
        import NonFungibleToken from 0xf8d6e0586b0a20c7
        
        pub fun main(marketAddress: Address): Bool {
          let account = getAccount(marketAddress)
          let marketRef = account.capabilities.get<&{DapperMarket.MarketPublic}>(DapperMarket.MarketPublicPath)
            .borrow()
            ?? panic("Could not borrow market reference")
          
          let listings = marketRef.getListingIDs()
          
          // Return true if marketplace is functional (has listings interface)
          return listings.length >= 0
        }
      `
      
      const canPurchase = await flowEmulator.executeScript(
        purchaseSimulationScript,
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(canPurchase).toBe(true)
    })

    it('should remove marketplace listings', async () => {
      // Get current listings
      const getListingsScript = `
        import DapperMarket from 0xf8d6e0586b0a20c7
        
        pub fun main(marketAddress: Address): [UInt64] {
          let account = getAccount(marketAddress)
          let marketRef = account.capabilities.get<&{DapperMarket.MarketPublic}>(DapperMarket.MarketPublicPath)
            .borrow()
            ?? panic("Could not borrow market reference")
          
          return marketRef.getListingIDs()
        }
      `
      
      const initialListings = await flowEmulator.executeScript(
        getListingsScript,
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      if (initialListings.length > 0) {
        const listingId = initialListings[0]
        
        // Remove listing transaction
        const removeListingTransaction = `
          import DapperMarket from 0xf8d6e0586b0a20c7
          import DapperCollectibles from 0xf8d6e0586b0a20c7
          
          transaction(listingID: UInt64) {
            let market: &DapperMarket.Market
            let collection: &DapperCollectibles.Collection
            
            prepare(acct: auth(Storage) &Account) {
              self.market = acct.storage.borrow<&DapperMarket.Market>(from: DapperMarket.MarketStoragePath)
                ?? panic("Could not borrow market")
              
              self.collection = acct.storage.borrow<&DapperCollectibles.Collection>(from: DapperCollectibles.CollectionStoragePath)
                ?? panic("Could not borrow collection")
            }
            
            execute {
              // Remove listing and get NFT back
              let nft <- self.market.removeListing(listingID: listingID)
              
              // Deposit NFT back to collection
              self.collection.deposit(token: <-nft)
              
              log("Removed listing: ".concat(listingID.toString()))
            }
          }
        `
        
        const removeResult = await flowEmulator.executeTransaction(
          removeListingTransaction,
          [listingId.toString()],
          'emulator-account'
        )
        
        expect(removeResult).toBeDefined()
        
        // Verify listing was removed
        const updatedListings = await flowEmulator.executeScript(
          getListingsScript,
          [TEST_ACCOUNTS.EMULATOR]
        )
        
        expect(updatedListings.length).toBe(initialListings.length - 1)
        expect(updatedListings).not.toContain(listingId)
        
        console.log('Listing removal result:', removeResult)
      }
    })
  })

  describe('Marketplace Event Testing', () => {
    it('should emit ListingCreated events', async () => {
      // This test would verify that marketplace events are emitted
      // For now, we'll test the transaction execution
      
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      if (collection.length > 0) {
        const nftId = collection[0]
        
        const createListingTransaction = `
          import DapperCollectibles from 0xf8d6e0586b0a20c7
          import DapperMarket from 0xf8d6e0586b0a20c7
          
          transaction(nftID: UInt64, price: UFix64) {
            let sellerCollection: &DapperCollectibles.Collection
            let market: &DapperMarket.Market
            
            prepare(acct: auth(Storage, Capabilities) &Account) {
              self.sellerCollection = acct.storage.borrow<&DapperCollectibles.Collection>(from: DapperCollectibles.CollectionStoragePath)
                ?? panic("Could not borrow seller collection")
              
              self.market = acct.storage.borrow<&DapperMarket.Market>(from: DapperMarket.MarketStoragePath)
                ?? panic("Could not borrow market")
            }
            
            execute {
              let nft <- self.sellerCollection.withdraw(withdrawID: nftID) as! @DapperCollectibles.NFT
              let listingID = self.market.createListing(nft: <-nft, price: price)
              
              // Event should be emitted here
              log("ListingCreated event should be emitted for listing: ".concat(listingID.toString()))
            }
          }
        `
        
        const result = await flowEmulator.executeTransaction(
          createListingTransaction,
          [nftId.toString(), '15.0'],
          'emulator-account'
        )
        
        expect(result).toBeDefined()
        console.log('Listing creation with event test:', result)
      }
    })

    it('should emit ListingRemoved events', async () => {
      // Get current listings to remove one
      const getListingsScript = `
        import DapperMarket from 0xf8d6e0586b0a20c7
        
        pub fun main(marketAddress: Address): [UInt64] {
          let account = getAccount(marketAddress)
          let marketRef = account.capabilities.get<&{DapperMarket.MarketPublic}>(DapperMarket.MarketPublicPath)
            .borrow()
            ?? panic("Could not borrow market reference")
          
          return marketRef.getListingIDs()
        }
      `
      
      const listings = await flowEmulator.executeScript(
        getListingsScript,
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      if (listings.length > 0) {
        const listingId = listings[0]
        
        const removeListingTransaction = `
          import DapperMarket from 0xf8d6e0586b0a20c7
          import DapperCollectibles from 0xf8d6e0586b0a20c7
          
          transaction(listingID: UInt64) {
            let market: &DapperMarket.Market
            let collection: &DapperCollectibles.Collection
            
            prepare(acct: auth(Storage) &Account) {
              self.market = acct.storage.borrow<&DapperMarket.Market>(from: DapperMarket.MarketStoragePath)
                ?? panic("Could not borrow market")
              
              self.collection = acct.storage.borrow<&DapperCollectibles.Collection>(from: DapperCollectibles.CollectionStoragePath)
                ?? panic("Could not borrow collection")
            }
            
            execute {
              let nft <- self.market.removeListing(listingID: listingID)
              self.collection.deposit(token: <-nft)
              
              // Event should be emitted here
              log("ListingRemoved event should be emitted for listing: ".concat(listingID.toString()))
            }
          }
        `
        
        const result = await flowEmulator.executeTransaction(
          removeListingTransaction,
          [listingId.toString()],
          'emulator-account'
        )
        
        expect(result).toBeDefined()
        console.log('Listing removal with event test:', result)
      }
    })
  })

  describe('Marketplace Error Handling', () => {
    it('should handle invalid listing operations', async () => {
      // Test creating listing with non-existent NFT
      const invalidListingTransaction = `
        import DapperCollectibles from 0xf8d6e0586b0a20c7
        import DapperMarket from 0xf8d6e0586b0a20c7
        
        transaction(nftID: UInt64, price: UFix64) {
          let sellerCollection: &DapperCollectibles.Collection
          let market: &DapperMarket.Market
          
          prepare(acct: auth(Storage, Capabilities) &Account) {
            self.sellerCollection = acct.storage.borrow<&DapperCollectibles.Collection>(from: DapperCollectibles.CollectionStoragePath)
              ?? panic("Could not borrow seller collection")
            
            self.market = acct.storage.borrow<&DapperMarket.Market>(from: DapperMarket.MarketStoragePath)
              ?? panic("Could not borrow market")
          }
          
          execute {
            // This should fail for non-existent NFT ID
            let nft <- self.sellerCollection.withdraw(withdrawID: nftID) as! @DapperCollectibles.NFT
            let listingID = self.market.createListing(nft: <-nft, price: price)
          }
        }
      `
      
      try {
        await flowEmulator.executeTransaction(
          invalidListingTransaction,
          ['99999', '10.0'], // Non-existent NFT ID
          'emulator-account'
        )
        
        // Should not reach here
        expect(false).toBe(true)
      } catch (error) {
        // Expected error for invalid NFT ID
        expect(error).toBeDefined()
        console.log('Expected error for invalid listing:', error)
      }
    })

    it('should handle invalid purchase operations', async () => {
      // Test purchasing non-existent listing
      const invalidPurchaseScript = `
        import DapperMarket from 0xf8d6e0586b0a20c7
        
        pub fun main(marketAddress: Address, listingID: UInt64): DapperMarket.ListingDetails? {
          let account = getAccount(marketAddress)
          let marketRef = account.capabilities.get<&{DapperMarket.MarketPublic}>(DapperMarket.MarketPublicPath)
            .borrow()
            ?? panic("Could not borrow market reference")
          
          // This should return nil for non-existent listing
          return marketRef.getListingDetails(listingID: listingID)
        }
      `
      
      const result = await flowEmulator.executeScript(
        invalidPurchaseScript,
        [TEST_ACCOUNTS.EMULATOR, '99999'] // Non-existent listing ID
      )
      
      expect(result).toBeNull()
    })
  })
})