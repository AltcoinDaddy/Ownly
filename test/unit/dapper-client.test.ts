import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dapperClient, DapperClient } from '@/lib/dapper/client'
import { DapperAPIError, DapperErrorType } from '@/lib/dapper/types'
import type {
  DapperMintRequest,
  DapperMintResponse,
  DapperTransferRequest,
  DapperTransferResponse,
} from '@/lib/dapper/types'

// Mock performance collector
vi.mock('@/lib/performance/collector', () => ({
  performanceCollector: {
    recordAPIMetric: vi.fn(),
  },
}))

// Mock Dapper config
vi.mock('@/lib/dapper/config', () => ({
  getDapperConfig: () => ({
    baseUrl: 'https://api.dapper.com',
    apiKey: 'test-api-key',
    environment: 'testnet',
  }),
  DAPPER_ENDPOINTS: {
    MINT: '/v1/nft/mint',
    TRANSFER: '/v1/nft/transfer',
    MARKETPLACE_LIST: '/v1/marketplace/list',
    MARKETPLACE_BUY: '/v1/marketplace/buy',
    MARKETPLACE: '/v1/marketplace',
    USER: '/v1/user',
    EVENTS: '/v1/events',
  },
  DAPPER_REQUEST_TIMEOUT: 30000,
  DAPPER_RETRY_ATTEMPTS: 3,
  DAPPER_RETRY_DELAY: 1000,
}))

