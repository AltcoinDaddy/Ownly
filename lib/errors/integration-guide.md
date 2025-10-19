# Error Handling System Integration Guide

This guide shows how to integrate the comprehensive error handling system into your Ownly application.

## Quick Start

### 1. Initialize the Error Handler

Add this to your main layout or app initialization:

```typescript
import { ErrorHandler } from '@/lib/errors'

// Initialize global error handlers
ErrorHandler.initialize()
```

### 2. Wrap Your App with Notification Provider

```tsx
import { NotificationProvider } from '@/components/feedback'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  )
}
```

### 3. Use Error Boundaries

```tsx
import { ErrorBoundary, WalletErrorBoundary } from '@/components/feedback'

function MyComponent() {
  return (
    <ErrorBoundary>
      <WalletErrorBoundary>
        <WalletConnectedContent />
      </WalletErrorBoundary>
    </ErrorBoundary>
  )
}
```

## Common Usage Patterns

### API Calls

```typescript
import { ErrorHandler } from '@/lib/errors'

// Simple API call with error handling
const data = await ErrorHandler.handleApiCall(
  () => fetch('/api/nfts').then(res => res.json()),
  '/api/nfts'
)

// With custom context
const data = await ErrorHandler.handleApiCall(
  () => fetch('/api/nfts').then(res => res.json()),
  '/api/nfts',
  { userId: user.id, operation: 'fetch_nfts' }
)
```

### Wallet Operations

```typescript
import { ErrorHandler } from '@/lib/errors'

const result = await ErrorHandler.handleWalletOperation(
  () => fcl.mutate({
    cadence: transaction,
    args: [fcl.arg(nftId, t.UInt64)]
  }),
  'transfer_nft',
  { nftId, recipient }
)
```

### IPFS Operations

```typescript
import { ErrorHandler } from '@/lib/errors'

const ipfsHash = await ErrorHandler.handleIPFS(
  () => uploadToIPFS(file),
  'upload_nft_image',
  { fileName: file.name, fileSize: file.size }
)
```

### Form Validation

```typescript
import { ErrorFactory } from '@/lib/errors'

function validateForm(data: FormData) {
  if (!data.name) {
    throw ErrorFactory.createError(
      'MISSING_REQUIRED_FIELD',
      'VALIDATION',
      'MEDIUM',
      'Name is required',
      'Please enter a name for your NFT',
      {
        context: { field: 'name' },
        actionable: true,
        suggestedActions: ['Enter a name between 1-100 characters']
      }
    )
  }
}
```

## UI Components

### Loading States

```tsx
import { LoadingOverlay, LoadingButton, InlineLoading } from '@/components/feedback'

// Full overlay
<LoadingOverlay isLoading={loading} type="mint" message="Creating NFT...">
  <YourContent />
</LoadingOverlay>

// Button with loading
<LoadingButton isLoading={loading} loadingText="Minting...">
  Mint NFT
</LoadingButton>

// Inline loading
<InlineLoading type="upload" message="Uploading to IPFS..." />
```

### Error Display

```tsx
import { ErrorDisplay, InlineError } from '@/components/feedback'

// Full error display
<ErrorDisplay 
  error={error} 
  onRetry={() => retryOperation()}
  showDetails={true}
/>

// Inline error for forms
<InlineError error={fieldError} />
```

### Notifications

```tsx
import { useNotificationSystem } from '@/components/feedback'

function MyComponent() {
  const { showSuccess, showError, showTransactionNotification } = useNotificationSystem()

  const handleSuccess = () => {
    showSuccess('NFT minted successfully!')
  }

  const handleError = (error: OwnlyError) => {
    showError(error)
  }

  const handleTransaction = () => {
    showTransactionNotification({
      operation: 'mint',
      status: 'pending'
    })
  }
}
```

## Error Types and Factories

### Creating Custom Errors

```typescript
import { ErrorFactory } from '@/lib/errors'

// Wallet errors
const walletError = ErrorFactory.walletNotConnected()
const signatureError = ErrorFactory.walletSignatureRejected()
const fundsError = ErrorFactory.insufficientFunds('1.5 FLOW', '2.0 FLOW')

// Transaction errors
const txError = ErrorFactory.transactionFailed('0x123...', originalError)
const timeoutError = ErrorFactory.transactionTimeout('0x123...')

// API errors
const apiError = ErrorFactory.apiTimeout('/api/nfts')
const rateLimitError = ErrorFactory.apiRateLimited(5000) // retry after 5 seconds

// Validation errors
const addressError = ErrorFactory.invalidAddress('invalid-address')
const nftError = ErrorFactory.invalidNFTId('invalid-id')

// IPFS errors
const uploadError = ErrorFactory.ipfsUploadFailed(originalError)

// Marketplace errors
const notForSaleError = ErrorFactory.nftNotForSale('nft-123')
const soldError = ErrorFactory.nftAlreadySold('nft-123')
```

### Converting Existing Errors

```typescript
import { ErrorFactory } from '@/lib/errors'

// Convert Dapper API errors
const ownlyError = ErrorFactory.fromDapperError(dapperError)

// Convert any error
const ownlyError = ErrorFactory.fromError(anyError, { context: { operation: 'mint' } })
```

## Advanced Usage

### Custom Retry Logic

```typescript
import { RetryHandler } from '@/lib/errors'

const result = await RetryHandler.executeWithRetry(
  () => unstableOperation(),
  {
    maxAttempts: 5,
    baseDelay: 2000,
    shouldRetry: (error, attempt) => {
      // Custom retry logic
      return error.message.includes('temporary') && attempt < 3
    },
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error.message)
    }
  }
)
```

### Error Logging and Monitoring

```typescript
import { ErrorLogger } from '@/lib/errors'

// Manual logging
ErrorLogger.logError(error, { userId: user.id })
ErrorLogger.logWarning('Slow API response', { endpoint: '/api/nfts', duration: 5000 })

// Get error statistics
const stats = ErrorLogger.getErrorStats()
console.log('Recent errors:', stats.recent)
console.log('Errors by severity:', stats.bySeverity)
```

### Safe Execution

```typescript
import { ErrorHandler } from '@/lib/errors'

// Execute without throwing
const result = await ErrorHandler.safeExecute(
  () => riskyOperation(),
  'fallback-value', // returned if operation fails
  { logError: true, showToUser: false }
)
```

## Best Practices

1. **Always use ErrorHandler for async operations**
2. **Provide meaningful context in error handling**
3. **Use appropriate error boundaries for different sections**
4. **Show loading states for all async operations**
5. **Provide actionable error messages with suggested solutions**
6. **Use the notification system for user feedback**
7. **Log errors appropriately (but not sensitive data)**
8. **Test error scenarios thoroughly**

## Testing Error Handling

```typescript
import { ErrorFactory, ErrorHandler } from '@/lib/errors'

// Test error creation
const error = ErrorFactory.walletNotConnected()
expect(error.code).toBe('WALLET_NOT_CONNECTED')
expect(error.retryable).toBe(false)
expect(error.actionable).toBe(true)

// Test error handling
const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'))
await expect(ErrorHandler.handleAsync(mockOperation)).rejects.toThrow()
```

This error handling system provides comprehensive coverage for all error scenarios in the Ownly application while maintaining a great user experience.