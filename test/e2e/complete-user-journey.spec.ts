import { test, expect } from '@playwright/test'
import { FlowTestHelpers, TEST_WALLETS } from './utils/flow-helpers'
import { TEST_NFT_METADATA, TEST_MARKETPLACE_DATA, MOCK_API_RESPONSES } from './utils/test-data'

test.describe('Complete User Journey - End to End', () => {
  let flowHelpers: FlowTestHelpers

  test.beforeEach(async ({ page }) => {
    flowHelpers = new FlowTestHelpers(page)
    
    // Mock all necessary APIs for complete journey
    await page.route('**/api/nft/mint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nft_id: 'journey-nft-' + Date.now(),
          transaction_hash: '0xjourney-mint-hash',
          status: 'completed',
        }),
      })
    })
    
    await page.route('**/api/marketplace/list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listing_id: 'journey-listing-' + Date.now(),
          transaction_hash: '0xjourney-list-hash',
          status: 'completed',
        }),
      })
    })
    
    await page.route('**/api/marketplace/buy', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transaction_hash: '0xjourney-buy-hash',
          status: 'completed',
        }),
      })
    })
    
    await page.route('**/api/nft/transfer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transaction_hash: '0xjourney-transfer-hash',
          status: 'completed',
        }),
      })
    })
    
    // Mock IPFS upload
    await page.route('**/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://test.ipfs.nftstorage.link/journey-metadata.json',
          cid: 'journey-test-cid',
        }),
      })
    })
    
    await page.goto('/')
  })

  test('should complete full creator journey: connect → mint → list → sell', async ({ page }) => {
    // === PHASE 1: WALLET CONNECTION ===
    console.log('Phase 1: Connecting wallet...')
    
    // Verify initial state
    await expect(page.locator('[data-testid="wallet-connect-button"]')).toBeVisible()
    
    // Connect Alice's wallet (creator)
    const creatorWallet = await flowHelpers.connectWallet('alice')
    
    // Verify connection success
    await expect(page.locator('[data-testid="wallet-address"]')).toContainText(creatorWallet.address)
    console.log('✅ Wallet connected successfully')
    
    // === PHASE 2: NFT MINTING ===
    console.log('Phase 2: Minting NFT...')
    
    // Navigate to mint page
    await page.click('a[href="/mint"]')
    await page.waitForURL('/mint')
    
    // Fill minting form
    await page.fill('[data-testid="nft-name-input"]', TEST_NFT_METADATA.basic.name)
    await page.fill('[data-testid="nft-description-input"]', TEST_NFT_METADATA.basic.description)
    await page.selectOption('[data-testid="nft-category-select"]', TEST_NFT_METADATA.basic.category)
    
    // Upload image
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'journey-nft.png',
      mimeType: 'image/png',
      buffer: Buffer.from('journey-nft-data'),
    })
    
    // Submit minting
    await page.click('[data-testid="mint-nft-button"]')
    
    // Wait for minting completion
    await flowHelpers.waitForTransaction()
    
    // Verify minting success
    await expect(page.locator('[data-testid="mint-success"]')).toBeVisible()
    console.log('✅ NFT minted successfully')
    
    // Navigate to profile to see minted NFT
    await page.click('[data-testid="view-nft-button"]')
    await page.waitForURL('/profile')
    
    // === PHASE 3: VIEW COLLECTION ===
    console.log('Phase 3: Viewing collection...')
    
    // Mock user NFTs including the newly minted one
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nfts: [
            {
              id: 'journey-nft-1',
              name: TEST_NFT_METADATA.basic.name,
              description: TEST_NFT_METADATA.basic.description,
              image: 'https://via.placeholder.com/400x400',
              owner: creatorWallet.address,
              listed: false,
            },
          ],
        }),
      })
    })
    
    await flowHelpers.waitForNFTGallery()
    
    // Verify NFT appears in gallery
    const nftCount = await flowHelpers.getNFTCount()
    expect(nftCount).toBeGreaterThan(0)
    console.log('✅ NFT visible in collection')
    
    // === PHASE 4: LIST FOR SALE ===
    console.log('Phase 4: Listing NFT for sale...')
    
    // Click on NFT to open details
    await flowHelpers.clickNFT(0)
    
    // Click list for sale
    await page.click('[data-testid="list-for-sale-button"]')
    
    // Fill listing form
    await page.fill('[data-testid="listing-price-input"]', TEST_MARKETPLACE_DATA.listing.price)
    
    // Confirm listing
    await page.click('[data-testid="confirm-listing-button"]')
    
    // Wait for listing completion
    await flowHelpers.waitForTransaction()
    
    // Verify listing success
    await expect(page.locator('[data-testid="listing-success"]')).toBeVisible()
    console.log('✅ NFT listed for sale successfully')
    
    // === PHASE 5: VERIFY MARKETPLACE LISTING ===
    console.log('Phase 5: Verifying marketplace listing...')
    
    // Navigate to marketplace
    await page.click('a[href="/marketplace"]')
    await page.waitForURL('/marketplace')
    
    // Mock marketplace with the listed NFT
    await page.route('**/api/marketplace', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [
            {
              id: 'journey-listing-1',
              nft_id: 'journey-nft-1',
              name: TEST_NFT_METADATA.basic.name,
              image: 'https://via.placeholder.com/400x400',
              price: TEST_MARKETPLACE_DATA.listing.price,
              currency: 'FLOW',
              seller: creatorWallet.address,
            },
          ],
        }),
      })
    })
    
    await flowHelpers.waitForMarketplace()
    
    // Verify listing appears in marketplace
    const listingCount = await flowHelpers.getMarketplaceListingCount()
    expect(listingCount).toBeGreaterThan(0)
    console.log('✅ NFT visible in marketplace')
    
    // === PHASE 6: SIMULATE PURCHASE BY ANOTHER USER ===
    console.log('Phase 6: Simulating purchase by buyer...')
    
    // Disconnect Alice and connect Bob (buyer)
    await flowHelpers.disconnectWallet()
    const buyerWallet = await flowHelpers.connectWallet('bob')
    
    // Click on the listing
    await page.click('[data-testid="marketplace-nft-card"]:first-child')
    
    // Verify NFT details modal
    await expect(page.locator('[data-testid="nft-details-modal"]')).toBeVisible()
    
    // Click buy now
    await page.click('[data-testid="buy-now-button"]')
    
    // Confirm purchase
    await page.click('[data-testid="confirm-purchase-button"]')
    
    // Wait for purchase completion
    await flowHelpers.waitForTransaction()
    
    // Verify purchase success
    await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible()
    console.log('✅ NFT purchased successfully')
    
    // === PHASE 7: VERIFY OWNERSHIP TRANSFER ===
    console.log('Phase 7: Verifying ownership transfer...')
    
    // Mock real-time event for purchase
    await flowHelpers.mockFlowEvent('NFTPurchased', {
      nft_id: 'journey-nft-1',
      buyer: buyerWallet.address,
      seller: creatorWallet.address,
      price: TEST_MARKETPLACE_DATA.listing.price,
    })
    
    // Navigate to buyer's profile
    await page.click('a[href="/profile"]')
    await page.waitForURL('/profile')
    
    // Mock buyer's NFTs including the purchased one
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nfts: [
            {
              id: 'journey-nft-1',
              name: TEST_NFT_METADATA.basic.name,
              description: TEST_NFT_METADATA.basic.description,
              image: 'https://via.placeholder.com/400x400',
              owner: buyerWallet.address,
              listed: false,
            },
          ],
        }),
      })
    })
    
    await flowHelpers.waitForNFTGallery()
    
    // Verify NFT now appears in buyer's collection
    const buyerNFTCount = await flowHelpers.getNFTCount()
    expect(buyerNFTCount).toBeGreaterThan(0)
    console.log('✅ NFT ownership transferred to buyer')
    
    // === PHASE 8: REAL-TIME NOTIFICATIONS ===
    console.log('Phase 8: Testing real-time notifications...')
    
    // Verify purchase notification was shown
    await expect(page.locator('[data-testid="nft-purchased-notification"]')).toBeVisible()
    
    // Mock another user minting (global event)
    await flowHelpers.mockFlowEvent('CollectibleMinted', {
      nft_id: 'global-mint-nft',
      creator: TEST_WALLETS.charlie.address,
      name: 'Global Mint NFT',
    })
    
    // Verify global mint notification
    await expect(page.locator('[data-testid="mint-notification"]')).toBeVisible()
    console.log('✅ Real-time notifications working')
    
    console.log('🎉 Complete user journey test passed!')
  })

  test('should handle complete transfer workflow between users', async ({ page }) => {
    // === SETUP: Connect Alice with NFT ===
    const aliceWallet = await flowHelpers.connectWallet('alice')
    
    // Mock Alice's NFTs
    await page.route('**/api/user/**', async (route) => {
      const url = route.request().url()
      if (url.includes(aliceWallet.address)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            nfts: [
              {
                id: 'transfer-nft-1',
                name: 'Transfer Test NFT',
                image: 'https://via.placeholder.com/400x400',
                owner: aliceWallet.address,
              },
            ],
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ nfts: [] }),
        })
      }
    })
    
    // === PHASE 1: INITIATE TRANSFER ===
    console.log('Phase 1: Initiating transfer...')
    
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Click on NFT
    await flowHelpers.clickNFT(0)
    
    // Click transfer button
    await page.click('[data-testid="transfer-nft-button"]')
    
    // Fill recipient address (Bob's address)
    await page.fill('[data-testid="recipient-address-input"]', TEST_WALLETS.bob.address)
    
    // Confirm transfer
    await page.click('[data-testid="confirm-transfer-button"]')
    
    // Wait for transfer completion
    await flowHelpers.waitForTransaction()
    
    // Verify transfer success
    await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible()
    console.log('✅ Transfer initiated successfully')
    
    // === PHASE 2: REAL-TIME UPDATE FOR SENDER ===
    console.log('Phase 2: Verifying sender UI updates...')
    
    // Mock transfer event
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'transfer-nft-1',
      from: aliceWallet.address,
      to: TEST_WALLETS.bob.address,
    })
    
    // Verify NFT is removed from Alice's gallery
    await page.waitForTimeout(1000)
    const aliceNFTCount = await flowHelpers.getNFTCount()
    expect(aliceNFTCount).toBe(0) // Should be empty now
    console.log('✅ Sender gallery updated')
    
    // === PHASE 3: SWITCH TO RECIPIENT ===
    console.log('Phase 3: Switching to recipient...')
    
    // Disconnect Alice and connect Bob
    await flowHelpers.disconnectWallet()
    const bobWallet = await flowHelpers.connectWallet('bob')
    
    // Navigate to Bob's profile
    await page.goto('/profile')
    
    // Mock Bob's NFTs including the received one
    await page.route('**/api/user/**', async (route) => {
      const url = route.request().url()
      if (url.includes(bobWallet.address)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            nfts: [
              {
                id: 'transfer-nft-1',
                name: 'Transfer Test NFT',
                image: 'https://via.placeholder.com/400x400',
                owner: bobWallet.address,
              },
            ],
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ nfts: [] }),
        })
      }
    })
    
    await flowHelpers.waitForNFTGallery()
    
    // === PHASE 4: VERIFY RECIPIENT RECEIVED NFT ===
    console.log('Phase 4: Verifying recipient received NFT...')
    
    // Mock real-time event for Bob receiving NFT
    await flowHelpers.mockFlowEvent('CollectibleTransferred', {
      nft_id: 'transfer-nft-1',
      from: aliceWallet.address,
      to: bobWallet.address,
      nft_data: {
        id: 'transfer-nft-1',
        name: 'Transfer Test NFT',
        image: 'https://via.placeholder.com/400x400',
      },
    })
    
    // Verify notification for received NFT
    await expect(page.locator('[data-testid="nft-received-notification"]')).toBeVisible()
    
    // Verify NFT appears in Bob's gallery
    const bobNFTCount = await flowHelpers.getNFTCount()
    expect(bobNFTCount).toBeGreaterThan(0)
    console.log('✅ Recipient received NFT successfully')
    
    console.log('🎉 Complete transfer workflow test passed!')
  })

  test('should handle error recovery throughout the journey', async ({ page }) => {
    // === SETUP ===
    await flowHelpers.connectWallet('alice')
    
    // === PHASE 1: MINT WITH NETWORK ERROR AND RECOVERY ===
    console.log('Phase 1: Testing mint error recovery...')
    
    let mintAttempts = 0
    await page.route('**/api/nft/mint', async (route) => {
      mintAttempts++
      if (mintAttempts === 1) {
        // First attempt fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Network error' }),
        })
      } else {
        // Second attempt succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            nft_id: 'recovery-nft-1',
            status: 'completed',
          }),
        })
      }
    })
    
    await page.goto('/mint')
    
    // Fill form
    await page.fill('[data-testid="nft-name-input"]', 'Recovery Test NFT')
    await page.fill('[data-testid="nft-description-input"]', 'Testing error recovery')
    
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'recovery.png',
      mimeType: 'image/png',
      buffer: Buffer.from('recovery-data'),
    })
    
    // Submit (will fail first time)
    await page.click('[data-testid="mint-nft-button"]')
    
    // Verify error is shown
    await expect(page.locator('[data-testid="mint-error"]')).toBeVisible()
    
    // Click retry
    await page.click('[data-testid="retry-mint-button"]')
    
    // Wait for success
    await flowHelpers.waitForTransaction()
    await expect(page.locator('[data-testid="mint-success"]')).toBeVisible()
    console.log('✅ Mint error recovery successful')
    
    // === PHASE 2: MARKETPLACE ERROR AND RECOVERY ===
    console.log('Phase 2: Testing marketplace error recovery...')
    
    // Mock user NFTs
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nfts: [
            {
              id: 'recovery-nft-1',
              name: 'Recovery Test NFT',
              owner: TEST_WALLETS.alice.address,
            },
          ],
        }),
      })
    })
    
    await page.goto('/profile')
    await flowHelpers.waitForNFTGallery()
    
    // Try to list with error
    let listAttempts = 0
    await page.route('**/api/marketplace/list', async (route) => {
      listAttempts++
      if (listAttempts === 1) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Listing failed' }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            listing_id: 'recovery-listing-1',
            status: 'completed',
          }),
        })
      }
    })
    
    // Open listing modal
    await flowHelpers.clickNFT(0)
    await page.click('[data-testid="list-for-sale-button"]')
    
    // Fill price and submit (will fail)
    await page.fill('[data-testid="listing-price-input"]', '5.0')
    await page.click('[data-testid="confirm-listing-button"]')
    
    // Verify error and retry
    await expect(page.locator('[data-testid="listing-error"]')).toBeVisible()
    await page.click('[data-testid="retry-listing-button"]')
    
    // Wait for success
    await flowHelpers.waitForTransaction()
    await expect(page.locator('[data-testid="listing-success"]')).toBeVisible()
    console.log('✅ Marketplace error recovery successful')
    
    // === PHASE 3: WALLET DISCONNECTION AND RECONNECTION ===
    console.log('Phase 3: Testing wallet disconnection recovery...')
    
    // Simulate wallet disconnection during operation
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wallet-disconnected'))
    })
    
    // Verify disconnection handling
    await expect(page.locator('[data-testid="wallet-disconnected-error"]')).toBeVisible()
    
    // Reconnect wallet
    await page.click('[data-testid="reconnect-wallet-button"]')
    await flowHelpers.connectWallet('alice')
    
    // Verify reconnection success
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
    console.log('✅ Wallet reconnection successful')
    
    console.log('🎉 Error recovery journey test passed!')
  })
})