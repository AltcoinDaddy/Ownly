import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HydrationErrorBoundary } from '@/components/hydration-error-boundary'
import { HydrationDashboard } from '@/components/hydration-dashboard'
import { withHydrationMonitoring, useHydrationSelfMonitoring } from '@/lib/hydration/with-hydration-monitoring'
import { hydrationMonitor } from '@/lib/hydration/hydration-monitor'

// Mock console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleGroup = console.group
const originalConsoleGroupEnd = console.groupEnd

beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
  console.group = vi.fn()
  console.groupEnd = vi.fn()
  
  // Clear warnings and errors
  hydrationMonitor.clearWarnings()
  sessionStorage.clear()
})

afterEach(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.group = originalConsoleGroup
  console.groupEnd = originalConsoleGroupEnd
})

// Test component that uses self-monitoring
const SelfMonitoringComponent = ({ triggerIssue = false }) => {
  const { reportIssue, checkBrowserAPI, checkDynamicContent } = useHydrationSelfMonitoring('SelfMonitoringComponent')
  
  React.useEffect(() => {
    if (triggerIssue) {
      reportIssue('mismatch', 'Self-reported hydration issue')
      checkBrowserAPI('localStorage')
      checkDynamicContent('Math.random()')
    }
  }, [triggerIssue, reportIssue, checkBrowserAPI, checkDynamicContent])
  
  return <div>Self-monitoring component</div>
}

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

// Enhanced component with monitoring
const MonitoredErrorComponent = withHydrationMonitoring(ErrorComponent, {
  componentName: 'MonitoredErrorComponent',
  enableErrorBoundary: true,
  enableRecovery: true
})

describe('Hydration Monitoring Integration', () => {
  it('should integrate error boundary with monitoring system', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <div>
        <HydrationErrorBoundary>
          <ErrorComponent shouldThrow={true} errorType="hydration" />
        </HydrationErrorBoundary>
        <HydrationDashboard />
      </div>
    )
    
    // Should show error boundary UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/A hydration error occurred/)).toBeInTheDocument()
    
    // Should show monitoring dashboard with error count
    expect(screen.getByText(/1 Hydration Issue/)).toBeInTheDocument()
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should track warnings from self-monitoring components', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <div>
        <SelfMonitoringComponent triggerIssue={true} />
        <HydrationDashboard />
      </div>
    )
    
    await waitFor(() => {
      // Should show monitoring dashboard with warning count
      expect(screen.getByText(/3 Hydration Issues/)).toBeInTheDocument()
    })
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should display warnings and errors in dashboard', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    // Add some warnings
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test mismatch warning')
    hydrationMonitor.reportPotentialIssue('browser-api', 'Test browser API warning')
    
    // Add error to sessionStorage
    const testError = {
      message: 'Test hydration error',
      timestamp: Date.now(),
      isHydrationError: true,
      retryCount: 0
    }
    sessionStorage.setItem('hydration-errors', JSON.stringify([testError]))
    
    render(<HydrationDashboard />)
    
    // Should show dashboard with issue count
    expect(screen.getByText(/3 Hydration Issues/)).toBeInTheDocument()
    
    // Click to open dashboard
    fireEvent.click(screen.getByText(/3 Hydration Issues/))
    
    // Should show warnings tab
    expect(screen.getByText('Warnings (2)')).toBeInTheDocument()
    expect(screen.getByText('Errors (1)')).toBeInTheDocument()
    
    // Should show warning details
    expect(screen.getByText('Test mismatch warning')).toBeInTheDocument()
    expect(screen.getByText('Test browser API warning')).toBeInTheDocument()
    
    // Switch to errors tab
    fireEvent.click(screen.getByText('Errors (1)'))
    expect(screen.getByText('Test hydration error')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should allow clearing warnings and errors from dashboard', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    // Add warnings and errors
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test warning')
    sessionStorage.setItem('hydration-errors', JSON.stringify([{
      message: 'Test error',
      timestamp: Date.now()
    }]))
    
    render(<HydrationDashboard />)
    
    // Open dashboard
    fireEvent.click(screen.getByText(/2 Hydration Issues/))
    
    // Clear warnings
    fireEvent.click(screen.getByText('Clear All'))
    
    await waitFor(() => {
      expect(screen.getByText('No hydration warnings detected')).toBeInTheDocument()
    })
    
    // Switch to errors and clear
    fireEvent.click(screen.getByText('Errors (1)'))
    fireEvent.click(screen.getByText('Clear All'))
    
    await waitFor(() => {
      expect(screen.getByText('No hydration errors recorded')).toBeInTheDocument()
    })
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should show summary statistics in dashboard', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    // Add various types of warnings
    hydrationMonitor.reportPotentialIssue('mismatch', 'Mismatch 1')
    hydrationMonitor.reportPotentialIssue('mismatch', 'Mismatch 2')
    hydrationMonitor.reportPotentialIssue('browser-api', 'Browser API 1')
    hydrationMonitor.reportPotentialIssue('dynamic-content', 'Dynamic content 1')
    
    render(<HydrationDashboard />)
    
    // Open dashboard
    fireEvent.click(screen.getByText(/4 Hydration Issues/))
    
    // Switch to summary tab
    fireEvent.click(screen.getByText('Summary'))
    
    // Should show warning type counts
    expect(screen.getByText('Mismatches:')).toBeInTheDocument()
    expect(screen.getByText('Browser APIs:')).toBeInTheDocument()
    expect(screen.getByText('Dynamic Content:')).toBeInTheDocument()
    
    // Should show recommendations
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
    expect(screen.getByText(/Wrap browser API usage in ClientOnly components/)).toBeInTheDocument()
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should work with withHydrationMonitoring HOC', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <div>
        <MonitoredErrorComponent shouldThrow={true} errorType="hydration" />
        <HydrationDashboard />
      </div>
    )
    
    // Should show error boundary UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Should show monitoring dashboard
    expect(screen.getByText(/Hydration Issue/)).toBeInTheDocument()
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should not render dashboard in production', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test warning')
    
    render(<HydrationDashboard />)
    
    // Should not render anything in production
    expect(screen.queryByText(/Hydration Issue/)).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should handle recovery attempts in error boundary', async () => {
    vi.useFakeTimers()
    
    const { rerender } = render(
      <HydrationErrorBoundary enableRecovery={true}>
        <ErrorComponent shouldThrow={true} errorType="hydration" />
      </HydrationErrorBoundary>
    )
    
    // Should show error initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/Attempting automatic recovery/)).toBeInTheDocument()
    
    // Fast-forward time to trigger recovery
    vi.advanceTimersByTime(1000)
    
    // Rerender with no error to simulate recovery
    rerender(
      <HydrationErrorBoundary enableRecovery={true}>
        <ErrorComponent shouldThrow={false} />
      </HydrationErrorBoundary>
    )
    
    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
    
    vi.useRealTimers()
  })
})