"use client"

import React from "react"

/**
 * Development-time hydration monitoring and warning system
 * Helps identify potential hydration issues before they cause errors
 */

interface HydrationWarning {
  type: 'mismatch' | 'browser-api' | 'dynamic-content' | 'event-listener'
  message: string
  component?: string
  timestamp: number
  stack?: string
}

class HydrationMonitor {
  private warnings: HydrationWarning[] = []
  private isEnabled: boolean = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  private observers: Set<(warnings: HydrationWarning[]) => void> = new Set()

  constructor() {
    if (this.isEnabled && typeof window !== 'undefined') {
      this.setupGlobalErrorHandler()
      this.setupConsoleInterceptor()
      this.setupMutationObserver()
    }
  }

  private setupGlobalErrorHandler() {
    const originalErrorHandler = window.onerror
    
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string' && this.isHydrationRelated(message)) {
        this.addWarning({
          type: 'mismatch',
          message: message,
          timestamp: Date.now(),
          stack: error?.stack
        })
      }
      
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error)
      }
      return false
    }

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || String(event.reason)
      if (this.isHydrationRelated(message)) {
        this.addWarning({
          type: 'mismatch',
          message: `Unhandled Promise Rejection: ${message}`,
          timestamp: Date.now(),
          stack: event.reason?.stack
        })
      }
    })
  }

  private setupConsoleInterceptor() {
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    console.error = (...args) => {
      const message = args.join(' ')
      if (this.isHydrationRelated(message)) {
        this.addWarning({
          type: 'mismatch',
          message: `Console Error: ${message}`,
          timestamp: Date.now()
        })
      }
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args.join(' ')
      if (this.isHydrationRelated(message)) {
        this.addWarning({
          type: 'mismatch',
          message: `Console Warning: ${message}`,
          timestamp: Date.now()
        })
      }
      originalConsoleWarn.apply(console, args)
    }
  }

  private setupMutationObserver() {
    // Monitor DOM changes that might indicate hydration issues
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for suspicious DOM changes that might indicate hydration mismatches
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.getAttribute('data-reactroot') || 
                  element.classList.contains('hydration-mismatch')) {
                this.addWarning({
                  type: 'mismatch',
                  message: 'Suspicious DOM change detected that might indicate hydration mismatch',
                  timestamp: Date.now()
                })
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    })
  }

  private isHydrationRelated(message: string): boolean {
    const hydrationPatterns = [
      /hydration/i,
      /server.*client.*mismatch/i,
      /text content does not match/i,
      /expected server html to contain/i,
      /did not match.*server/i,
      /useLayoutEffect does nothing on the server/i,
      /cannot read.*of undefined.*window/i,
      /cannot read.*of undefined.*document/i,
      /cannot read.*of undefined.*navigator/i,
      /localStorage is not defined/i,
      /sessionStorage is not defined/i
    ]

    return hydrationPatterns.some(pattern => pattern.test(message))
  }

  private addWarning(warning: HydrationWarning) {
    this.warnings.push(warning)
    
    // Keep only last 50 warnings
    if (this.warnings.length > 50) {
      this.warnings = this.warnings.slice(-50)
    }

    // Notify observers
    this.observers.forEach(observer => observer([...this.warnings]))

    // Log to console in development
    if (this.isEnabled) {
      console.group(`🚨 Hydration Warning (${warning.type})`)
      console.warn(warning.message)
      if (warning.stack) {
        console.error(warning.stack)
      }
      console.groupEnd()
    }
  }

  /**
   * Manually report a potential hydration issue
   */
  reportPotentialIssue(type: HydrationWarning['type'], message: string, component?: string) {
    if (!this.isEnabled) return

    this.addWarning({
      type,
      message,
      component,
      timestamp: Date.now(),
      stack: new Error().stack
    })
  }

  /**
   * Check if a component is using browser APIs without proper guards
   */
  checkBrowserAPIUsage(componentName: string, apiName: string) {
    if (!this.isEnabled) return

    const browserAPIs = ['localStorage', 'sessionStorage', 'navigator', 'document', 'window']
    
    if (browserAPIs.includes(apiName)) {
      this.reportPotentialIssue(
        'browser-api',
        `Component "${componentName}" is using "${apiName}" which may cause hydration issues if not properly guarded`,
        componentName
      )
    }
  }

  /**
   * Check for dynamic content that might cause hydration mismatches
   */
  checkDynamicContent(componentName: string, contentType: string) {
    if (!this.isEnabled) return

    const dynamicContentTypes = ['Math.random()', 'Date.now()', 'new Date()', 'crypto.randomUUID()']
    
    if (dynamicContentTypes.includes(contentType)) {
      this.reportPotentialIssue(
        'dynamic-content',
        `Component "${componentName}" is using "${contentType}" which may cause hydration mismatches`,
        componentName
      )
    }
  }

  /**
   * Subscribe to warning updates
   */
  subscribe(callback: (warnings: HydrationWarning[]) => void) {
    this.observers.add(callback)
    
    return () => {
      this.observers.delete(callback)
    }
  }

  /**
   * Get all warnings
   */
  getWarnings(): HydrationWarning[] {
    return [...this.warnings]
  }

  /**
   * Clear all warnings
   */
  clearWarnings() {
    this.warnings = []
    this.observers.forEach(observer => observer([]))
  }

  /**
   * Get warnings by type
   */
  getWarningsByType(type: HydrationWarning['type']): HydrationWarning[] {
    return this.warnings.filter(warning => warning.type === type)
  }

  /**
   * Get warnings by component
   */
  getWarningsByComponent(component: string): HydrationWarning[] {
    return this.warnings.filter(warning => warning.component === component)
  }
}

// Global instance
export const hydrationMonitor = new HydrationMonitor()

/**
 * React hook to access hydration warnings
 */
export function useHydrationWarnings() {
  const [warnings, setWarnings] = React.useState<HydrationWarning[]>([])

  React.useEffect(() => {
    const unsubscribe = hydrationMonitor.subscribe(setWarnings)
    setWarnings(hydrationMonitor.getWarnings())
    
    return unsubscribe
  }, [])

  return {
    warnings,
    clearWarnings: () => hydrationMonitor.clearWarnings(),
    getWarningsByType: (type: HydrationWarning['type']) => 
      hydrationMonitor.getWarningsByType(type),
    getWarningsByComponent: (component: string) => 
      hydrationMonitor.getWarningsByComponent(component)
  }
}

/**
 * Development helper to manually report hydration issues
 */
export function reportHydrationIssue(
  type: HydrationWarning['type'], 
  message: string, 
  component?: string
) {
  hydrationMonitor.reportPotentialIssue(type, message, component)
}

/**
 * Development helper to check browser API usage
 */
export function checkBrowserAPI(componentName: string, apiName: string) {
  hydrationMonitor.checkBrowserAPIUsage(componentName, apiName)
}

/**
 * Development helper to check dynamic content usage
 */
export function checkDynamicContent(componentName: string, contentType: string) {
  hydrationMonitor.checkDynamicContent(componentName, contentType)
}