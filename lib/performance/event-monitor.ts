// Enhanced event monitoring with performance tracking

import { performanceCollector } from './collector'
import { eventQueue, BlockchainEvent, EventCallback } from '@/lib/flow/events'

// Enhanced event queue with performance monitoring
export class PerformanceAwareEventQueue {
  private originalQueue: typeof eventQueue
  private processingTimes: Map<string, number> = new Map()

  constructor(originalQueue: typeof eventQueue) {
    this.originalQueue = originalQueue
    this.wrapQueueMethods()
  }

  private wrapQueueMethods() {
    // Wrap the enqueue method to track queue size
    const originalEnqueue = this.originalQueue.enqueue.bind(this.originalQueue)
    this.originalQueue.enqueue = async (event: BlockchainEvent) => {
      const queueSize = this.originalQueue.getQueueSize()
      
      // Record queue size metric
      await performanceCollector.recordEventMetric({
        eventType: 'queue_size',
        processingTime: 0,
        queueSize: queueSize + 1, // +1 because we're about to add this event
        eventSource: 'internal',
        tags: {
          operation: 'enqueue',
          event_type: event.type
        }
      })

      return originalEnqueue(event)
    }

    // Wrap processor addition to track processing times
    const originalAddProcessor = this.originalQueue.addProcessor.bind(this.originalQueue)
    this.originalQueue.addProcessor = (eventType: string, callback: EventCallback) => {
      const wrappedCallback: EventCallback = async (event: BlockchainEvent) => {
        const startTime = performance.now()
        
        try {
          await callback(event)
          const processingTime = performance.now() - startTime
          
          // Record successful event processing
          await performanceCollector.recordEventMetric({
            eventType: event.type,
            processingTime,
            queueSize: this.originalQueue.getQueueSize(),
            eventSource: this.getEventSource(event),
            blockHeight: event.blockHeight,
            transactionId: event.transactionId,
            tags: {
              processor: eventType,
              success: 'true'
            }
          })

          // Track processing time for this event type
          this.processingTimes.set(event.type, processingTime)
          
        } catch (error) {
          const processingTime = performance.now() - startTime
          
          // Record failed event processing
          await performanceCollector.recordEventMetric({
            eventType: event.type,
            processingTime,
            queueSize: this.originalQueue.getQueueSize(),
            eventSource: this.getEventSource(event),
            blockHeight: event.blockHeight,
            transactionId: event.transactionId,
            tags: {
              processor: eventType,
              success: 'false',
              error: error instanceof Error ? error.message : 'unknown'
            }
          })
          
          throw error
        }
      }

      return originalAddProcessor(eventType, wrappedCallback)
    }
  }

  private getEventSource(event: BlockchainEvent): 'flow' | 'dapper' | 'internal' {
    if (event.transactionId) return 'flow'
    if (event.type.includes('Dapper')) return 'dapper'
    return 'internal'
  }

  // Get average processing time for an event type
  getAverageProcessingTime(eventType: string): number | undefined {
    return this.processingTimes.get(eventType)
  }

  // Get all processing times
  getAllProcessingTimes(): Map<string, number> {
    return new Map(this.processingTimes)
  }

  // Clear processing time history
  clearProcessingTimes(): void {
    this.processingTimes.clear()
  }
}

// Event processing latency monitor
export class EventLatencyMonitor {
  private eventStartTimes: Map<string, number> = new Map()
  private latencyHistory: Array<{
    eventType: string
    latency: number
    timestamp: Date
  }> = []

  // Mark the start of event processing
  markEventStart(eventId: string, eventType: string): void {
    this.eventStartTimes.set(eventId, performance.now())
  }

  // Mark the end of event processing and calculate latency
  async markEventEnd(eventId: string, eventType: string): Promise<number | null> {
    const startTime = this.eventStartTimes.get(eventId)
    if (!startTime) return null

    const latency = performance.now() - startTime
    this.eventStartTimes.delete(eventId)

    // Record latency in history
    this.latencyHistory.push({
      eventType,
      latency,
      timestamp: new Date()
    })

    // Keep only last 1000 entries
    if (this.latencyHistory.length > 1000) {
      this.latencyHistory.shift()
    }

    // Record latency metric
    await performanceCollector.recordEventMetric({
      eventType: `${eventType}_latency`,
      processingTime: latency,
      queueSize: 0, // Not applicable for latency
      eventSource: 'internal',
      tags: {
        metric_type: 'latency',
        event_id: eventId
      }
    })

    return latency
  }

  // Get latency statistics for an event type
  getLatencyStats(eventType: string): {
    count: number
    average: number
    min: number
    max: number
    p95: number
    p99: number
  } | null {
    const events = this.latencyHistory.filter(e => e.eventType === eventType)
    if (events.length === 0) return null

    const latencies = events.map(e => e.latency).sort((a, b) => a - b)
    const count = latencies.length
    const sum = latencies.reduce((a, b) => a + b, 0)
    const average = sum / count
    const min = latencies[0]
    const max = latencies[latencies.length - 1]
    
    const p95Index = Math.floor(count * 0.95)
    const p99Index = Math.floor(count * 0.99)
    const p95 = latencies[Math.min(p95Index, count - 1)]
    const p99 = latencies[Math.min(p99Index, count - 1)]

    return {
      count,
      average: Math.round(average * 100) / 100,
      min,
      max,
      p95,
      p99
    }
  }

