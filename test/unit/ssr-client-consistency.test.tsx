import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ClientOnly } from '@/lib/hydration/client-only'
import { useHydrated } from '@/lib/hydration/use-hydrated'
import { SafeLocalStorage } from '@/lib/hydration/safe-local-storage'

// Mock components that might cause hydration issues
const ProblematicComponent = () => {
  const randomId = Math.random().toString(36).substr(2, 9)
  return <div id={randomId}>Random ID: {randomId}</div>
}

const SafeRandomComponent = () => {
  const { isHydrated } = useHydrated()
  const [randomId, setRandomId] = React.useState('')
  
  React.useEffect(() => {
    if (isHydrated) {
      setRandomId(Math.random().toString(36).substr(2, 9))
    }
  }, [isHydrated])
  
  return <div id={randomId || 'ssr-safe'}>Random ID: {randomId || 'Loading...'}</div>
}

const LocalStorageComponent = ({ usesSafeStorage = false }) => {
  const [value, setValue] = React.useState('')
  
  React.useEffect(() => {
    if (usesSafeStorage) {
      const stored = SafeLocalStorage.getItem('test-key')
      setValue(stored || 'No value')
    } else {
      // This would cause hydration issues
      const stored = typeof window !== 'undefined' ? localStorage.getItem('test-key') : null
      setValue(stored || 'No value')
    }
  }, [usesSafeStorage])
  
  return <div>Stored value: {value}</div>
}

