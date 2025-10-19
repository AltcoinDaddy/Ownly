import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  FlowEventListener,
  EventQueue,
  eventQueue,
  flowEventListener,
  EVENT_TYPES,
  type BlockchainEvent,
  type EventCallback,
} from '@/lib/flow/events'
import * as fcl from '@onflow/fcl'

// Mock FCL
vi.mock('@onflow/fcl', () => ({
  events: vi.fn(),
}))

// Mock Flow config
vi.mock('@/lib/flow/config', () => ({
  getContractAddress: vi.fn((contractName: string) => {
    const addresses = {
      DapperCollectibles: '0x82ec283f88a62e65',
      DapperMarket: '0x94b06cfca1d8a476',
    }
    return addresses[contractName as keyof typeof addresses] || '0x123'
  }),
}))

// Mock performance collector
vi.mock('@/lib/performance/collector', () => ({
  performanceCollector: {
    recordEventMetric: vi.fn(),
  },
}))

// Mock event handlers to avoid circular dependency
vi.mock('@/lib/flow/event-handlers', () => ({
  eventHandlerRegistry: {
    processEvent: vi.fn(),
  },
}))

describe('EventQueue', () => {
  let queue: EventQueue
  let mockCallback: EventCallback

  beforeEach(() => {
    queue = new EventQueue()
    mockCallback = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should process events in order', async () => {
    const events: BlockchainEvent[] = [
      {
        type: EVENT_TYPES.COLLECTIBLE_MINTED,
        transactionId: 'tx1',
        blockHeight: 100,
        data: { nftId: '1' },
        timestamp: new Date(),
      },
      {
        type: EVENT_TYPES.COLLECTIBLE_TRANSFERRED,
        transactionId: 'tx2',
        blockHeight: 101,
        data: { nftId: '1', from: 'addr1', to: 'addr2' },
        timestamp: new Date(),
      },
    ]

    queue.addProcessor(EVENT_TYPES.COLLECTIBLE_MINTED, mockCallback)
    queue.addProcessor(EVENT_TYPES.COLLECTIBLE_TRANSFERRED, mockCallback)

    // Enqueue events
    await queue.enqueue(events[0])
    await queue.enqueue(events[1])

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockCallback).toHaveBeenCalledTimes(2)
    expect(mockCallback).toHaveBeenNthCalledWith(1, events[0])
    expect(mockCallback).toHaveBeenNthCalledWith(2, events[1])
  })

  it('should handle processor errors gracefully', async () => {
    const errorCallback = vi.fn().mockRejectedValue(new Error('Processing failed'))
    const successCallback = vi.fn()

    queue.addProcessor(EVENT_TYPES.COLLECTIBLE_MINTED, errorCallback)
    queue.addProcessor(EVENT_TYPES.COLLECTIBLE_TRANSFERRED, successCallback)

    const events: BlockchainEvent[] = [
      {
        type: EVENT_TYPES.COLLECTIBLE_MINTED,
        transactionId: 'tx1',
        blockHeight: 100,
        data: { nftId: '1' },
        timestamp: new Date(),
      },
      {
        type: EVENT_TYPES.COLLECTIBLE_TRANSFERRED,
        transactionId: 'tx2',
        blockHeight: 101,
        data: { nftId: '1' },
        timestamp: new Date(),
      },
    ]

    await queue.enqueue(events[0])
    await queue.enqueue(events[1])

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(errorCallback).toHaveBeenCalledWith(events[0])
    expect(successCallback).toHaveBeenCalledWith(events[1])
  })

  it('should track queue size correctly', async () => {
    expect(queue.getQueueSize()).toBe(0)

    const event: BlockchainEvent = {
      type: EVENT_TYPES.COLLECTIBLE_MINTED,
      transactionId: 'tx1',
      blockHeight: 100,
      data: { nftId: '1' },
      timestamp: new Date(),
    }

    // Add processor that takes time to process
    queue.addProcessor(EVENT_TYPES.COLLECTIBLE_MINTED, async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    await queue.enqueue(event)
    
    // Queue should be processing
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(queue.getQueueSize()).toBe(0)
  })

  it('should remove processors correctly', async () => {
    queue.addProcessor(EVENT_TYPES.COLLECTIBLE_MINTED, mockCallback)
    queue.removeProcessor(EVENT_TYPES.COLLECTIBLE_MINTED)

    const event: BlockchainEvent = {
      type: EVENT_TYPES.COLLECTIBLE_MINTED,
      transactionId: 'tx1',
      blockHeight: 100,
      data: { nftId: '1' },
      timestamp: new Date(),
    }

    await queue.enqueue(event)
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockCallback).not.toHaveBeenCalled()
  })
})

