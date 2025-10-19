import { test, expect } from '@playwright/test'
import { FlowTestHelpers } from './utils/flow-helpers'
import { TEST_NFT_METADATA, MOCK_API_RESPONSES, MOCK_IPFS_RESPONSE } from './utils/test-data'

test.describe('NFT Minting Journey', () => {
  let flowHelpers: FlowTestHelpers

  test.beforeEach(async ({ page }) => {
    flowHelpers = new FlowTestHelpers(page)
    
    // Mock API responses
    await page.route('**/api/nft/mint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSES.mint.success),
      })
    })
    
    // Mock IPFS upload
    await page.route('**/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_IPFS_RESPONSE),
      })
    })
    
    await page.goto('/')
  })

  test('should complete full minting workflow from wallet connection to success', async ({ page }) => {
    // Step 1: Connect wallet
    await flowHelpers.connectWallet('alice')
    
    // Step 2: Navigate to mint page
    await page.click('a[href="/mint"]')
    await page.waitForURL('/mint')
    
    // Step 3: Fill out minting form
    await page.fill('[data-testid="nft-name-input"]', TEST_NFT_METADATA.basic.name)
    await page.fill('[data-testid="nft-description-input"]', TEST_NFT_METADATA.basic.description)
    await page.selectOption('[data-testid="nft-category-select"]', TEST_NFT_METADATA.basic.category)
    
    // Step 4: Upload image (mock file upload)
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'test-nft.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data'),
    })
    
    // Step 5: Submit minting form
    await page.click('[data-testid="mint-nft-button"]')
    
    // Step 6: Verify loading state
    await expect(page.locator('[data-testid="minting-progress"]')).toBeVisible()
    
    // Step 7: Wait for transaction completion
    await flowHelpers.waitForTransaction()
    
    // Step 8: Verify success state
    await expect(page.locator('[data-testid="mint-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="mint-success"]')).toContainText('NFT minted successfully')
    
    // Step 9: Verify redirect to profile/gallery
    await page.click('[data-testid="view-nft-button"]')
    await page.waitForURL('/profile')
    
    // Step 10: Verify NFT appears in gallery
    await flowHelpers.waitForNFTGallery()
    const nftCount = await flowHelpers.getNFTCount()
    expect(nftCount).toBeGreaterThan(0)
  })

  test('should handle minting form validation', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/mint')
    
    // Try to submit empty form
    await page.click('[data-testid="mint-nft-button"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="image-error"]')).toBeVisible()
    
    // Fill name only
    await page.fill('[data-testid="nft-name-input"]', 'Test NFT')
    
    // Verify partial validation
    await expect(page.locator('[data-testid="name-error"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible()
  })

  test('should handle minting API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/nft/mint', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSES.mint.error),
      })
    })
    
    await flowHelpers.connectWallet('alice')
    await page.goto('/mint')
    
    // Fill and submit form
    await page.fill('[data-testid="nft-name-input"]', TEST_NFT_METADATA.basic.name)
    await page.fill('[data-testid="nft-description-input"]', TEST_NFT_METADATA.basic.description)
    await page.selectOption('[data-testid="nft-category-select"]', TEST_NFT_METADATA.basic.category)
    
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'test-nft.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data'),
    })
    
    await page.click('[data-testid="mint-nft-button"]')
    
    // Verify error handling
    await expect(page.locator('[data-testid="mint-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="mint-error"]')).toContainText('Minting failed')
    
    // Verify retry button is available
    await expect(page.locator('[data-testid="retry-mint-button"]')).toBeVisible()
  })

  test('should prevent minting without wallet connection', async ({ page }) => {
    await page.goto('/mint')
    
    // Verify wallet connection prompt
    await expect(page.locator('[data-testid="connect-wallet-prompt"]')).toBeVisible()
    await expect(page.locator('[data-testid="mint-form"]')).not.toBeVisible()
    
    // Connect wallet and verify form appears
    await flowHelpers.connectWallet('alice')
    await expect(page.locator('[data-testid="mint-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="connect-wallet-prompt"]')).not.toBeVisible()
  })

  test('should handle file upload validation', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/mint')
    
    // Try to upload invalid file type
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    })
    
    // Verify file type validation
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    
    // Try to upload file that's too large (mock)
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="nft-image-input"]') as HTMLInputElement
      if (input) {
        // Mock file size validation
        Object.defineProperty(input.files?.[0] || {}, 'size', { value: 10 * 1024 * 1024 }) // 10MB
      }
    })
    
    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
  })

  test('should show real-time minting progress', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/mint')
    
    // Fill form
    await page.fill('[data-testid="nft-name-input"]', TEST_NFT_METADATA.basic.name)
    await page.fill('[data-testid="nft-description-input"]', TEST_NFT_METADATA.basic.description)
    await page.selectOption('[data-testid="nft-category-select"]', TEST_NFT_METADATA.basic.category)
    
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'test-nft.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data'),
    })
    
    // Submit form
    await page.click('[data-testid="mint-nft-button"]')
    
    // Verify progress indicators
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="transaction-progress"]')).toBeVisible()
    
    // Verify progress text updates
    await expect(page.locator('[data-testid="progress-text"]')).toContainText('Uploading to IPFS')
    
    // Wait for completion
    await flowHelpers.waitForTransaction()
    
    await expect(page.locator('[data-testid="progress-text"]')).toContainText('Minting complete')
  })
})