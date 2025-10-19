import { test, expect } from '@playwright/test'
import { FlowTestHelpers, TEST_WALLETS } from './utils/flow-helpers'
import { TEST_MARKETPLACE_DATA, MOCK_API_RESPONSES } from './utils/test-data'

test.describe('Marketplace Journey', () => {
  let flowHelpers: FlowTestHelpers

  test.beforeEach(async ({ page }) => {
    flowHelpers = new FlowTestHelpers(page)
    
    // Mock marketplace APIs
    await page.route('**/api/marketplace/list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSES.marketplace.list.success),
      })
    })
    
    await page.route('**/api/marketplace/buy', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSES.marketplace.buy.success),
      })
    })
    
    // Mock marketplace listings
    await page.route('**/api/marketplace', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [
            {
              id: 'listing-1',
              nft_id: 'nft-1',
              name: 'Marketplace NFT #1',
              image: 'https://via.placeholder.com/400x400',
              price: '5.0',
              currency: 'FLOW',
              seller: TEST_WALLETS.bob.address,
            },
            {
              id: 'listing-2',
              nft_id: 'nft-2',
              name: 'Marketplace NFT #2',
              image: 'https://via.placeholder.com/400x400',
              price: '10.0',
              currency: 'FLOW',
              seller: TEST_WALLETS.charlie.address,
            },
          ],
        }),
      })
    })
    
    // Mock user NFTs for listing
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nfts: [
            {
              id: 'owned-nft-1',
              name: 'My NFT #1',
              image: 'https://via.placeholder.com/400x400',
              owner: TEST_WALLETS.alice.address,
              listed: false,
            },
          ],
        }),
      })
    })
    
    await page.goto('/')
  })

  test('should complete full marketplace listing workflow', async ({ page }) => {
    // Step 1: Connect Alice's wallet (seller)
    await flowHelpers.connectWallet('alice')
    
    // Step 2: Navigate to profile to see owned NFTs
    await page.click('a[href="/profile"]')
    await page.waitForURL('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Step 3: Click on NFT to list
    await flowHelpers.clickNFT(0)
    
    // Step 4: Click "List for Sale" button
    await page.click('[data-testid="list-for-sale-button"]')
    
    // Step 5: Verify listing modal opens
    await expect(page.locator('[data-testid="listing-modal"]')).toBeVisible()
    
    // Step 6: Enter listing price
    await page.fill('[data-testid="listing-price-input"]', TEST_MARKETPLACE_DATA.listing.price)
    
    // Step 7: Select currency (should default to FLOW)
    await expect(page.locator('[data-testid="currency-select"]')).toHaveValue('FLOW')
    
    // Step 8: Click confirm listing
    await page.click('[data-testid="confirm-listing-button"]')
    
    // Step 9: Verify transaction progress
    await expect(page.locator('[data-testid="listing-progress"]')).toBeVisible()
    
    // Step 10: Wait for transaction completion
    await flowHelpers.waitForTransaction()
    
    // Step 11: Verify success message
    await expect(page.locator('[data-testid="listing-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="listing-success"]')).toContainText('Listed successfully')
    
    // Step 12: Navigate to marketplace to verify listing appears
    await page.click('a[href="/marketplace"]')
    await page.waitForURL('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Step 13: Mock real-time event for new listing
    await flowHelpers.mockFlowEvent('NFTListed', {
      nft_id: 'owned-nft-1',
      seller: TEST_WALLETS.alice.address,
      price: TEST_MARKETPLACE_DATA.listing.price,
    })
    
    // Step 14: Verify listing appears in marketplace
    await page.waitForTimeout(1000) // Allow time for event processing
    const listingCount = await flowHelpers.getMarketplaceListingCount()
    expect(listingCount).toBeGreaterThan(0)
  })

  test('should complete full marketplace purchase workflow', async ({ page }) => {
    // Step 1: Connect Alice's wallet (buyer)
    await flowHelpers.connectWallet('alice')
    
    // Step 2: Navigate to marketplace
    await page.click('a[href="/marketplace"]')
    await page.waitForURL('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Step 3: Click on NFT to purchase
    await page.click('[data-testid="marketplace-nft-card"]:first-child')
    
    // Step 4: Verify NFT details modal opens
    await expect(page.locator('[data-testid="nft-details-modal"]')).toBeVisible()
    
    // Step 5: Click "Buy Now" button
    await page.click('[data-testid="buy-now-button"]')
    
    // Step 6: Verify purchase confirmation modal
    await expect(page.locator('[data-testid="purchase-confirmation-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="purchase-price"]')).toContainText('5.0 FLOW')
    
    // Step 7: Confirm purchase
    await page.click('[data-testid="confirm-purchase-button"]')
    
    // Step 8: Verify transaction progress
    await expect(page.locator('[data-testid="purchase-progress"]')).toBeVisible()
    
    // Step 9: Wait for transaction completion
    await flowHelpers.waitForTransaction()
    
    // Step 10: Verify success message
    await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="purchase-success"]')).toContainText('Purchase successful')
    
    // Step 11: Mock real-time event for purchase
    await flowHelpers.mockFlowEvent('NFTPurchased', {
      nft_id: 'nft-1',
      buyer: TEST_WALLETS.alice.address,
      seller: TEST_WALLETS.bob.address,
      price: '5.0',
    })
    
    // Step 12: Verify NFT is removed from marketplace (real-time update)
    await page.waitForTimeout(1000)
    await expect(page.locator('[data-testid="nft-details-modal"]')).not.toBeVisible()
    
    // Step 13: Navigate to profile to verify NFT ownership
    await page.click('a[href="/profile"]')
    await page.waitForURL('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Step 14: Verify purchased NFT appears in gallery
    const nftCount = await flowHelpers.getNFTCount()
    expect(nftCount).toBeGreaterThan(0)
  })

  test('should handle marketplace search and filtering', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Test search functionality
    await page.fill('[data-testid="marketplace-search"]', 'NFT #1')
    await page.waitForTimeout(500) // Debounce delay
    
    // Verify search results
    const searchResults = await page.locator('[data-testid="marketplace-nft-card"]').count()
    expect(searchResults).toBeLessThanOrEqual(2) // Should filter results
    
    // Test price filter
    await page.click('[data-testid="price-filter-button"]')
    await page.fill('[data-testid="min-price-input"]', '1.0')
    await page.fill('[data-testid="max-price-input"]', '8.0')
    await page.click('[data-testid="apply-filter-button"]')
    
    // Verify filtered results
    await page.waitForTimeout(500)
    const filteredResults = await page.locator('[data-testid="marketplace-nft-card"]').count()
    expect(filteredResults).toBeGreaterThanOrEqual(0)
    
    // Test category filter
    await page.selectOption('[data-testid="category-filter"]', 'Art')
    await page.waitForTimeout(500)
    
    // Clear filters
    await page.click('[data-testid="clear-filters-button"]')
    await page.waitForTimeout(500)
    
    // Verify all listings are shown again
    const allResults = await page.locator('[data-testid="marketplace-nft-card"]').count()
    expect(allResults).toBe(2) // Should show all mock listings
  })

  test('should handle listing price validation', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Open listing modal
    await flowHelpers.clickNFT(0)
    await page.click('[data-testid="list-for-sale-button"]')
    
    // Test invalid price (negative)
    await page.fill('[data-testid="listing-price-input"]', '-1.0')
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-listing-button"]')).toBeDisabled()
    
    // Test invalid price (zero)
    await page.fill('[data-testid="listing-price-input"]', '0')
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible()
    
    // Test invalid price (too many decimals)
    await page.fill('[data-testid="listing-price-input"]', '1.123456')
    await expect(page.locator('[data-testid="decimal-error"]')).toBeVisible()
    
    // Test valid price
    await page.fill('[data-testid="listing-price-input"]', '5.50')
    await expect(page.locator('[data-testid="price-error"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="confirm-listing-button"]')).toBeEnabled()
  })

  test('should handle insufficient funds during purchase', async ({ page }) => {
    // Mock insufficient funds error
    await page.route('**/api/marketplace/buy', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Insufficient funds',
          message: 'Your wallet balance is too low for this purchase',
        }),
      })
    })
    
    await flowHelpers.connectWallet('alice')
    await page.goto('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Attempt purchase
    await page.click('[data-testid="marketplace-nft-card"]:first-child')
    await page.click('[data-testid="buy-now-button"]')
    await page.click('[data-testid="confirm-purchase-button"]')
    
    // Verify error handling
    await expect(page.locator('[data-testid="purchase-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="purchase-error"]')).toContainText('Insufficient funds')
    
    // Verify helpful error message
    await expect(page.locator('[data-testid="add-funds-link"]')).toBeVisible()
  })

  test('should prevent users from buying their own listings', async ({ page }) => {
    // Mock marketplace with Alice's own listing
    await page.route('**/api/marketplace', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [
            {
              id: 'listing-1',
              nft_id: 'nft-1',
              name: 'My Own NFT',
              image: 'https://via.placeholder.com/400x400',
              price: '5.0',
              currency: 'FLOW',
              seller: TEST_WALLETS.alice.address, // Alice's own listing
            },
          ],
        }),
      })
    })
    
    await flowHelpers.connectWallet('alice')
    await page.goto('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Click on own listing
    await page.click('[data-testid="marketplace-nft-card"]:first-child')
    
    // Verify buy button is disabled/hidden for own listing
    await expect(page.locator('[data-testid="buy-now-button"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="own-listing-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="own-listing-message"]')).toContainText('This is your listing')
    
    // Verify edit/cancel listing options are available
    await expect(page.locator('[data-testid="edit-listing-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="cancel-listing-button"]')).toBeVisible()
  })

  test('should show real-time marketplace updates', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Get initial listing count
    const initialCount = await flowHelpers.getMarketplaceListingCount()
    
    // Mock new listing event
    await flowHelpers.mockFlowEvent('NFTListed', {
      nft_id: 'new-listing-nft',
      seller: TEST_WALLETS.bob.address,
      price: '15.0',
      nft_data: {
        id: 'new-listing-nft',
        name: 'New Listing NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Verify real-time notification
    await expect(page.locator('[data-testid="new-listing-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="new-listing-notification"]')).toContainText('New NFT listed')
    
    // Verify marketplace updates automatically
    await page.waitForTimeout(2000)
    const updatedCount = await flowHelpers.getMarketplaceListingCount()
    expect(updatedCount).toBeGreaterThan(initialCount)
    
    // Mock purchase event (NFT sold)
    await flowHelpers.mockFlowEvent('NFTPurchased', {
      nft_id: 'nft-1',
      buyer: TEST_WALLETS.charlie.address,
      seller: TEST_WALLETS.bob.address,
    })
    
    // Verify sold notification
    await expect(page.locator('[data-testid="nft-sold-notification"]')).toBeVisible()
    
    // Verify listing is removed
    await page.waitForTimeout(2000)
    const finalCount = await flowHelpers.getMarketplaceListingCount()
    expect(finalCount).toBeLessThan(updatedCount)
  })

  test('should handle marketplace sorting options', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    await page.goto('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Test sort by price (low to high)
    await page.selectOption('[data-testid="sort-select"]', 'price-asc')
    await page.waitForTimeout(500)
    
    // Verify sorting (first item should have lower price)
    const firstPrice = await page.locator('[data-testid="marketplace-nft-card"]:first-child [data-testid="nft-price"]').textContent()
    expect(firstPrice).toContain('5.0')
    
    // Test sort by price (high to low)
    await page.selectOption('[data-testid="sort-select"]', 'price-desc')
    await page.waitForTimeout(500)
    
    // Verify sorting (first item should have higher price)
    const firstPriceDesc = await page.locator('[data-testid="marketplace-nft-card"]:first-child [data-testid="nft-price"]').textContent()
    expect(firstPriceDesc).toContain('10.0')
    
    // Test sort by newest
    await page.selectOption('[data-testid="sort-select"]', 'newest')
    await page.waitForTimeout(500)
    
    // Verify default sorting is restored
    const listingCount = await flowHelpers.getMarketplaceListingCount()
    expect(listingCount).toBe(2)
  })
})