describe('FlowEventListener', () => {
  let listener: FlowEventListener
  let mockSubscribe: ReturnType<typeof vi.fn>
  let mockUnsubscribe: ReturnType<typeof vi.fn>

  beforeEach(() => {
    listener = new FlowEventListener()
    mockUnsubscribe = vi.fn()
    mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe)
    
    vi.mocked(fcl.events).mockReturnValue({
      subscribe: mockSubscribe,
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('subscribeToMintEvents', () => {
    it('should subscribe to mint events with correct event name', () => {
      const callback = vi.fn()
      
      listener.subscribeToMintEvents(callback)

      expect(fcl.events).toHaveBeenCalledWith(
        'A.82ec283f88a62e65.DapperCollectibles.CollectibleMinted'
      )
      expect(mockSubscribe).toHaveBeenCalledWith({
        next: expect.any(Function),
        error: expect.any(Function),
      })
    })

    it('should parse mint event data correctly', () => {
      const callback = vi.fn()
      let nextHandler: (event: any) => void

      mockSubscribe.mockImplementation(({ next }) => {
        nextHandler = next
        return mockUnsubscribe
      })

      listener.subscribeToMintEvents(callback)

      const mockFlowEvent = {
        transactionId: 'tx123',
        blockHeight: 12345,
        eventIndex: 0,
        data: {
          id: { value: 'nft_456' },
          to: { value: '0xrecipient123' },
          collectionId: { value: 'ownly_collectibles' },
          metadataUrl: { value: 'https://ipfs.io/ipfs/QmTest' },
          creator: { value: '0xcreator123' },
        },
      }

      nextHandler!(mockFlowEvent)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENT_TYPES.COLLECTIBLE_MINTED,
          transactionId: 'tx123',
          blockHeight: 12345,
          eventIndex: 0,
          data: {
            nftId: 'nft_456',
            recipient: '0xrecipient123',
            collectionId: 'ownly_collectibles',
            metadataUrl: 'https://ipfs.io/ipfs/QmTest',
            creator: '0xcreator123',
            rawData: mockFlowEvent.data,
          },
          timestamp: expect.any(Date),
        })
      )
    })

    it('should handle malformed event data gracefully', () => {
      const callback = vi.fn()
      let nextHandler: (event: any) => void

      mockSubscribe.mockImplementation(({ next }) => {
        nextHandler = next
        return mockUnsubscribe
      })

      listener.subscribeToMintEvents(callback)

      const malformedEvent = {
        transactionId: 'tx123',
        blockHeight: 12345,
        eventIndex: 0,
        data: null, // Malformed data
      }

      nextHandler!(malformedEvent)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENT_TYPES.COLLECTIBLE_MINTED,
          data: { rawData: null },
        })
      )
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      
      const unsubscribe = listener.subscribeToMintEvents(callback)
      
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })

  describe('subscribeToTransferEvents', () => {
    it('should subscribe to transfer events with correct event name', () => {
      const callback = vi.fn()
      
      listener.subscribeToTransferEvents(callback)

      expect(fcl.events).toHaveBeenCalledWith(
        'A.82ec283f88a62e65.DapperCollectibles.CollectibleTransferred'
      )
    })

    it('should parse transfer event data correctly', () => {
      const callback = vi.fn()
      let nextHandler: (event: any) => void

      mockSubscribe.mockImplementation(({ next }) => {
        nextHandler = next
        return mockUnsubscribe
      })

      listener.subscribeToTransferEvents(callback)

      const mockFlowEvent = {
        transactionId: 'tx789',
        blockHeight: 12346,
        eventIndex: 1,
        data: {
          id: { value: 'nft_456' },
          from: { value: '0xsender123' },
          to: { value: '0xrecipient456' },
          collectionId: { value: 'ownly_collectibles' },
        },
      }

      nextHandler!(mockFlowEvent)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENT_TYPES.COLLECTIBLE_TRANSFERRED,
          transactionId: 'tx789',
          blockHeight: 12346,
          eventIndex: 1,
          data: {
            nftId: 'nft_456',
            from: '0xsender123',
            to: '0xrecipient456',
            collectionId: 'ownly_collectibles',
            rawData: mockFlowEvent.data,
          },
        })
      )
    })
  })

  describe('error handling and reconnection', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should handle subscription errors with exponential backoff', () => {
      const callback = vi.fn()
      let errorHandler: (error: any) => void

      mockSubscribe.mockImplementation(({ error }) => {
        errorHandler = error
        return mockUnsubscribe
      })

      const resubscribeSpy = vi.spyOn(listener, 'subscribeToMintEvents')
      
      listener.subscribeToMintEvents(callback)

      // Trigger error
      errorHandler!(new Error('Connection lost'))

      // Fast forward through first retry delay (1000ms)
      vi.advanceTimersByTime(1000)

      expect(resubscribeSpy).toHaveBeenCalledTimes(2) // Original + 1 retry
    })

    it('should stop retrying after max attempts', () => {
      const callback = vi.fn()
      let errorHandler: (error: any) => void

      mockSubscribe.mockImplementation(({ error }) => {
        errorHandler = error
        return mockUnsubscribe
      })

      const resubscribeSpy = vi.spyOn(listener, 'subscribeToMintEvents')
      
      listener.subscribeToMintEvents(callback)

      // Trigger multiple errors to exceed max retry attempts
      for (let i = 0; i < 6; i++) {
        errorHandler!(new Error('Connection lost'))
        vi.advanceTimersByTime(10000) // Advance past all delays
      }

      // Should not exceed max attempts (5) + original call = 6 total
      expect(resubscribeSpy).toHaveBeenCalledTimes(6)
    })
  })

  describe('unsubscribeAll', () => {
    it('should unsubscribe from all active subscriptions', () => {
      const callback = vi.fn()
      
      listener.subscribeToMintEvents(callback)
      listener.subscribeToTransferEvents(callback)

      expect(listener.getActiveSubscriptions()).toHaveLength(2)

      listener.unsubscribeAll()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2)
      expect(listener.getActiveSubscriptions()).toHaveLength(0)
    })

    it('should handle unsubscribe errors gracefully', () => {
      const callback = vi.fn()
      mockUnsubscribe.mockImplementation(() => {
        throw new Error('Unsubscribe failed')
      })
      
      listener.subscribeToMintEvents(callback)
      
      // Should not throw
      expect(() => listener.unsubscribeAll()).not.toThrow()
    })
  })
})

describe('Global event listener instance', () => {
  it('should provide global flowEventListener instance', () => {
    expect(flowEventListener).toBeInstanceOf(FlowEventListener)
  })

  it('should provide global eventQueue instance', () => {
    expect(eventQueue).toBeInstanceOf(EventQueue)
  })
})

describe('Event type constants', () => {
  it('should define all required event types', () => {
    expect(EVENT_TYPES).toEqual({
      COLLECTIBLE_MINTED: 'CollectibleMinted',
      COLLECTIBLE_TRANSFERRED: 'CollectibleTransferred',
      SALE_COMPLETED: 'SaleCompleted',
      LISTING_CREATED: 'ListingCreated',
      LISTING_REMOVED: 'ListingRemoved',
    })
  })
})