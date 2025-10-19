import { test, expect } from '@playwright/test'
import { FlowTestHelpers, TEST_WALLETS } from './utils/flow-helpers'
import { TEST_TRANSFER_DATA, MOCK_API_RESPONSES } from './utils/test-data'

test.describe('NFT Transfer Journey', () => {
  let flowHelpers: FlowTestHelpers

  test.beforeEach(async ({ page }) => {
    flowHelpers = new FlowTestHelpers(page)
    
    // Mock transfer API
    await page.route('**/api/nft/transfer', async (route) => {
      const request = route.request()
      const body = JSON.parse(request.postData() || '{}')
      
      if (body.to_address === TEST_TRANSFER_DATA.invalidAddress) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_API_RESPONSES.transfer.error),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_API_RESPONSES.transfer.success),
        })
      }
    })
    
    // Mock user NFTs API
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nfts: [
            {
              id: 'test-nft-1',
              name: 'Test NFT #1',
              image: 'https://via.placeholder.com/400x400',
              owner: TEST_WALLETS.alice.address,
            },
            {
              id: 'test-nft-2', 
              name: 'Test NFT #2',
              image: 'https://via.placeholder.com/400x400',
              owner: TEST_WALLETS.alice.address,
            },
          ],
        }),
      })
    })
    
    await page.goto('/')
  })

  test('should complete full NFT transfer workflow between users', async ({ page }) => {
    // Step 1: Connect Alice's wallet
    await flowHelpers.connectWallet('alice')
    
    // Step 2: Navigate to profile to see owned NFTs
    await page.click('a[href="/profile"]')
    await page.waitForURL('/profile')
    
    // Step 3: Wait for NFT gallery to load
    await flowHelpers.waitForNFTGallery()
    
    // Step 4: Click on first NFT to open details
    await flowHelpers.clickNFT(0)
    
    // Step 5: Click transfer button
    await page.click('[data-testid="transfer-nft-button"]')
    
    // Step 6: Verify transfer modal opens
    await expect(page.locator('[data-testid="transfer-modal"]')).toBeVisible()
    
    // Step 7: Enter recipient address
    await page.fill('[data-testid="recipient-address-input"]', TEST_TRANSFER_DATA.validAddress)
    
    // Step 8: Verify address validation (should be valid)
    await expect(page.locator('[data-testid="address-validation-success"]')).toBeVisible()
    
    // Step 9: Click confirm transfer
    await page.click('[data-testid="confirm-transfer-button"]')
    
    // Step 10: Verify transaction progress
    await expect(page.locator('[data-testid="transfer-progress"]')).toBeVisible()
    
    // Step 11: Wait for transaction completion
    await flowHelpers.waitForTransaction()
    
    // Step 12: Verify success message
    await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="transfer-success"]')).toContainText('Transfer completed')
    
    // Step 13: Verify modal closes and gallery updates
    await expect(page.locator('[data-testid="transfer-modal"]')).not.toBeVisible()
    
    // Step 14: Mock real-time event to update UI
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'test-nft-1',
      from: TEST_WALLETS.alice.address,
      to: TEST_TRANSFER_DATA.validAddress,
    })
    
    // Step 15: Verify NFT is removed from Alice's gallery (real-time update)
    await page.waitForTimeout(1000) // Allow time for event processing
    const updatedNFTCount = await flowHelpers.getNFTCount()
    expect(updatedNFTCount).toBeLessThan(2) // Should have one less NFT
  })

  test('should validate recipient address format', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Open transfer modal
    await flowHelpers.clickNFT(0)
    await page.click('[data-testid="transfer-nft-button"]')
    
    // Test invalid address
    await page.fill('[data-testid="recipient-address-input"]', TEST_TRANSFER_DATA.invalidAddress)
    
    // Verify validation error
    await expect(page.locator('[data-testid="address-validation-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-transfer-button"]')).toBeDisabled()
    
    // Test valid address
    await page.fill('[data-testid="recipient-address-input"]', TEST_TRANSFER_DATA.validAddress)
    
    // Verify validation success
    await expect(page.locator('[data-testid="address-validation-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-transfer-button"]')).toBeEnabled()
  })

  test('should handle transfer API errors gracefully', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Open transfer modal
    await flowHelpers.clickNFT(0)
    await page.click('[data-testid="transfer-nft-button"]')
    
    // Enter invalid address to trigger API error
    await page.fill('[data-testid="recipient-address-input"]', TEST_TRANSFER_DATA.invalidAddress)
    await page.click('[data-testid="confirm-transfer-button"]')
    
    // Verify error handling
    await expect(page.locator('[data-testid="transfer-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="transfer-error"]')).toContainText('Transfer failed')
    
    // Verify retry option
    await expect(page.locator('[data-testid="retry-transfer-button"]')).toBeVisible()
    
    // Test retry functionality
    await page.fill('[data-testid="recipient-address-input"]', TEST_TRANSFER_DATA.validAddress)
    await page.click('[data-testid="retry-transfer-button"]')
    
    await flowHelpers.waitForTransaction()
    await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible()
  })

  test('should prevent self-transfer', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Open transfer modal
    await flowHelpers.clickNFT(0)
    await page.click('[data-testid="transfer-nft-button"]')
    
    // Try to transfer to own address
    await page.fill('[data-testid="recipient-address-input"]', TEST_WALLETS.alice.address)
    
    // Verify self-transfer prevention
    await expect(page.locator('[data-testid="self-transfer-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-transfer-button"]')).toBeDisabled()
  })

  test('should show real-time UI updates when receiving NFT', async ({ page }) => {
    // Connect Bob's wallet (recipient)
    await flowHelpers.connectWallet('bob')
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Get initial NFT count
    const initialCount = await flowHelpers.getNFTCount()
    
    // Mock receiving an NFT transfer event
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'test-nft-received',
      from: TEST_WALLETS.alice.address,
      to: TEST_WALLETS.bob.address,
      nft_data: {
        id: 'test-nft-received',
        name: 'Received NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Verify real-time notification
    await expect(page.locator('[data-testid="nft-received-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="nft-received-notification"]')).toContainText('You received a new NFT')
    
    // Verify gallery updates automatically
    await page.waitForTimeout(2000) // Allow time for UI update
    const updatedCount = await flowHelpers.getNFTCount()
    expect(updatedCount).toBeGreaterThan(initialCount)
  })

  test('should handle transfer confirmation dialog', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Open transfer modal
    await flowHelpers.clickNFT(0)
    await page.click('[data-testid="transfer-nft-button"]')
    
    // Fill recipient address
    await page.fill('[data-testid="recipient-address-input"]', TEST_TRANSFER_DATA.validAddress)
    
    // Click confirm - should show confirmation dialog
    await page.click('[data-testid="confirm-transfer-button"]')
    
    // Verify confirmation dialog
    await expect(page.locator('[data-testid="transfer-confirmation-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="transfer-confirmation-dialog"]')).toContainText('Are you sure')
    
    // Test cancel
    await page.click('[data-testid="cancel-transfer-button"]')
    await expect(page.locator('[data-testid="transfer-confirmation-dialog"]')).not.toBeVisible()
    
    // Test confirm
    await page.click('[data-testid="confirm-transfer-button"]')
    await page.click('[data-testid="final-confirm-transfer-button"]')
    
    await flowHelpers.waitForTransaction()
    await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible()
  })

  test('should handle wallet disconnection during transfer', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Open transfer modal
    await flowHelpers.clickNFT(0)
    await page.click('[data-testid="transfer-nft-button"]')
    
    // Fill form
    await page.fill('[data-testid="recipient-address-input"]', TEST_TRANSFER_DATA.validAddress)
    
    // Disconnect wallet
    await flowHelpers.disconnectWallet()
    
    // Verify modal closes and user is redirected
    await expect(page.locator('[data-testid="transfer-modal"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="wallet-required-message"]')).toBeVisible()
  })
})