import { Page } from '@playwright/test'

export interface MockWallet {
  address: string
  name: string
  connected: boolean
}

export const TEST_WALLETS = {
  alice: {
    address: '0x01cf0e2f2f715450',
    name: 'Alice Test Wallet',
    connected: false,
  },
  bob: {
    address: '0x179b6b1cb6755e31',
    name: 'Bob Test Wallet', 
    connected: false,
  },
  charlie: {
    address: '0xf3fcd2c1a78f5eee',
    name: 'Charlie Test Wallet',
    connected: false,
  },
} as const

export class FlowTestHelpers {
  constructor(private page: Page) {}

  /**
   * Mock wallet connection for E2E tests
   */
  async mockWalletConnection(wallet: MockWallet) {
    // Inject mock FCL implementation
    await this.page.addInitScript((mockWallet) => {
      // Mock FCL for testing
      window.fcl = {
        authenticate: async () => ({
          addr: mockWallet.address,
          cid: 'test-cid',
          loggedIn: true,
          services: [
            {
              type: 'authn',
              uid: 'test-wallet',
              endpoint: 'http://localhost:8701/fcl/authn',
              method: 'HTTP/POST',
              identity: {
                address: mockWallet.address,
                keyId: 0,
              },
            },
          ],
        }),
        unauthenticate: async () => {},
        currentUser: () => ({
          subscribe: (callback: any) => {
            callback({
              addr: mockWallet.address,
              cid: 'test-cid',
              loggedIn: true,
            })
            return () => {}
          },
          authorization: mockWallet.address,
        }),
        mutate: async (tx: any) => ({
          transactionId: 'test-tx-' + Date.now(),
          status: 4, // SEALED
          statusCode: 0,
          events: [],
        }),
        query: async (script: any) => ({}),
        events: (eventType: string) => ({
          subscribe: (callback: any) => {
            // Mock event subscription
            return () => {}
          },
        }),
        config: () => ({
          put: () => {},
        }),
      }
    }, wallet)
  }

  /**
   * Wait for wallet connection UI to appear
   */
  async waitForWalletConnection() {
    await this.page.waitForSelector('[data-testid="wallet-connect-button"]', {
      timeout: 10000,
    })
  }

  /**
   * Connect a test wallet
   */
  async connectWallet(walletKey: keyof typeof TEST_WALLETS) {
    const wallet = TEST_WALLETS[walletKey]
    await this.mockWalletConnection(wallet)
    
    // Click connect wallet button
    await this.page.click('[data-testid="wallet-connect-button"]')
    
    // Wait for connection to complete
    await this.page.waitForSelector('[data-testid="wallet-address"]', {
      timeout: 10000,
    })
    
    return wallet
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    await this.page.click('[data-testid="wallet-disconnect-button"]')
    await this.page.waitForSelector('[data-testid="wallet-connect-button"]', {
      timeout: 5000,
    })
  }

  /**
   * Wait for transaction to complete
   */
  async waitForTransaction(timeout = 30000) {
    // Wait for loading state to disappear
    await this.page.waitForSelector('[data-testid="transaction-loading"]', {
      state: 'hidden',
      timeout,
    })
    
    // Wait for success or error message
    await this.page.waitForSelector(
      '[data-testid="transaction-success"], [data-testid="transaction-error"]',
      { timeout: 5000 }
    )
  }

  /**
   * Mock Flow events for real-time updates
   */
  async mockFlowEvent(eventType: string, eventData: any) {
    await this.page.evaluate(
      ({ eventType, eventData }) => {
        // Trigger mock event
        const event = new CustomEvent('flow-event', {
          detail: { type: eventType, data: eventData },
        })
        window.dispatchEvent(event)
      },
      { eventType, eventData }
    )
  }

  /**
   * Get current wallet address from UI
   */
  async getCurrentWalletAddress(): Promise<string | null> {
    try {
      const addressElement = await this.page.locator('[data-testid="wallet-address"]')
      return await addressElement.textContent()
    } catch {
      return null
    }
  }

  /**
   * Wait for NFT gallery to load
   */
  async waitForNFTGallery() {
    await this.page.waitForSelector('[data-testid="nft-gallery"]', {
      timeout: 10000,
    })
  }

  /**
   * Get NFT count from gallery
   */
  async getNFTCount(): Promise<number> {
    const nftCards = await this.page.locator('[data-testid="nft-card"]')
    return await nftCards.count()
  }

  /**
   * Click on NFT by index
   */
  async clickNFT(index: number) {
    const nftCards = await this.page.locator('[data-testid="nft-card"]')
    await nftCards.nth(index).click()
  }

  /**
   * Wait for marketplace to load
   */
  async waitForMarketplace() {
    await this.page.waitForSelector('[data-testid="marketplace-grid"]', {
      timeout: 10000,
    })
  }

  /**
   * Get marketplace listing count
   */
  async getMarketplaceListingCount(): Promise<number> {
    const listings = await this.page.locator('[data-testid="marketplace-nft-card"]')
    return await listings.count()
  }
}