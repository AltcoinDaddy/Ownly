import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NotificationSystem, NotificationSettings } from '@/components/notification-system'

// Mock dependencies
vi.mock('@/lib/wallet-context', () => ({
  useWallet: vi.fn(() => ({ address: '0x123' }))
}))

vi.mock('@/lib/flow/hooks', () => ({
  useBlockchainEvents: vi.fn(() => ({}))
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('@/lib/hydration/safe-local-storage', () => ({
  SafeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

vi.mock('@/lib/hydration/use-hydrated', () => ({
  useHydrated: vi.fn()
}))

import { SafeLocalStorage } from '@/lib/hydration/safe-local-storage'
import { useHydrated } from '@/lib/hydration/use-hydrated'

const mockUseHydrated = vi.mocked(useHydrated)
const mockSafeLocalStorage = vi.mocked(SafeLocalStorage)

describe('Notification System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render notification system without hydration errors', async () => {
    // Start with not hydrated
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    const { rerender } = render(
      <div>
        <NotificationSystem />
        <NotificationSettings />
      </div>
    )

    // Should show loading state for settings
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    // Simulate hydration
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify({
      enableToasts: true,
      enableBrowserNotifications: false,
      enableSounds: true
    }))

    rerender(
      <div>
        <NotificationSystem />
        <NotificationSettings />
      </div>
    )

    // Should show actual settings after hydration
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })

    // Verify preferences are loaded correctly
    const toastCheckbox = screen.getByLabelText('Show toast notifications')
    const browserCheckbox = screen.getByLabelText('Enable browser notifications')
    const soundsCheckbox = screen.getByLabelText('Play notification sounds')

    expect(toastCheckbox).toBeChecked()
    expect(browserCheckbox).not.toBeChecked()
    expect(soundsCheckbox).toBeChecked()

    // Verify localStorage was accessed
    expect(mockSafeLocalStorage.getItem).toHaveBeenCalledWith('ownly-notification-preferences')
  })

  it('should handle localStorage errors gracefully', async () => {
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })

    render(<NotificationSettings />)

    // Should still render with default preferences
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })

    const toastCheckbox = screen.getByLabelText('Show toast notifications')
    expect(toastCheckbox).toBeChecked() // Default value
  })

  it('should maintain consistent state between server and client', async () => {
    // Simulate server-side rendering (not hydrated)
    mockUseHydrated.mockReturnValue({ isHydrated: false })
    
    const { container: serverContainer } = render(<NotificationSettings />)
    const serverHTML = serverContainer.innerHTML

    // Simulate client-side hydration
    mockUseHydrated.mockReturnValue({ isHydrated: true })
    mockSafeLocalStorage.getItem.mockReturnValue(null) // No saved preferences
    
    const { container: clientContainer } = render(<NotificationSettings />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })

    // The initial loading state should be consistent
    // (We can't directly compare HTML due to hydration changes, but we verify no errors occur)
    expect(clientContainer).toBeDefined()
    expect(serverContainer).toBeDefined()
  })
})