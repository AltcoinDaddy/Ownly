// Performance monitoring middleware for API routes

import { NextRequest, NextResponse } from 'next/server'
import { performanceCollector } from './collector'

// API performance tracking middleware
export function withPerformanceTracking(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async function trackedHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    const startTime = performance.now()
    const endpoint = new URL(request.url).pathname
    const method = request.method as 'GET' | 'POST' | 'PUT' | 'DELETE'
    
    // Get request size
    const requestSize = request.headers.get('content-length') 
      ? parseInt(request.headers.get('content-length')!) 
      : undefined

    let response: NextResponse
    let statusCode = 200
    let responseSize: number | undefined

    try {
      response = await handler(request, ...args)
      statusCode = response.status
      
      // Get response size if available
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        responseSize = parseInt(contentLength)
      }

      return response
    } catch (error) {
      statusCode = 500
      throw error
    } finally {
      const responseTime = performance.now() - startTime

      // Record API performance metric
      await performanceCollector.recordAPIMetric({
        endpoint,
        method,
        statusCode,
        responseTime,
        requestSize,
        responseSize,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        tags: {
          route: endpoint,
          status_class: `${Math.floor(statusCode / 100)}xx`
        }
      })
    }
  }
}

// Higher-order function to wrap API route handlers
export function trackAPIPerformance<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return withPerformanceTracking(handler)
}

// Middleware for measuring specific operations within handlers
export async function measureOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - startTime
    
    // Record as a custom metric
    await performanceCollector.recordAPIMetric({
      endpoint: `/internal/${operationName}`,
      method: 'POST',
      statusCode: 200,
      responseTime: duration,
      tags: {
        operation: operationName,
        ...tags
      }
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    // Record failed operation
    await performanceCollector.recordAPIMetric({
      endpoint: `/internal/${operationName}`,
      method: 'POST',
      statusCode: 500,
      responseTime: duration,
      tags: {
        operation: operationName,
        error: error instanceof Error ? error.message : 'unknown',
        ...tags
      }
    })
    
    throw error
  }
}

// Utility to track external API calls (like Dapper Core API)
export async function trackExternalAPICall<T>(
  apiName: string,
  endpoint: string,
  method: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - startTime
    
    // Record external API call performance
    await performanceCollector.recordAPIMetric({
      endpoint: `${apiName}${endpoint}`,
      method: method as any,
      statusCode: 200,
      responseTime: duration,
      tags: {
        external_api: apiName,
        api_type: 'external'
      }
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    // Determine status code from error
    let statusCode = 500
    if (error && typeof error === 'object' && 'status' in error) {
      statusCode = (error as any).status || 500
    }
    
    await performanceCollector.recordAPIMetric({
      endpoint: `${apiName}${endpoint}`,
      method: method as any,
      statusCode,
      responseTime: duration,
      tags: {
        external_api: apiName,
        api_type: 'external',
        error: error instanceof Error ? error.message : 'unknown'
      }
    })
    
    throw error
  }
}

// Blockchain operation tracking
export async function trackBlockchainOperation<T>(
  operation: 'query' | 'transaction' | 'event_subscription',
  network: 'testnet' | 'mainnet',
  contractAddress: string | undefined,
  blockchainCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await blockchainCall()
    const duration = performance.now() - startTime
    
    await performanceCollector.recordBlockchainMetric({
      operation,
      network,
      responseTime: duration,
      contractAddress,
      success: true,
      tags: {
        contract: contractAddress || 'unknown'
      }
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    await performanceCollector.recordBlockchainMetric({
      operation,
      network,
      responseTime: duration,
      contractAddress,
      success: false,
      tags: {
        contract: contractAddress || 'unknown',
        error: error instanceof Error ? error.message : 'unknown'
      }
    })
    
    throw error
  }
}