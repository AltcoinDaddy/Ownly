import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorHandler } from '@/lib/errors/error-handler'
import { RetryHandler } from '@/lib/errors/retry-handler'
import { ErrorFactory } from '@/lib/errors/error-factory'
import { OwnlyError } from '@/lib/errors/types'

describe('ErrorHandler', () => {
  let mockErrorCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockErrorCallback = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('should handle OwnlyError instances', () => {
      const originalError = ErrorFactory.walletNotConnected()
      
      const result = ErrorHandler.handle(originalError, { showToUser: false })
      
      expect(result).toBe(originalError)
      expect(result).toBeInstanceOf(OwnlyError)
    })

    it('should convert regular Error to OwnlyError', () => {
      const originalError = new Error('Test error')
      
      const result = ErrorHandler.handle(originalError, { showToUser: false })
      
      expect(result).toBeInstanceOf(OwnlyError)
      expect(result.message).toBe('Test error')
    })

    it('should convert string errors to OwnlyError', () => {
      const result = ErrorHandler.handle('String error', { showToUser: false })
      
      expect(result).toBeInstanceOf(OwnlyError)
      expect(result.message).toBe('String error')
    })

    it('should handle unknown error types', () => {
      const result = ErrorHandler.handle({ unknown: 'object' }, { showToUser: false })
      
      expect(result).toBeInstanceOf(OwnlyError)
      expect(result.message).toBe('Unknown error occurred')
    })

    it('should call registered error callbacks', () => {
      const unsubscribe = ErrorHandler.onError(mockErrorCallback)
      
      const error = new Error('Test error')
      ErrorHandler.handle(error, { showToUser: true })
      
      expect(mockErrorCallback).toHaveBeenCalledOnce()
      expect(mockErrorCallback).toHaveBeenCalledWith(expect.any(OwnlyError))
      
      unsubscribe()
    })

    it('should not call callbacks when showToUser is false', () => {
      ErrorHandler.onError(mockErrorCallback)
      
      const error = new Error('Test error')
      ErrorHandler.handle(error, { showToUser: false })
      
      expect(mockErrorCallback).not.toHaveBeenCalled()
    })

    it('should call custom onError callback', () => {
      const customCallback = vi.fn()
      
      const error = new Error('Test error')
      ErrorHandler.handle(error, { 
        showToUser: false,
        onError: customCallback 
      })
      
      expect(customCallback).toHaveBeenCalledOnce()
      expect(customCallback).toHaveBeenCalledWith(expect.any(OwnlyError))
    })

    it('should handle callback errors gracefully', () => {
      const faultyCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })
      
      ErrorHandler.onError(faultyCallback)
      
      // Should not throw even if callback throws
      expect(() => {
        ErrorHandler.handle(new Error('Test error'), { showToUser: true })
      }).not.toThrow()
      
      expect(faultyCallback).toHaveBeenCalled()
    })
  })

  describe('handleAsync', () => {
    it('should handle successful async operations', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await ErrorHandler.handleAsync(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledOnce()
    })

    it('should handle async operation errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Async error'))
      
      await expect(ErrorHandler.handleAsync(operation, { showToUser: false }))
        .rejects.toThrow(OwnlyError)
    })
  })

  describe('handleApiCall', () => {
    it('should handle successful API calls', async () => {
      const apiCall = vi.fn().mockResolvedValue({ data: 'success' })
      
      const result = await ErrorHandler.handleApiCall(apiCall, '/test-endpoint')
      
      expect(result).toEqual({ data: 'success' })
      expect(apiCall).toHaveBeenCalled()
    })

    it('should retry failed API calls', async () => {
      const apiCall = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ data: 'success' })
      
      vi.useFakeTimers()
      
      const resultPromise = ErrorHandler.handleApiCall(apiCall, '/test-endpoint')
      
      // Fast forward through retry delay
      await vi.runAllTimersAsync()
      
      const result = await resultPromise
      
      expect(result).toEqual({ data: 'success' })
      expect(apiCall).toHaveBeenCalledTimes(2)
      
      vi.useRealTimers()
    })
  })

  describe('handleWalletOperation', () => {
    it('should handle successful wallet operations', async () => {
      const walletOp = vi.fn().mockResolvedValue('0xtransactionhash')
      
      const result = await ErrorHandler.handleWalletOperation(walletOp, 'sign transaction')
      
      expect(result).toBe('0xtransactionhash')
    })

    it('should handle user rejection errors', async () => {
      const walletOp = vi.fn().mockRejectedValue(new Error('User rejected the transaction'))
      
      await expect(ErrorHandler.handleWalletOperation(walletOp, 'sign transaction'))
        .rejects.toThrow('User rejected wallet signature')
    })

    it('should handle insufficient funds errors', async () => {
      const walletOp = vi.fn().mockRejectedValue(new Error('insufficient funds'))
      
      await expect(ErrorHandler.handleWalletOperation(walletOp, 'send transaction'))
        .rejects.toThrow('Insufficient funds')
    })

    it('should handle generic wallet errors', async () => {
      const walletOp = vi.fn().mockRejectedValue(new Error('Wallet connection lost'))
      
      await expect(ErrorHandler.handleWalletOperation(walletOp, 'connect wallet'))
        .rejects.toThrow(OwnlyError)
    })
  })

  describe('handleValidationError', () => {
    it('should create validation errors', () => {
      const error = ErrorHandler.handleValidationError(
        'email',
        'invalid-email',
        'Invalid email format'
      )
      
      expect(error).toBeInstanceOf(OwnlyError)
      expect(error.message).toContain('Validation failed for email')
    })
  })

  describe('safeExecute', () => {
    it('should return result on success', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await ErrorHandler.safeExecute(operation)
      
      expect(result).toBe('success')
    })

    it('should return fallback on error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'))
      
      const result = await ErrorHandler.safeExecute(operation, 'fallback')
      
      expect(result).toBe('fallback')
    })

    it('should return undefined when no fallback provided', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'))
      
      const result = await ErrorHandler.safeExecute(operation)
      
      expect(result).toBeUndefined()
    })
  })
})

