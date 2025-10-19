import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_FLOW_NETWORK = 'testnet'
process.env.NEXT_PUBLIC_NFT_STORAGE_KEY = 'test-key'
process.env.NEXT_PUBLIC_DAPPER_API_KEY = 'test-dapper-key'
process.env.NEXT_PUBLIC_DAPPER_BASE_URL = 'https://api.dapper.com'

// Mock global fetch
global.fetch = vi.fn()

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  },
})

// Mock AbortSignal.timeout for older Node versions
if (!AbortSignal.timeout) {
  AbortSignal.timeout = vi.fn((delay: number) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), delay)
    return controller.signal
  })
}

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}