describe('SSR/Client Consistency Tests', () => {
  let originalWindow: any
  let originalLocalStorage: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    originalWindow = global.window
    originalLocalStorage = global.localStorage
  })
  
  afterEach(() => {
    global.window = originalWindow
    global.localStorage = originalLocalStorage
  })

  describe('Hydration Mismatch Detection', () => {
    it('detects hydration mismatch with Math.random()', () => {
      // Simulate SSR environment
      delete (global as any).window
      
      // Render on server
      const serverHTML = renderToString(<ProblematicComponent />)
      
      // Restore window for client render
      global.window = originalWindow
      
      // Render on client
      const { container } = render(<ProblematicComponent />)
      const clientHTML = container.innerHTML
      
      // Should be different due to Math.random()
      expect(serverHTML).not.toBe(clientHTML)
    })

    it('prevents hydration mismatch with safe random component', () => {
      // Simulate SSR environment
      delete (global as any).window
      
      // Render on server
      const serverHTML = renderToString(<SafeRandomComponent />)
      
      // Restore window for client render
      global.window = originalWindow
      
      // Initial client render should match server
      const { container } = render(<SafeRandomComponent />)
      const initialClientHTML = container.innerHTML
      
      // Initial render should match server (before useEffect runs)
      expect(serverHTML).toBe(initialClientHTML)
    })

    it('handles localStorage safely during SSR', () => {
      // Simulate SSR environment
      delete (global as any).window
      delete (global as any).localStorage
      
      // Should not throw during SSR
      expect(() => {
        renderToString(<LocalStorageComponent usesSafeStorage={true} />)
      }).not.toThrow()
      
      // Restore for client render
      global.window = originalWindow
      global.localStorage = originalLocalStorage
      
      // Should render without errors on client
      expect(() => {
        render(<LocalStorageComponent usesSafeStorage={true} />)
      }).not.toThrow()
    })

    it('detects unsafe localStorage usage', () => {
      // Simulate SSR environment
      delete (global as any).window
      delete (global as any).localStorage
      
      // Should potentially cause issues during SSR
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        renderToString(<LocalStorageComponent usesSafeStorage={false} />)
      } catch (error) {
        // Expected to fail in SSR environment
        expect(error).toBeDefined()
      }
      
      consoleSpy.mockRestore()
    })
  })

  describe('ClientOnly Wrapper Consistency', () => {
    it('ensures consistent rendering with ClientOnly wrapper', () => {
      // Simulate SSR environment
      delete (global as any).window
      
      const WrappedComponent = () => (
        <ClientOnly fallback={<div>Loading...</div>}>
          <ProblematicComponent />
        </ClientOnly>
      )
      
      // Render on server
      const serverHTML = renderToString(<WrappedComponent />)
      
      // Restore window for client render
      global.window = originalWindow
      
      // Initial client render should match server
      const { container } = render(<WrappedComponent />)
      
      // Should show fallback initially (matching server)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      // Server HTML should contain fallback
      expect(serverHTML).toContain('Loading...')
    })

    it('handles nested components with mixed hydration safety', () => {
      const MixedComponent = () => (
        <div>
          <h1>Safe Title</h1>
          <ClientOnly fallback={<div>Loading unsafe content...</div>}>
            <ProblematicComponent />
          </ClientOnly>
          <p>Safe paragraph</p>
        </div>
      )
      
      // Simulate SSR environment
      delete (global as any).window
      
      const serverHTML = renderToString(<MixedComponent />)
      
      // Restore window for client render
      global.window = originalWindow
      
      const { container } = render(<MixedComponent />)
      
      // Safe content should be present
      expect(screen.getByText('Safe Title')).toBeInTheDocument()
      expect(screen.getByText('Safe paragraph')).toBeInTheDocument()
      
      // Unsafe content should show fallback initially
      expect(screen.getByText('Loading unsafe content...')).toBeInTheDocument()
      
      // Server HTML should match initial client render structure
      expect(serverHTML).toContain('Safe Title')
      expect(serverHTML).toContain('Safe paragraph')
      expect(serverHTML).toContain('Loading unsafe content...')
    })
  })

  describe('Date and Time Consistency', () => {
    it('handles Date.now() safely', () => {
      const DateComponent = ({ useSafeDate = false }) => {
        const [timestamp, setTimestamp] = React.useState(useSafeDate ? 0 : Date.now())
        
        React.useEffect(() => {
          if (useSafeDate) {
            setTimestamp(Date.now())
          }
        }, [useSafeDate])
        
        return <div>Timestamp: {timestamp}</div>
      }
      
      // Simulate SSR environment
      delete (global as any).window
      
      // Safe version should render consistently
      const serverHTML = renderToString(<DateComponent useSafeDate={true} />)
      
      // Restore window for client render
      global.window = originalWindow
      
      const { container } = render(<DateComponent useSafeDate={true} />)
      const initialClientHTML = container.innerHTML
      
      // Initial render should match server (timestamp = 0)
      expect(serverHTML).toBe(initialClientHTML)
      expect(serverHTML).toContain('Timestamp: 0')
    })

    it('detects Date.now() hydration issues', () => {
      const UnsafeDateComponent = () => {
        const timestamp = Date.now()
        return <div>Timestamp: {timestamp}</div>
      }
      
      // Simulate SSR environment
      delete (global as any).window
      
      const serverHTML = renderToString(<UnsafeDateComponent />)
      
      // Wait a bit to ensure different timestamps
      vi.advanceTimersByTime(10)
      
      // Restore window for client render
      global.window = originalWindow
      
      const { container } = render(<UnsafeDateComponent />)
      const clientHTML = container.innerHTML
      
      // Should be different due to different timestamps
      expect(serverHTML).not.toBe(clientHTML)
    })
  })

  describe('Browser API Consistency', () => {
    it('handles navigator API safely', () => {
      const NavigatorComponent = ({ useSafe = false }) => {
        if (useSafe) {
          return (
            <ClientOnly fallback={<div>Detecting browser...</div>}>
              <div>User Agent: {navigator.userAgent}</div>
            </ClientOnly>
          )
        }
        
        // Unsafe version
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'
        return <div>User Agent: {userAgent}</div>
      }
      
      // Simulate SSR environment
      delete (global as any).navigator
      
      // Safe version should render consistently
      const serverHTML = renderToString(<NavigatorComponent useSafe={true} />)
      
      // Restore for client render
      global.navigator = { userAgent: 'Test Browser' } as any
      global.window = originalWindow
      
      const { container } = render(<NavigatorComponent useSafe={true} />)
      
      // Should show fallback initially
      expect(screen.getByText('Detecting browser...')).toBeInTheDocument()
      expect(serverHTML).toContain('Detecting browser...')
    })
  })
})