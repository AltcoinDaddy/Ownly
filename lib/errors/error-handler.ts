// Centralized Error Handler

import { OwnlyError, ErrorContext } from './types'
import { ErrorFactory } from './error-factory'
import { ErrorLogger } from './error-logger'
import { RetryHandler } from './retry-handler'

export interface ErrorHandlerOptions {
  context?: ErrorContext
  logError?: boolean
  showToUser?: boolean
  retryable?: boolean
  onError?: (error: OwnlyError) => void
}

export class ErrorHandler {
  private static errorCallbacks: ((error: OwnlyError) => void)[] = []

  // Register global error callback (for UI notifications)
  static onError(callback: (error: OwnlyError) => void): () => void {
    this.errorCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback)
      if (index > -1) {
        this.errorCallbacks.splice(index, 1)
      }
    }
  }

  // Handle any error and convert to OwnlyError
  static handle(
    error: unknown, 
    options: ErrorHandlerOptions = {}
  ): OwnlyError {
    const {
      context,
      logError = true,
      showToUser = true,
      onError
    } = options

    let ownlyError: OwnlyError

    // Convert to OwnlyError if needed
    if (error instanceof OwnlyError) {
      ownlyError = error
    } else if (error instanceof Error) {
      ownlyError = ErrorFactory.fromError(error, context)
    } else if (typeof error === 'string') {
      ownlyError = ErrorFactory.systemError(new Error(error), context)
    } else {
      ownlyError = ErrorFactory.systemError(
        new Error('Unknown error occurred'), 
        context
      )
    }

    // Log the error
    if (logError) {
      ErrorLogger.logError(ownlyError, context)
    }

    // Call registered callbacks
    if (showToUser) {
      this.errorCallbacks.forEach(callback => {
        try {
          callback(ownlyError)
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError)
        }
      })
    }

    // Call custom error handler
    onError?.(ownlyError)

    return ownlyError
  }

  // Handle async operations with error handling
  static async handleAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      throw this.handle(error, options)
    }
  }

  // Handle async operations with retry
  static async handleAsyncWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    try {
      return await RetryHandler.retryApiCall(operation, operationName, options.context)
    } catch (error) {
      throw this.handle(error, options)
    }
  }

  // Wrapper for API calls
  static async handleApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    context?: ErrorContext
  ): Promise<T> {
    return this.handleAsyncWithRetry(
      apiCall,
      `API call to ${endpoint}`,
      {
        context: { ...context, endpoint },
        logError: true,
        showToUser: true
      }
    )
  }

  // Wrapper for blockchain transactions
  static async handleTransaction<T>(
    transaction: () => Promise<T>,
    transactionName: string,
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await RetryHandler.retryTransaction(
        transaction,
        transactionName,
        context
      )
    } catch (error) {
      throw this.handle(error, {
        context: { ...context, operation: transactionName },
        logError: true,
        showToUser: true
      })
    }
  }

  // Wrapper for IPFS operations
  static async handleIPFS<T>(
    ipfsOperation: () => Promise<T>,
    operationName: string,
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await RetryHandler.retryIPFS(
        ipfsOperation,
        operationName,
        context
      )
    } catch (error) {
      throw this.handle(error, {
        context: { ...context, operation: operationName },
        logError: true,
        showToUser: true
      })
    }
  }

  // Validate and handle wallet operations
  static async handleWalletOperation<T>(
    walletOperation: () => Promise<T>,
    operationName: string,
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await walletOperation()
    } catch (error) {
      // Handle specific wallet errors
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || 
            error.message.includes('User denied')) {
          throw ErrorFactory.walletSignatureRejected(context)
        }
        
        if (error.message.includes('insufficient funds') ||
            error.message.includes('insufficient balance')) {
          throw ErrorFactory.insufficientFunds(undefined, undefined, context)
        }
      }

      throw this.handle(error, {
        context: { ...context, operation: operationName },
        logError: true,
        showToUser: true
      })
    }
  }

  // Handle form validation errors
  static handleValidationError(
    field: string,
    value: any,
    message: string,
    context?: ErrorContext
  ): OwnlyError {
    return this.handle(
      ErrorFactory.createError(
        'VALIDATION_ERROR' as any,
        'VALIDATION' as any,
        'MEDIUM' as any,
        `Validation failed for ${field}: ${message}`,
        message,
        {
          context: { ...context, field, value },
          actionable: true
        }
      ),
      { logError: false, showToUser: true }
    )
  }

  // Safe execution wrapper that doesn't throw
  static async safeExecute<T>(
    operation: () => Promise<T>,
    fallback?: T,
    options: ErrorHandlerOptions = {}
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      this.handle(error, { ...options, showToUser: false })
      return fallback
    }
  }

  // Initialize global error handlers
  static initialize(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason
        this.handle(error, {
          context: { type: 'unhandledrejection' },
          logError: true,
          showToUser: false // Don't show unhandled rejections to user
        })
      })

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.handle(event.error, {
          context: { 
            type: 'globalerror',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          },
          logError: true,
          showToUser: false
        })
      })
    }

    // Node.js unhandled rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason) => {
        this.handle(reason, {
          context: { type: 'unhandledrejection' },
          logError: true,
          showToUser: false
        })
      })
    }
  }
}