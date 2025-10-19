// Performance metrics API endpoint

import { NextRequest, NextResponse } from 'next/server'
import { performanceCollector } from '@/lib/performance/collector'
import { performanceAwareFlowEventListener, eventLatencyMonitor } from '@/lib/performance/event-monitor'
import { PerformanceDashboardData } from '@/lib/performance/types'
import { trackAPIPerformance } from '@/lib/performance/middleware'

async function getPerformanceDashboard(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url)
    const timeRangeParam = url.searchParams.get('timeRange') || '1h'
    
    // Parse time range
    const timeRangeMs = parseTimeRange(timeRangeParam)
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - timeRangeMs)

    // Get API metrics
    const apiMetrics = await performanceCollector.getMetrics({
      category: 'api',
      startTime,
      endTime,
      limit: 1000
    })

    // Get event metrics
    const eventMetrics = await performanceCollector.getMetrics({
      category: 'event',
      startTime,
      endTime,
      limit: 1000
    })

    // Get blockchain metrics
    const blockchainMetrics = await performanceCollector.getMetrics({
      category: 'blockchain',
      startTime,
      endTime,
      limit: 1000
    })

    // Get aggregated API data
    const apiAggregated = await performanceCollector.getAggregatedMetrics(
      'api',
      { start: startTime, end: endTime },
      'endpoint'
    )

    // Get aggregated event data
    const eventAggregated = await performanceCollector.getAggregatedMetrics(
      'event',
      { start: startTime, end: endTime },
      'eventType'
    )

    // Get aggregated blockchain data
    const blockchainAggregated = await performanceCollector.getAggregatedMetrics(
      'blockchain',
      { start: startTime, end: endTime },
      'operation'
    )

    // Calculate overview metrics
    const totalRequests = apiMetrics.length
    const averageResponseTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0
    
    const errorCount = apiMetrics.filter(m => (m as any).statusCode >= 400).length
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
    
    const eventsProcessed = eventMetrics.length
    const averageEventProcessingTime = eventMetrics.length > 0
      ? eventMetrics.reduce((sum, m) => sum + m.value, 0) / eventMetrics.length
      : 0

    // Get active alerts
    const activeAlerts = performanceCollector.getActiveAlerts()

    // Get subscription metrics
    const subscriptionMetrics = performanceAwareFlowEventListener.getSubscriptionMetrics()

    // Build dashboard data
    const dashboardData: PerformanceDashboardData = {
      overview: {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        eventsProcessed,
        averageEventProcessingTime: Math.round(averageEventProcessingTime * 100) / 100,
        activeAlerts: activeAlerts.length
      },
      apiMetrics: {
        endpoints: apiAggregated.map(agg => ({
          endpoint: agg.group,
          requestCount: agg.count,
          averageResponseTime: agg.average,
          errorRate: 0, // Would need additional calculation
          p95ResponseTime: agg.p95,
          p99ResponseTime: agg.p99
        })),
        recentRequests: apiMetrics
          .slice(0, 50)
          .map(m => m as any)
      },
      eventMetrics: {
        eventTypes: eventAggregated.map(agg => ({
          eventType: agg.group,
          processedCount: agg.count,
          averageProcessingTime: agg.average,
          errorRate: 0 // Would need additional calculation
        })),
        recentEvents: eventMetrics
          .slice(0, 50)
          .map(m => m as any),
        queueStatus: {
          currentSize: 0, // Would need to get from event queue
          averageSize: 0,
          maxSize: 0
        }
      },
      blockchainMetrics: {
        operations: blockchainAggregated.map(agg => ({
          operation: agg.group,
          count: agg.count,
          averageTime: agg.average,
          successRate: 100 // Would need additional calculation
        })),
        recentOperations: blockchainMetrics
          .slice(0, 50)
          .map(m => m as any)
      },
      alerts: activeAlerts,
      timeRange: {
        start: startTime,
        end: endTime
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('[Performance API] Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}

async function getPerformanceMetrics(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const timeRange = url.searchParams.get('timeRange') || '1h'
    const limit = parseInt(url.searchParams.get('limit') || '100')

    const timeRangeMs = parseTimeRange(timeRange)
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - timeRangeMs)

    const metrics = await performanceCollector.getMetrics({
      category: category || undefined,
      startTime,
      endTime,
      limit
    })

    return NextResponse.json({
      metrics,
      timeRange: { start: startTime, end: endTime },
      total: metrics.length
    })

  } catch (error) {
    console.error('[Performance API] Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

async function getPerformanceAlerts(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url)
    const resolved = url.searchParams.get('resolved') === 'true'

    const alerts = performanceCollector.getActiveAlerts()
    const filteredAlerts = resolved ? alerts : alerts.filter(a => !a.resolved)

    return NextResponse.json({
      alerts: filteredAlerts,
      total: filteredAlerts.length
    })

  } catch (error) {
    console.error('[Performance API] Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

async function resolveAlert(request: NextRequest): Promise<NextResponse> {
  try {
    const { alertId } = await request.json()
    
    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    performanceCollector.resolveAlert(alertId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Performance API] Error resolving alert:', error)
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    )
  }
}

async function getLatencyStats(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url)
    const eventType = url.searchParams.get('eventType')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    if (eventType) {
      const stats = eventLatencyMonitor.getLatencyStats(eventType)
      const recentLatency = eventLatencyMonitor.getRecentLatency(eventType, limit)
      
      return NextResponse.json({
        eventType,
        stats,
        recentLatency
      })
    } else {
      const recentLatency = eventLatencyMonitor.getRecentLatency(undefined, limit)
      
      return NextResponse.json({
        recentLatency
      })
    }

  } catch (error) {
    console.error('[Performance API] Error fetching latency stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latency stats' },
      { status: 500 }
    )
  }
}

// Parse time range string to milliseconds
function parseTimeRange(timeRange: string): number {
  const match = timeRange.match(/^(\d+)([smhd])$/)
  if (!match) return 60 * 60 * 1000 // Default to 1 hour

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return 60 * 60 * 1000
  }
}

// Route handlers
export const GET = trackAPIPerformance(async (request: NextRequest) => {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  switch (action) {
    case 'dashboard':
      return getPerformanceDashboard(request)
    case 'metrics':
      return getPerformanceMetrics(request)
    case 'alerts':
      return getPerformanceAlerts(request)
    case 'latency':
      return getLatencyStats(request)
    default:
      return getPerformanceDashboard(request)
  }
})

export const POST = trackAPIPerformance(async (request: NextRequest) => {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  switch (action) {
    case 'resolve-alert':
      return resolveAlert(request)
    default:
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
  }
})