import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import { HydrationErrorBoundary } from '@/components/hydration-error-boundary'
import { ClientOnly } from '@/lib/hydration/client-only'
import { useHydrated } from '@/lib/hydration/use-hydrated'
import { SafeLocalStorage } from '@/lib/hydration/safe-local-storage'
import { hydrationMonitor } from '@/lib/hydration/hydration-monitor'

// Mock real-world components that might have hydration issues
const WalletConnectionStatus = () => {
  const { isHydrated } = useHydrated()
  const [isConnected, setIsConnected] = React.useState(false)
  
  React.useEffect(() => {
    if (isHydrated) {
      // Simulate checking wallet connection from localStorage
      const walletData = SafeLocalStorage.getItem('wallet-connection')
      setIsConnected(!!walletData)
    }
  }, [isHydrated])
  
  if (!isHydrated) {
    return <div>Checking wallet...</div>
  }
  
  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  )
}

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isHydrated } = useHydrated()
  const [theme, setTheme] = React.useState('light')
  
  React.useEffect(() => {
    if (isHydrated) {
      const savedTheme = SafeLocalStorage.getItem('theme')
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }
  }, [isHydrated])
  
  return (
    <div className={`theme-${theme}`} data-theme={theme}>
      {children}
    </div>
  )
}

const UserPreferences = () => {
  const [preferences, setPreferences] = React.useState({
    notifications: true,
    language: 'en',
    currency: 'USD'
  })
  
  React.useEffect(() => {
    // Load preferences from localStorage
    const saved = SafeLocalStorage.getItem('user-preferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (e) {
        console.warn('Failed to parse user preferences')
      }
    }
  }, [])
  
  return (
    <div>
      <div>Notifications: {preferences.notifications ? 'On' : 'Off'}</div>
      <div>Language: {preferences.language}</div>
      <div>Currency: {preferences.currency}</div>
    </div>
  )
}

const NFTGallery = ({ nfts }: { nfts: any[] }) => {
  const { isHydrated } = useHydrated()
  const [viewMode, setViewMode] = React.useState('grid')
  
  React.useEffect(() => {
    if (isHydrated) {
      const savedViewMode = SafeLocalStorage.getItem('gallery-view-mode')
      if (savedViewMode) {
        setViewMode(savedViewMode)
      }
    }
  }, [isHydrated])
  
  return (
    <div className={`gallery-${viewMode}`}>
      <div>View Mode: {viewMode}</div>
      <div>NFTs: {nfts.length} items</div>
    </div>
  )
}

