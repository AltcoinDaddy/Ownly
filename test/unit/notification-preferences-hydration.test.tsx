import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useNotificationPreferences, NotificationSettings } from '@/components/notification-system'

// Mock the SafeLocalStorage
vi.mock('@/lib/hydration/safe-local-storage', () => ({
  SafeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

// Mock the useHydrated hook
vi.mock('@/lib/hydration/use-hydrated', () => ({
  useHydrated: vi.fn()
}))

// Mock the wallet context
vi.mock('@/lib/wallet-context', () => ({
  useWallet: vi.fn(() => ({ address: null }))
}))

// Mock the blockchain events hook
vi.mock('@/lib/flow/hooks', () => ({
  useBlockchainEvents: vi.fn(() => ({}))
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

import { SafeLocalStorage } from '@/lib/hydration/safe-local-storage'
import { useHydrated } from '@/lib/hydration/use-hydrated'

const mockUseHydrated = vi.mocked(useHydrated)
const mockSafeLocalStorage = vi.mocked(SafeLocalStorage)

// Test component that uses the hook
function TestComponent() {
  const { preferences, updatePreferences, isLoaded } = useNotificationPreferences()
  
  return (
    <div>
      <div data-testid="is-loaded">{isLoaded.toString()}</div>
      <div data-testid="enable-toasts">{preferences.enableToasts.toString()}</div>
      <div data-testid="enable-browser">{preferences.enableBrowserNotifications.toString()}</div>
      <div data-testid="enable-sounds">{preferences.enableSounds.toString()}</div>
      <button 
        onClick={() => updatePreferences({ enableToasts: false })}
        data-testid="toggle-toasts"
      >
        Toggle Toasts
      </button>
    </div>
  )
}

describe('Notification Preferences Hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not load preferences before hydration', () => {
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('is-loaded')).toHaveTextContent('false')
    expect(mockSafeLocalStorage.getItem).not.toHaveBeenCalled()
  })

  it('should load preferences after hydration', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify({
      enableToasts: false,
      enableBrowserNotifications: true,
      enableSounds: true
    }))
    
    render(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('is-loaded')).toHaveTextContent('true')
    })
    
    expect(mockSafeLocalStorage.getItem).toHaveBeenCalledWith('ownly-notification-preferences')
    expect(screen.getByTestId('enable-toasts')).toHaveTextContent('false')
    expect(screen.getByTestId('enable-browser')).toHaveTextContent('true')
    expect(screen.getByTestId('enable-sounds')).toHaveTextContent('true')
  })

  it('should use default preferences when localStorage is empty', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null)
    
    render(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('is-loaded')).toHaveTextContent('true')
    })
    
    expect(screen.getByTestId('enable-toasts')).toHaveTextContent('true')
    expect(screen.getByTestId('enable-browser')).toHaveTextContent('false')
    expect(screen.getByTestId('enable-sounds')).toHaveTextContent('false')
  })

  it('should handle corrupted localStorage data gracefully', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue('invalid-json')
    
    render(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('is-loaded')).toHaveTextContent('true')
    })
    
    // Should fall back to default preferences
    expect(screen.getByTestId('enable-toasts')).toHaveTextContent('true')
    expect(screen.getByTestId('enable-browser')).toHaveTextContent('false')
    expect(screen.getByTestId('enable-sounds')).toHaveTextContent('false')
  })

  it('should save preferences only after hydration', async () => {
    const user = userEvent.setup()
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null)
    
    render(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('is-loaded')).toHaveTextContent('true')
    })
    
    await act(async () => {
      await user.click(screen.getByTestId('toggle-toasts'))
    })
    
    expect(mockSafeLocalStorage.setItem).toHaveBeenCalledWith(
      'ownly-notification-preferences',
      JSON.stringify({
        enableToasts: false,
        enableBrowserNotifications: false,
        enableSounds: false
      })
    )
  })

  it('should not save preferences before hydration', async () => {
    const user = userEvent.setup()
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    render(<TestComponent />)
    
    await act(async () => {
      await user.click(screen.getByTestId('toggle-toasts'))
    })
    
    expect(mockSafeLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('should validate localStorage data structure', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify({
      enableToasts: 'invalid', // Should be boolean
      enableBrowserNotifications: true,
      enableSounds: null // Should be boolean
    }))
    
    render(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('is-loaded')).toHaveTextContent('true')
    })
    
    // Should use defaults for invalid values
    expect(screen.getByTestId('enable-toasts')).toHaveTextContent('true') // default
    expect(screen.getByTestId('enable-browser')).toHaveTextContent('true') // valid value
    expect(screen.getByTestId('enable-sounds')).toHaveTextContent('false') // default
  })
})

describe('NotificationSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state before hydration', () => {
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    render(<NotificationSettings />)
    
    // Should show loading skeleton
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0) // Loading skeleton elements
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('should show settings after hydration', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null)
    
    render(<NotificationSettings />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })
    
    expect(screen.getByLabelText('Show toast notifications')).toBeInTheDocument()
    expect(screen.getByLabelText('Enable browser notifications')).toBeInTheDocument()
    expect(screen.getByLabelText('Play notification sounds')).toBeInTheDocument()
  })

  it('should update preferences when checkboxes are toggled', async () => {
    const user = userEvent.setup()
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null)
    
    render(<NotificationSettings />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })
    
    const toastCheckbox = screen.getByLabelText('Show toast notifications')
    expect(toastCheckbox).toBeChecked() // Default is true
    
    await act(async () => {
      await user.click(toastCheckbox)
    })
    
    expect(mockSafeLocalStorage.setItem).toHaveBeenCalledWith(
      'ownly-notification-preferences',
      expect.stringContaining('"enableToasts":false')
    )
  })
})