describe('DapperClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.mocked(fetch)
    mockFetch.mockClear()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('mintNFT', () => {
    const mockMintRequest: DapperMintRequest = {
      metadata_url: 'https://ipfs.io/ipfs/QmTest123',
      recipient: '0x1234567890abcdef',
      collection_id: 'ownly_collectibles',
    }

    const mockMintResponse: DapperMintResponse = {
      nft_id: 'nft_123',
      transaction_hash: '0xabc123',
      status: 'completed',
      metadata: {
        name: 'Test NFT',
        description: 'Test Description',
        image: 'https://ipfs.io/ipfs/QmImage123',
      },
    }

    it('should successfully mint NFT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '500' }),
        json: async () => mockMintResponse,
      } as Response)

      const result = await dapperClient.mintNFT(mockMintRequest)

      expect(result).toEqual(mockMintResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.dapper.com/v1/nft/mint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
            'X-Environment': 'testnet',
          }),
          body: JSON.stringify(mockMintRequest),
        })
      )
    })

    it('should handle API error responses', async () => {
      const errorResponse = {
        message: 'Invalid metadata URL',
        details: { field: 'metadata_url' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => errorResponse,
      } as Response)

      await expect(dapperClient.mintNFT(mockMintRequest)).rejects.toThrow(DapperAPIError)

      try {
        await dapperClient.mintNFT(mockMintRequest)
      } catch (error) {
        expect(error).toBeInstanceOf(DapperAPIError)
        const apiError = error as DapperAPIError
        expect(apiError.type).toBe(DapperErrorType.INVALID_REQUEST)
        expect(apiError.message).toBe('Invalid metadata URL')
        expect(apiError.statusCode).toBe(400)
      }
    })

    it('should retry on server errors', async () => {
      // First two calls fail with 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers(),
          json: async () => ({ message: 'Server error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers(),
          json: async () => ({ message: 'Server error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-length': '500' }),
          json: async () => mockMintResponse,
        } as Response)

      const resultPromise = dapperClient.mintNFT(mockMintRequest)

      // Fast-forward through retry delays
      await vi.runAllTimersAsync()

      const result = await resultPromise

      expect(result).toEqual(mockMintResponse)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should not retry on client errors (except rate limiting)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: async () => ({ message: 'NFT not found' }),
      } as Response)

      await expect(dapperClient.mintNFT(mockMintRequest)).rejects.toThrow(DapperAPIError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should retry on rate limiting', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'Retry-After': '60' }),
          json: async () => ({ message: 'Rate limit exceeded' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-length': '500' }),
          json: async () => mockMintResponse,
        } as Response)

      const resultPromise = dapperClient.mintNFT(mockMintRequest)
      await vi.runAllTimersAsync()
      const result = await resultPromise

      expect(result).toEqual(mockMintResponse)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(dapperClient.mintNFT(mockMintRequest)).rejects.toThrow('Request timeout')
    })
  })

  describe('transferNFT', () => {
    const mockTransferRequest: DapperTransferRequest = {
      nft_id: 'nft_123',
      from: '0x1234567890abcdef',
      to: '0xfedcba0987654321',
    }

    const mockTransferResponse: DapperTransferResponse = {
      transaction_hash: '0xdef456',
      status: 'completed',
      from: mockTransferRequest.from,
      to: mockTransferRequest.to,
      nft_id: mockTransferRequest.nft_id,
    }

    it('should successfully transfer NFT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '300' }),
        json: async () => mockTransferResponse,
      } as Response)

      const result = await dapperClient.transferNFT(mockTransferRequest)

      expect(result).toEqual(mockTransferResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.dapper.com/v1/nft/transfer',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockTransferRequest),
        })
      )
    })

    it('should validate transfer addresses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => ({
          message: 'Invalid recipient address',
          details: { field: 'to' },
        }),
      } as Response)

      await expect(dapperClient.transferNFT(mockTransferRequest)).rejects.toThrow(DapperAPIError)
    })
  })

  describe('getUserNFTs', () => {
    const mockUserAddress = '0x1234567890abcdef'
    const mockUserResponse = {
      address: mockUserAddress,
      nfts: [
        {
          nft_id: 'nft_123',
          name: 'Test NFT 1',
          image: 'https://ipfs.io/ipfs/QmImage1',
        },
        {
          nft_id: 'nft_456',
          name: 'Test NFT 2',
          image: 'https://ipfs.io/ipfs/QmImage2',
        },
      ],
      total_count: 2,
    }

    it('should fetch user NFTs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '800' }),
        json: async () => mockUserResponse,
      } as Response)

      const result = await dapperClient.getUserNFTs(mockUserAddress)

      expect(result).toEqual(mockUserResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.dapper.com/v1/user/${mockUserAddress}`,
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should handle user not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: async () => ({ message: 'User not found' }),
      } as Response)

      await expect(dapperClient.getUserNFTs(mockUserAddress)).rejects.toThrow(DapperAPIError)
    })
  })

  describe('marketplace operations', () => {
    it('should list NFT for sale', async () => {
      const listRequest = {
        nft_id: 'nft_123',
        price: 10.5,
        currency: 'FLOW' as const,
      }

      const listResponse = {
        listing_id: 'listing_456',
        status: 'active' as const,
        nft_id: listRequest.nft_id,
        price: listRequest.price,
        currency: listRequest.currency,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '400' }),
        json: async () => listResponse,
      } as Response)

      const result = await dapperClient.listNFT(listRequest)

      expect(result).toEqual(listResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.dapper.com/v1/marketplace/list',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(listRequest),
        })
      )
    })

    it('should buy NFT from marketplace', async () => {
      const buyRequest = {
        nft_id: 'nft_123',
        buyer_address: '0xbuyer123',
      }

      const buyResponse = {
        transaction_hash: '0xpurchase789',
        status: 'completed' as const,
        nft_id: buyRequest.nft_id,
        buyer: buyRequest.buyer_address,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '350' }),
        json: async () => buyResponse,
      } as Response)

      const result = await dapperClient.buyNFT(buyRequest)

      expect(result).toEqual(buyResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.dapper.com/v1/marketplace/buy',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(buyRequest),
        })
      )
    })
  })

  describe('error handling', () => {
    it('should map HTTP status codes to error types correctly', async () => {
      const testCases = [
        { status: 400, expectedType: DapperErrorType.INVALID_REQUEST },
        { status: 401, expectedType: DapperErrorType.AUTHENTICATION_ERROR },
        { status: 403, expectedType: DapperErrorType.AUTHENTICATION_ERROR },
        { status: 404, expectedType: DapperErrorType.NFT_NOT_FOUND },
        { status: 429, expectedType: DapperErrorType.RATE_LIMIT_EXCEEDED },
        { status: 500, expectedType: DapperErrorType.SERVER_ERROR },
        { status: 502, expectedType: DapperErrorType.SERVER_ERROR },
        { status: 503, expectedType: DapperErrorType.SERVER_ERROR },
        { status: 504, expectedType: DapperErrorType.SERVER_ERROR },
      ]

      for (const { status, expectedType } of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          headers: new Headers(),
          json: async () => ({ message: 'Test error' }),
        } as Response)

        try {
          await dapperClient.mintNFT({
            metadata_url: 'test',
            recipient: 'test',
            collection_id: 'ownly_collectibles',
          })
        } catch (error) {
          expect(error).toBeInstanceOf(DapperAPIError)
          const apiError = error as DapperAPIError
          expect(apiError.type).toBe(expectedType)
          expect(apiError.statusCode).toBe(status)
        }

        mockFetch.mockClear()
      }
    })

    it('should handle malformed error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      try {
        await dapperClient.mintNFT({
          metadata_url: 'test',
          recipient: 'test',
          collection_id: 'ownly_collectibles',
        })
      } catch (error) {
        expect(error).toBeInstanceOf(DapperAPIError)
        const apiError = error as DapperAPIError
        expect(apiError.message).toBe('Internal Server Error')
        expect(apiError.type).toBe(DapperErrorType.SERVER_ERROR)
      }
    })
  })
})