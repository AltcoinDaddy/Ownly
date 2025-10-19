// Error Factory for creating standardized errors

import { 
  OwnlyError, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorDetails, 
  ErrorContext, 
  ERROR_CODES,
  type ErrorCode 
} from './types'
import { DapperAPIError, DapperErrorType } from '@/lib/dapper/types'

export class ErrorFactory {
  private static createError(
    code: ErrorCode,
    category: ErrorCategory,
    severity: ErrorSeverity,
    message: string,
    userMessage: string,
    options: {
      context?: ErrorContext
      originalError?: Error
      retryable?: boolean
      retryAfter?: number
      actionable?: boolean
      suggestedActions?: string[]
      helpUrl?: string
    } = {}
  ): OwnlyError {
    const details: ErrorDetails = {
      code,
      category,
      severity,
      message,
      userMessage,
      retryable: options.retryable ?? false,
      actionable: options.actionable ?? false,
      ...options
    }

    return new OwnlyError(details)
  }

  // Wallet Errors
  static walletNotConnected(context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.WALLET_NOT_CONNECTED,
      ErrorCategory.WALLET,
      ErrorSeverity.MEDIUM,
      'Wallet is not connected',
      'Please connect your wallet to continue',
      {
        context,
        actionable: true,
        suggestedActions: ['Click "Connect Wallet" button', 'Ensure your wallet extension is installed'],
        helpUrl: '/help/wallet-connection'
      }
    )
  }

  static walletConnectionFailed(originalError?: Error, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.WALLET_CONNECTION_FAILED,
      ErrorCategory.WALLET,
      ErrorSeverity.HIGH,
      'Failed to connect to wallet',
      'Unable to connect to your wallet. Please try again.',
      {
        context,
        originalError,
        retryable: true,
        actionable: true,
        suggestedActions: [
          'Refresh the page and try again',
          'Check if your wallet extension is unlocked',
          'Try switching to a different wallet'
        ],
        helpUrl: '/help/wallet-troubleshooting'
      }
    )
  }

  static walletSignatureRejected(context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.WALLET_SIGNATURE_REJECTED,
      ErrorCategory.WALLET,
      ErrorSeverity.MEDIUM,
      'Transaction signature was rejected by user',
      'Transaction cancelled. You rejected the signature request.',
      {
        context,
        actionable: true,
        suggestedActions: ['Try the transaction again and approve the signature'],
        helpUrl: '/help/transaction-signing'
      }
    )
  }

  static insufficientFunds(balance?: string, required?: string, context?: ErrorContext): OwnlyError {
    const balanceInfo = balance && required ? ` (Balance: ${balance}, Required: ${required})` : ''
    return this.createError(
      ERROR_CODES.WALLET_INSUFFICIENT_FUNDS,
      ErrorCategory.WALLET,
      ErrorSeverity.HIGH,
      `Insufficient funds for transaction${balanceInfo}`,
      'You don\'t have enough FLOW tokens to complete this transaction.',
      {
        context: { ...context, balance, required },
        actionable: true,
        suggestedActions: [
          'Add more FLOW tokens to your wallet',
          'Try a transaction with a lower amount'
        ],
        helpUrl: '/help/add-funds'
      }
    )
  }

  // Transaction Errors
  static transactionFailed(transactionId?: string, originalError?: Error, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.TRANSACTION_FAILED,
      ErrorCategory.TRANSACTION,
      ErrorSeverity.HIGH,
      'Blockchain transaction failed',
      'Your transaction failed to complete. Please try again.',
      {
        context: { ...context, transactionId },
        originalError,
        retryable: true,
        actionable: true,
        suggestedActions: [
          'Wait a moment and try again',
          'Check your wallet balance',
          'Contact support if the issue persists'
        ],
        helpUrl: '/help/transaction-issues'
      }
    )
  }

  static transactionTimeout(transactionId?: string, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.TRANSACTION_TIMEOUT,
      ErrorCategory.TRANSACTION,
      ErrorSeverity.MEDIUM,
      'Transaction timed out',
      'Your transaction is taking longer than expected. It may still complete.',
      {
        context: { ...context, transactionId },
        retryable: true,
        actionable: true,
        suggestedActions: [
          'Check your transaction status in a few minutes',
          'Try the transaction again if it doesn\'t complete'
        ],
        helpUrl: '/help/transaction-status'
      }
    )
  }

  // API Errors
  static apiTimeout(endpoint?: string, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.API_TIMEOUT,
      ErrorCategory.API,
      ErrorSeverity.MEDIUM,
      'API request timed out',
      'The request is taking longer than expected. Please try again.',
      {
        context: { ...context, endpoint },
        retryable: true,
        retryAfter: 5000,
        actionable: true,
        suggestedActions: ['Wait a moment and try again', 'Check your internet connection']
      }
    )
  }

  static apiRateLimited(retryAfter?: number, context?: ErrorContext): OwnlyError {
    const retryMessage = retryAfter ? ` Please wait ${Math.ceil(retryAfter / 1000)} seconds.` : ''
    return this.createError(
      ERROR_CODES.API_RATE_LIMITED,
      ErrorCategory.API,
      ErrorSeverity.MEDIUM,
      'API rate limit exceeded',
      `Too many requests. Please slow down.${retryMessage}`,
      {
        context,
        retryable: true,
        retryAfter,
        actionable: true,
        suggestedActions: ['Wait before making another request', 'Reduce the frequency of your actions']
      }
    )
  }

  // Validation Errors
  static invalidAddress(address?: string, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.INVALID_ADDRESS,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      'Invalid Flow address format',
      'Please enter a valid Flow address (0x followed by 16 hexadecimal characters)',
      {
        context: { ...context, address },
        actionable: true,
        suggestedActions: ['Check the address format', 'Copy the address from a trusted source'],
        helpUrl: '/help/flow-addresses'
      }
    )
  }

  static invalidNFTId(nftId?: string, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.INVALID_NFT_ID,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      'Invalid NFT ID',
      'The NFT ID provided is not valid',
      {
        context: { ...context, nftId },
        actionable: true,
        suggestedActions: ['Check the NFT ID', 'Refresh the page and try again']
      }
    )
  }

  // IPFS Errors
  static ipfsUploadFailed(originalError?: Error, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.IPFS_UPLOAD_FAILED,
      ErrorCategory.IPFS,
      ErrorSeverity.HIGH,
      'Failed to upload to IPFS',
      'Unable to upload your file. Please try again.',
      {
        context,
        originalError,
        retryable: true,
        actionable: true,
        suggestedActions: [
          'Check your internet connection',
          'Try uploading a smaller file',
          'Wait a moment and try again'
        ],
        helpUrl: '/help/file-upload'
      }
    )
  }

  // Marketplace Errors
  static nftNotForSale(nftId?: string, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.NFT_NOT_FOR_SALE,
      ErrorCategory.MARKETPLACE,
      ErrorSeverity.MEDIUM,
      'NFT is not listed for sale',
      'This NFT is not currently available for purchase',
      {
        context: { ...context, nftId },
        actionable: true,
        suggestedActions: ['Browse other available NFTs', 'Check back later']
      }
    )
  }

  static nftAlreadySold(nftId?: string, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.NFT_ALREADY_SOLD,
      ErrorCategory.MARKETPLACE,
      ErrorSeverity.MEDIUM,
      'NFT has already been sold',
      'Someone else purchased this NFT before you',
      {
        context: { ...context, nftId },
        actionable: true,
        suggestedActions: ['Browse other available NFTs', 'Set up alerts for similar NFTs']
      }
    )
  }

  // Network Errors
  static networkError(originalError?: Error, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.NETWORK_ERROR,
      ErrorCategory.NETWORK,
      ErrorSeverity.HIGH,
      'Network connection error',
      'Unable to connect to the network. Please check your internet connection.',
      {
        context,
        originalError,
        retryable: true,
        actionable: true,
        suggestedActions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ]
      }
    )
  }

  // System Errors
  static systemError(originalError?: Error, context?: ErrorContext): OwnlyError {
    return this.createError(
      ERROR_CODES.SYSTEM_ERROR,
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      'System error occurred',
      'Something went wrong on our end. Please try again later.',
      {
        context,
        originalError,
        retryable: true,
        actionable: true,
        suggestedActions: [
          'Try again in a few minutes',
          'Contact support if the issue persists'
        ],
        helpUrl: '/help/contact-support'
      }
    )
  }

  // Convert Dapper API errors to Ownly errors
  static fromDapperError(dapperError: DapperAPIError, context?: ErrorContext): OwnlyError {
    switch (dapperError.type) {
      case DapperErrorType.AUTHENTICATION_ERROR:
        return this.createError(
          ERROR_CODES.API_UNAUTHORIZED,
          ErrorCategory.API,
          ErrorSeverity.HIGH,
          'Authentication failed with Dapper API',
          'Authentication error. Please try again.',
          {
            context,
            originalError: dapperError,
            retryable: false,
            actionable: true,
            suggestedActions: ['Contact support if this issue persists']
          }
        )

      case DapperErrorType.INSUFFICIENT_FUNDS:
        return this.insufficientFunds(undefined, undefined, context)

      case DapperErrorType.RATE_LIMIT_EXCEEDED:
        return this.apiRateLimited(dapperError.retryAfter, context)

      case DapperErrorType.SERVER_ERROR:
        return this.createError(
          ERROR_CODES.API_SERVER_ERROR,
          ErrorCategory.API,
          ErrorSeverity.HIGH,
          'Dapper API server error',
          'Service temporarily unavailable. Please try again later.',
          {
            context,
            originalError: dapperError,
            retryable: true,
            retryAfter: dapperError.retryAfter,
            actionable: true,
            suggestedActions: ['Wait a moment and try again']
          }
        )

      case DapperErrorType.NETWORK_ERROR:
        return this.networkError(dapperError, context)

      case DapperErrorType.NFT_NOT_FOUND:
        return this.createError(
          ERROR_CODES.API_NOT_FOUND,
          ErrorCategory.API,
          ErrorSeverity.MEDIUM,
          'NFT not found',
          'The requested NFT could not be found',
          {
            context,
            originalError: dapperError,
            actionable: true,
            suggestedActions: ['Check the NFT ID', 'Refresh the page']
          }
        )

      default:
        return this.systemError(dapperError, context)
    }
  }

  // Convert generic errors to Ownly errors
  static fromError(error: Error, context?: ErrorContext): OwnlyError {
    if (error instanceof OwnlyError) {
      return error
    }

    if (error instanceof DapperAPIError) {
      return this.fromDapperError(error, context)
    }

    // Handle common error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return this.networkError(error, context)
    }

    if (error.message.includes('timeout')) {
      return this.apiTimeout(undefined, context)
    }

    if (error.message.includes('signature') || error.message.includes('rejected')) {
      return this.walletSignatureRejected(context)
    }

    // Default to system error
    return this.systemError(error, context)
  }
}