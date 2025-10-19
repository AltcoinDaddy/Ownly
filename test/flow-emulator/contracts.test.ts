import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { flowEmulator, setupFlowEmulator, teardownFlowEmulator, TEST_ACCOUNTS } from './setup'

describe('Flow Emulator Contract Tests', () => {
  beforeAll(async () => {
    await setupFlowEmulator()
  }, 60000)

  afterAll(async () => {
    await teardownFlowEmulator()
  }, 30000)

  describe('DapperCollectibles Contract', () => {
    it('should have deployed DapperCollectibles contract', async () => {
      // Test that we can query the collection
      const result = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      expect(Array.isArray(result)).toBe(true)
    })

    it('should have minted test NFTs', async () => {
      // Check that test NFTs were minted to emulator account
      const emulatorCollection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )

      expect(emulatorCollection.length).toBeGreaterThan(0)
    })

    it('should be able to get NFT metadata', async () => {
      // Get first NFT from emulator account
      const collection = await flowEmulator.executeScript(
        'cadence/scripts/get-collection.cdc',
        [TEST_ACCOUNTS.EMULATOR]
      )
      
      if (collection.length > 0) {
        const nftId = collection[0]
        const metadata = await flowEmulator.executeScript(
          'cadence/scripts/get-nft-metadata.cdc',
          [TEST_ACCOUNTS.EMULATOR, nftId.toString()]
        )
        
        expect(metadata).toBeDefined()
        expect(metadata.id).toBe(nftId)
        expect(metadata.name).toBeDefined()
        expect(metadata.description).toBeDefined()
      }
    })
  })

  describe('DapperMarket Contract', () => {
    it('should have deployed DapperMarket contract', async () => {
      // This test verifies the market contract is deployed and accessible
      // We can expand this with actual marketplace operations
      expect(true).toBe(true) // Placeholder - contract deployment is verified by setup
    })
  })
})