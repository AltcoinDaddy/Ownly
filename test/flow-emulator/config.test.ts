import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Flow Configuration Tests', () => {
  it('should have valid flow.json configuration', () => {
    const flowConfigPath = resolve(process.cwd(), 'flow.json')
    const flowConfig = JSON.parse(readFileSync(flowConfigPath, 'utf8'))
    
    // Verify basic structure
    expect(flowConfig.contracts).toBeDefined()
    expect(flowConfig.dependencies).toBeDefined()
    expect(flowConfig.networks).toBeDefined()
    expect(flowConfig.accounts).toBeDefined()
    
    // Verify our custom contracts are defined
    expect(flowConfig.contracts.DapperCollectibles).toBeDefined()
    expect(flowConfig.contracts.DapperMarket).toBeDefined()
    
    // Verify dependencies include standard contracts
    expect(flowConfig.dependencies.NonFungibleToken).toBeDefined()
    expect(flowConfig.dependencies.MetadataViews).toBeDefined()
    expect(flowConfig.dependencies.ViewResolver).toBeDefined()
    
    // Verify accounts are defined
    expect(flowConfig.accounts['emulator-account']).toBeDefined()
    
    // Verify networks
    expect(flowConfig.networks.emulator).toBeDefined()
  })

  it('should have valid contract files', () => {
    const contractFiles = [
      'cadence/contracts/MetadataViews.cdc', 
      'cadence/contracts/DapperCollectibles.cdc',
      'cadence/contracts/DapperMarket.cdc'
    ]
    
    contractFiles.forEach(file => {
      const contractPath = resolve(process.cwd(), file)
      const contractContent = readFileSync(contractPath, 'utf8')
      
      // Basic validation - should contain contract keyword
      expect(contractContent).toContain('contract')
      expect(contractContent.length).toBeGreaterThan(0)
    })
  })

  it('should have valid script files', () => {
    const scriptFiles = [
      'cadence/transactions/setup-test-accounts.cdc',
      'cadence/transactions/mint-test-nfts.cdc',
      'cadence/scripts/get-collection.cdc',
      'cadence/scripts/get-nft-metadata.cdc'
    ]
    
    scriptFiles.forEach(file => {
      const scriptPath = resolve(process.cwd(), file)
      const scriptContent = readFileSync(scriptPath, 'utf8')
      
      // Basic validation - should contain import statements
      expect(scriptContent).toContain('import')
      expect(scriptContent.length).toBeGreaterThan(0)
    })
  })
})