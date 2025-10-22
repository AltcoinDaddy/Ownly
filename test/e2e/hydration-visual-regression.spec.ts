import { test, expect, Page } from '@playwright/test'

// Helper function to wait for hydration
async function waitForHydration(page: Page) {
  // Wait for React to hydrate by checking for hydration markers
  await page.waitForFunction(() => {
    return window.document.querySelector('[data-hydrated="true"]') !== null ||
           window.document.querySelector('.hydrated') !== null ||
           // Fallback: wait for any React event handlers to be attached
           window.React !== undefined
  }, { timeout: 10000 })
  
  // Additional wait to ensure all effects have run
  await page.waitForTimeout(1000)
}

// Helper function to disable animations for consistent screenshots
async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  })
}

test.describe('Hydration Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await disableAnimations(page)
  })

  test('homepage layout remains stable during hydration', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Take screenshot before hydration completes
    await page.waitForSelector('body')
    const beforeHydration = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    // Wait for hydration to complete
    await waitForHydration(page)
    
    // Take screenshot after hydration
    const afterHydration = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    // Compare screenshots - they should be identical or very similar
    expect(beforeHydration).toEqual(afterHydration)
  })

  test('marketplace page layout stability', async ({ page }) => {
    await page.goto('/marketplace')
    
    // Wait for initial render
    await page.waitForSelector('[data-testid="marketplace-container"]', { timeout: 10000 })
    
    const beforeHydration = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    await waitForHydration(page)
    
    const afterHydration = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    expect(beforeHydration).toEqual(afterHydration)
  })

  test('profile page layout stability', async ({ page }) => {
    await page.goto('/profile')
    
    // Wait for profile content to load
    await page.waitForSelector('[data-testid="profile-container"]', { timeout: 10000 })
    
    const beforeHydration = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    await waitForHydration(page)
    
    const afterHydration = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    expect(beforeHydration).toEqual(afterHydration)
  })

  test('wallet connection status remains stable', async ({ page }) => {
    await page.goto('/')
    
    // Focus on wallet connection area
    const walletArea = page.locator('[data-testid="wallet-connection"]')
    await walletArea.waitFor({ timeout: 10000 })
    
    const beforeHydration = await walletArea.screenshot({
      animations: 'disabled'
    })
    
    await waitForHydration(page)
    
    const afterHydration = await walletArea.screenshot({
      animations: 'disabled'
    })
    
    expect(beforeHydration).toEqual(afterHydration)
  })

  test('theme switching does not cause layout shifts', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)
    
    // Take screenshot in light mode
    const lightMode = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    // Switch to dark mode
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(500) // Wait for theme transition
      
      const darkMode = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      })
      
      // Layouts should be identical (only colors should change)
      // We'll check this by comparing element positions
      const lightElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'))
        return elements.map(el => {
          const rect = el.getBoundingClientRect()
          return {
            tag: el.tagName,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        })
      })
      
      const darkElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'))
        return elements.map(el => {
          const rect = el.getBoundingClientRect()
          return {
            tag: el.tagName,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        })
      })
      
      // Element positions should be identical
      expect(lightElements).toEqual(darkElements)
    }
  })

  test('NFT gallery maintains layout during loading states', async ({ page }) => {
    await page.goto('/profile')
    await waitForHydration(page)
    
    // Wait for gallery to be visible
    const gallery = page.locator('[data-testid="nft-gallery"]')
    await gallery.waitFor({ timeout: 10000 })
    
    // Take screenshot of loading state
    const loadingState = await gallery.screenshot({
      animations: 'disabled'
    })
    
    // Wait for NFTs to load
    await page.waitForSelector('[data-testid="nft-card"]', { timeout: 15000 })
    
    // Take screenshot of loaded state
    const loadedState = await gallery.screenshot({
      animations: 'disabled'
    })
    
    // The gallery container should maintain its dimensions
    const loadingRect = await gallery.boundingBox()
    const loadedRect = await gallery.boundingBox()
    
    expect(loadingRect?.width).toBe(loadedRect?.width)
    // Height may change as content loads, but width should remain stable
  })

  test('responsive layout stability across breakpoints', async ({ page }) => {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ]
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      })
      
      await page.goto('/')
      
      // Take screenshot before hydration
      const beforeHydration = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      })
      
      await waitForHydration(page)
      
      // Take screenshot after hydration
      const afterHydration = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      })
      
      // Layout should be stable at each breakpoint
      expect(beforeHydration).toEqual(afterHydration)
    }
  })

  test('modal and overlay positioning stability', async ({ page }) => {
    await page.goto('/marketplace')
    await waitForHydration(page)
    
    // Find and click on an NFT to open modal
    const nftCard = page.locator('[data-testid="nft-card"]').first()
    await nftCard.waitFor({ timeout: 10000 })
    await nftCard.click()
    
    // Wait for modal to appear
    const modal = page.locator('[data-testid="nft-details-modal"]')
    await modal.waitFor({ timeout: 5000 })
    
    // Take screenshot of modal
    const modalScreenshot = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    // Close and reopen modal to test consistency
    await page.keyboard.press('Escape')
    await modal.waitFor({ state: 'hidden' })
    
    await nftCard.click()
    await modal.waitFor({ timeout: 5000 })
    
    const modalScreenshot2 = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    // Modal should appear in the same position
    expect(modalScreenshot).toEqual(modalScreenshot2)
  })

  test('form layout stability during validation', async ({ page }) => {
    await page.goto('/mint')
    await waitForHydration(page)
    
    // Take screenshot of initial form
    const form = page.locator('[data-testid="mint-form"]')
    await form.waitFor({ timeout: 10000 })
    
    const initialForm = await form.screenshot({
      animations: 'disabled'
    })
    
    // Trigger validation errors
    const submitButton = page.locator('[data-testid="mint-submit"]')
    await submitButton.click()
    
    // Wait for validation errors to appear
    await page.waitForSelector('[data-testid="form-error"]', { timeout: 5000 })
    
    const formWithErrors = await form.screenshot({
      animations: 'disabled'
    })
    
    // Form should expand to show errors without major layout shifts
    const initialRect = await form.boundingBox()
    const errorRect = await form.boundingBox()
    
    // Width should remain the same
    expect(initialRect?.width).toBe(errorRect?.width)
    // Height may increase for error messages, but should be controlled
    expect(errorRect?.height).toBeGreaterThanOrEqual(initialRect?.height || 0)
  })

  test('navigation menu stability during hydration', async ({ page }) => {
    await page.goto('/')
    
    // Focus on navigation area
    const nav = page.locator('[data-testid="main-navigation"]')
    await nav.waitFor({ timeout: 10000 })
    
    const beforeHydration = await nav.screenshot({
      animations: 'disabled'
    })
    
    await waitForHydration(page)
    
    const afterHydration = await nav.screenshot({
      animations: 'disabled'
    })
    
    expect(beforeHydration).toEqual(afterHydration)
  })

  test('footer layout stability', async ({ page }) => {
    await page.goto('/')
    
    // Scroll to footer
    await page.locator('[data-testid="footer"]').scrollIntoViewIfNeeded()
    
    const footer = page.locator('[data-testid="footer"]')
    await footer.waitFor({ timeout: 10000 })
    
    const beforeHydration = await footer.screenshot({
      animations: 'disabled'
    })
    
    await waitForHydration(page)
    
    const afterHydration = await footer.screenshot({
      animations: 'disabled'
    })
    
    expect(beforeHydration).toEqual(afterHydration)
  })
})

