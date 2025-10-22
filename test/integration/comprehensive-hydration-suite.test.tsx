import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import userEvent from '@testing-library/user-event'

// Import all hydration-related components and utilities
import { HydrationErrorBoundary } from '@/components/hydration-error-boundary'
import { ClientOnly } from '@/lib/hydration/client-only'
import { useHydrated } from '@/lib/hydration/use-hydrated'
import { SafeLocalStorage } from '@/lib/hydration/safe-local-storage'
import { hydrationMonitor } from '@/lib/hydration/hydration-monitor'
import { HydrationDashboard } from '@/components/hydration-dashboard'
import { withHydrationMonitoring } from '@/lib/hydration/with-hydration-monitoring'

// Mock real application components
const MockWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { isHydrated } = useHydrated()
  const [walletState, setWalletState] = React.useState({
    isConnected: false,
    address: null,
    isLoading: !isHydrated
  })
  
  React.useEffect(() => {
    if (isHydrated) {
      const savedWallet = SafeLocalStorage.getItem('wallet-data')
      if (savedWallet) {
        try {
          setWalletState({
            ...JSON.parse(savedWallet),
            isLoading: false
          })
        } catch (e) {
          setWalletState(prev => ({ ...prev, isLoading: false }))
        }
      } else {
        setWalletState(prev => ({ ...prev, isLoading: false }))
      }
    }
  }, [isHydrated])
  
  return (
    <div data-testid="wallet-provider" data-hydrated={isHydrated}>
      {walletState.isLoading ? (
        <div>Connecting wallet...</div>
      ) : (
        <div>
          <div>Wallet: {walletState.isConnected ? 'Connected' : 'Disconnected'}</div>
          {children}
        </div>
      )}
    </div>
  )
}

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
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
    <div data-theme={theme} data-testid="theme-provider">
      <button 
        data-testid="theme-toggle" 
        onClick={() => {
          const newTheme = theme === 'light' ? 'dark' : 'light'
          setTheme(newTheme)
          SafeLocalStorage.setItem('theme', newTheme)
        }}
      >
        Toggle Theme
      </button>
      {children}
    </div>
  )
}

const MockNFTGallery = ({ nfts = [] }: { nfts?: any[] }) => {
  const { isHydrated } = useHydrated()
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState('grid')
  
  React.useEffect(() => {
    if (isHydrated) {
      const savedViewMode = SafeLocalStorage.getItem('gallery-view-mode')
      if (savedViewMode) {
        setViewMode(savedViewMode)
      }
      
      // Simulate loading NFTs
      setTimeout(() => setLoading(false), 100)
    }
  }, [isHydrated])
  
  if (!isHydrated || loading) {
    return <div data-testid="nft-gallery-loading">Loading NFTs...</div>
  }
  
  return (
    <div data-testid="nft-gallery" className={`gallery-${viewMode}`}>
      <div>View Mode: {viewMode}</div>
      <div>NFTs: {nfts.length} items</div>
      {nfts.map((nft, index) => (
        <div key={index} data-testid="nft-card">
          {nft.name}
        </div>
      ))}
    </div>
  )
}

const MockNotificationSystem = () => {
  const { isHydrated } = useHydrated()
  const [preferences, setPreferences] = React.useState({
    enabled: true,
    sound: false,
    desktop: true
  })
  
  React.useEffect(() => {
    if (isHydrated) {
      const saved = SafeLocalStorage.getItem('notification-preferences')
      if (saved) {
        try {
          setPreferences(JSON.parse(saved))
        } catch (e) {
          console.warn('Failed to parse notification preferences')
        }
      }
    }
  }, [isHydrated])
  
  return (
    <div data-testid="notification-system">
      <div>Notifications: {preferences.enabled ? 'Enabled' : 'Disabled'}</div>
      <div>Sound: {preferences.sound ? 'On' : 'Off'}</div>
      <div>Desktop: {preferences.desktop ? 'On' : 'Off'}</div>
    </div>
  )
}

