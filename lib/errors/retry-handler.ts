// Retry Handler with Exponential Backoff

import { OwnlyError, RetryConfig } from './types'

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: Error) => void
  shouldRetry?: (error: Error, attempt: number) => boolean
}

export class RetryHandler {
  private static defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      'NETWORK_ERROR',
      'API_TIMEOUT',
      'API_SERVER_ERROR',
      'TRANSACTION_TIMEOUT',
      'IPFS_UPLOAD_FAILED',
      'SYSTEM_ERROR'
    ]
  }

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultConfig, ...options }
    let lastError: Error

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Check if we should retry
        if (!this.shouldRetry(error as Error, attempt, config, options.shouldRetry)) {
          throw error
        }

        // Don't wait after the last attempt
        if (attempt === config.maxAttempts) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config)
        
        // Call retry callback if provided
        options.onRetry?.(attempt, error as Error)

        // Wait before retrying
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  private static shouldRetry(
    error: Error, 
    attempt: number, 
    config: RetryConfig,
    customShouldRetry?: (error: Error, attempt: number) => boolean
  ): boolean {
    // Use custom retry logic if provided
    if (customShouldRetry) {
      return customShouldRetry(error, attempt)
    }

    // Don't retry if we've reached max attempts
    if (attempt >= config.maxAttempts) {
      return false
    }

    // Check if it's an OwnlyError and if it's retryable
    if (error instanceof OwnlyError) {
      return error.retryable
    }

    // Check if error code is in retryable list
    if (error instanceof OwnlyError && config.retryableErrors.includes(error.code)) {
      return true
    }

    // Default retry logic for common error patterns
    const errorMessage = error.message.toLowerCase()
    
    // Network-related errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection')) {
      return true
    }

    // Server errors (5xx)
    if (errorMessage.includes('server error') || 
        errorMessage.includes('internal error') ||
        errorMessage.includes('service unavailable')) {
      return true
    }

    return false
  }

  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay
    
    return Math.min(exponentialDelay + jitter, config.maxDelay)
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Utility method for retrying specific operations
  static async retryApiCall<T>(
    apiCall: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    return this.executeWithRetry(apiCall, {
      maxAttempts: 3,
      baseDelay: 1000,
      onRetry: (attempt, error) => {
        console.warn(`[RETRY] ${operationName} failed (attempt ${attempt}):`, {
          error: error.message,
          context
        })
      }
    })
  }

  // Utility method for retrying blockchain transactions
  static async retryTransaction<T>(
    transaction: () => Promise<T>,
    transactionName: string,
    context?: Record<string, any>
  ): Promise<T> {
    return this.executeWithRetry(transaction, {
      maxAttempts: 2, // Fewer retries for transactions
      baseDelay: 2000, // Longer delay for blockchain operations
      onRetry: (attempt, error) => {
        console.warn(`[RETRY] ${transactionName} failed (attempt ${attempt}):`, {
          error: error.message,
          context
        })
      }
    })
  }

  // Utility method for retrying IPFS operations
  static async retryIPFS<T>(
    ipfsOperation: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    return this.executeWithRetry(ipfsOperation, {
      maxAttempts: 4, // More retries for IPFS due to network variability
      baseDelay: 500,
      maxDelay: 10000,
      onRetry: (attempt, error) => {
        console.warn(`[RETRY] IPFS ${operationName} failed (attempt ${attempt}):`, {
          error: error.message,
          context
        })
      }
    })
  }
}