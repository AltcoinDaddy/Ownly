'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorHandler, OwnlyError, ErrorSeverity } from '@/lib/errors'

interface ErrorBoundaryState {
  hasError: boolean
  error?: OwnlyError
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: OwnlyError, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: OwnlyError
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert to OwnlyError if needed
    const ownlyError = error instanceof OwnlyError 
      ? error 
      : ErrorHandler.handle(error, { logError: false, showToUser: false })

    return {
      hasError: true,
      error: ownlyError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const ownlyError = this.state.error || ErrorHandler.handle(error, { 
      logError: true, 
      showToUser: false,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    })

    this.setState({ errorInfo })
    this.props.onError?.(ownlyError, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            {error.severity === ErrorSeverity.CRITICAL ? 'Critical Error' : 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {error.userMessage || 'An unexpected error occurred'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error.suggestedActions && error.suggestedActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Try these steps:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {error.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xs mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isProduction && errorInfo && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-auto max-h-32">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Code:</strong> {error.code}
                </div>
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button onClick={resetError} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="default" 
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </CardFooter>

        {error.helpUrl && (
          <CardFooter className="pt-0">
            <Button 
              onClick={() => window.open(error.helpUrl, '_blank')}
              variant="ghost" 
              className="w-full"
            >
              <Bug className="h-4 w-4 mr-2" />
              Get Help
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

// Specialized error boundaries for different sections
export function WalletErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Card className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wallet Connection Error</h3>
          <p className="text-muted-foreground mb-4">{error.userMessage}</p>
          <Button onClick={resetError}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function NFTErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Card className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">NFT Loading Error</h3>
          <p className="text-muted-foreground mb-4">{error.userMessage}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function TransactionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Card className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Transaction Error</h3>
          <p className="text-muted-foreground mb-4">{error.userMessage}</p>
          {error.retryable && (
            <Button onClick={resetError}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Transaction Again
            </Button>
          )}
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}