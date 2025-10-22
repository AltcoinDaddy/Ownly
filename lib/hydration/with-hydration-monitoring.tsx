"use client"

import React from "react"
import { HydrationErrorBoundary } from "@/components/hydration-error-boundary"
import { hydrationMonitor } from "./hydration-monitor"

interface WithHydrationMonitoringOptions {
  componentName?: string
  enableErrorBoundary?: boolean
  enableRecovery?: boolean
  showErrorDetails?: boolean
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Higher-order component that wraps components with hydration monitoring
 * Provides automatic error boundary and monitoring capabilities
 */
export function withHydrationMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithHydrationMonitoringOptions = {}
) {
  const {
    componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component',
    enableErrorBoundary = true,
    enableRecovery = true,
    showErrorDetails = process.env.NODE_ENV === 'development',
    onError
  } = options

  const MonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    // Monitor component lifecycle for potential issues
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        // Check for common hydration issues
        const checkHydrationIssues = () => {
          // Check if component is using browser APIs without guards
          if (typeof window !== 'undefined') {
            const componentElement = document.querySelector(`[data-component="${componentName}"]`)
            if (componentElement) {
              // Monitor for DOM changes that might indicate hydration issues
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    hydrationMonitor.reportPotentialIssue(
                      'mismatch',
                      `DOM change detected in ${componentName} after hydration`,
                      componentName
                    )
                  }
                })
              })

              observer.observe(componentElement, {
                childList: true,
                attributes: true,
                subtree: true
              })

              return () => observer.disconnect()
            }
          }
        }

        const cleanup = checkHydrationIssues()
        return cleanup
      }
    }, [])

    const componentWithRef = (
      <div data-component={componentName}>
        <WrappedComponent {...props} ref={ref} />
      </div>
    )

    if (enableErrorBoundary) {
      return (
        <HydrationErrorBoundary
          enableRecovery={enableRecovery}
          showErrorDetails={showErrorDetails}
          onError={(error, errorInfo) => {
            // Log component-specific error
            hydrationMonitor.reportPotentialIssue(
              'mismatch',
              `Error in ${componentName}: ${error.message}`,
              componentName
            )
            
            if (onError) {
              onError(error, errorInfo)
            }
          }}
        >
          {componentWithRef}
        </HydrationErrorBoundary>
      )
    }

    return componentWithRef
  })

  MonitoredComponent.displayName = `withHydrationMonitoring(${componentName})`

  return MonitoredComponent
}

/**
 * Hook for components to self-report hydration issues
 */
export function useHydrationSelfMonitoring(componentName: string) {
  const reportIssue = React.useCallback((
    type: 'mismatch' | 'browser-api' | 'dynamic-content' | 'event-listener',
    message: string
  ) => {
    if (process.env.NODE_ENV === 'development') {
      hydrationMonitor.reportPotentialIssue(type, message, componentName)
    }
  }, [componentName])

  const checkBrowserAPI = React.useCallback((apiName: string) => {
    if (process.env.NODE_ENV === 'development') {
      hydrationMonitor.checkBrowserAPIUsage(componentName, apiName)
    }
  }, [componentName])

  const checkDynamicContent = React.useCallback((contentType: string) => {
    if (process.env.NODE_ENV === 'development') {
      hydrationMonitor.checkDynamicContent(componentName, contentType)
    }
  }, [componentName])

  return {
    reportIssue,
    checkBrowserAPI,
    checkDynamicContent
  }
}

/**
 * Development helper component for testing hydration issues
 */
export function HydrationTestComponent() {
  const { reportIssue } = useHydrationSelfMonitoring('HydrationTestComponent')

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-yellow-100 dark:bg-yellow-900 p-2 rounded text-xs">
      <div className="font-medium mb-2">Hydration Test Controls</div>
      <div className="space-y-1">
        <button
          onClick={() => reportIssue('mismatch', 'Test hydration mismatch')}
          className="block w-full text-left px-2 py-1 bg-red-200 dark:bg-red-800 rounded"
        >
          Trigger Mismatch Warning
        </button>
        <button
          onClick={() => reportIssue('browser-api', 'Test browser API usage')}
          className="block w-full text-left px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded"
        >
          Trigger Browser API Warning
        </button>
        <button
          onClick={() => reportIssue('dynamic-content', 'Test dynamic content')}
          className="block w-full text-left px-2 py-1 bg-green-200 dark:bg-green-800 rounded"
        >
          Trigger Dynamic Content Warning
        </button>
      </div>
    </div>
  )
}