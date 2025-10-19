import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('WalletContext', () => {
  const mockUser = {
    addr: '0x1234567890abcdef',
    cid: 'test-cid',
    loggedIn: true,
    services: []
  }

  let mockSubscribe: ReturnType<typeof vi.fn>
  let mockAuthenticate: ReturnType<typeof vi.fn>
  let mockUnauthenticate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSubscribe = vi.mocked(fcl.currentUser.subscribe)
    mockAuthenticate = vi.mocked(fcl.authenticate)
    mockUnauthenticate = vi.mocked(fcl.unauthenticate)
    
    // Reset mocks
    mockSubscribe.mockClear()
    mockAuthenticate.mockClear()
    mockUnauthenticate.mockClear()
    
    // Clear localStorage
    vi.mocked(localStorage.setItem).mockClear()
    vi.mocked(localStorage.removeItem).mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with disconnected state', () => {
    // Mock subscribe to call callback with no user
    mockSubscribe.mockImplementation((callback) => {
      callback(null)
      return vi.fn() // unsubscribe function
    })

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
    expect(screen.getByTestId('address')).toHaveTextContent('no-address')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should handle successful wallet connection', async () => {
    let subscribeCallback: ((user: any) => void) | null = null
    
    // Mock subscribe to capture callback
    mockSubscribe.mockImplementation((callback) => {
      subscribeCallback = callback
      callback(null) // Initial state
      return vi.fn() // unsubscribe function
    })

    mockAuthenticate.mockResolvedValue(undefined)

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    const connectBtn = screen.getByTestId('connect-btn')
    
    // Trigger connection
    await act(async () => {
      await userEvent.click(connectBtn)
    })

    expect(mockAuthenticate).toHaveBeenCalledOnce()

    // Simulate FCL calling the subscribe callback with user data
    await act(async () => {
      subscribeCallback?.(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
      expect(screen.getByTestId('address')).toHaveTextContent(mockUser.addr)
    })

    // Check that user data was stored in localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'ownly_user',
      expect.stringContaining(mockUser.addr)
    )
  })

  it('should handle wallet connection error', async () => {
    mockSubscribe.mockImplementation((callback) => {
      callback(null)
      return vi.fn()
    })

    const connectionError = new Error('Connection failed')
    mockAuthenticate.mockRejectedValue(connectionError)

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    const connectBtn = screen.getByTestId('connect-btn')
    
    await expect(async () => {
      await act(async () => {
        await userEvent.click(connectBtn)
      })
    }).rejects.toThrow('Connection failed')

    expect(mockAuthenticate).toHaveBeenCalledOnce()
  })

  it('should handle wallet disconnection', async () => {
    let subscribeCallback: ((user: any) => void) | null = null
    
    mockSubscribe.mockImplementation((callback) => {
      subscribeCallback = callback
      callback(mockUser) // Start connected
      return vi.fn()
    })

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // Should start connected
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
    })

    const disconnectBtn = screen.getByTestId('disconnect-btn')
    
    // Trigger disconnection
    await act(async () => {
      await userEvent.click(disconnectBtn)
    })

    expect(mockUnauthenticate).toHaveBeenCalledOnce()

    // Simulate FCL calling the subscribe callback with null user
    await act(async () => {
      subscribeCallback?.(null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
      expect(screen.getByTestId('address')).toHaveTextContent('no-address')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    // Check that user data was removed from localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith('ownly_user')
  })

  it('should create proper user profile from Flow user', async () => {
    let subscribeCallback: ((user: any) => void) | null = null
    
    mockSubscribe.mockImplementation((callback) => {
      subscribeCallback = callback
      callback(null) // Start disconnected
      return vi.fn()
    })

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    )

    // Simulate user connection
    await act(async () => {
      subscribeCallback?.(mockUser)
    })

    await waitFor(() => {
      const userText = screen.getByTestId('user').textContent
      const userData = JSON.parse(userText!)
      
      expect(userData).toMatchObject({
        id: mockUser.addr,
        address: mockUser.addr,
        username: mockUser.addr.slice(0, 8),
        verified: false,
        followers: 0,
        following: 0,
      })
      expect(userData.avatar).toContain('placeholder.svg')
      expect(userData.bio).toBe('Flow blockchain user')
      expect(userData.joinedDate).toBeDefined()
    })
  })

  it('should throw error when useWallet is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useWallet must be used within a WalletProvider')
    
    consoleSpy.mockRestore()
  })

  it('should handle FCL subscription cleanup', () => {
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

    // Unmount component to trigger cleanup
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })
})