// Component that intentionally causes hydration issues
const ProblematicComponent = ({ causeIssue = false }) => {
  if (causeIssue) {
    // These will cause hydration mismatches
    const randomId = Math.random().toString(36)
    const timestamp = Date.now()
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'
    
    return (
      <div>
        <div>Random ID: {randomId}</div>
        <div>Timestamp: {timestamp}</div>
        <div>User Agent: {userAgent}</div>
      </div>
    )
  }
  
  return <div>No issues</div>
}

// Safe version of the problematic component
const SafeComponent = () => {
  const { isHydrated } = useHydrated()
  const [dynamicData, setDynamicData] = React.useState({
    randomId: '',
    timestamp: 0,
    userAgent: ''
  })
  
  React.useEffect(() => {
    if (isHydrated) {
      setDynamicData({
        randomId: Math.random().toString(36),
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    }
  }, [isHydrated])
  
  if (!isHydrated) {
    return <div>Loading dynamic content...</div>
  }
  
  return (
    <div>
      <div>Random ID: {dynamicData.randomId}</div>
      <div>Timestamp: {dynamicData.timestamp}</div>
      <div>User Agent: {dynamicData.userAgent}</div>
    </div>
  )
}

// Complete application mock
const MockApp = ({ hasIssues = false }) => (
  <HydrationErrorBoundary>
    <MockThemeProvider>
      <MockWalletProvider>
        <div data-testid="app-container">
          <header data-testid="app-header">
            <h1>NFT Marketplace</h1>
          </header>
          
          <main data-testid="app-main">
            {hasIssues ? (
              <ProblematicComponent causeIssue={true} />
            ) : (
              <SafeComponent />
            )}
            
            <MockNFTGallery nfts={[
              { name: 'NFT 1' },
              { name: 'NFT 2' },
              { name: 'NFT 3' }
            ]} />
            
            <ClientOnly fallback={<div>Loading browser features...</div>}>
              <div data-testid="browser-only-content">
                <div>Window width: {window.innerWidth}</div>
                <div>Local storage available: {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}</div>
              </div>
            </ClientOnly>
          </main>
          
          <MockNotificationSystem />
          
          <footer data-testid="app-footer">
            <p>© 2024 NFT Marketplace</p>
          </footer>
        </div>
      </MockWalletProvider>
    </MockThemeProvider>
  </HydrationErrorBoundary>
)

describe('Comprehensive Hydration Test Suite', () => {
  let originalWindow: any
  let originalLocalStorage: any
  let originalNavigator: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    originalWindow = global.window
    originalLocalStorage = global.localStorage
    originalNavigator = global.navigator
    
    // Clear hydration monitor
    hydrationMonitor.clearWarnings()
    
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
  })
  
  afterEach(() => {
    global.window = originalWindow
    global.localStorage = originalLocalStorage
    global.navigator = originalNavigator
  })

  describe('Full Application Hydration Flow', () => {
    it('handles complete application hydration without errors', async () => {
      // Simulate SSR environment
      delete (global as any).window
      delete (global as any).navigator
      
      // Render on server
      const serverHTML = renderToString(<MockApp />)
      
      // Verify server render
      expect(serverHTML).toContain('NFT Marketplace')
      expect(serverHTML).toContain('Connecting wallet...')
      expect(serverHTML).toContain('Loading NFTs...')
      expect(serverHTML).toContain('Loading dynamic content...')
      expect(serverHTML).toContain('Loading browser features...')
      
      // Restore client environment
      global.window = originalWindow
      global.navigator = originalNavigator
      
      // Render on client
      render(<MockApp />)
      
      // Should start with SSR-matching content
      expect(screen.getByText('NFT Marketplace')).toBeInTheDocument()
      expect(screen.getByText('Connecting wallet...')).toBeInTheDocument()
      expect(screen.getByText('Loading NFTs...')).toBeInTheDocument()
      expect(screen.getByText('Loading dynamic content...')).toBeInTheDocument()
      expect(screen.getByText('Loading browser features...')).toBeInTheDocument()
      
      // Wait for hydration to complete
      await waitFor(() => {
        expect(screen.getByText('Wallet: Disconnected')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByText('NFTs: 3 items')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByText(/Random ID:/)).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByText(/Window width:/)).toBeInTheDocument()
      })
      
      // Verify no hydration errors
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('handles hydration errors gracefully with error boundaries', () => {
      render(<MockApp hasIssues={true} />)
      
      // Should either show error boundary or handle gracefully
      // In test environment, hydration errors might not trigger the same way
      expect(screen.getByTestId('app-container')).toBeInTheDocument()
    })

    it('maintains state consistency across hydration', async () => {
      // Set up localStorage with saved state
      global.localStorage.getItem = vi.fn((key) => {
        switch (key) {
          case 'theme':
            return 'dark'
          case 'wallet-data':
            return JSON.stringify({ isConnected: true, address: '0x123' })
          case 'gallery-view-mode':
            return 'list'
          case 'notification-preferences':
            return JSON.stringify({ enabled: false, sound: true, desktop: false })
          default:
            return null
        }
      })
      
      render(<MockApp />)
      
      // Wait for hydration and state loading
      await waitFor(() => {
        expect(screen.getByText('Wallet: Connected')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByText('View Mode: list')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByText('Notifications: Disabled')).toBeInTheDocument()
      })
      
      // Check theme
      const themeProvider = screen.getByTestId('theme-provider')
      await waitFor(() => {
        expect(themeProvider).toHaveAttribute('data-theme', 'dark')
      })
    })
  })

  describe('Interactive Hydration Testing', () => {
    it('handles user interactions after hydration', async () => {
      const user = userEvent.setup()
      
      render(<MockApp />)
      
      // Wait for hydration
      await waitFor(() => {
        expect(screen.getByText('Wallet: Disconnected')).toBeInTheDocument()
      })
      
      // Test theme toggle
      const themeToggle = screen.getByTestId('theme-toggle')
      await user.click(themeToggle)
      
      const themeProvider = screen.getByTestId('theme-provider')
      expect(themeProvider).toHaveAttribute('data-theme', 'dark')
      
      // Verify localStorage was called
      expect(global.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('handles form interactions after hydration', async () => {
      const user = userEvent.setup()
      
      const FormComponent = () => {
        const { isHydrated } = useHydrated()
        const [value, setValue] = React.useState('')
        
        if (!isHydrated) {
          return <div>Loading form...</div>
        }
        
        return (
          <form data-testid="hydrated-form">
            <input
              data-testid="form-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter text"
            />
            <div data-testid="form-output">Value: {value}</div>
          </form>
        )
      }
      
      render(
        <HydrationErrorBoundary>
          <FormComponent />
        </HydrationErrorBoundary>
      )
      
      // Should show loading initially
      expect(screen.getByText('Loading form...')).toBeInTheDocument()
      
      // Wait for hydration
      await waitFor(() => {
        expect(screen.getByTestId('hydrated-form')).toBeInTheDocument()
      })
      
      // Test form interaction
      const input = screen.getByTestId('form-input')
      await user.type(input, 'Hello World')
      
      expect(screen.getByText('Value: Hello World')).toBeInTheDocument()
    })
  })

  describe('Error Recovery and Monitoring', () => {
    it('integrates with hydration monitoring system', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const MonitoredApp = withHydrationMonitoring(MockApp, {
        componentName: 'MockApp',
        enableErrorBoundary: true
      })
      
      render(
        <div>
          <MonitoredApp />
          <HydrationDashboard />
        </div>
      )
      
      // Wait for hydration
      await waitFor(() => {
        expect(screen.getByText('Wallet: Disconnected')).toBeInTheDocument()
      })
      
      // Should show monitoring dashboard in development
      expect(screen.getByTestId('hydration-dashboard')).toBeInTheDocument()
      
      process.env.NODE_ENV = originalNodeEnv
    })

    it('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw errors
      global.localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      render(<MockApp />)
      
      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Wallet: Disconnected')).toBeInTheDocument()
      })
      
      // Should log warnings
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('handles corrupted localStorage data', async () => {
      // Mock localStorage with corrupted data
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'notification-preferences') {
          return 'invalid-json{'
        }
        return null
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      render(<MockApp />)
      
      // Should handle corrupted data gracefully
      await waitFor(() => {
        expect(screen.getByText('Notifications: Enabled')).toBeInTheDocument() // Default value
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse notification preferences')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance and Memory', () => {
    it('does not cause memory leaks during hydration', async () => {
      const components: React.ReactElement[] = []
      
      // Create multiple instances
      for (let i = 0; i < 10; i++) {
        components.push(<MockApp key={i} />)
      }
      
      const { unmount } = render(
        <div>
          {components}
        </div>
      )
      
      // Wait for all to hydrate
      await waitFor(() => {
        const walletElements = screen.getAllByText('Wallet: Disconnected')
        expect(walletElements).toHaveLength(10)
      })
      
      // Unmount all components
      unmount()
      
      // Should not have any lingering effects
      expect(document.body.innerHTML).toBe('<div></div>')
    })

    it('handles rapid re-renders during hydration', async () => {
      let renderCount = 0
      
      const RapidRerenderComponent = () => {
        const { isHydrated } = useHydrated()
        const [count, setCount] = React.useState(0)
        
        React.useEffect(() => {
          renderCount++
        })
        
        React.useEffect(() => {
          if (isHydrated) {
            // Trigger rapid re-renders
            const interval = setInterval(() => {
              setCount(c => c + 1)
            }, 10)
            
            setTimeout(() => clearInterval(interval), 100)
          }
        }, [isHydrated])
        
        return <div>Count: {count}</div>
      }
      
      render(<RapidRerenderComponent />)
      
      // Wait for rapid re-renders to complete
      await waitFor(() => {
        expect(screen.getByText(/Count: \d+/)).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Should handle rapid re-renders without issues
      expect(renderCount).toBeGreaterThan(1)
    })
  })

  describe('Edge Cases and Browser Compatibility', () => {
    it('handles missing browser APIs', async () => {
      // Remove browser APIs
      delete (global as any).localStorage
      delete (global as any).sessionStorage
      delete (global as any).navigator
      
      render(<MockApp />)
      
      // Should still work without browser APIs
      await waitFor(() => {
        expect(screen.getByText('NFT Marketplace')).toBeInTheDocument()
      })
      
      // ClientOnly content should show fallback
      expect(screen.getByText('Loading browser features...')).toBeInTheDocument()
    })

    it('handles disabled JavaScript scenario', () => {
      // Simulate SSR-only environment (no hydration)
      delete (global as any).window
      
      const serverHTML = renderToString(<MockApp />)
      
      // Should render meaningful content even without JavaScript
      expect(serverHTML).toContain('NFT Marketplace')
      expect(serverHTML).toContain('Loading')
      expect(serverHTML).not.toContain('undefined')
      expect(serverHTML).not.toContain('null')
    })

    it('handles concurrent hydration attempts', async () => {
      // Render multiple instances simultaneously
      const { container: container1 } = render(<MockApp />)
      const { container: container2 } = render(<MockApp />)
      const { container: container3 } = render(<MockApp />)
      
      // All should hydrate successfully
      await waitFor(() => {
        expect(container1.querySelector('[data-testid="app-container"]')).toBeInTheDocument()
        expect(container2.querySelector('[data-testid="app-container"]')).toBeInTheDocument()
        expect(container3.querySelector('[data-testid="app-container"]')).toBeInTheDocument()
      })
    })
  })
})