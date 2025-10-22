import { vi } from 'vitest'

/**
 * Specialized setup for hydration testing
 * Provides utilities and mocks specific to SSR/client consistency testing
 */

// Enhanced localStorage mock for hydration testing
const createLocalStorageMock = () => {
  const store = new Map<string, string>()
  
  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
    get length() {
      return store.size
    },
    key: vi.fn((index: number) => {
      const keys = Array.from(store.keys())
      return keys[index] || null
    })
  }
}

// Enhanced sessionStorage mock
const createSessionStorageMock = () => {
  const store = new Map<string, string>()
  
  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
    get length() {
      return store.size
    },
    key: vi.fn((index: number) => {
      const keys = Array.from(store.keys())
      return keys[index] || null
    })
  }
}

// Mock window object for hydration testing
const createWindowMock = () => ({
  innerWidth: 1024,
  innerHeight: 768,
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn()
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Test Environment)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    share: vi.fn().mockResolvedValue(undefined)
  },
  document: global.document,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: vi.fn(),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval
})

// Setup hydration testing environment
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks()
  
  // Create fresh storage mocks
  Object.defineProperty(global, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
    configurable: true
  })
  
  Object.defineProperty(global, 'sessionStorage', {
    value: createSessionStorageMock(),
    writable: true,
    configurable: true
  })
  
  // Create window mock
  Object.defineProperty(global, 'window', {
    value: createWindowMock(),
    writable: true,
    configurable: true
  })
  
  // Mock performance API for hydration timing
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      memory: {
        usedJSHeapSize: 1024 * 1024 * 10, // 10MB
        totalJSHeapSize: 1024 * 1024 * 20, // 20MB
        jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
      }
    },
    writable: true,
    configurable: true
  })
  
  // Mock IntersectionObserver for component visibility testing
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }))
  
  // Mock ResizeObserver for responsive testing
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
  
  // Mock MutationObserver for DOM change testing
  global.MutationObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  }))
})

// Cleanup after each test
afterEach(() => {
  // Clear all timers
  vi.clearAllTimers()
  
  // Reset DOM
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  
  // Clear any global state
  if (typeof window !== 'undefined') {
    // Clear event listeners
    window.removeEventListener = vi.fn()
  }
})

// Utility functions for hydration testing
export const hydrationTestUtils = {
  /**
   * Simulate SSR environment by removing window and browser APIs
   */
  simulateSSR: () => {
    delete (global as any).window
    delete (global as any).localStorage
    delete (global as any).sessionStorage
    delete (global as any).navigator
    delete (global as any).document
  },
  
  /**
   * Restore client environment
   */
  restoreClient: () => {
    Object.defineProperty(global, 'window', {
      value: createWindowMock(),
      writable: true,
      configurable: true
    })
    
    Object.defineProperty(global, 'localStorage', {
      value: createLocalStorageMock(),
      writable: true,
      configurable: true
    })
    
    Object.defineProperty(global, 'sessionStorage', {
      value: createSessionStorageMock(),
      writable: true,
      configurable: true
    })
    
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Test Environment)',
        language: 'en-US',
        languages: ['en-US', 'en'],
        onLine: true,
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
          readText: vi.fn().mockResolvedValue(''),
        },
        share: vi.fn().mockResolvedValue(undefined)
      },
      writable: true,
      configurable: true
    })
  },
  
  /**
   * Wait for hydration to complete
   */
  waitForHydration: async (timeout = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now()
      
      const checkHydration = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Hydration timeout'))
          return
        }
        
        // Check for hydration markers
        const hasHydrated = document.querySelector('[data-hydrated="true"]') ||
                           document.querySelector('.hydrated') ||
                           (global as any).React
        
        if (hasHydrated) {
          resolve()
        } else {
          setTimeout(checkHydration, 10)
        }
      }
      
      checkHydration()
    })
  },
  
  /**
   * Compare server and client rendered HTML
   */
  compareSSRClientHTML: (serverHTML: string, clientHTML: string) => {
    // Normalize whitespace and remove React-specific attributes
    const normalize = (html: string) => {
      return html
        .replace(/\s+/g, ' ')
        .replace(/data-reactroot="[^"]*"/g, '')
        .replace(/data-react-[^=]*="[^"]*"/g, '')
        .trim()
    }
    
    return normalize(serverHTML) === normalize(clientHTML)
  },
  
  /**
   * Mock localStorage with specific data
   */
  mockLocalStorageData: (data: Record<string, string>) => {
    const mockStorage = createLocalStorageMock()
    
    Object.entries(data).forEach(([key, value]) => {
      mockStorage.setItem(key, value)
    })
    
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    })
    
    return mockStorage
  },
  
  /**
   * Simulate hydration error
   */
  simulateHydrationError: (message = 'Hydration failed') => {
    const error = new Error(message)
    error.name = 'HydrationError'
    
    // Dispatch error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new ErrorEvent('error', {
        error,
        message,
        filename: 'test.js',
        lineno: 1,
        colno: 1
      }))
    }
    
    return error
  }
}

// Make utils available globally for tests
declare global {
  var hydrationTestUtils: typeof hydrationTestUtils
}

global.hydrationTestUtils = hydrationTestUtils