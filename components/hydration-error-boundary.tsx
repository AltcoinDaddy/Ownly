"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface HydrationErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRecovery?: boolean
  showErrorDetails?: boolean
}

interface HydrationErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

/**
 * Error boundary specifically designed to catch and handle hydration errors
 * Provides recovery mechanisms and detailed error logging
 */
export class HydrationErrorBoundary extends Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  private maxRetries = 3
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: HydrationErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<HydrationErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Log hydration errors with detailed information
    this.logHydrationError(error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Attempt automatic recovery for hydration errors
    if (this.isHydrationError(error) && this.props.enableRecovery !== false) {
      this.attemptRecovery()
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  private isHydrationError(error: Error): boolean {
    const hydrationErrorPatterns = [
      /hydration/i,
      /server.*client.*mismatch/i,
      /text content does not match/i,
      /expected server html to contain/i,
      /did not match.*server/i,
    ]

    return hydrationErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || "")
    )
  }

  private logHydrationError(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "SSR",
      url: typeof window !== "undefined" ? window.location.href : "SSR",
      isHydrationError: this.isHydrationError(error),
      retryCount: this.state.retryCount,
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Hydration Error Boundary")
      console.error("Error:", error)
      console.error("Error Info:", errorInfo)
      console.table(errorDetails)
      console.groupEnd()
    }

    // Log to external service in production (placeholder)
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
      console.error("Hydration Error:", errorDetails)
    }

    // Store error in sessionStorage for debugging
    if (typeof window !== "undefined") {
      try {
        const existingErrors = JSON.parse(
          sessionStorage.getItem("hydration-errors") || "[]"
        )
        existingErrors.push(errorDetails)
        // Keep only last 10 errors
        const recentErrors = existingErrors.slice(-10)
        sessionStorage.setItem("hydration-errors", JSON.stringify(recentErrors))
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  private attemptRecovery = () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.warn("Max retry attempts reached for hydration error recovery")
      return
    }

    console.log(`Attempting hydration error recovery (attempt ${this.state.retryCount + 1}/${this.maxRetries})`)

    // Clear the error state after a short delay to allow for re-render
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }))
    }, 1000)
  }

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    })
  }

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              {this.isHydrationError(this.state.error!) ? (
                <>
                  A hydration error occurred. This usually happens when the server and client render different content.
                  {this.state.retryCount < this.maxRetries && (
                    <span className="block mt-2 text-sm text-muted-foreground">
                      Attempting automatic recovery...
                    </span>
                  )}
                </>
              ) : (
                "An unexpected error occurred while rendering this component."
              )}
            </AlertDescription>
            
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleManualRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            </div>

            {this.props.showErrorDetails && process.env.NODE_ENV === "development" && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {this.state.error?.message}
                  {this.state.error?.stack && (
                    <>
                      {"\n\nStack Trace:\n"}
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {"\n\nComponent Stack:\n"}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to access hydration error information from sessionStorage
 * Useful for debugging and monitoring
 */
export function useHydrationErrors() {
  const [errors, setErrors] = React.useState<any[]>([])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedErrors = JSON.parse(
          sessionStorage.getItem("hydration-errors") || "[]"
        )
        setErrors(storedErrors)
      } catch (e) {
        setErrors([])
      }
    }
  }, [])

  const clearErrors = React.useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("hydration-errors")
      setErrors([])
    }
  }, [])

  return { errors, clearErrors }
}