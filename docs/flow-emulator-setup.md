# Flow Emulator Testing Setup

This document describes the Flow emulator testing environment setup for the Ownly project.

## Overview

The Flow emulator provides a local blockchain environment for testing smart contracts and blockchain interactions without deploying to testnet or mainnet.

## Prerequisites

- Flow CLI installed (v2.7.3 or later)
- Node.js 18+ 
- npm package manager

## Installation

1. **Install Flow CLI** (if not already installed):
   ```bash
   curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh | sh
   ```

2. **Verify installation**:
   ```bash
   flow version
   ```

## Project Structure

```
├── flow.json                         # Flow project configuration
├── cadence/                          # Cadence smart contracts and scripts
│   ├── contracts/                    # Smart contracts
│   │   ├── MetadataViews.cdc        # Metadata standard (Cadence 1.0)
│   │   ├── DapperCollectibles.cdc   # Main NFT contract (Cadence 1.0)
│   │   └── DapperMarket.cdc         # Marketplace contract (Cadence 1.0)
│   ├── transactions/                 # Cadence transactions
│   │   ├── setup-test-accounts.cdc  # Account setup transaction
│   │   └── mint-test-nfts.cdc       # NFT minting transaction
│   └── scripts/                      # Cadence query scripts
│       ├── get-collection.cdc       # Collection query script
│       └── get-nft-metadata.cdc     # NFT metadata query script
├── imports/                          # Standard Flow contracts (auto-imported)
│   └── 1d7e57aa55817448/            # Mainnet contract imports
│       ├── NonFungibleToken.cdc     # NFT standard interface
│       ├── MetadataViews.cdc        # Official metadata standard
│       └── ViewResolver.cdc         # View resolver interface
└── test/flow-emulator/               # Flow emulator tests
    ├── setup.ts                      # Emulator setup utilities
    ├── config.test.ts               # Configuration validation tests
    ├── cli.test.ts                  # Flow CLI integration tests
    └── contracts.test.ts            # Contract tests
```

## Configuration

### flow.json

The `flow.json` file configures:
- Contract definitions and source paths
- Dependencies on standard Flow contracts (NonFungibleToken, MetadataViews, ViewResolver)
- Network configurations for emulator/testnet/mainnet
- Account configurations with key management
- Contract aliases for different networks

### Test Accounts

Pre-configured test accounts:
- **emulator-account**: `0xf8d6e0586b0a20c7` (contract deployer and test user)

## Running Tests

### Manual Emulator Setup

1. **Start the emulator**:
   ```bash
   npm run flow:emulator
   ```

2. **Deploy contracts** (in another terminal):
   ```bash
   npm run flow:deploy
   ```

3. **Setup test accounts**:
   ```bash
   npm run flow:setup
   ```

### Automated Testing

Run all Flow emulator tests:
```bash
npm run test:flow
```

Run tests in watch mode:
```bash
npm run test:flow:watch
```

### Test Structure

The test suite automatically:
1. Starts the Flow emulator
2. Deploys all contracts
3. Sets up test accounts with collections
4. Mints sample NFTs
5. Runs contract interaction tests
6. Stops the emulator

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run flow:emulator` | Start Flow emulator |
| `npm run flow:deploy` | Deploy contracts to emulator |
| `npm run flow:setup` | Setup test accounts |
| `npm run test:flow` | Run Flow emulator tests |
| `npm run test:flow:watch` | Run tests in watch mode |

## Contract Testing

### DapperCollectibles Contract (Cadence 1.0)

Tests verify:
- Contract deployment with proper Cadence 1.0 syntax
- NFT minting functionality using `access(all)` modifiers
- Collection queries with new capability system
- Metadata retrieval through ViewResolver interface
- Proper resource management without custom destructors

### DapperMarket Contract (Cadence 1.0)

Tests verify:
- Market contract deployment with Cadence 1.0 compliance
- Listing creation with proper resource handling
- Purchase transactions using new syntax
- Resource extraction without nested resource moves

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -ti:3569 | xargs kill -9
   ```

2. **Contract deployment fails**:
   - Ensure emulator is running
   - Check contract syntax
   - Verify account permissions

3. **Test timeouts**:
   - Increase test timeout in vitest config
   - Check emulator startup time
   - Verify network connectivity

### Debug Mode

Enable verbose logging:
```bash
flow emulator start --verbose
```

## CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/flow-tests.yml`) that:
- Installs Flow CLI
- Runs emulator tests
- Uploads test artifacts

## Next Steps

1. Add marketplace transaction tests with Cadence 1.0 syntax
2. Implement NFT transfer tests using new entitlement system
3. Add event emission verification for Cadence 1.0 events
4. Create performance benchmarks for new capability system
5. Add integration with frontend components using updated FCL
6. Migrate any remaining pre-Cadence 1.0 syntax
7. Add comprehensive view resolver tests

## Resources

- [Flow CLI Documentation](https://docs.onflow.org/flow-cli/)
- [Flow Emulator Guide](https://docs.onflow.org/emulator/)
- [Cadence Language Reference](https://docs.onflow.org/cadence/)
- [Flow Testing Framework](https://docs.onflow.org/cadence/testing-framework/)