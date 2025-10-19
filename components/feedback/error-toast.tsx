'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { OwnlyError, ErrorSeverity } from '@/lib/errors'

interface ErrorToastProps {
  error: OwnlyError
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorToast({ error, onRetry, onDismiss }: ErrorToastProps) {
  const { toast } = useToast()

  React.useEffect(() => {
    const variant = getToastVariant(error.severity)
    const actions = createToastActions(error, onRetry, onDismiss)

    toast({
      variant,
      title: getErrorTitle(error),
      description: error.userMessage,
      action: actions,
      duration: getToastDuration(error.severity)
    })
  }, [error, onRetry, onDismiss, toast])

  return null
}

function getToastVariant(severity: ErrorSeverity): 'default' | 'destructive' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'destructive'
    default:
      return 'default'
  }
}

function getErrorTitle(error: OwnlyError): string {
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      return 'Critical Error'
    case ErrorSeverity.HIGH:
      return 'Error'
    case ErrorSeverity.MEDIUM:
      return 'Warning'
    case ErrorSeverity.LOW:
      return 'Notice'
    default:
      return 'Error'
  }
}

function getToastDuration(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return Infinity // Don't auto-dismiss critical errors
    case ErrorSeverity.HIGH:
      return 10000 // 10 seconds
    case ErrorSeverity.MEDIUM:
      return 7000 // 7 seconds
    case ErrorSeverity.LOW:
      return 5000 // 5 seconds
    default:
      return 7000
  }
}

function createToastActions(
  error: OwnlyError, 
  onRetry?: () => void, 
  onDismiss?: () => void
): React.ReactElement | undefined {
  const actions: React.ReactElement[] = []

  // Add retry action if error is retryable and callback is provided
  if (error.retryable && onRetry) {
    actions.push(
      <ToastAction key="retry" altText="Retry" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-1" />
        Retry
      </ToastAction>
    )
  }

  // Add help link if available
  if (error.helpUrl) {
    actions.push(
      <ToastAction 
        key="help" 
        altText="Get Help" 
        onClick={() => window.open(error.helpUrl, '_blank')}
      >
        <ExternalLink className="h-4 w-4 mr-1" />
        Help
      </ToastAction>
    )
  }

  // Add dismiss action for critical errors
  if (error.severity === ErrorSeverity.CRITICAL && onDismiss) {
    actions.push(
      <ToastAction key="dismiss" altText="Dismiss" onClick={onDismiss}>
        <X className="h-4 w-4 mr-1" />
        Dismiss
      </ToastAction>
    )
  }

  // Return the first action (most important)
  return actions[0]
}

// Hook for easy error toast usage
export function useErrorToast() {
  const showError = React.useCallback((
    error: OwnlyError, 
    options?: {
      onRetry?: () => void
      onDismiss?: () => void
    }
  ) => {
    return <ErrorToast 
      error={error} 
      onRetry={options?.onRetry}
      onDismiss={options?.onDismiss}
    />
  }, [])

  return { showError }
}