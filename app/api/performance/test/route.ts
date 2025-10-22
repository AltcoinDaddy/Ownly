// Test endpoint for performance monitoring

import { NextRequest, NextResponse } from 'next/server'
import { trackAPIPerformance, measureOperation } from '@/lib/performance/middleware'
import { performanceCollector } from '@/lib/performance/collector'

export const GET = trackAPIPerformance(async (request: NextRequest) => {
  const url = new URL(request.url)
  const delay = parseInt(url.searchParams.get('delay') || '100')
  const shouldError = url.searchParams.get('error') === 'true'

  try {
    // Simulate some work with performance tracking
    const result = await measureOperation('test_operation', async () => {
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, delay))
      
      if (shouldError) {
        throw new Error('Simulated error for testing')
      }
      
      return { message: 'Test operation completed', delay }
    }, {
      test_param: delay.toString(),
      error_simulation: shouldError.toString()
    })

    // Record a custom event metric
    await performanceCollector.recordEventMetric({
      eventType: 'test_event',
      processingTime: delay,
      queueSize: 0,
      eventSource: 'internal',
      tags: {
        test: 'true',
        delay: delay.toString()
      }
    })

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
})

export const POST = trackAPIPerformance(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    // Simulate blockchain operation with deterministic response time
    const baseResponseTime = 500
    const variableTime = (body?.seed || 1) % 1000 // Use request data for variation
    await performanceCollector.recordBlockchainMetric({
      operation: 'query',
      network: 'testnet',
      responseTime: baseResponseTime + variableTime, // Deterministic time between 500-1500ms
      success: true,
      tags: {
        test: 'true',
        contract: 'TestContract'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Test blockchain metric recorded',
      body
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})