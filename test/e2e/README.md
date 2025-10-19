# End-to-End Testing with Playwright

This directory contains comprehensive end-to-end tests for the Ownly NFT marketplace, covering complete user journeys from wallet connection to NFT operations.

## Test Structure

### Core Test Files

- **`wallet-connection.spec.ts`** - Tests wallet connection, disconnection, and authentication flows
- **`nft-minting.spec.ts`** - Tests complete NFT minting workflow with IPFS upload and validation
- **`nft-transfer.spec.ts`** - Tests peer-to-peer NFT transfers with real-time UI updates
- **`marketplace.spec.ts`** - Tests marketplace listing, purchasing, and search functionality
- **`real-time-events.spec.ts`** - Tests real-time blockchain event notifications and UI updates
- **`error-handling.spec.ts`** - Tests error scenarios, retry mechanisms, and recovery flows
- **`complete-user-journey.spec.ts`** - Tests full end-to-end user journeys combining all features

### Utility Files

- **`utils/flow-helpers.ts`** - Helper functions for Flow blockchain interactions and wallet mocking
- **`utils/test-data.ts`** - Mock data and API responses for consistent testing
- **`global-setup.ts`** - Global test setup including Flow emulator initialization
- **`global-teardown.ts`** - Global test cleanup

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Ensure Flow CLI is installed:**
   ```bash
   # Install Flow CLI if not already installed
   sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"
   ```

### Test Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests with UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

### Running Specific Test Files

```bash
# Run only wallet connection tests
npx playwright test wallet-connection

# Run only marketplace tests
npx playwright test marketplace

# Run complete user journey tests
npx playwright test complete-user-journey
```

## Test Environment

### Flow Emulator Integration

The tests automatically:
1. Start a Flow emulator instance
2. Deploy DapperCollectibles and DapperMarket contracts
3. Set up test accounts with initial state
4. Mint test NFTs for testing scenarios

### Mock Services

Tests use comprehensive mocking for:
- **Dapper Core API** - All NFT operations (mint, transfer, marketplace)
- **IPFS/NFT.Storage** - File uploads and metadata storage
- **Flow Client Library (FCL)** - Wallet connections and transactions
- **Real-time Events** - Blockchain event subscriptions

### Test Data

Consistent test data is provided for:
- Test wallet addresses and user profiles
- NFT metadata and attributes
- Marketplace listings and prices
- Transaction hashes and responses

## Test Scenarios Covered

### 1. Wallet Connection Journey
- ✅ Connect/disconnect wallet flows
- ✅ Wallet persistence across navigation
- ✅ Error handling for connection failures
- ✅ Multiple wallet support (Dapper, Blocto)

### 2. NFT Minting Journey
- ✅ Complete mint workflow (metadata + IPFS upload)
- ✅ Form validation and error handling
- ✅ Progress tracking and success states
- ✅ File upload validation and processing

### 3. NFT Transfer Journey
- ✅ Peer-to-peer transfers between users
- ✅ Address validation and error prevention
- ✅ Real-time UI updates for sender/receiver
- ✅ Transfer confirmation and progress tracking

### 4. Marketplace Journey
- ✅ List NFTs for sale with price validation
- ✅ Purchase NFTs with confirmation flows
- ✅ Search, filter, and sort functionality
- ✅ Real-time marketplace updates

### 5. Real-time Events
- ✅ Blockchain event notifications (mint, transfer, sale)
- ✅ Automatic UI updates without page refresh
- ✅ Event filtering based on user relevance
- ✅ Notification preferences and management

### 6. Error Handling & Recovery
- ✅ Network connectivity issues and retry mechanisms
- ✅ API rate limiting with exponential backoff
- ✅ Transaction failures and recovery options
- ✅ Wallet disconnection during operations
- ✅ IPFS upload failures with fallback
- ✅ Session timeout and re-authentication

### 7. Complete User Journeys
- ✅ Creator journey: Connect → Mint → List → Sell
- ✅ Collector journey: Connect → Browse → Buy → Transfer
- ✅ Error recovery throughout complete workflows

## Browser Coverage

Tests run across multiple browsers and devices:
- **Desktop:** Chrome, Firefox, Safari
- **Mobile:** Chrome (Pixel 5), Safari (iPhone 12)

## Continuous Integration

The test suite is designed for CI/CD integration with:
- Automatic Flow emulator setup/teardown
- Parallel test execution
- Comprehensive reporting
- Screenshot/video capture on failures
- Retry mechanisms for flaky tests

## Test Data Management

### Mock Wallets
```typescript
const TEST_WALLETS = {
  alice: { address: '0x01cf0e2f2f715450', name: 'Alice Test Wallet' },
  bob: { address: '0x179b6b1cb6755e31', name: 'Bob Test Wallet' },
  charlie: { address: '0xf3fcd2c1a78f5eee', name: 'Charlie Test Wallet' },
}
```

### Test NFT Metadata
```typescript
const TEST_NFT_METADATA = {
  basic: {
    name: 'Test NFT #1',
    description: 'A test NFT for E2E testing',
    category: 'Art',
    image: 'https://via.placeholder.com/400x400',
  }
}
```

## Debugging Tests

### Visual Debugging
```bash
# Run with browser visible
pnpm test:e2e:headed

# Run in debug mode (step through)
pnpm test:e2e:debug
```

### Screenshots and Videos
- Screenshots are captured on test failures
- Videos are recorded for failed tests
- Traces are collected for debugging

### Logs and Reports
- Comprehensive HTML reports with screenshots
- Console logs from browser and server
- Network request/response logging

## Best Practices

### Test Organization
- Each test file focuses on a specific feature area
- Tests are independent and can run in any order
- Shared utilities are extracted to helper files
- Mock data is centralized and reusable

### Assertions
- Use semantic test IDs (`data-testid`) for reliable element selection
- Wait for elements and state changes explicitly
- Verify both UI state and underlying data changes
- Test error states and edge cases

### Performance
- Tests run in parallel where possible
- Mock external services to avoid network dependencies
- Use efficient selectors and minimal waiting
- Clean up state between tests

## Troubleshooting

### Common Issues

1. **Flow Emulator Not Starting**
   - Ensure Flow CLI is installed and in PATH
   - Check port 8080 is available
   - Verify contracts deploy successfully

2. **Browser Installation Issues**
   - Run `npx playwright install` to install browsers
   - Check system dependencies for Linux/Docker

3. **Test Timeouts**
   - Increase timeout values in playwright.config.ts
   - Check for network connectivity issues
   - Verify mock responses are properly configured

4. **Flaky Tests**
   - Add explicit waits for async operations
   - Use `waitForSelector` instead of fixed delays
   - Ensure proper test isolation and cleanup

### Getting Help

- Check Playwright documentation: https://playwright.dev/
- Review test logs and screenshots in `test-results/`
- Use `--debug` flag to step through tests interactively
- Check Flow emulator logs for blockchain-related issues