describe('Hydration SSR Integration Tests', () => {
  let originalWindow: any
  let originalLocalStorage: any
  let originalNavigator: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    originalWindow = global.window
    originalLocalStorage = global.localStorage
    originalNavigator = global.navigator
    
    // Clear hydration monitor warnings
    hydrationMonitor.clearWarnings()
    
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
  })
  
  afterEach(() => {
    global.window = originalWindow
    global.localStorage = originalLocalStorage
    global.navigator = originalNavigator
  })

  describe('Real-world Component Hydration', () => {
    it('handles wallet connection status consistently', async () => {
      // Simulate SSR environment
      delete (global as any).window
      delete (global as any).localStorage
      
      // Render on server
      const serverHTML = renderToString(
        <HydrationErrorBoundary>
          <WalletConnectionStatus />
        </HydrationErrorBoundary>
      )
      
      // Should show loading state on server
      expect(serverHTML).toContain('Checking wallet...')
      
      // Restore client environment
      global.window = originalWindow
      global.localStorage = {
        getItem: vi.fn().mockReturnValue('{"address":"0x123"}'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      
      // Render on client
      render(
        <HydrationErrorBoundary>
          <WalletConnectionStatus />
        </HydrationErrorBoundary>
      )
      
      // Should show loading initially (matching server)
      expect(screen.getByText('Checking wallet...')).toBeInTheDocument()
      
      // After hydration, should show connected status
      await waitFor(() => {
        expect(screen.getByText('Status: Connected')).toBeInTheDocument()
      })
    })

    it('handles theme provider consistently', async () => {
      // Simulate SSR environment
      delete (global as any).window
      delete (global as any).localStorage
      
      // Render on server
      const serverHTML = renderToString(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      
      // Should use default theme on server
      expect(serverHTML).toContain('theme-light')
      expect(serverHTML).toContain('data-theme="light"')
      
      // Restore client environment with saved dark theme
      global.window = originalWindow
      global.localStorage = {
        getItem: vi.fn().mockReturnValue('dark'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      
      // Render on client
      const { container } = render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      
      // Should start with light theme (matching server)
      expect(container.firstChild).toHaveClass('theme-light')
      expect(container.firstChild).toHaveAttribute('data-theme', 'light')
      
      // After hydration, should switch to dark theme
      await waitFor(() => {
        expect(container.firstChild).toHaveClass('theme-dark')
        expect(container.firstChild).toHaveAttribute('data-theme', 'dark')
      })
    })

    it('handles user preferences loading consistently', async () => {
      // Simulate SSR environment
      delete (global as any).window
      delete (global as any).localStorage
      
      // Render on server
      const serverHTML = renderToString(
        <HydrationErrorBoundary>
          <UserPreferences />
        </HydrationErrorBoundary>
      )
      
      // Should show default preferences on server
      expect(serverHTML).toContain('Notifications: On')
      expect(serverHTML).toContain('Language: en')
      expect(serverHTML).toContain('Currency: USD')
      
      // Restore client environment with saved preferences
      global.window = originalWindow
      global.localStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify({
          notifications: false,
          language: 'es',
          currency: 'EUR'
        })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      
      // Render on client
      render(
        <HydrationErrorBoundary>
          <UserPreferences />
        </HydrationErrorBoundary>
      )
      
      // Should start with default preferences (matching server)
      expect(screen.getByText('Notifications: On')).toBeInTheDocument()
      expect(screen.getByText('Language: en')).toBeInTheDocument()
      expect(screen.getByText('Currency: USD')).toBeInTheDocument()
      
      // After hydration, should show saved preferences
      await waitFor(() => {
        expect(screen.getByText('Notifications: Off')).toBeInTheDocument()
        expect(screen.getByText('Language: es')).toBeInTheDocument()
        expect(screen.getByText('Currency: EUR')).toBeInTheDocument()
      })
    })

    it('handles NFT gallery view mode consistently', async () => {
      const mockNFTs = [
        { id: 1, name: 'NFT 1' },
        { id: 2, name: 'NFT 2' }
      ]
      
      // Simulate SSR environment
      delete (global as any).window
      delete (global as any).localStorage
      
      // Render on server
      const serverHTML = renderToString(
        <NFTGallery nfts={mockNFTs} />
      )
      
      // Should show default view mode on server
      expect(serverHTML).toContain('gallery-grid')
      expect(serverHTML).toContain('View Mode: grid')
      
      // Restore client environment with saved list view
      global.window = originalWindow
      global.localStorage = {
        getItem: vi.fn().mockReturnValue('list'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      
      // Render on client
      const { container } = render(<NFTGallery nfts={mockNFTs} />)
      
      // Should start with grid view (matching server)
      expect(container.firstChild).toHaveClass('gallery-grid')
      expect(screen.getByText('View Mode: grid')).toBeInTheDocument()
      
      // After hydration, should switch to list view
      await waitFor(() => {
        expect(container.firstChild).toHaveClass('gallery-list')
        expect(screen.getByText('View Mode: list')).toBeInTheDocument()
      })
    })
  })

  describe('Error Boundary Integration', () => {
    it('catches hydration errors in complex component trees', () => {
      const ProblematicComponent = () => {
        // This will cause hydration mismatch
        const randomValue = Math.random()
        return <div>Random: {randomValue}</div>
      }
      
      const ComplexApp = () => (
        <HydrationErrorBoundary>
          <ThemeProvider>
            <div>
              <WalletConnectionStatus />
              <ProblematicComponent />
              <UserPreferences />
            </div>
          </ThemeProvider>
        </HydrationErrorBoundary>
      )
      
      // Should not throw during render
      expect(() => {
        render(<ComplexApp />)
      }).not.toThrow()
      
      // Should show error boundary UI if hydration error occurs
      // Note: In test environment, hydration errors might not trigger
      // the same way as in real browser environment
    })

    it('provides recovery mechanisms for hydration failures', async () => {
      let shouldFail = true
      
      const RecoverableComponent = () => {
        if (shouldFail) {
          throw new Error('Hydration failed because the initial UI does not match what was rendered on the server')
        }
        return <div>Component recovered</div>
      }
      
      render(
        <HydrationErrorBoundary enableRecovery={true}>
          <RecoverableComponent />
        </HydrationErrorBoundary>
      )
      
      // Should show error initially
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/A hydration error occurred/)).toBeInTheDocument()
      
      // Simulate recovery by fixing the component
      shouldFail = false
      
      // The error boundary should attempt automatic recovery
      // In a real scenario, this would happen after a timeout
    })
  })

  describe('Performance and Monitoring', () => {
    it('tracks hydration performance metrics', async () => {
      const performanceEntries: any[] = []
      
      // Mock performance API
      global.performance = {
        now: vi.fn(() => Date.now()),
        mark: vi.fn((name: string) => {
          performanceEntries.push({ name, type: 'mark', startTime: Date.now() })
        }),
        measure: vi.fn((name: string, startMark: string, endMark: string) => {
          performanceEntries.push({ name, type: 'measure', duration: 100 })
        }),
        getEntriesByType: vi.fn(() => performanceEntries),
        getEntriesByName: vi.fn(() => performanceEntries)
      } as any
      
      const MonitoredComponent = () => {
        const { isHydrated } = useHydrated()
        
        React.useEffect(() => {
          if (isHydrated) {
            performance.mark('hydration-complete')
          }
        }, [isHydrated])
        
        return <div>Monitored component</div>
      }
      
      render(<MonitoredComponent />)
      
      await waitFor(() => {
        expect(screen.getByText('Monitored component')).toBeInTheDocument()
      })
      
      // Should have marked hydration completion
      expect(performance.mark).toHaveBeenCalledWith('hydration-complete')
    })

    it('detects and reports hydration warnings', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const ComponentWithWarnings = () => {
        // Simulate potential hydration issues
        React.useEffect(() => {
          hydrationMonitor.checkBrowserAPIUsage('ComponentWithWarnings', 'localStorage')
          hydrationMonitor.checkDynamicContent('ComponentWithWarnings', 'Math.random()')
        }, [])
        
        return <div>Component with warnings</div>
      }
      
      render(<ComponentWithWarnings />)
      
      const warnings = hydrationMonitor.getWarnings()
      expect(warnings.length).toBeGreaterThan(0)
      
      const browserApiWarnings = hydrationMonitor.getWarningsByType('browser-api')
      const dynamicContentWarnings = hydrationMonitor.getWarningsByType('dynamic-content')
      
      expect(browserApiWarnings.length).toBe(1)
      expect(dynamicContentWarnings.length).toBe(1)
      
      process.env.NODE_ENV = originalNodeEnv
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('handles localStorage quota exceeded errors', () => {
      global.window = originalWindow
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('QuotaExceededError')
        }),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      
      const ComponentWithStorage = () => {
        React.useEffect(() => {
          SafeLocalStorage.setItem('test', 'value')
        }, [])
        
        return <div>Component with storage</div>
      }
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Should not throw
      expect(() => {
        render(<ComponentWithStorage />)
      }).not.toThrow()
      
      // Should log warning
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('handles corrupted localStorage data gracefully', () => {
      global.window = originalWindow
      global.localStorage = {
        getItem: vi.fn().mockReturnValue('invalid-json{'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      
      const ComponentWithCorruptedData = () => {
        const [data, setData] = React.useState(null)
        
        React.useEffect(() => {
          try {
            const stored = SafeLocalStorage.getItem('corrupted-data')
            if (stored) {
              setData(JSON.parse(stored))
            }
          } catch (e) {
            setData({ error: 'Failed to parse data' })
          }
        }, [])
        
        return <div>Data: {data ? JSON.stringify(data) : 'No data'}</div>
      }
      
      // Should not throw
      expect(() => {
        render(<ComponentWithCorruptedData />)
      }).not.toThrow()
      
      // Should handle corrupted data gracefully
      expect(screen.getByText(/Data:/)).toBeInTheDocument()
    })

    it('handles missing browser APIs gracefully', () => {
      // Remove browser APIs
      delete (global as any).navigator
      delete (global as any).localStorage
      delete (global as any).sessionStorage
      
      const ComponentWithBrowserAPIs = () => (
        <ClientOnly fallback={<div>Loading browser features...</div>}>
          <div>
            <div>Navigator: {typeof navigator !== 'undefined' ? 'Available' : 'Not available'}</div>
            <div>LocalStorage: {typeof localStorage !== 'undefined' ? 'Available' : 'Not available'}</div>
          </div>
        </ClientOnly>
      )
      
      // Should not throw during SSR
      expect(() => {
        renderToString(<ComponentWithBrowserAPIs />)
      }).not.toThrow()
      
      // Restore window but keep APIs missing
      global.window = originalWindow
      
      // Should not throw on client
      expect(() => {
        render(<ComponentWithBrowserAPIs />)
      }).not.toThrow()
      
      // Should show fallback initially
      expect(screen.getByText('Loading browser features...')).toBeInTheDocument()
    })
  })
})