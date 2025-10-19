// Performance monitoring types and interfaces

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: Date
  category: 'api' | 'event' | 'ui' | 'blockchain'
  tags?: Record<string, string>
}

export interface APIPerformanceMetric extends PerformanceMetric {
  category: 'api'
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  statusCode: number
  responseTime: number
  requestSize?: number
  responseSize?: number
  userAgent?: string
  ip?: string
}

export interface EventPerformanceMetric extends PerformanceMetric {
  category: 'event'
  eventType: string
  processingTime: number
  queueSize: number
  eventSource: 'flow' | 'dapper' | 'internal'
  blockHeight?: number
  transactionId?: string
}

export interface BlockchainPerformanceMetric extends PerformanceMetric {
  category: 'blockchain'
  operation: 'query' | 'transaction' | 'event_subscription'
  network: 'testnet' | 'mainnet'
  contractAddress?: string
  gasUsed?: number
  blockHeight?: number
}

export interface UIPerformanceMetric extends PerformanceMetric {
  category: 'ui'
  component: string
  renderTime: number
  interactionType?: 'click' | 'scroll' | 'load' | 'navigation'
  route?: string
}

// Performance thresholds for alerting
export interface PerformanceThresholds {
  api: {
    responseTime: {
      warning: number // ms
      critical: number // ms
    }
    errorRate: {
      warning: number // percentage
      critical: number // percentage
    }
  }
  events: {
    processingTime: {
      warning: number // ms
      critical: number // ms
    }
    queueSize: {
      warning: number // count
      critical: number // count
    }
  }
  blockchain: {
    queryTime: {
      warning: number // ms
      critical: number // ms
    }
    transactionTime: {
      warning: number // ms
      critical: number // ms
    }
  }
}

// Performance alert
export interface PerformanceAlert {
  id: string
  type: 'warning' | 'critical'
  category: 'api' | 'event' | 'blockchain' | 'ui'
  message: string
  metric: PerformanceMetric
  threshold: number
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
}

// Performance dashboard data
export interface PerformanceDashboardData {
  overview: {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    eventsProcessed: number
    averageEventProcessingTime: number
    activeAlerts: number
  }
  apiMetrics: {
    endpoints: Array<{
      endpoint: string
      requestCount: number
      averageResponseTime: number
      errorRate: number
      p95ResponseTime: number
      p99ResponseTime: number
    }>
    recentRequests: APIPerformanceMetric[]
  }
  eventMetrics: {
    eventTypes: Array<{
      eventType: string
      processedCount: number
      averageProcessingTime: number
      errorRate: number
    }>
    recentEvents: EventPerformanceMetric[]
    queueStatus: {
      currentSize: number
      averageSize: number
      maxSize: number
    }
  }
  blockchainMetrics: {
    operations: Array<{
      operation: string
      count: number
      averageTime: number
      successRate: number
    }>
    recentOperations: BlockchainPerformanceMetric[]
  }
  alerts: PerformanceAlert[]
  timeRange: {
    start: Date
    end: Date
  }
}

// Performance collector configuration
export interface PerformanceConfig {
  enabled: boolean
  sampleRate: number // 0-1, percentage of requests to track
  retentionDays: number
  thresholds: PerformanceThresholds
  alerting: {
    enabled: boolean
    webhookUrl?: string
    emailRecipients?: string[]
  }
  storage: {
    type: 'memory' | 'mongodb' | 'redis'
    maxMemoryEntries?: number
  }
}

// Performance storage interface
export interface PerformanceStorage {
  store(metric: PerformanceMetric): Promise<void>
  query(filters: {
    category?: string
    startTime?: Date
    endTime?: Date
    limit?: number
    tags?: Record<string, string>
  }): Promise<PerformanceMetric[]>
  getAggregated(
    category: string,
    timeRange: { start: Date; end: Date },
    groupBy?: string
  ): Promise<Array<{
    group: string
    count: number
    average: number
    min: number
    max: number
    p95: number
    p99: number
  }>>
  cleanup(olderThan: Date): Promise<number>
}