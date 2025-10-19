export const TEST_NFT_METADATA = {
  basic: {
    name: 'Test NFT #1',
    description: 'A test NFT for E2E testing',
    category: 'Art',
    image: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Test+NFT',
  },
  premium: {
    name: 'Premium Test NFT',
    description: 'A premium test NFT with special attributes',
    category: 'Collectibles',
    image: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Premium+NFT',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Power', value: '100' },
    ],
  },
}

export const TEST_MARKETPLACE_DATA = {
  listing: {
    price: '10.0',
    currency: 'FLOW',
  },
  purchase: {
    confirmationText: 'Confirm Purchase',
  },
}

export const TEST_TRANSFER_DATA = {
  validAddress: '0x179b6b1cb6755e31',
  invalidAddress: '0xinvalid',
  confirmationText: 'Transfer NFT',
}

export const MOCK_IPFS_RESPONSE = {
  url: 'https://test.ipfs.nftstorage.link/test-metadata.json',
  cid: 'bafkreitest123456789',
}

export const MOCK_API_RESPONSES = {
  mint: {
    success: {
      nft_id: 'test-nft-123',
      transaction_hash: '0xtest-tx-hash',
      status: 'completed',
    },
    error: {
      error: 'Minting failed',
      message: 'Insufficient funds',
    },
  },
  transfer: {
    success: {
      transaction_hash: '0xtest-transfer-hash',
      status: 'completed',
    },
    error: {
      error: 'Transfer failed',
      message: 'Invalid recipient address',
    },
  },
  marketplace: {
    list: {
      success: {
        listing_id: 'test-listing-123',
        transaction_hash: '0xtest-list-hash',
        status: 'completed',
      },
    },
    buy: {
      success: {
        transaction_hash: '0xtest-buy-hash',
        status: 'completed',
      },
    },
  },
}