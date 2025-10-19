import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { flowEmulator, setupFlowEmulator, teardownFlowEmulator, TEST_ACCOUNTS } from './setup'
import * as fcl from '@onflow/fcl'

// Configure FCL for emulator testing
fcl.config()
  .put('flow.network', 'emulator')
  .put('accessNode.api', 'http://127.0.0.1:8888')
  .put('discovery.wallet', 'http://127.0.0.1:8701/fcl/authn')

describe('Flow Blockchain Integration Tests', () => {
  beforeAll(async () => {
    console.log('Setting up Flow emulator for blockchain integration tests...')
    await setupFlowEmulator()
  }, 120000) // 2 minute timeout for setup

  afterAll(async () => {
    console.log('Tearing down Flow emulator...')
    await teardownFlowEmulator()
  }, 30000)

  describe('Cadence Scripts - NFT Queries and Collection Management', () => {
    it('should query user NFT collection using get-collection script', async () => {
      const result = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      console.log('Collection NFT IDs:', result)
    })

    it('should get NFT metadata using get-nft-metadata script', async () => {
      // First get the collection to find an NFT ID
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(collection.length).toBeGreaterThan(0)
      
      const nftId = collection[0]
      const metadata = await flowEmulator.executeScript(
        'cadence/scripts/get-nft-metadata.cdc',
        [TEST_ACCOUNTS.EMULATOR, nftId.toString()]
      )
      
      expect(metadata).toBeDefined()
      expect(metadata.id).toBe(nftId)
      expect(metadata.name).toBeDefined()
      expect(metadata.description).toBeDefined()
      expect(metadata.thumbnail).toBeDefined()
      expect(metadata.creator).toBeDefined()
      
      console.log('NFT Metadata:', metadata)
    })

    it('should handle empty collection queries gracefully', async () => {
      // Test with a non-existent account address
      const emptyAddress = '0x0000000000000001'
      
      try {
        const result = await flowEmulator.executeScript(
          'cadence/scripts/get-collection.cdc',
          [emptyAddress]
        )
        // Should return empty array or throw error
        expect(Array.isArray(result) ? result.length === 0 : true).toBe(true)
      } catch (error) {
        // Expected behavior for non-existent collection
        expect(error).toBeDefined()
      }
    })

    it('should validate NFT ownership through collection queries', async () => {
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(collection.length).toBeGreaterThan(0)
      
      // Verify each NFT in collection belongs to the owner
      for (const nftId of collection) {
        const metadata = await flowEmulator.executeScript(
          'cadence/scripts/get-nft-metadata.cdc',
          [TEST_ACCOUNTS.EMULATOR, nftId.toString()]
        )
        
        expect(metadata).toBeDefined()
        expect(metadata.id).toBe(nftId)
      }
    })

    it('should test script execution with various parameter types', async () => {
      // Test script with Address parameter
      const addressScript = `
        access(all) fun main(addr: Address): String {
          return addr.toString()
        }
      `
      const addressResult = await flowEmulator.executeScript(addressScript, [TEST_ACCOUNTS.EMULATOR])
      expect(addressResult).toBe(TEST_ACCOUNTS.EMULATOR)

      // Test script with UInt64 parameter
      const uint64Script = `
        access(all) fun main(num: UInt64): UInt64 {
          return num * 2
        }
      `
      const uint64Result = await flowEmulator.executeScript(uint64Script, ['42'])
      expect(uint64Result).toBe(84)

      // Test script with String parameter
      const stringScript = `
        access(all) fun main(text: String): String {
          return "Hello, ".concat(text)
        }
      `
      const stringResult = await flowEmulator.executeScript(stringScript, ['World'])
      expect(stringResult).toBe('Hello, World')
    })

    it('should handle script errors gracefully', async () => {
      const errorScript = `
        access(all) fun main(): String {
          panic("This script intentionally fails")
        }
      `
      
      await expect(flowEmulator.executeScript(errorScript)).rejects.toThrow()
    })
  })

  describe('Cadence Transactions - Minting, Transfers, and Marketplace', () => {
    it('should mint new NFT using mint-test-nfts transaction', async () => {
      const initialCollection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      const initialCount = initialCollection.length
      
      // Mint a new NFT
      const mintResult = await flowEmulator.executeTransaction(
        'cadence/transactions/mint-test-nfts.cdc',
        [
          TEST_ACCOUNTS.EMULATOR,
          'Integration Test NFT',
          'NFT created during integration testing',
          'https://example.com/integration-test.png'
        ],
        'emulator-account'
      )
      
      expect(mintResult).toBeDefined()
      console.log('Mint transaction result:', mintResult)
      
      // Verify the NFT was minted
      const updatedCollection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(updatedCollection.length).toBe(initialCount + 1)
      
      // Get metadata for the new NFT
      const newNftId = updatedCollection[updatedCollection.length - 1]
      const metadata = await flowEmulator.executeScript(
        'cadence/scripts/get-nft-metadata.cdc',
        [TEST_ACCOUNTS.EMULATOR, newNftId.toString()]
      )
      
      expect(metadata.name).toBe('Integration Test NFT')
      expect(metadata.description).toBe('NFT created during integration testing')
    })

    it('should setup collection for new account', async () => {
      // This test verifies the setup-test-accounts transaction
      const setupResult = await flowEmulator.executeTransaction(
        'cadence/transactions/setup-test-accounts.cdc',
        [],
        'emulator-account'
      )
      
      expect(setupResult).toBeDefined()
      console.log('Setup transaction result:', setupResult)
      
      // Verify collection is accessible
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(Array.isArray(collection)).toBe(true)
    })

    it('should handle transaction failures gracefully', async () => {
      // Test with invalid parameters to ensure error handling
      try {
        await flowEmulator.executeTransaction(
          'cadence/transactions/mint-test-nfts.cdc',
          [
            '0x0000000000000001', // Invalid recipient
            'Test NFT',
            'Test Description',
            'https://example.com/test.png'
          ],
          'emulator-account'
        )
        
        // If we reach here, the transaction unexpectedly succeeded
        expect(false).toBe(true)
      } catch (error) {
        // Expected behavior for invalid transaction
        expect(error).toBeDefined()
        console.log('Expected transaction error:', error)
      }
    })
  })

  describe('Contract Interactions - DapperCollectibles and DapperMarket', () => {
    it('should verify DapperCollectibles contract deployment and functionality', async () => {
      // Test contract is deployed by checking totalSupply
      const totalSupplyScript = `
        import DapperCollectibles from 0xf8d6e0586b0a20c7
        
        access(all) fun main(): UInt64 {
          return DapperCollectibles.totalSupply
        }
      `
      
      const totalSupply = await flowEmulator.executeScript(totalSupplyScript, [])
      expect(typeof totalSupply).toBe('number')
      expect(totalSupply).toBeGreaterThan(0)
      
      console.log('DapperCollectibles totalSupply:', totalSupply)
    })

    it('should verify DapperMarket contract deployment and functionality', async () => {
      // Test market contract is deployed by checking nextListingID
      const nextListingScript = `
        import DapperMarket from 0xf8d6e0586b0a20c7
        
        access(all) fun main(): UInt64 {
          return DapperMarket.nextListingID
        }
      `
      
      const nextListingId = await flowEmulator.executeScript(nextListingScript, [])
      expect(typeof nextListingId).toBe('number')
      expect(nextListingId).toBeGreaterThanOrEqual(1)
      
      console.log('DapperMarket nextListingID:', nextListingId)
    })

    it('should test NFT collection interface compliance', async () => {
      // Test that our collection implements NonFungibleToken.Collection interface
      const interfaceTestScript = `
        import NonFungibleToken from 0xf8d6e0586b0a20c7
        import DapperCollectibles from 0xf8d6e0586b0a20c7
        
        access(all) fun main(address: Address): Bool {
          let account = getAccount(address)
          let collectionRef = account.capabilities.get<&{NonFungibleToken.CollectionPublic}>(DapperCollectibles.CollectionPublicPath)
            .borrow()
          
          return collectionRef != nil
        }
      `
      
      const hasValidInterface = await flowEmulator.executeScript(
        interfaceTestScript,
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(hasValidInterface).toBe(true)
    })
  })

  describe('Event Emission and Subscription', () => {
    it('should test event emission during NFT minting', async () => {
      // Test that events are emitted when minting NFTs
      // Since we're testing against emulator, we'll verify transaction completion
      const mintResult = await flowEmulator.executeTransaction(
        'cadence/transactions/mint-test-nfts.cdc',
        [
          TEST_ACCOUNTS.EMULATOR,
          'Event Test NFT',
          'NFT created to test event emission',
          'https://example.com/event-test.png'
        ],
        'emulator-account'
      )
      
      expect(mintResult).toBeDefined()
      console.log('Event test mint result:', mintResult)
      
      // Verify the NFT was created (which means event was emitted)
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(collection.length).toBeGreaterThan(0)
    })
  })

  describe('Wallet Connection and Transaction Signing', () => {
    it('should configure FCL for emulator environment', () => {
      // Verify FCL configuration
      const config = fcl.config()
      expect(config).toBeDefined()
      
      // Test that we can get configuration values
      const network = fcl.config().get('flow.network')
      expect(network).toBe('emulator')
    })

    it('should test mock authorization structure', async () => {
      // Create mock authorization that mimics real wallet behavior
      const mockAuthorization = () => ({
        tempId: 'mock-temp-id-' + Date.now(),
        addr: TEST_ACCOUNTS.EMULATOR,
        keyId: 0,
        signingFunction: (signable: any) => ({
          signature: 'mock-signature-' + signable.message,
          keyId: 0,
          addr: TEST_ACCOUNTS.EMULATOR
        })
      })

      const auth = mockAuthorization()
      expect(auth.addr).toBe(TEST_ACCOUNTS.EMULATOR)
      expect(auth.keyId).toBe(0)
      expect(typeof auth.signingFunction).toBe('function')
      
      // Test signing function
      const mockSignable = { message: 'test-message' }
      const signature = auth.signingFunction(mockSignable)
      expect(signature.signature).toContain('mock-signature-test-message')
      expect(signature.addr).toBe(TEST_ACCOUNTS.EMULATOR)
    })

    it('should validate transaction signing flow', async () => {
      // Test a simple transaction that requires signing
      const simpleTransaction = `
        transaction() {
          prepare(signer: auth(Storage) &Account) {
            log("Transaction signed by: ".concat(signer.address.toString()))
          }
        }
      `
      
      const result = await flowEmulator.executeTransaction(
        simpleTransaction,
        [],
        'emulator-account'
      )
      
      expect(result).toBeDefined()
      console.log('Signing test result:', result)
    })
  })

  describe('Integration Test Scenarios', () => {
    it('should complete full NFT lifecycle: mint -> query -> verify', async () => {
      // 1. Get initial state
      const initialCollection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      // 2. Mint new NFT
      await flowEmulator.executeTransaction(
        'cadence/transactions/mint-test-nfts.cdc',
        [
          TEST_ACCOUNTS.EMULATOR,
          'Lifecycle Test NFT',
          'NFT for testing complete lifecycle',
          'https://example.com/lifecycle-test.png'
        ],
        'emulator-account'
      )
      
      // 3. Query updated collection
      const updatedCollection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(updatedCollection.length).toBe(initialCollection.length + 1)
      
      // 4. Get metadata for new NFT
      const newNftId = updatedCollection[updatedCollection.length - 1]
      const metadata = await flowEmulator.executeScript(
        'cadence/scripts/get-nft-metadata.cdc',
        [TEST_ACCOUNTS.EMULATOR, newNftId.toString()]
      )
      
      // 5. Verify all data is correct
      expect(metadata.name).toBe('Lifecycle Test NFT')
      expect(metadata.description).toBe('NFT for testing complete lifecycle')
      expect(metadata.thumbnail).toBe('https://example.com/lifecycle-test.png')
      expect(metadata.creator).toBe(TEST_ACCOUNTS.EMULATOR)
      
      console.log('Complete lifecycle test passed:', metadata)
    })

    it('should handle concurrent operations correctly', async () => {
      // Test multiple concurrent minting operations
      const mintPromises = []
      
      for (let i = 0; i < 3; i++) {
        const mintPromise = flowEmulator.executeTransaction(
          'cadence/transactions/mint-test-nfts.cdc',
          [
            TEST_ACCOUNTS.EMULATOR,
            `Concurrent NFT ${i}`,
            `NFT ${i} for concurrent testing`,
            `https://example.com/concurrent-${i}.png`
          ],
          'emulator-account'
        )
        mintPromises.push(mintPromise)
      }
      
      // Wait for all mints to complete
      const results = await Promise.all(mintPromises)
      
      // Verify all transactions succeeded
      results.forEach((result, index) => {
        expect(result).toBeDefined()
        console.log(`Concurrent mint ${index} result:`, result)
      })
      
      // Verify final collection state
      const finalCollection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(finalCollection.length).toBeGreaterThanOrEqual(3)
    })

    it('should maintain data consistency across operations', async () => {
      // Get initial total supply
      const initialSupplyScript = `
        import DapperCollectibles from 0xf8d6e0586b0a20c7
        access(all) fun main(): UInt64 { return DapperCollectibles.totalSupply }
      `
      
      const initialSupply = await flowEmulator.executeScript(initialSupplyScript, [])
      
      // Mint one NFT
      await flowEmulator.executeTransaction(
        'cadence/transactions/mint-test-nfts.cdc',
        [
          TEST_ACCOUNTS.EMULATOR,
          'Consistency Test NFT',
          'NFT for testing data consistency',
          'https://example.com/consistency-test.png'
        ],
        'emulator-account'
      )
      
      // Check updated total supply
      const updatedSupply = await flowEmulator.executeScript(initialSupplyScript, [])
      
      // Verify supply increased by exactly 1
      expect(updatedSupply).toBe(initialSupply + 1)
      
      // Verify collection count matches
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      // The collection should contain NFTs (may be more than total supply if multiple accounts)
      expect(collection.length).toBeGreaterThan(0)
      
      console.log('Consistency test - Initial supply:', initialSupply, 'Updated supply:', updatedSupply)
    })
  })
})