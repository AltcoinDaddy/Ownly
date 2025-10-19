import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')
  
  try {
    // Clean up any test data or state if needed
    // The Flow emulator will be stopped automatically by the webServer config
    
    console.log('✅ E2E test cleanup completed')
  } catch (error) {
    console.error('❌ E2E test cleanup failed:', error)
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown