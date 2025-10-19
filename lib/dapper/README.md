# Dapper Core API Integration

This module provides a complete integration with the Dapper Core API for NFT operations on the Flow blockchain.

## Setup

1. Copy `.env.example` to `.env.local` and configure your Dapper API credentials:

```bash
DAPPER_API_URL=https://api.dapper.com
DAPPER_API_KEY=your_dapper_api_key_here
NEXT_PUBLIC_FLOW_NETWORK=testnet
```

2. Import and use the Dapper service in your components:

```typescript
import { dapperService } from '@/lib/dapper'

// Mint an NFT
const result = await dapperService.mintOwnlyNFT(metadataUrl, recipientAddress)

// Get user's NFTs
const collection = await dapperService.getUserCollection(userAddress)
```

## API Endpoints

The integration provides the following API endpoints:

- `POST /api/auth/connect` - Authenticate wallet connection
- `POST /api/nft/mint` - Mint new NFTs
- `POST /api/nft/transfer` - Transfer NFTs between addresses
- `POST /api/marketplace/list` - List NFTs for sale
- `POST /api/marketplace/buy` - Purchase NFTs from marketplace
- `GET /api/user/[address]` - Get user's NFT collection
- `GET /api/events` - Get blockchain events

## Error Handling

All API calls include comprehensive error handling with retry logic:

```typescript
try {
  const result = await dapperService.mintOwnlyNFT(metadataUrl, recipient)
} catch (error) {
  if (error instanceof DapperAPIError) {
    console.error('Dapper API Error:', error.type, error.message)
  }
}
```

## Features

- ✅ Automatic retry with exponential backoff
- ✅ Comprehensive error handling and typing
- ✅ Request timeout protection
- ✅ Flow address validation
- ✅ Environment-based configuration
- ✅ TypeScript support throughout
- ✅ Singleton client pattern for efficiency