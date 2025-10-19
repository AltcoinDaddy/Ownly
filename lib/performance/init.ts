// Performance monitoring initialization

import { performanceCollector } from './collector'
import { performanceAwareFlowEventListener } from './event-monitor'

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  console.log('[Performance] Initializing performance monitoring...')

  // Set up alert handlers
  performanceCollector.onAlert((alert) => {
    console.warn(`[Performance Alert] ${alert.type.toUpperCase()}: ${alert.message}`)
    
    // In production, you might want to send alerts to external services
    // like Slack, PagerDuty, or email notifications
    if (typeof window !== 'undefined') {
      // Browser environment - could show toast notifications
      console.warn('Performance alert:', alert)
    }
  })

  // Set up periodic cleanup
  if (typeof window === 'undefined') {
    // Server environment - set up cleanup interval
    setInterval(() => {
      performanceCollector.cleanup()
    }, 60 * 60 * 1000) // Cleanup every hour
  }

  // Configure performance thresholds based on environment
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    // More lenient thresholds for development
    performanceCollector.updateConfig({
      thresholds: {
        api: {
          responseTime: { warning: 2000, critical: 5000 },
          errorRate: { warning: 10, critical: 25 }
        },
        events: {
          processingTime: { warning: 1000, critical: 3000 },
          queueSize: { warning: 200, critical: 1000 }
        },
        blockchain: {
          queryTime: { warning: 3000, critical: 8000 },
          transactionTime: { warning: 15000, critical: 45000 }
        }
      }
    })
  }

  console.log('[Performance] Performance monitoring initialized')
}

// Initialize on module load for server-side
if (typeof window === 'undefined') {
  initializePerformanceMonitoring()
}

// Export for manual initialization in client-side code
export { performanceCollector, performanceAwareFlowEventListener }