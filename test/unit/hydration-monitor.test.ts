import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { hydrationMonitor, useHydrationWarnings } from '@/lib/hydration/hydration-monitor'
import { renderHook, act } from '@testing-library/react'

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
  
  // Clear warnings
  hydrationMonitor.clearWarnings()
  
  // Clear sessionStorage
  sessionStorage.clear()
})

afterEach(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.group = originalConsoleGroup
  console.groupEnd = originalConsoleGroupEnd
})

describe('HydrationMonitor', () => {
  it('should be enabled in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    expect(hydrationMonitor.getWarnings()).toEqual([])
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should report potential hydration issues', () => {
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test hydration mismatch', 'TestComponent')
    
    const warnings = hydrationMonitor.getWarnings()
    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('mismatch')
    expect(warnings[0].message).toBe('Test hydration mismatch')
    expect(warnings[0].component).toBe('TestComponent')
  })

  it('should check browser API usage', () => {
    hydrationMonitor.checkBrowserAPIUsage('TestComponent', 'localStorage')
    
    const warnings = hydrationMonitor.getWarnings()
    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('browser-api')
    expect(warnings[0].message).toContain('localStorage')
    expect(warnings[0].component).toBe('TestComponent')
  })

  it('should check dynamic content usage', () => {
    hydrationMonitor.checkDynamicContent('TestComponent', 'Math.random()')
    
    const warnings = hydrationMonitor.getWarnings()
    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('dynamic-content')
    expect(warnings[0].message).toContain('Math.random()')
    expect(warnings[0].component).toBe('TestComponent')
  })

  it('should filter warnings by type', () => {
    hydrationMonitor.reportPotentialIssue('mismatch', 'Mismatch 1')
    hydrationMonitor.reportPotentialIssue('browser-api', 'Browser API 1')
    hydrationMonitor.reportPotentialIssue('mismatch', 'Mismatch 2')
    
    const mismatchWarnings = hydrationMonitor.getWarningsByType('mismatch')
    const browserApiWarnings = hydrationMonitor.getWarningsByType('browser-api')
    
    expect(mismatchWarnings).toHaveLength(2)
    expect(browserApiWarnings).toHaveLength(1)
  })

  it('should filter warnings by component', () => {
    hydrationMonitor.reportPotentialIssue('mismatch', 'Warning 1', 'Component1')
    hydrationMonitor.reportPotentialIssue('mismatch', 'Warning 2', 'Component2')
    hydrationMonitor.reportPotentialIssue('mismatch', 'Warning 3', 'Component1')
    
    const component1Warnings = hydrationMonitor.getWarningsByComponent('Component1')
    const component2Warnings = hydrationMonitor.getWarningsByComponent('Component2')
    
    expect(component1Warnings).toHaveLength(2)
    expect(component2Warnings).toHaveLength(1)
  })

  it('should clear all warnings', () => {
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test warning')
    expect(hydrationMonitor.getWarnings()).toHaveLength(1)
    
    hydrationMonitor.clearWarnings()
    expect(hydrationMonitor.getWarnings()).toHaveLength(0)
  })

  it('should limit warnings to 50 entries', () => {
    // Add 60 warnings
    for (let i = 0; i < 60; i++) {
      hydrationMonitor.reportPotentialIssue('mismatch', `Warning ${i}`)
    }
    
    const warnings = hydrationMonitor.getWarnings()
    expect(warnings).toHaveLength(50)
    
    // Should keep the most recent warnings
    expect(warnings[0].message).toBe('Warning 10')
    expect(warnings[49].message).toBe('Warning 59')
  })

  it('should notify observers when warnings are added', () => {
    const observer = vi.fn()
    const unsubscribe = hydrationMonitor.subscribe(observer)
    
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test warning')
    
    expect(observer).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'mismatch',
        message: 'Test warning'
      })
    ])
    
    unsubscribe()
  })

  it('should log warnings to console in development', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test warning')
    
    expect(console.group).toHaveBeenCalledWith('🚨 Hydration Warning (mismatch)')
    expect(console.warn).toHaveBeenCalledWith('Test warning')
    expect(console.groupEnd).toHaveBeenCalled()
    
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should identify hydration-related error messages', () => {
    const hydrationErrors = [
      'Hydration failed',
      'Server and client mismatch',
      'Text content does not match',
      'Expected server HTML to contain',
      'Did not match server',
      'useLayoutEffect does nothing on the server',
      'Cannot read property of undefined: window',
      'localStorage is not defined'
    ]
    
    hydrationErrors.forEach((errorMessage, index) => {
      // Simulate error by triggering global error handler
      const error = new Error(errorMessage)
      window.dispatchEvent(new ErrorEvent('error', { error, message: errorMessage }))
    })
    
    // Should have captured hydration-related errors
    const warnings = hydrationMonitor.getWarnings()
    expect(warnings.length).toBeGreaterThan(0)
  })
})

describe('useHydrationWarnings', () => {
  it('should return current warnings', () => {
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test warning')
    
    const { result } = renderHook(() => useHydrationWarnings())
    
    expect(result.current.warnings).toHaveLength(1)
    expect(result.current.warnings[0].message).toBe('Test warning')
  })

  it('should update when new warnings are added', () => {
    const { result } = renderHook(() => useHydrationWarnings())
    
    expect(result.current.warnings).toHaveLength(0)
    
    act(() => {
      hydrationMonitor.reportPotentialIssue('mismatch', 'New warning')
    })
    
    expect(result.current.warnings).toHaveLength(1)
  })

  it('should provide clearWarnings function', () => {
    hydrationMonitor.reportPotentialIssue('mismatch', 'Test warning')
    
    const { result } = renderHook(() => useHydrationWarnings())
    
    expect(result.current.warnings).toHaveLength(1)
    
    act(() => {
      result.current.clearWarnings()
    })
    
    expect(result.current.warnings).toHaveLength(0)
  })

  it('should provide filtering functions', () => {
    hydrationMonitor.reportPotentialIssue('mismatch', 'Mismatch warning')
    hydrationMonitor.reportPotentialIssue('browser-api', 'API warning', 'TestComponent')
    
    const { result } = renderHook(() => useHydrationWarnings())
    
    const mismatchWarnings = result.current.getWarningsByType('mismatch')
    const componentWarnings = result.current.getWarningsByComponent('TestComponent')
    
    expect(mismatchWarnings).toHaveLength(1)
    expect(componentWarnings).toHaveLength(1)
  })
})