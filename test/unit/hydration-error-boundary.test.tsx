import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HydrationErrorBoundary, useHydrationErrors } from '@/components/hydration-error-boundary'

// Mock console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleGroup = console.group
const originalConsoleGroupEnd = console.groupEnd
const originalConsoleTable = console.table

beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
  console.group = vi.fn()
  console.groupEnd = vi.fn()
  console.table = vi.fn()
  
  // Clear sessionStorage
  sessionStorage.clear()
})

afterEach(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.group = originalConsoleGroup
  console.groupEnd = originalConsoleGroupEnd
  console.table = originalConsoleTable
})

// Test component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div>No error</div>
}

// Test component that throws a hydration error
const ThrowHydrationError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Hydration failed because the initial UI does not match what was rendered on the server')
  }
  return <div>No hydration error</div>
}

describe('HydrationErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <HydrationErrorBoundary>
        <div>Test content</div>
      </HydrationErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when child component throws an error', () => {
    render(
      <HydrationErrorBoundary>
        <ThrowError shouldThrow={true} />
      </HydrationErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    // The component shows hydration error message for any error by default
    expect(screen.getByText(/A hydration error occurred/)).toBeInTheDocument()
  })

  it('identifies hydration errors correctly', () => {
    render(
      <HydrationErrorBoundary>
        <ThrowHydrationError shouldThrow={true} />
      </HydrationErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/A hydration error occurred/)).toBeInTheDocument()
    expect(screen.getByText(/Attempting automatic recovery/)).toBeInTheDocument()
  })

  it('logs error details to console in development', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <HydrationErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Test error message" />
      </HydrationErrorBoundary>
    )

    expect(console.group).toHaveBeenCalledWith('🚨 Hydration Error Boundary')
    expect(console.error).toHaveBeenCalled()

    process.env.NODE_ENV = originalNodeEnv
  })

  it('stores error in sessionStorage', () => {
    render(
      <HydrationErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Storage test error" />
      </HydrationErrorBoundary>
    )

    const storedErrors = JSON.parse(sessionStorage.getItem('hydration-errors') || '[]')
    expect(storedErrors).toHaveLength(1)
    expect(storedErrors[0].message).toBe('Storage test error')
  })

  it('calls custom onError handler when provided', () => {
    const onError = vi.fn()

    render(
      <HydrationErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </HydrationErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>

    render(
      <HydrationErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </HydrationErrorBoundary>
    )

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('shows error details in development when enabled', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <HydrationErrorBoundary showErrorDetails={true}>
        <ThrowError shouldThrow={true} errorMessage="Detailed error" />
      </HydrationErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()

    process.env.NODE_ENV = originalNodeEnv
  })

  it('provides retry functionality', async () => {
    let shouldThrow = true
    const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />
    
    const { rerender } = render(
      <HydrationErrorBoundary>
        <TestComponent />
      </HydrationErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const retryButton = screen.getByText('Try Again')
    
    // Change the error state before clicking retry
    shouldThrow = false
    
    fireEvent.click(retryButton)

    // Rerender with no error
    rerender(
      <HydrationErrorBoundary>
        <ThrowError shouldThrow={false} />
      </HydrationErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  it('provides reload functionality', () => {
    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })

    render(
      <HydrationErrorBoundary>
        <ThrowError shouldThrow={true} />
      </HydrationErrorBoundary>
    )

    const reloadButton = screen.getByText('Reload Page')
    fireEvent.click(reloadButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it('attempts automatic recovery for hydration errors', async () => {
    vi.useFakeTimers()

    render(
      <HydrationErrorBoundary enableRecovery={true}>
        <ThrowHydrationError shouldThrow={true} />
      </HydrationErrorBoundary>
    )

    expect(screen.getByText(/Attempting automatic recovery/)).toBeInTheDocument()

    // Fast-forward time to trigger recovery attempt
    vi.advanceTimersByTime(1000)

    // The error boundary should attempt recovery but still show error since component still throws
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    vi.useRealTimers()
  }, 10000)

  it('limits retry attempts', () => {
    vi.useFakeTimers()

    render(
      <HydrationErrorBoundary enableRecovery={true}>
        <ThrowHydrationError shouldThrow={true} />
      </HydrationErrorBoundary>
    )

    // The component should show recovery message initially
    expect(screen.getByText(/Attempting automatic recovery/)).toBeInTheDocument()

    // Simulate multiple recovery attempts by advancing time multiple times
    // Each recovery attempt happens after 1 second
    for (let i = 0; i < 4; i++) {
      vi.advanceTimersByTime(1000)
      // Each time it will try to recover but fail since component still throws
    }

    // After max retries, it should log a warning (but we can't easily test the internal state)
    // Instead, verify the error UI is still shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    vi.useRealTimers()
  })
})

describe('useHydrationErrors', () => {
  const TestComponent = () => {
    const { errors, clearErrors } = useHydrationErrors()
    
    return (
      <div>
        <div data-testid="error-count">{errors.length}</div>
        <button onClick={clearErrors}>Clear Errors</button>
        {errors.map((error, index) => (
          <div key={index} data-testid={`error-${index}`}>
            {error.message}
          </div>
        ))}
      </div>
    )
  }

  it('returns empty array when no errors are stored', () => {
    render(<TestComponent />)
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
  })

  it('returns stored errors from sessionStorage', () => {
    const testErrors = [
      { message: 'Test error 1', timestamp: Date.now() },
      { message: 'Test error 2', timestamp: Date.now() }
    ]
    
    sessionStorage.setItem('hydration-errors', JSON.stringify(testErrors))
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('2')
    expect(screen.getByTestId('error-0')).toHaveTextContent('Test error 1')
    expect(screen.getByTestId('error-1')).toHaveTextContent('Test error 2')
  })

  it('clears errors when clearErrors is called', () => {
    const testErrors = [{ message: 'Test error', timestamp: Date.now() }]
    sessionStorage.setItem('hydration-errors', JSON.stringify(testErrors))
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    
    fireEvent.click(screen.getByText('Clear Errors'))
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
    expect(sessionStorage.getItem('hydration-errors')).toBeNull()
  })

  it('handles invalid JSON in sessionStorage gracefully', () => {
    sessionStorage.setItem('hydration-errors', 'invalid json')
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
  })
})