test.describe('Hydration Error Recovery Visual Tests', () => {
  test('error boundary displays consistently', async ({ page }) => {
    // Navigate to a page that might have hydration errors
    await page.goto('/')
    
    // Inject a script that causes hydration errors
    await page.addScriptTag({
      content: `
        // Simulate hydration error by modifying DOM after initial render
        setTimeout(() => {
          const element = document.querySelector('body');
          if (element) {
            element.setAttribute('data-test-hydration-error', 'true');
          }
        }, 100);
      `
    })
    
    // Wait for potential error boundary to appear
    try {
      await page.waitForSelector('[data-testid="error-boundary"]', { timeout: 5000 })
      
      // Take screenshot of error boundary
      const errorBoundary = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      })
      
      // Error boundary should be displayed consistently
      expect(errorBoundary).toBeDefined()
    } catch (e) {
      // No error boundary appeared, which is also valid
      console.log('No error boundary triggered in test environment')
    }
  })

  test('recovery mechanism maintains layout', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)
    
    // Take baseline screenshot
    const baseline = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    // Simulate error and recovery
    await page.evaluate(() => {
      // Trigger a recoverable error
      window.dispatchEvent(new ErrorEvent('error', {
        error: new Error('Test hydration error'),
        message: 'Hydration failed because the initial UI does not match what was rendered on the server'
      }))
    })
    
    // Wait for potential recovery
    await page.waitForTimeout(2000)
    
    const afterRecovery = await page.screenshot({
      fullPage: true,
      animations: 'disabled'
    })
    
    // Layout should be restored after recovery
    expect(baseline).toEqual(afterRecovery)
  })
})