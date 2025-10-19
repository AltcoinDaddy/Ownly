// Centralized Error Types and Interfaces

export enum ErrorCategory {
  WALLET = 'WALLET',
  BLOCKCHAIN = 'BLOCKCHAIN',
  API = 'API',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  IPFS = 'IPFS',
  MARKETPLACE = 'MARKETPLACE',
  AUTHENTICATION = 'AUTHENTICATION',
  TRANSACTION = 'TRANSACTION',
  SYSTEM = 'SYSTEM'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string
  address?: string
  nftId?: string
  transactionId?: string
  endpoint?: string
  operation?: string
  timestamp?: string
  userAgent?: string
  [key: string]: any
}

export interface ErrorDetails {
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  userMessage: string
  context?: ErrorContext
  originalError?: Error
  retryable: boolean
  retryAfter?: number
  actionable: boolean
  suggestedActions?: string[]
  helpUrl?: string
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

export class OwnlyError extends Error {
  public readonly code: string
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly userMessage: string
  public readonly context?: ErrorContext
  public readonly originalError?: Error
  public readonly retryable: boolean
  public readonly retryAfter?: number
  public readonly actionable: boolean
  public readonly suggestedActions?: string[]
  public readonly helpUrl?: string
  public readonly timestamp: string

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = 'OwnlyError'
    this.code = details.code
    this.category = details.category
    this.severity = details.severity
    this.userMessage = details.userMessage
    this.context = details.context
    this.originalError = details.originalError
    this.retryable = details.retryable
    this.retryAfter = details.retryAfter
    this.actionable = details.actionable
    this.suggestedActions = details.suggestedActions
    this.helpUrl = details.helpUrl
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      actionable: this.actionable,
      suggestedActions: this.suggestedActions,
      helpUrl: this.helpUrl,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

// Predefined error codes
export const ERROR_CODES = {
  // Wallet errors
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED: 'WALLET_CONNECTION_FAILED',
  WALLET_DISCONNECTED: 'WALLET_DISCONNECTED',
  WALLET_SIGNATURE_REJECTED: 'WALLET_SIGNATURE_REJECTED',
  WALLET_INSUFFICIENT_FUNDS: 'WALLET_INSUFFICIENT_FUNDS',
  
  // Blockchain errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  BLOCK_NOT_FOUND: 'BLOCK_NOT_FOUND',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  
  // API errors
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMITED: 'API_RATE_LIMITED',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  API_NOT_FOUND: 'API_NOT_FOUND',
  
  // Validation errors
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_NFT_ID: 'INVALID_NFT_ID',
  INVALID_METADATA: 'INVALID_METADATA',
  INVALID_PRICE: 'INVALID_PRICE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // IPFS errors
  IPFS_UPLOAD_FAILED: 'IPFS_UPLOAD_FAILED',
  IPFS_FETCH_FAILED: 'IPFS_FETCH_FAILED',
  IPFS_INVALID_HASH: 'IPFS_INVALID_HASH',
  
  // Marketplace errors
  NFT_NOT_FOR_SALE: 'NFT_NOT_FOR_SALE',
  NFT_ALREADY_SOLD: 'NFT_ALREADY_SOLD',
  LISTING_EXPIRED: 'LISTING_EXPIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  
  // Authentication errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  
  // System errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]