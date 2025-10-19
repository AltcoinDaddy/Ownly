import { chromium, FullConfig } from '@playwright/test'
import { execSync } from 'child_process'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')
  
  try {
    // Wait for Flow emulator to be ready
    console.log('⏳ Waiting for Flow emulator to start...')
    await waitForEmulator()
    
    // Deploy contracts to emulator
    console.log('📦 Deploying contracts to Flow emulator...')
    execSync('flow project deploy --network emulator', { 
      stdio: 'inherit',
      timeout: 30000 
    })
    
    // Setup test accounts
    console.log('👥 Setting up test accounts...')
    execSync('flow transactions send scripts/setup-test-accounts.cdc --network emulator --signer emulator-account', { 
      stdio: 'inherit',
      timeout: 30000 
    })
    
    // Mint some test NFTs for testing
    console.log('🎨 Minting test NFTs...')
    execSync('flow transactions send scripts/mint-test-nfts.cdc --network emulator --signer emulator-account', { 
      stdio: 'inherit',
      timeout: 30000 
    })
    
    console.log('✅ E2E test setup completed successfully')
  } catch (error) {
    console.error('❌ E2E test setup failed:', error)
    throw error
  }
}

async function waitForEmulator(maxRetries = 30, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:8080/v1/blocks?height=sealed')
      if (response.ok) {
        console.log('✅ Flow emulator is ready')
        return
      }
    } catch (error) {
      // Emulator not ready yet
    }
    
    console.log(`⏳ Waiting for emulator... (${i + 1}/${maxRetries})`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  throw new Error('Flow emulator failed to start within timeout period')
}

export default globalSetup