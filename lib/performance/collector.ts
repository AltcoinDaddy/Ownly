// Performance metrics collector

import { 
  PerformanceMetric, 
  APIPerformanceMetric, 
  EventPerformanceMetric, 
  BlockchainPerformanceMetric,
  UIPerformanceMetric,
  PerformanceConfig,
  PerformanceStorage,
  PerformanceAlert,
  PerformanceThresholds
} from './types'
import { MemoryStorage } from './storage/memory'
import { generateId } from '@/lib/utils'
import { safeRandom } from '@/lib/hydration/safe-random'

// Default performance configuration
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0, // Track 100% of requests in development
  retentionDays: 7,
  thresholds: {
    api: {
      responseTime: { warning: 1000, critical: 3000 },
      errorRate: { warning: 5, critical: 10 }
    },
    events: {
      processingTime: { warning: 500, critical: 2000 },
      queueSize: { warning: 100, critical: 500 }
    },
    blockchain: {
      queryTime: { warning: 2000, critical: 5000 },
      transactionTime: { warning: 10000, critical: 30000 }
    }
  },
  alerting: {
    enabled: true
  },
  storage: {
    type: 'memory',
    maxMemoryEntries: 10000
  }
}

export class PerformanceCollector {
  private config: PerformanceConfig
  private storage: PerformanceStorage
  private alerts: PerformanceAlert[] = []
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = []

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.storage = this.createStorage()
  }

  private createStorage(): PerformanceStorage {
    switch (this.config.storage.type) {
      case 'memory':
        return new MemoryStorage(this.config.storage.maxMemoryEntries || 10000)
      // TODO: Add MongoDB and Redis storage implementations
      default:
        return new MemoryStorage(this.config.storage.maxMemoryEntries || 10000)
    }
  }

  // Check if we should collect this metric based on sample rate
  private shouldCollect(): boolean {
    if (!this.config.enabled) return false
    return safeRandom() < this.config.sampleRate
  }

  // Record API performance metric
  async recordAPIMetric(data: {
    endpoint: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    statusCode: number
    responseTime: number
    requestSize?: number
    responseSize?: number
    userAgent?: string
    ip?: string
    tags?: Record<string, string>
  }): Promise<void> {
    if (!this.shouldCollect()) return

    const metric: APIPerformanceMetric = {
      id: generateId(),
      name: `api_${data.method.toLowerCase()}_${data.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
      value: data.responseTime,
      unit: 'ms',
      timestamp: new Date(),
      category: 'api',
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      requestSize: data.requestSize,
      responseSize: data.responseSize,
      userAgent: data.userAgent,
      ip: data.ip,
      tags: data.tags
    }

    await this.storage.store(metric)
    await this.checkAPIThresholds(metric)
  }

  // Record event processing performance metric
  async recordEventMetric(data: {
    eventType: string
    processingTime: number
    queueSize: number
    eventSource: 'flow' | 'dapper' | 'internal'
    blockHeight?: number
    transactionId?: string
    tags?: Record<string, string>
  }): Promise<void> {
    if (!this.shouldCollect()) return

    const metric: EventPerformanceMetric = {
      id: generateId(),
      name: `event_${data.eventType.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
      value: data.processingTime,
      unit: 'ms',
      timestamp: new Date(),
      category: 'event',
      eventType: data.eventType,
      processingTime: data.processingTime,
      queueSize: data.queueSize,
      eventSource: data.eventSource,
      blockHeight: data.blockHeight,
      transactionId: data.transactionId,
      tags: data.tags
    }

    await this.storage.store(metric)
    await this.checkEventThresholds(metric)
  }

  // Record blockchain operation performance metric
  async recordBlockchainMetric(data: {
    operation: 'query' | 'transaction' | 'event_subscription'
    network: 'testnet' | 'mainnet'
    responseTime: number
    contractAddress?: string
    gasUsed?: number
    blockHeight?: number
    success: boolean
    tags?: Record<string, string>
  }): Promise<void> {
    if (!this.shouldCollect()) return

    const metric: BlockchainPerformanceMetric = {
      id: generateId(),
      name: `blockchain_${data.operation}_${data.network}`,
      value: data.responseTime,
      unit: 'ms',
      timestamp: new Date(),
      category: 'blockchain',
      operation: data.operation,
      network: data.network,
      contractAddress: data.contractAddress,
      gasUsed: data.gasUsed,
      blockHeight: data.blockHeight,
      tags: {
        ...data.tags,
        success: data.success.toString()
      }
    }

    await this.storage.store(metric)
    await this.checkBlockchainThresholds(metric)
  }

  // Record UI performance metric
  async recordUIMetric(data: {
    component: string
    renderTime: number
    interactionType?: 'click' | 'scroll' | 'load' | 'navigation'
    route?: string
    tags?: Record<string, string>
  }): Promise<void> {
    if (!this.shouldCollect()) return

    const metric: UIPerformanceMetric = {
      id: generateId(),
      name: `ui_${data.component.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
      value: data.renderTime,
      unit: 'ms',
      timestamp: new Date(),
      category: 'ui',
      component: data.component,
      renderTime: data.renderTime,
      interactionType: data.interactionType,
      route: data.route,
      tags: data.tags
    }

    await this.storage.store(metric)
  }

  // Check API performance thresholds and create alerts
  private async checkAPIThresholds(metric: APIPerformanceMetric): Promise<void> {
    const thresholds = this.config.thresholds.api

    if (metric.responseTime > thresholds.responseTime.critical) {
      await this.createAlert({
        type: 'critical',
        category: 'api',
        message: `API response time critical: ${metric.endpoint} took ${metric.responseTime}ms`,
        metric,
        threshold: thresholds.responseTime.critical
      })
    } else if (metric.responseTime > thresholds.responseTime.warning) {
      await this.createAlert({
        type: 'warning',
        category: 'api',
        message: `API response time warning: ${metric.endpoint} took ${metric.responseTime}ms`,
        metric,
        threshold: thresholds.responseTime.warning
      })
    }

    // Check error rate (requires aggregation)
    if (metric.statusCode >= 400) {
      const recentMetrics = await this.storage.query({
        category: 'api',
        startTime: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        tags: { endpoint: metric.endpoint }
      })

      const errorCount = recentMetrics.filter(m => 
        (m as APIPerformanceMetric).statusCode >= 400
      ).length
      const totalCount = recentMetrics.length
      const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0

      if (errorRate > thresholds.errorRate.critical) {
        await this.createAlert({
          type: 'critical',
          category: 'api',
          message: `API error rate critical: ${metric.endpoint} has ${errorRate.toFixed(1)}% error rate`,
          metric,
          threshold: thresholds.errorRate.critical
        })
      } else if (errorRate > thresholds.errorRate.warning) {
        await this.createAlert({
          type: 'warning',
          category: 'api',
          message: `API error rate warning: ${metric.endpoint} has ${errorRate.toFixed(1)}% error rate`,
          metric,
          threshold: thresholds.errorRate.warning
        })
      }
    }
  }

  // Check event processing thresholds
  private async checkEventThresholds(metric: EventPerformanceMetric): Promise<void> {
    const thresholds = this.config.thresholds.events

    if (metric.processingTime > thresholds.processingTime.critical) {
      await this.createAlert({
        type: 'critical',
        category: 'event',
        message: `Event processing time critical: ${metric.eventType} took ${metric.processingTime}ms`,
        metric,
        threshold: thresholds.processingTime.critical
      })
    } else if (metric.processingTime > thresholds.processingTime.warning) {
      await this.createAlert({
        type: 'warning',
        category: 'event',
        message: `Event processing time warning: ${metric.eventType} took ${metric.processingTime}ms`,
        metric,
        threshold: thresholds.processingTime.warning
      })
    }

    if (metric.queueSize > thresholds.queueSize.critical) {
      await this.createAlert({
        type: 'critical',
        category: 'event',
        message: `Event queue size critical: ${metric.queueSize} events in queue`,
        metric,
        threshold: thresholds.queueSize.critical
      })
    } else if (metric.queueSize > thresholds.queueSize.warning) {
      await this.createAlert({
        type: 'warning',
        category: 'event',
        message: `Event queue size warning: ${metric.queueSize} events in queue`,
        metric,
        threshold: thresholds.queueSize.warning
      })
    }
  }

  // Check blockchain operation thresholds
  private async checkBlockchainThresholds(metric: BlockchainPerformanceMetric): Promise<void> {
    const thresholds = this.config.thresholds.blockchain
    const thresholdKey = metric.operation === 'transaction' ? 'transactionTime' : 'queryTime'
    const threshold = thresholds[thresholdKey]

    if (metric.value > threshold.critical) {
      await this.createAlert({
        type: 'critical',
        category: 'blockchain',
        message: `Blockchain ${metric.operation} time critical: ${metric.value}ms on ${metric.network}`,
        metric,
        threshold: threshold.critical
      })
    } else if (metric.value > threshold.warning) {
      await this.createAlert({
        type: 'warning',
        category: 'blockchain',
        message: `Blockchain ${metric.operation} time warning: ${metric.value}ms on ${metric.network}`,
        metric,
        threshold: threshold.warning
      })
    }
  }

  // Create performance alert
  private async createAlert(data: {
    type: 'warning' | 'critical'
    category: 'api' | 'event' | 'blockchain' | 'ui'
    message: string
    metric: PerformanceMetric
    threshold: number
  }): Promise<void> {
    const alert: PerformanceAlert = {
      id: generateId(),
      type: data.type,
      category: data.category,
      message: data.message,
      metric: data.metric,
      threshold: data.threshold,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.push(alert)

    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('[PerformanceCollector] Error in alert callback:', error)
      }
    })

    console.warn(`[PerformanceCollector] ${data.type.toUpperCase()} ALERT: ${data.message}`)
  }

  // Subscribe to performance alerts
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback)
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  // Get performance metrics
  async getMetrics(filters: {
    category?: string
    startTime?: Date
    endTime?: Date
    limit?: number
    tags?: Record<string, string>
  }): Promise<PerformanceMetric[]> {
    return this.storage.query(filters)
  }

  // Get aggregated metrics
  async getAggregatedMetrics(
    category: string,
    timeRange: { start: Date; end: Date },
    groupBy?: string
  ) {
    return this.storage.getAggregated(category, timeRange, groupBy)
  }

  // Get active alerts
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  // Resolve alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
    }
  }

  // Cleanup old metrics
  async cleanup(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000)
    const deletedCount = await this.storage.cleanup(cutoffDate)
    console.log(`[PerformanceCollector] Cleaned up ${deletedCount} old metrics`)

    // Clean up old alerts (keep for 30 days)
    const alertCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const initialAlertCount = this.alerts.length
    this.alerts = this.alerts.filter(alert => alert.timestamp > alertCutoff)
    const removedAlerts = initialAlertCount - this.alerts.length
    if (removedAlerts > 0) {
      console.log(`[PerformanceCollector] Cleaned up ${removedAlerts} old alerts`)
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get current configuration
  getConfig(): PerformanceConfig {
    return { ...this.config }
  }
}

// Global performance collector instance
export const performanceCollector = new PerformanceCollector()

// Utility function to measure execution time
export async function measureAsync<T>(
  operation: () => Promise<T>,
  onComplete?: (duration: number, result: T, error?: Error) => void
): Promise<T> {
  const startTime = performance.now()
  try {
    const result = await operation()
    const duration = performance.now() - startTime
    onComplete?.(duration, result)
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    onComplete?.(duration, undefined as any, error as Error)
    throw error
  }
}

// Utility function to measure synchronous execution time
export function measureSync<T>(
  operation: () => T,
  onComplete?: (duration: number, result: T, error?: Error) => void
): T {
  const startTime = performance.now()
  try {
    const result = operation()
    const duration = performance.now() - startTime
    onComplete?.(duration, result)
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    onComplete?.(duration, undefined as any, error as Error)
    throw error
  }
}