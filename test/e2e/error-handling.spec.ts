import { test, expect } from '@playwright/test'
import { FlowTestHelpers, TEST_WALLETS } from './utils/flow-helpers'

test.describe('Error Handling and Retry Mechanisms', () => {
  let flowHelpers: FlowTestHelpers

  test.beforeEach(async ({ page }) => {
    flowHelpers = new FlowTestHelpers(page)
    await page.goto('/')
  })

  test('should handle network connectivity issues gracefully', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock network failure
    await page.route('**/*', async (route) => {
      if (route.request().url().includes('/api/')) {
        await route.abort('failed')
      } else {
        await route.continue()
      }
    })
    
    // Navigate to profile (should trigger API call)
    await page.goto('/profile')
    
    // Verify network error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network connection failed')
    
    // Verify retry button is available
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    
    // Restore network and test retry
    await page.unroute('**/*')
    
    // Mock successful API response
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ nfts: [] }),
      })
    })
    
    // Click retry
    await page.click('[data-testid="retry-button"]')
    
    // Verify error is cleared and content loads
    await expect(page.locator('[data-testid="network-error"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="nft-gallery"]')).toBeVisible()
  })

  test('should handle API rate limiting with exponential backoff', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    let requestCount = 0
    
    // Mock rate limiting
    await page.route('**/api/nft/mint', async (route) => {
      requestCount++
      
      if (requestCount <= 2) {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            retry_after: 2,
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            nft_id: 'success-after-retry',
            status: 'completed',
          }),
        })
      }
    })
    
    // Navigate to mint page and submit form
    await page.goto('/mint')
    await page.fill('[data-testid="nft-name-input"]', 'Rate Limited NFT')
    await page.fill('[data-testid="nft-description-input"]', 'Testing rate limits')
    
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image'),
    })
    
    await page.click('[data-testid="mint-nft-button"]')
    
    // Verify rate limit error is shown
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('Rate limit exceeded')
    
    // Verify automatic retry countdown
    await expect(page.locator('[data-testid="retry-countdown"]')).toBeVisible()
    
    // Wait for automatic retry (should succeed on 3rd attempt)
    await page.waitForTimeout(3000)
    
    // Verify success after retry
    await expect(page.locator('[data-testid="mint-success"]')).toBeVisible()
    expect(requestCount).toBe(3) // Should have made 3 requests
  })

  test('should handle Flow blockchain transaction failures', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock transaction failure
    await page.addInitScript(() => {
      window.fcl = {
        ...window.fcl,
        mutate: async () => {
          throw new Error('Transaction failed: insufficient gas')
        },
      }
    })
    
    // Mock successful API but failing transaction
    await page.route('**/api/nft/mint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nft_id: 'pending-tx',
          transaction_hash: 'failed-tx-hash',
          status: 'pending',
        }),
      })
    })
    
    await page.goto('/mint')
    
    // Fill and submit form
    await page.fill('[data-testid="nft-name-input"]', 'Failed Transaction NFT')
    await page.fill('[data-testid="nft-description-input"]', 'Testing transaction failure')
    
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image'),
    })
    
    await page.click('[data-testid="mint-nft-button"]')
    
    // Verify transaction error handling
    await expect(page.locator('[data-testid="transaction-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="transaction-error"]')).toContainText('Transaction failed')
    
    // Verify helpful error message
    await expect(page.locator('[data-testid="gas-error-help"]')).toBeVisible()
    await expect(page.locator('[data-testid="gas-error-help"]')).toContainText('insufficient gas')
    
    // Verify retry option
    await expect(page.locator('[data-testid="retry-transaction-button"]')).toBeVisible()
  })

  test('should handle wallet disconnection during operations', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/mint')
    
    // Fill form partially
    await page.fill('[data-testid="nft-name-input"]', 'Disconnected Wallet NFT')
    
    // Simulate wallet disconnection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wallet-disconnected'))
    })
    
    // Verify wallet disconnection handling
    await expect(page.locator('[data-testid="wallet-disconnected-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="wallet-disconnected-error"]')).toContainText('Wallet disconnected')
    
    // Verify form is disabled
    await expect(page.locator('[data-testid="mint-nft-button"]')).toBeDisabled()
    
    // Verify reconnect option
    await expect(page.locator('[data-testid="reconnect-wallet-button"]')).toBeVisible()
    
    // Test reconnection
    await page.click('[data-testid="reconnect-wallet-button"]')
    
    // Mock successful reconnection
    await flowHelpers.connectWallet('alice')
    
    // Verify form is re-enabled and data is preserved
    await expect(page.locator('[data-testid="mint-nft-button"]')).toBeEnabled()
    await expect(page.locator('[data-testid="nft-name-input"]')).toHaveValue('Disconnected Wallet NFT')
  })

  test('should handle IPFS upload failures with fallback', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    let uploadAttempts = 0
    
    // Mock IPFS upload failures then success
    await page.route('**/upload', async (route) => {
      uploadAttempts++
      
      if (uploadAttempts <= 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'IPFS upload failed',
            message: 'Gateway timeout',
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'https://ipfs.io/ipfs/success-hash',
            cid: 'success-hash',
          }),
        })
      }
    })
    
    await page.goto('/mint')
    
    // Fill form and upload file
    await page.fill('[data-testid="nft-name-input"]', 'IPFS Retry NFT')
    await page.fill('[data-testid="nft-description-input"]', 'Testing IPFS retry')
    
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image'),
    })
    
    // Verify upload error and retry
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('Upload failed')
    
    // Verify automatic retry
    await expect(page.locator('[data-testid="upload-retry-progress"]')).toBeVisible()
    
    // Wait for successful retry
    await page.waitForTimeout(3000)
    
    // Verify upload success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible()
    expect(uploadAttempts).toBe(3) // Should have retried twice
  })

  test('should handle concurrent operation conflicts', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock user NFTs
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nfts: [
            {
              id: 'concurrent-nft',
              name: 'Concurrent Test NFT',
              owner: TEST_WALLETS.alice.address,
            },
          ],
        }),
      })
    })
    
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Open NFT details
    await flowHelpers.clickNFT(0)
    
    // Try to perform multiple operations simultaneously
    const transferPromise = page.click('[data-testid="transfer-nft-button"]')
    const listPromise = page.click('[data-testid="list-for-sale-button"]')
    
    await Promise.all([transferPromise, listPromise])
    
    // Verify conflict handling
    await expect(page.locator('[data-testid="operation-conflict-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="operation-conflict-error"]')).toContainText('Another operation is in progress')
    
    // Verify only one modal is open
    const modalCount = await page.locator('[data-testid="modal"]').count()
    expect(modalCount).toBeLessThanOrEqual(1)
  })

  test('should handle session timeout and re-authentication', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock session timeout
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Session expired',
          message: 'Please reconnect your wallet',
        }),
      })
    })
    
    await page.goto('/profile')
    
    // Verify session timeout handling
    await expect(page.locator('[data-testid="session-expired-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="session-expired-error"]')).toContainText('Session expired')
    
    // Verify automatic redirect to re-authentication
    await expect(page.locator('[data-testid="reauthenticate-button"]')).toBeVisible()
    
    // Test re-authentication
    await page.click('[data-testid="reauthenticate-button"]')
    
    // Mock successful re-authentication
    await page.unroute('**/api/**')
    await flowHelpers.connectWallet('alice')
    
    // Verify session is restored
    await expect(page.locator('[data-testid="session-expired-error"]')).not.toBeVisible()
  })

  test('should provide helpful error messages for common issues', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Test insufficient balance error
    await page.route('**/api/marketplace/buy', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Insufficient balance',
          balance: '2.5',
          required: '10.0',
        }),
      })
    })
    
    await page.goto('/marketplace')
    
    // Mock marketplace data
    await page.route('**/api/marketplace', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [
            {
              id: 'expensive-nft',
              name: 'Expensive NFT',
              price: '10.0',
              currency: 'FLOW',
            },
          ],
        }),
      })
    })
    
    await flowHelpers.waitForMarketplace()
    
    // Try to buy expensive NFT
    await page.click('[data-testid="marketplace-nft-card"]:first-child')
    await page.click('[data-testid="buy-now-button"]')
    await page.click('[data-testid="confirm-purchase-button"]')
    
    // Verify helpful error message
    await expect(page.locator('[data-testid="insufficient-balance-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="insufficient-balance-error"]')).toContainText('Insufficient balance')
    await expect(page.locator('[data-testid="balance-info"]')).toContainText('Current: 2.5 FLOW')
    await expect(page.locator('[data-testid="balance-info"]')).toContainText('Required: 10.0 FLOW')
    
    // Verify helpful actions
    await expect(page.locator('[data-testid="add-funds-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="view-cheaper-nfts-button"]')).toBeVisible()
  })

  test('should handle browser compatibility issues', async ({ page }) => {
    // Mock unsupported browser features
    await page.addInitScript(() => {
      // Remove WebAssembly support to simulate older browser
      delete (window as any).WebAssembly
      
      // Mock missing APIs
      delete (window as any).crypto.subtle
    })
    
    await page.goto('/')
    
    // Verify browser compatibility warning
    await expect(page.locator('[data-testid="browser-compatibility-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="browser-compatibility-warning"]')).toContainText('Browser not fully supported')
    
    // Verify fallback functionality is offered
    await expect(page.locator('[data-testid="fallback-mode-button"]')).toBeVisible()
    
    // Test fallback mode
    await page.click('[data-testid="fallback-mode-button"]')
    
    // Verify limited functionality warning
    await expect(page.locator('[data-testid="limited-functionality-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="limited-functionality-warning"]')).toContainText('Some features may be limited')
  })
})