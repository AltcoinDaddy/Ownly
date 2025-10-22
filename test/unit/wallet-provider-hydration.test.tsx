import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { WalletProvider, useWallet } from '@/lib/wallet-context'
import * as fcl from '@onflow/fcl'

// Mock FCL
vi.mock('@onflow/fcl', () => ({
  currentUser: {
    subscribe: vi.fn(),
  },
  authenticate: vi.fn(),
  unauthenticate: vi.fn(),
}))

// Mock Flow config
vi.mock('@/lib/flow/config', () => ({}))

// Mock hydration utilities
vi.mock('@/lib/hydration/use-hydrated', () => ({
  useHydrated: vi.fn(),
}))

vi.mock('@/lib/hydration/safe-local-storage', () => ({
  SafeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}))

// Mock the actual import path used by WalletProvider
vi.mock('../../lib/hydration/safe-local-storage', () => ({
  SafeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}))

vi.mock('../../lib/hydration/use-hydrated', () => ({
  useHydrated: vi.fn(),
}))

import { useHydrated } from '@/lib/hydration/use-hydrated'
import { SafeLocalStorage } from '@/lib/hydration/safe-local-storage'

// Test component to access wallet context
function TestComponent() {
  const { isConnected, user, address, connect, disconnect } = useWallet()
  
  return (
    <div>
      <div data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="address">{address || 'no-address'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <button onClick={connect} data-testid="connect-btn">Connect</button>
      <button onClick={disconnect} data-testid="disconnect-btn">Disconnect</button>
    </div>
  )
}

describe('WalletProvider Hydration', () => {
  const mockUser = {
    addr: '0x1234567890abcdef',
    cid: 'test-cid',
    loggedIn: true,
    services: []
  }

  const savedUserData = {
    id: mockUser.addr,
    username: mockUser.addr.slice(0, 8),
    displayName: mockUser.addr.slice(0, 8),
    avatar: `/placeholder.svg?height=100&width=100&query=avatar`,
    bio: "Flow blockchain user",
    walletAddress: mockUser.addr,
    verified: false,
    joinedAt: new Date().toISOString(),
    nftsOwned: 0,
    nftsCreated: 0,
  }

  let mockSubscribe: ReturnType<typeof vi.fn>
  let mockAuthenticate: ReturnType<typeof vi.fn>
  let mockUnauthenticate: ReturnType<typeof vi.fn>
  let mockUseHydrated: ReturnType<typeof vi.fn>
  let mockSafeLocalStorage: {
    getItem: ReturnType<typeof vi.fn>
    setItem: ReturnType<typeof vi.fn>
    removeItem: ReturnType<typeof vi.fn>
    clear: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockSubscribe = vi.mocked(fcl.currentUser.subscribe)
    mockAuthenticate = vi.mocked(fcl.authenticate)
    mockUnauthenticate = vi.mocked(fcl.unauthenticate)
    mockUseHydrated = vi.mocked(useHydrated)
    mockSafeLocalStorage = {
      getItem: vi.mocked(SafeLocalStorage.getItem),
      setItem: vi.mocked(SafeLocalStorage.setItem),
      removeItem: vi.mocked(SafeLocalStorage.removeItem),
      clear: vi.mocked(SafeLocalStorage.clear),
    }
    
    // Reset all mocks
    mockSubscribe.mockClear()
    mockAuthenticate.mockClear()
    mockUnauthenticate.mockClear()
    mockUseHydrated.mockClear()
    mockSafeLocalStorage.getItem.mockClear()
    mockSafeLocalStorage.setItem.mockClear()
    mockSafeLocalStorage.removeItem.mockClear()
    mockSafeLocalStorage.clear.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should not access localStorage or FCL before hydration', () => {
    // Mock not hydrated state
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    // Mock subscribe to not be called
    mockSubscribe.mockImplementation(() => vi.fn())

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // Should not access localStorage before hydration
    expect(mockSafeLocalStorage.getItem).not.toHaveBeenCalled()
    
    // Should not set up FCL subscription before hydration
    expect(mockSubscribe).not.toHaveBeenCalled()
    
    // Should show disconnected state
    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
    expect(screen.getByTestId('address')).toHaveTextContent('no-address')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should attempt to load saved user data after hydration', async () => {
    // Mock hydration complete
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null) // No saved data
    mockSubscribe.mockImplementation((callback) => {
      callback(null) // No current FCL user
      return vi.fn()
    })

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // Should access localStorage after hydration
    await waitFor(() => {
      expect(mockSafeLocalStorage.getItem).toHaveBeenCalledWith('ownly_user')
    })

    // Should remain in disconnected state when no saved data
    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should handle corrupted localStorage data gracefully', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue('invalid-json')
    mockSubscribe.mockImplementation((callback) => {
      callback(null)
      return vi.fn()
    })

    // Spy on console.warn to check error handling
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    await waitFor(() => {
      expect(mockSafeLocalStorage.getItem).toHaveBeenCalledWith('ownly_user')
    })

    // Should handle corrupted data gracefully
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse saved user data:',
      expect.any(Error)
    )
    
    // Should remove corrupted data
    expect(mockSafeLocalStorage.removeItem).toHaveBeenCalledWith('ownly_user')
    
    // Should show disconnected state
    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')

    consoleSpy.mockRestore()
  })

  it('should prevent wallet operations before hydration', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    // Spy on console.warn
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    const connectBtn = screen.getByTestId('connect-btn')
    const disconnectBtn = screen.getByTestId('disconnect-btn')

    // Try to connect before hydration
    await act(async () => {
      await connectBtn.click()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Cannot connect wallet before hydration')
    expect(mockAuthenticate).not.toHaveBeenCalled()

    // Try to disconnect before hydration
    await act(async () => {
      await disconnectBtn.click()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Cannot disconnect wallet before hydration')
    expect(mockUnauthenticate).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should set up FCL subscription only after hydration', async () => {
    // Start not hydrated
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    const { rerender } = render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // Should not set up subscription yet
    expect(mockSubscribe).not.toHaveBeenCalled()

    // Mock hydration complete
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null)
    
    let subscribeCallback: ((user: any) => void) | null = null
    mockSubscribe.mockImplementation((callback) => {
      subscribeCallback = callback
      callback(null) // Initial state
      return vi.fn() // unsubscribe function
    })

    // Re-render to trigger hydration effect
    rerender(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledOnce()
    })

    // Simulate FCL user change
    await act(async () => {
      subscribeCallback?.(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
      expect(screen.getByTestId('address')).toHaveTextContent(mockUser.addr)
    })

    // Should save user data to localStorage
    expect(mockSafeLocalStorage.setItem).toHaveBeenCalledWith(
      'ownly_user',
      expect.stringContaining(mockUser.addr)
    )
  })

  it('should maintain consistent state between server and client', () => {
    // Test that initial state is consistent regardless of hydration status
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    const { rerender } = render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // Initial state should be consistent
    const initialConnectionStatus = screen.getByTestId('connection-status').textContent
    const initialAddress = screen.getByTestId('address').textContent
    const initialUser = screen.getByTestId('user').textContent

    expect(initialConnectionStatus).toBe('disconnected')
    expect(initialAddress).toBe('no-address')
    expect(initialUser).toBe('no-user')

    // Mock hydration without saved data
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null)
    mockSubscribe.mockImplementation((callback) => {
      callback(null)
      return vi.fn()
    })

    // Re-render after hydration
    rerender(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // State should remain consistent
    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
    expect(screen.getByTestId('address')).toHaveTextContent('no-address')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should handle FCL subscription cleanup properly', () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null)
    
    const mockUnsubscribe = vi.fn()
    mockSubscribe.mockImplementation((callback) => {
      callback(null)
      return mockUnsubscribe
    })

    const { unmount } = render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // Unmount to trigger cleanup
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })
})