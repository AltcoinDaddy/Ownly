import { test, expect } from '@playwright/test'
import { FlowTestHelpers, TEST_WALLETS } from './utils/flow-helpers'

test.describe('Real-time Event Notifications', () => {
  let flowHelpers: FlowTestHelpers

  test.beforeEach(async ({ page }) => {
    flowHelpers = new FlowTestHelpers(page)
    
    // Mock event API
    await page.route('**/api/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [
            {
              id: 'event-1',
              type: 'CollectibleMinted',
              data: {
                nft_id: 'new-mint-123',
                creator: TEST_WALLETS.alice.address,
                name: 'Fresh Mint NFT',
              },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      })
    })
    
    await page.goto('/')
  })

  test('should display real-time mint notifications', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Navigate to homepage where global events are shown
    await page.goto('/')
    
    // Mock a new mint event
    await flowHelpers.mockFlowEvent('CollectibleMinted', {
      nft_id: 'real-time-mint-456',
      creator: TEST_WALLETS.bob.address,
      name: 'Real-time Mint NFT',
      image: 'https://via.placeholder.com/400x400',
    })
    
    // Verify notification appears
    await expect(page.locator('[data-testid="mint-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="mint-notification"]')).toContainText('New NFT minted')
    await expect(page.locator('[data-testid="mint-notification"]')).toContainText('Real-time Mint NFT')
    
    // Verify notification has action button
    await expect(page.locator('[data-testid="view-mint-button"]')).toBeVisible()
    
    // Click to view the minted NFT
    await page.click('[data-testid="view-mint-button"]')
    
    // Should navigate to the NFT or marketplace
    await expect(page.url()).toMatch(/(marketplace|nft)/)
  })

  test('should display real-time transfer notifications', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock receiving a transfer
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'transferred-nft-789',
      from: TEST_WALLETS.bob.address,
      to: TEST_WALLETS.alice.address,
      nft_data: {
        name: 'Transferred NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Verify transfer received notification
    await expect(page.locator('[data-testid="transfer-received-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="transfer-received-notification"]')).toContainText('You received an NFT')
    await expect(page.locator('[data-testid="transfer-received-notification"]')).toContainText('Transferred NFT')
    
    // Mock sending a transfer
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'sent-nft-101',
      from: TEST_WALLETS.alice.address,
      to: TEST_WALLETS.charlie.address,
      nft_data: {
        name: 'Sent NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Verify transfer sent notification
    await expect(page.locator('[data-testid="transfer-sent-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="transfer-sent-notification"]')).toContainText('NFT transferred successfully')
  })

  test('should display real-time marketplace notifications', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock NFT listed event
    await flowHelpers.mockFlowEvent('NFTListed', {
      nft_id: 'listed-nft-202',
      seller: TEST_WALLETS.bob.address,
      price: '25.0',
      currency: 'FLOW',
      nft_data: {
        name: 'Newly Listed NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Verify listing notification
    await expect(page.locator('[data-testid="nft-listed-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="nft-listed-notification"]')).toContainText('New NFT listed')
    await expect(page.locator('[data-testid="nft-listed-notification"]')).toContainText('25.0 FLOW')
    
    // Mock NFT purchased event
    await flowHelpers.mockFlowEvent('NFTPurchased', {
      nft_id: 'purchased-nft-303',
      buyer: TEST_WALLETS.alice.address,
      seller: TEST_WALLETS.charlie.address,
      price: '15.0',
      nft_data: {
        name: 'Purchased NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Verify purchase notification
    await expect(page.locator('[data-testid="nft-purchased-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="nft-purchased-notification"]')).toContainText('Purchase successful')
    await expect(page.locator('[data-testid="nft-purchased-notification"]')).toContainText('Purchased NFT')
  })

  test('should handle notification queue and display multiple notifications', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Send multiple events in quick succession
    await flowHelpers.mockFlowEvent('CollectibleMinted', {
      nft_id: 'mint-1',
      creator: TEST_WALLETS.bob.address,
      name: 'Mint #1',
    })
    
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'transfer-1',
      from: TEST_WALLETS.charlie.address,
      to: TEST_WALLETS.alice.address,
      nft_data: { name: 'Transfer #1' },
    })
    
    await flowHelpers.mockFlowEvent('NFTListed', {
      nft_id: 'listing-1',
      seller: TEST_WALLETS.bob.address,
      price: '5.0',
      nft_data: { name: 'Listing #1' },
    })
    
    // Verify multiple notifications are displayed
    await expect(page.locator('[data-testid="notification-container"]')).toBeVisible()
    
    const notificationCount = await page.locator('[data-testid="notification-item"]').count()
    expect(notificationCount).toBeGreaterThanOrEqual(2) // Should show multiple notifications
    
    // Verify notifications can be dismissed
    await page.click('[data-testid="notification-item"]:first-child [data-testid="dismiss-notification"]')
    
    const updatedCount = await page.locator('[data-testid="notification-item"]').count()
    expect(updatedCount).toBeLessThan(notificationCount)
  })

  test('should update UI state automatically on events', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Navigate to profile
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Get initial NFT count
    const initialCount = await flowHelpers.getNFTCount()
    
    // Mock receiving an NFT
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'auto-update-nft',
      from: TEST_WALLETS.bob.address,
      to: TEST_WALLETS.alice.address,
      nft_data: {
        id: 'auto-update-nft',
        name: 'Auto Update NFT',
        image: 'https://via.placeholder.com/400x400',
        owner: TEST_WALLETS.alice.address,
      },
    })
    
    // Wait for UI to update automatically
    await page.waitForTimeout(2000)
    
    // Verify gallery updated without page refresh
    const updatedCount = await flowHelpers.getNFTCount()
    expect(updatedCount).toBeGreaterThan(initialCount)
    
    // Navigate to marketplace
    await page.goto('/marketplace')
    await flowHelpers.waitForMarketplace()
    
    // Get initial marketplace count
    const initialMarketplaceCount = await flowHelpers.getMarketplaceListingCount()
    
    // Mock new listing
    await flowHelpers.mockFlowEvent('NFTListed', {
      nft_id: 'auto-marketplace-nft',
      seller: TEST_WALLETS.charlie.address,
      price: '20.0',
      nft_data: {
        id: 'auto-marketplace-nft',
        name: 'Auto Marketplace NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Wait for marketplace to update
    await page.waitForTimeout(2000)
    
    // Verify marketplace updated automatically
    const updatedMarketplaceCount = await flowHelpers.getMarketplaceListingCount()
    expect(updatedMarketplaceCount).toBeGreaterThan(initialMarketplaceCount)
  })

  test('should handle event listener connection failures and reconnection', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock event listener connection failure
    await page.evaluate(() => {
      // Simulate connection failure
      window.dispatchEvent(new CustomEvent('flow-event-connection-error', {
        detail: { error: 'Connection lost' }
      }))
    })
    
    // Verify connection error notification
    await expect(page.locator('[data-testid="connection-error-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="connection-error-notification"]')).toContainText('Connection lost')
    
    // Mock reconnection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('flow-event-connection-restored', {
        detail: { message: 'Connection restored' }
      }))
    })
    
    // Verify reconnection notification
    await expect(page.locator('[data-testid="connection-restored-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="connection-restored-notification"]')).toContainText('Connection restored')
    
    // Verify error notification is dismissed
    await expect(page.locator('[data-testid="connection-error-notification"]')).not.toBeVisible()
  })

  test('should filter notifications based on user relevance', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Mock event not relevant to Alice
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'irrelevant-transfer',
      from: TEST_WALLETS.bob.address,
      to: TEST_WALLETS.charlie.address, // Not Alice
      nft_data: { name: 'Irrelevant Transfer' },
    })
    
    // Verify no notification for irrelevant event
    await expect(page.locator('[data-testid="transfer-received-notification"]')).not.toBeVisible()
    
    // Mock event relevant to Alice
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'relevant-transfer',
      from: TEST_WALLETS.bob.address,
      to: TEST_WALLETS.alice.address, // To Alice
      nft_data: { name: 'Relevant Transfer' },
    })
    
    // Verify notification appears for relevant event
    await expect(page.locator('[data-testid="transfer-received-notification"]')).toBeVisible()
    
    // Mock Alice's own mint (should show notification)
    await flowHelpers.mockFlowEvent('CollectibleMinted', {
      nft_id: 'alice-mint',
      creator: TEST_WALLETS.alice.address,
      name: 'Alice Mint',
    })
    
    // Verify notification for own mint
    await expect(page.locator('[data-testid="mint-success-notification"]')).toBeVisible()
  })

  test('should persist notification preferences', async ({ page }) => {
    await flowHelpers.connectWallet('alice')
    
    // Open notification settings
    await page.click('[data-testid="notification-settings-button"]')
    
    // Verify settings modal
    await expect(page.locator('[data-testid="notification-settings-modal"]')).toBeVisible()
    
    // Disable mint notifications
    await page.uncheck('[data-testid="mint-notifications-toggle"]')
    
    // Enable sound notifications
    await page.check('[data-testid="sound-notifications-toggle"]')
    
    // Save settings
    await page.click('[data-testid="save-notification-settings"]')
    
    // Mock mint event
    await flowHelpers.mockFlowEvent('CollectibleMinted', {
      nft_id: 'disabled-mint',
      creator: TEST_WALLETS.bob.address,
      name: 'Disabled Mint',
    })
    
    // Verify mint notification is not shown (disabled)
    await expect(page.locator('[data-testid="mint-notification"]')).not.toBeVisible()
    
    // Mock transfer event
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'enabled-transfer',
      from: TEST_WALLETS.bob.address,
      to: TEST_WALLETS.alice.address,
      nft_data: { name: 'Enabled Transfer' },
    })
    
    // Verify transfer notification is shown (still enabled)
    await expect(page.locator('[data-testid="transfer-received-notification"]')).toBeVisible()
  })
})