'use client'

import React from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { OwnlyError, ErrorHandler, ErrorSeverity } from '@/lib/errors'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationOptions {
  title?: string
  message: string
  type: NotificationType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

export interface TransactionNotificationOptions {
  transactionId?: string
  nftId?: string
  operation: 'mint' | 'transfer' | 'purchase' | 'list' | 'cancel'
  status: 'pending' | 'success' | 'failed'
  error?: OwnlyError
}

// Main notification system hook
export function useNotificationSystem() {
  const { toast } = useToast()

  const showNotification = React.useCallback((options: NotificationOptions) => {
    const { title, message, type, duration, action, persistent } = options
    
    const variant = type === 'error' ? 'destructive' : 'default'
    const icon = getNotificationIcon(type)
    
    toast({
      title: title || getDefaultTitle(type),
      description: (
        <div className="flex items-start gap-2">
          {icon}
          <span>{message}</span>
        </div>
      ),
      variant,
      duration: persistent ? Infinity : (duration || getDefaultDuration(type)),
      action: action ? (
        <button
          onClick={action.onClick}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {action.label}
        </button>
      ) : undefined
    })
  }, [toast])

  const showSuccess = React.useCallback((message: string, options?: Partial<NotificationOptions>) => {
    showNotification({
      ...options,
      message,
      type: 'success'
    })
  }, [showNotification])

  const showError = React.useCallback((error: OwnlyError | string, options?: Partial<NotificationOptions>) => {
    const errorMessage = typeof error === 'string' ? error : error.userMessage
    const errorTitle = typeof error === 'string' ? 'Error' : getErrorTitle(error.severity)
    
    showNotification({
      ...options,
      title: options?.title || errorTitle,
      message: errorMessage,
      type: 'error',
      duration: typeof error === 'string' ? undefined : getErrorDuration(error.severity)
    })
  }, [showNotification])

  const showWarning = React.useCallback((message: string, options?: Partial<NotificationOptions>) => {
    showNotification({
      ...options,
      message,
      type: 'warning'
    })
  }, [showNotification])

  const showInfo = React.useCallback((message: string, options?: Partial<NotificationOptions>) => {
    showNotification({
      ...options,
      message,
      type: 'info'
    })
  }, [showNotification])

  const showTransactionNotification = React.useCallback((options: TransactionNotificationOptions) => {
    const { transactionId, nftId, operation, status, error } = options
    
    switch (status) {
      case 'pending':
        showNotification({
          type: 'info',
          title: 'Transaction Pending',
          message: getTransactionPendingMessage(operation),
          persistent: true
        })
        break
        
      case 'success':
        showNotification({
          type: 'success',
          title: 'Transaction Successful',
          message: getTransactionSuccessMessage(operation, nftId),
          duration: 8000,
          action: transactionId ? {
            label: 'View Transaction',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.open(`https://flowscan.org/transaction/${transactionId}`, '_blank')
              }
            }
          } : undefined
        })
        break
        
      case 'failed':
        if (error) {
          showError(error, {
            title: 'Transaction Failed',
            action: error.retryable ? {
              label: 'Retry',
              onClick: () => {
                // This would be handled by the calling component
                console.log('Retry transaction')
              }
            } : undefined
          })
        } else {
          showNotification({
            type: 'error',
            title: 'Transaction Failed',
            message: `Failed to ${operation} NFT. Please try again.`
          })
        }
        break
    }
  }, [showNotification, showError])

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTransactionNotification
  }
}

// Notification system provider for global error handling
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { showError } = useNotificationSystem()

  React.useEffect(() => {
    // Register global error handler
    const unsubscribe = ErrorHandler.onError((error: OwnlyError) => {
      showError(error)
    })

    return unsubscribe
  }, [showError])

  return <>{children}</>
}

// Helper functions
function getNotificationIcon(type: NotificationType) {
  const iconClass = "h-4 w-4 flex-shrink-0"
  
  switch (type) {
    case 'success':
      return <CheckCircle className={`${iconClass} text-green-500`} />
    case 'error':
      return <AlertCircle className={`${iconClass} text-red-500`} />
    case 'warning':
      return <AlertTriangle className={`${iconClass} text-yellow-500`} />
    case 'info':
      return <Info className={`${iconClass} text-blue-500`} />
    default:
      return <Info className={`${iconClass} text-blue-500`} />
  }
}

function getDefaultTitle(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'Success'
    case 'error':
      return 'Error'
    case 'warning':
      return 'Warning'
    case 'info':
      return 'Information'
    default:
      return 'Notification'
  }
}

function getDefaultDuration(type: NotificationType): number {
  switch (type) {
    case 'success':
      return 5000
    case 'error':
      return 8000
    case 'warning':
      return 6000
    case 'info':
      return 4000
    default:
      return 5000
  }
}

function getErrorTitle(severity: ErrorSeverity): string {
  switch (severity) {
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

function getErrorDuration(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return Infinity
    case ErrorSeverity.HIGH:
      return 10000
    case ErrorSeverity.MEDIUM:
      return 7000
    case ErrorSeverity.LOW:
      return 5000
    default:
      return 7000
  }
}

function getTransactionPendingMessage(operation: string): string {
  switch (operation) {
    case 'mint':
      return 'Your NFT is being minted on the blockchain...'
    case 'transfer':
      return 'Your NFT transfer is being processed...'
    case 'purchase':
      return 'Your NFT purchase is being processed...'
    case 'list':
      return 'Your NFT is being listed for sale...'
    case 'cancel':
      return 'Cancelling your NFT listing...'
    default:
      return 'Your transaction is being processed...'
  }
}

function getTransactionSuccessMessage(operation: string, nftId?: string): string {
  const nftText = nftId ? ` (NFT #${nftId})` : ''
  
  switch (operation) {
    case 'mint':
      return `NFT successfully minted${nftText}!`
    case 'transfer':
      return `NFT successfully transferred${nftText}!`
    case 'purchase':
      return `NFT successfully purchased${nftText}!`
    case 'list':
      return `NFT successfully listed for sale${nftText}!`
    case 'cancel':
      return `NFT listing successfully cancelled${nftText}!`
    default:
      return `Transaction completed successfully${nftText}!`
  }
}