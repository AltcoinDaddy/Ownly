// In-memory performance metrics storage

import { PerformanceMetric, PerformanceStorage } from '../types'

export class MemoryStorage implements PerformanceStorage {
  private metrics: PerformanceMetric[] = []
  private maxEntries: number

  constructor(maxEntries: number = 10000) {
    this.maxEntries = maxEntries
  }

  async store(metric: PerformanceMetric): Promise<void> {
    this.metrics.push(metric)

    // Remove oldest entries if we exceed max capacity
    if (this.metrics.length > this.maxEntries) {
      const removeCount = this.metrics.length - this.maxEntries
      this.metrics.splice(0, removeCount)
    }
  }

  async query(filters: {
    category?: string
    startTime?: Date
    endTime?: Date
    limit?: number
    tags?: Record<string, string>
  }): Promise<PerformanceMetric[]> {
    let filtered = this.metrics

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(m => m.category === filters.category)
    }

    // Filter by time range
    if (filters.startTime) {
      filtered = filtered.filter(m => m.timestamp >= filters.startTime!)
    }
    if (filters.endTime) {
      filtered = filtered.filter(m => m.timestamp <= filters.endTime!)
    }

    // Filter by tags
    if (filters.tags) {
      filtered = filtered.filter(m => {
        if (!m.tags) return false
        return Object.entries(filters.tags!).every(([key, value]) => 
          m.tags![key] === value
        )
      })
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply limit
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  async getAggregated(
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
  }>> {
    // Filter metrics by category and time range
    const filtered = this.metrics.filter(m => 
      m.category === category &&
      m.timestamp >= timeRange.start &&
      m.timestamp <= timeRange.end
    )

    if (filtered.length === 0) {
      return []
    }

    // Group metrics
    const groups = new Map<string, PerformanceMetric[]>()

    filtered.forEach(metric => {
      let groupKey = 'all'
      
      if (groupBy) {
        switch (groupBy) {
          case 'endpoint':
            groupKey = (metric as any).endpoint || 'unknown'
            break
          case 'eventType':
            groupKey = (metric as any).eventType || 'unknown'
            break
          case 'operation':
            groupKey = (metric as any).operation || 'unknown'
            break
          case 'component':
            groupKey = (metric as any).component || 'unknown'
            break
          case 'hour':
            groupKey = metric.timestamp.toISOString().slice(0, 13) + ':00:00'
            break
          case 'day':
            groupKey = metric.timestamp.toISOString().slice(0, 10)
            break
          default:
            groupKey = 'all'
        }
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(metric)
    })

    // Calculate aggregations for each group
    const results = Array.from(groups.entries()).map(([group, metrics]) => {
      const values = metrics.map(m => m.value).sort((a, b) => a - b)
      const count = values.length
      const sum = values.reduce((a, b) => a + b, 0)
      const average = sum / count
      const min = values[0]
      const max = values[values.length - 1]
      
      // Calculate percentiles
      const p95Index = Math.floor(count * 0.95)
      const p99Index = Math.floor(count * 0.99)
      const p95 = values[Math.min(p95Index, count - 1)]
      const p99 = values[Math.min(p99Index, count - 1)]

      return {
        group,
        count,
        average: Math.round(average * 100) / 100,
        min,
        max,
        p95,
        p99
      }
    })

    // Sort by group name
    results.sort((a, b) => a.group.localeCompare(b.group))

    return results
  }

  async cleanup(olderThan: Date): Promise<number> {
    const initialCount = this.metrics.length
    this.metrics = this.metrics.filter(m => m.timestamp > olderThan)
    return initialCount - this.metrics.length
  }

  // Additional methods for memory storage
  getStorageStats(): {
    totalMetrics: number
    memoryUsage: number
    oldestMetric?: Date
    newestMetric?: Date
  } {
    const totalMetrics = this.metrics.length
    const memoryUsage = JSON.stringify(this.metrics).length // Rough estimate
    
    let oldestMetric: Date | undefined
    let newestMetric: Date | undefined

    if (totalMetrics > 0) {
      const timestamps = this.metrics.map(m => m.timestamp).sort()
      oldestMetric = timestamps[0]
      newestMetric = timestamps[timestamps.length - 1]
    }

    return {
      totalMetrics,
      memoryUsage,
      oldestMetric,
      newestMetric
    }
  }

  clear(): void {
    this.metrics = []
  }
}