  // Get recent latency history
  getRecentLatency(eventType?: string, limit: number = 100): Array<{
    eventType: string
    latency: number
    timestamp: Date
  }> {
    let filtered = this.latencyHistory
    
    if (eventType) {
      filtered = filtered.filter(e => e.eventType === eventType)
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Clear latency history
  clearHistory(): void {
    this.latencyHistory = []
    this.eventStartTimes.clear()
  }
}

// Flow event listener with performance monitoring
export class PerformanceAwareFlowEventListener {
  private latencyMonitor = new EventLatencyMonitor()
  private subscriptionMetrics: Map<string, {
    subscriptionTime: number
    eventCount: number
    errorCount: number
    lastEventTime?: number
  }> = new Map()

  // Enhanced event subscription with performance tracking
  subscribeWithPerformanceTracking(
    eventName: string,
    callback: EventCallback,
    subscriptionType: string = 'unknown'
  ): () => void {
    const subscriptionStart = performance.now()
    
    // Initialize subscription metrics
    this.subscriptionMetrics.set(subscriptionType, {
      subscriptionTime: subscriptionStart,
      eventCount: 0,
      errorCount: 0
    })

    // Import FCL dynamically to avoid circular dependencies
    const setupSubscription = async () => {
      const fcl = await import('@onflow/fcl')
      
      return fcl.events(eventName).subscribe({
        next: async (event: any) => {
          const eventId = `${event.transactionId}_${event.eventIndex || 0}`
          const eventType = this.extractEventType(eventName)
          
          // Mark event processing start
          this.latencyMonitor.markEventStart(eventId, eventType)
          
          // Update subscription metrics
          const metrics = this.subscriptionMetrics.get(subscriptionType)!
          metrics.eventCount++
          metrics.lastEventTime = performance.now()
          
          try {
            // Create blockchain event
            const blockchainEvent: BlockchainEvent = {
              type: eventType,
              transactionId: event.transactionId,
              blockHeight: event.blockHeight,
              eventIndex: event.eventIndex,
              data: event.data,
              timestamp: new Date()
            }

            // Process event through callback
            await callback(blockchainEvent)
            
            // Mark event processing end
            await this.latencyMonitor.markEventEnd(eventId, eventType)
            
            // Record successful event processing
            await performanceCollector.recordEventMetric({
              eventType,
              processingTime: 0, // Will be recorded by latency monitor
              queueSize: 0, // Not applicable here
              eventSource: 'flow',
              blockHeight: event.blockHeight,
              transactionId: event.transactionId,
              tags: {
                subscription_type: subscriptionType,
                success: 'true'
              }
            })
            
          } catch (error) {
            // Update error count
            metrics.errorCount++
            
            // Mark event processing end (with error)
            await this.latencyMonitor.markEventEnd(eventId, eventType)
            
            // Record failed event processing
            await performanceCollector.recordEventMetric({
              eventType,
              processingTime: 0,
              queueSize: 0,
              eventSource: 'flow',
              blockHeight: event.blockHeight,
              transactionId: event.transactionId,
              tags: {
                subscription_type: subscriptionType,
                success: 'false',
                error: error instanceof Error ? error.message : 'unknown'
              }
            })
            
            console.error(`[PerformanceAwareFlowEventListener] Error processing ${eventType}:`, error)
          }
        },
        error: async (error: any) => {
          // Update error count
          const metrics = this.subscriptionMetrics.get(subscriptionType)
          if (metrics) {
            metrics.errorCount++
          }
          
          // Record subscription error
          await performanceCollector.recordEventMetric({
            eventType: 'subscription_error',
            processingTime: 0,
            queueSize: 0,
            eventSource: 'flow',
            tags: {
              subscription_type: subscriptionType,
              event_name: eventName,
              error: error instanceof Error ? error.message : 'unknown'
            }
          })
          
          console.error(`[PerformanceAwareFlowEventListener] Subscription error for ${eventName}:`, error)
        }
      })
    }

    let unsubscribe: (() => void) | null = null
    
    setupSubscription().then(unsub => {
      unsubscribe = unsub
    }).catch(error => {
      console.error('[PerformanceAwareFlowEventListener] Failed to setup subscription:', error)
    })

    // Return unsubscribe function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      this.subscriptionMetrics.delete(subscriptionType)
    }
  }

  private extractEventType(eventName: string): string {
    // Extract event type from full event name
    // e.g., "A.0x123.DapperCollectibles.CollectibleMinted" -> "CollectibleMinted"
    const parts = eventName.split('.')
    return parts[parts.length - 1] || 'unknown'
  }

  // Get subscription performance metrics
  getSubscriptionMetrics(subscriptionType?: string): Map<string, {
    subscriptionTime: number
    eventCount: number
    errorCount: number
    lastEventTime?: number
    uptime: number
    errorRate: number
  }> {
    const now = performance.now()
    const result = new Map()

    for (const [type, metrics] of this.subscriptionMetrics.entries()) {
      if (subscriptionType && type !== subscriptionType) continue

      const uptime = now - metrics.subscriptionTime
      const errorRate = metrics.eventCount > 0 ? (metrics.errorCount / metrics.eventCount) * 100 : 0

      result.set(type, {
        ...metrics,
        uptime,
        errorRate: Math.round(errorRate * 100) / 100
      })
    }

    return result
  }

  // Get latency monitor
  getLatencyMonitor(): EventLatencyMonitor {
    return this.latencyMonitor
  }

  // Clear all metrics
  clearMetrics(): void {
    this.subscriptionMetrics.clear()
    this.latencyMonitor.clearHistory()
  }
}

// Global instances
export const performanceAwareEventQueue = new PerformanceAwareEventQueue(eventQueue)
export const performanceAwareFlowEventListener = new PerformanceAwareFlowEventListener()
export const eventLatencyMonitor = new EventLatencyMonitor()