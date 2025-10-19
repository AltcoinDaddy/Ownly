import { test, expect } from '@playwright/test'
import { FlowTestHelpers, TEST_WALLETS } from './utils/flow-helpers'

test.describe('Wallet Connection Journey', () => {
  let flowHelpers: FlowTestHelpers

  test.beforeEach(async ({ page }) => {
    flowHelpers = new FlowTestHelpers(page)
    await page.goto('/')
  })

  test('should display connect wallet button on homepage', async ({ page }) => {
    // Check that connect wallet button is visible
    await expect(page.locator('[data-testid="wallet-connect-button"]')).toBeVisible()
    
    // Check that wallet address is not displayed when not connected
    await expect(page.locator('[data-testid="wallet-address"]')).not.toBeVisible()
  })

  test('should successfully connect Dapper wallet', async ({ page }) => {
    // Connect Alice's wallet
    const wallet = await flowHelpers.connectWallet('alice')
    
    // Verify wallet connection UI updates
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
    await expect(page.locator('[data-testid="wallet-address"]')).toContainText(wallet.address)
    
    // Verify connect button is replaced with disconnect button
    await expect(page.locator('[data-testid="wallet-connect-button"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="wallet-disconnect-button"]')).toBeVisible()
  })

  test('should successfully disconnect wallet', async ({ page }) => {
    // First connect a wallet
    await flowHelpers.connectWallet('alice')
    
    // Then disconnect
    await flowHelpers.disconnectWallet()
    
    // Verify UI returns to disconnected state
    await expect(page.locator('[data-testid="wallet-connect-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="wallet-address"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="wallet-disconnect-button"]')).not.toBeVisible()
  })

  test('should persist wallet connection across page navigation', async ({ page }) => {
    // Connect wallet on homepage
    const wallet = await flowHelpers.connectWallet('alice')
    
    // Navigate to marketplace
    await page.click('a[href="/marketplace"]')
    await page.waitForURL('/marketplace')
    
    // Verify wallet is still connected
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
    await expect(page.locator('[data-testid="wallet-address"]')).toContainText(wallet.address)
    
    // Navigate to profile
    await page.click('a[href="/profile"]')
    await page.waitForURL('/profile')
    
    // Verify wallet is still connected
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
  })

  test('should handle wallet connection errors gracefully', async ({ page }) => {
    // Mock wallet connection failure
    await page.addInitScript(() => {
      window.fcl = {
        authenticate: async () => {
          throw new Error('User rejected connection')
        },
        currentUser: () => ({
          subscribe: (callback: any) => {
            callback({ addr: null, loggedIn: false })
            return () => {}
          },
        }),
      }
    })
    
    // Attempt to connect wallet
    await page.click('[data-testid="wallet-connect-button"]')
    
    // Verify error handling
    await expect(page.locator('[data-testid="wallet-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="wallet-connect-button"]')).toBeVisible()
  })

  test('should show different UI states for connected vs disconnected users', async ({ page }) => {
    // Check disconnected state
    await expect(page.locator('[data-testid="connect-wallet-cta"]')).toBeVisible()
    
    // Connect wallet
    await flowHelpers.connectWallet('alice')
    
    // Check connected state - should show user-specific content
    await expect(page.locator('[data-testid="user-dashboard-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="connect-wallet-cta"]')).not.toBeVisible()
  })
})