describe('RetryHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await RetryHandler.executeWithRetry(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success')
      
      const resultPromise = RetryHandler.executeWithRetry(operation, {
        maxAttempts: 3,
        baseDelay: 100
      })
      
      // Fast forward through retry delays
      await vi.runAllTimersAsync()
      
      const result = await resultPromise
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation error'))
      
      await expect(RetryHandler.executeWithRetry(operation, {
        shouldRetry: () => false
      })).rejects.toThrow('Validation error')
      
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should respect max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))
      
      const resultPromise = RetryHandler.executeWithRetry(operation, {
        maxAttempts: 2,
        baseDelay: 100
      })
      
      await vi.runAllTimersAsync()
      
      await expect(resultPromise).rejects.toThrow('Network error')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should call onRetry callback', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')
      
      const onRetry = vi.fn()
      
      const resultPromise = RetryHandler.executeWithRetry(operation, {
        maxAttempts: 2,
        baseDelay: 100,
        onRetry
      })
      
      await vi.runAllTimersAsync()
      
      await resultPromise
      
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
    })

    it('should use custom shouldRetry logic', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Custom error'))
      const shouldRetry = vi.fn().mockReturnValue(false)
      
      await expect(RetryHandler.executeWithRetry(operation, {
        shouldRetry
      })).rejects.toThrow('Custom error')
      
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should implement exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')
      
      const delays: number[] = []
      const originalSetTimeout = global.setTimeout
      
      vi.mocked(setTimeout).mockImplementation((callback, delay) => {
        delays.push(delay as number)
        return originalSetTimeout(callback, 0) // Execute immediately for test
      })
      
      await RetryHandler.executeWithRetry(operation, {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffMultiplier: 2
      })
      
      // Should have exponential backoff: 1000ms, 2000ms
      expect(delays).toHaveLength(2)
      expect(delays[0]).toBeGreaterThanOrEqual(1000)
      expect(delays[1]).toBeGreaterThanOrEqual(2000)
    })
  })

  describe('retryApiCall', () => {
    it('should retry API calls with appropriate settings', async () => {
      const apiCall = vi.fn()
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValue({ data: 'success' })
      
      const resultPromise = RetryHandler.retryApiCall(apiCall, 'test API')
      
      await vi.runAllTimersAsync()
      
      const result = await resultPromise
      
      expect(result).toEqual({ data: 'success' })
      expect(apiCall).toHaveBeenCalledTimes(2)
    })
  })

  describe('retryTransaction', () => {
    it('should retry transactions with blockchain-appropriate settings', async () => {
      const transaction = vi.fn()
        .mockRejectedValueOnce(new Error('Transaction timeout'))
        .mockResolvedValue('0xtxhash')
      
      const resultPromise = RetryHandler.retryTransaction(transaction, 'mint NFT')
      
      await vi.runAllTimersAsync()
      
      const result = await resultPromise
      
      expect(result).toBe('0xtxhash')
      expect(transaction).toHaveBeenCalledTimes(2)
    })
  })

  describe('retryIPFS', () => {
    it('should retry IPFS operations with appropriate settings', async () => {
      const ipfsOp = vi.fn()
        .mockRejectedValueOnce(new Error('IPFS timeout'))
        .mockResolvedValue('QmHash123')
      
      const resultPromise = RetryHandler.retryIPFS(ipfsOp, 'upload metadata')
      
      await vi.runAllTimersAsync()
      
      const result = await resultPromise
      
      expect(result).toBe('QmHash123')
      expect(ipfsOp).toHaveBeenCalledTimes(2)
    })
  })
})