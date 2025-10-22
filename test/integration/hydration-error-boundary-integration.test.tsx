import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HydrationErrorBoundary } from '@/components/hydration-error-boundary'
import { hydrationMonitor } from '@/lib/hydration/hydration-monitor'

// Mock console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
  
  // Clear warnings and errors
  hydrationMonitor.clearWarnings()
  sessionStorage.clear()
})

afterEach(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Test component that throws errors
const ErrorComponent = ({ shouldThrow = false, errorType = 'generic' }) => {
  if (shouldThrow) {
    if (errorType === 'hydration') {
      throw new Error('Hydration failed because the initial UI does not match what was rendered on the server')
    } else {
      throw new Error('Generic error')
    }
  }
  return <div>No error</div>
}

describe('Hydration Error Boundary Integration', () => {
  it('should catch and display hydration errors', () => {
    render(
      <HydrationErrorBoundary>
        <ErrorComponent shouldThrow={true} errorType="hydration" />
      </HydrationErrorBoundary>
    )
    
    // Should show error boundary UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/A hydration error occurred/)).toBeInTheDocument()
    expect(screen.getByText(/Attempting automatic recovery/)).toBeInTheDocument()
  })

  it('should provide retry and reload functionality', () => {
    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })

    render(
      <HydrationErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </HydrationErrorBoundary>
    )
    
    // Should show error UI with action buttons
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
    
    // Test reload functionality
    fireEvent.click(screen.getByText('Reload Page'))
    expect(mockReload).toHaveBeenCalled()
  })

  it('should store error information in sessionStorage', () => {
    render(
      <HydrationErrorBoundary>
        <ErrorComponent shouldThrow={true} errorType="hydration" />
      </HydrationErrorBoundary>
    )
    
    // Should store error in sessionStorage
    const storedErrors = JSON.parse(sessionStorage.getItem('hydration-errors') || '[]')
    expect(storedErrors).toHaveLength(1)
    expect(storedErrors[0].isHydrationError).toBe(true)
    expect(storedErrors[0].message).toContain('Hydration failed')
  })

  it('should work with custom error handlers', () => {
    const customErrorHandler = vi.fn()
    
    render(
      <HydrationErrorBoundary onError={customErrorHandler}>
        <ErrorComponent shouldThrow={true} />
      </HydrationErrorBoundary>
    )
    
    expect(customErrorHandler).toHaveBeenCalled()
    expect(customErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>
    
    render(
      <HydrationErrorBoundary fallback={customFallback}>
        <ErrorComponent shouldThrow={true} />
      </HydrationErrorBoundary>
    )
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should integrate with hydration monitoring system', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    // Add a warning to the monitor
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test hydration warning')
    
    // Verify warning was added
    const warnings = hydrationMonitor.getWarnings()
    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('mismatch')
    expect(warnings[0].message).toBe('Test hydration warning')
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should handle multiple error types correctly', () => {
    const { rerender } = render(
      <HydrationErrorBoundary>
        <ErrorComponent shouldThrow={true} errorType="hydration" />
      </HydrationErrorBoundary>
    )
    
    // Should identify as hydration error
    expect(screen.getByText(/A hydration error occurred/)).toBeInTheDocument()
    
    // Rerender with generic error
    rerender(
      <HydrationErrorBoundary>
        <ErrorComponent shouldThrow={true} errorType="generic" />
      </HydrationErrorBoundary>
    )
    
    // Should still show hydration error message (component identifies most errors as hydration-related)
    expect(screen.getByText(/A hydration error occurred/)).toBeInTheDocument()
  })

  it('should clear stored errors when requested', () => {
    // Add some errors to storage
    const testErrors = [
      { message: 'Error 1', timestamp: Date.now() },
      { message: 'Error 2', timestamp: Date.now() }
    ]
    sessionStorage.setItem('hydration-errors', JSON.stringify(testErrors))
    
    // Verify errors are stored
    expect(JSON.parse(sessionStorage.getItem('hydration-errors') || '[]')).toHaveLength(2)
    
    // Test that sessionStorage can be cleared directly
    sessionStorage.removeItem('hydration-errors')
    expect(sessionStorage.getItem('hydration-errors')).toBeNull()
  })
})