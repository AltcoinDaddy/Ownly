import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useIsMobile } from '@/components/ui/use-mobile'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useHydrated } from '@/lib/hydration'

// Mock the hydration hook
vi.mock('@/lib/hydration', () => ({
  useHydrated: vi.fn(),
  useIsomorphicLayoutEffect: vi.fn((effect, deps) => {
    // Mock implementation that calls effect immediately in tests
    if (typeof effect === 'function') {
      const cleanup = effect()
      return cleanup
    }
  }),
  SafeCookies: {
    get: vi.fn(() => null),
    set: vi.fn(),
  }
}))

// Mock window.matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock addEventListener and removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener,
})
Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener,
})

// Test component that uses useIsMobile
function TestMobileComponent() {
  const isMobile = useIsMobile()
  return <div data-testid="mobile-status">{isMobile ? 'mobile' : 'desktop'}</div>
}

// Test component that uses SidebarProvider
function TestSidebarComponent() {
  return (
    <SidebarProvider>
      <div data-testid="sidebar-content">Sidebar Content</div>
    </SidebarProvider>
  )
}

describe('Event Listener Hydration Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock matchMedia to return a media query list
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useIsMobile hook', () => {
    it('should not add event listeners during SSR', () => {
      // Mock SSR environment (window is undefined)
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      render(<TestMobileComponent />)

      // Should not have called matchMedia or addEventListener
      expect(mockMatchMedia).not.toHaveBeenCalled()
      expect(mockAddEventListener).not.toHaveBeenCalled()

      // Restore window
      global.window = originalWindow
    })

    it('should add event listeners only on client side', () => {
      const mockMql = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      mockMatchMedia.mockReturnValue(mockMql)

      render(<TestMobileComponent />)

      // Should have called matchMedia and addEventListener
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
      expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should clean up event listeners on unmount', () => {
      const mockMql = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      mockMatchMedia.mockReturnValue(mockMql)

      const { unmount } = render(<TestMobileComponent />)
      
      // Verify listener was added
      expect(mockMql.addEventListener).toHaveBeenCalled()
      
      // Unmount and verify cleanup
      unmount()
      expect(mockMql.removeEventListener).toHaveBeenCalled()
    })
  })

  describe('SidebarProvider keyboard shortcuts', () => {
    it('should not add keyboard event listeners before hydration', () => {
      // Mock not hydrated
      vi.mocked(useHydrated).mockReturnValue({ isHydrated: false })

      render(<TestSidebarComponent />)

      // Should not have added keyboard event listeners
      expect(mockAddEventListener).not.toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should add keyboard event listeners after hydration', async () => {
      // Mock hydrated
      vi.mocked(useHydrated).mockReturnValue({ isHydrated: true })

      render(<TestSidebarComponent />)

      // Should have added keyboard event listeners
      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      })
    })

    it('should clean up keyboard event listeners on unmount', async () => {
      // Mock hydrated
      vi.mocked(useHydrated).mockReturnValue({ isHydrated: true })

      const { unmount } = render(<TestSidebarComponent />)

      // Wait for event listener to be added
      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      })

      // Unmount and verify cleanup
      unmount()
      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Custom event listeners', () => {
    it('should guard against SSR for custom events', () => {
      // Mock SSR environment
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      // This should not throw an error
      expect(() => {
        // Simulate the pattern used in NFT Gallery and Marketplace components
        if (typeof window !== 'undefined') {
          window.addEventListener('nft-event', () => {})
        }
      }).not.toThrow()

      // Restore window
      global.window = originalWindow
    })

    it('should add custom event listeners only on client', () => {
      const handler = vi.fn()
      
      // Simulate the pattern used in components
      if (typeof window !== 'undefined') {
        window.addEventListener('nft-event', handler)
      }

      expect(mockAddEventListener).toHaveBeenCalledWith('nft-event', handler)
    })
  })
})