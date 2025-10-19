# Performance Monitoring System

This module provides comprehensive performance monitoring for the Ownly NFT marketplace, tracking API response times, event processing latency, and blockchain operation performance.

## Features

### 1. API Response Time Tracking
- Automatic tracking of all API endpoints
- Response time measurement
- Request/response size tracking
- Error rate monitoring
- External API call tracking (Dapper Core API)

### 2. Event Processing Latency Monitoring
- Flow blockchain event processing times
- Event queue size monitoring
- Event processing success/failure rates
- Real-time event latency tracking

### 3. Performance Metrics Dashboard
- Real-time performance overview
- Detailed metrics by category (API, Events, Blockchain)
- Performance alerts and thresholds
- Historical data visualization

### 4. Alerting System
- Configurable performance thresholds
- Warning and critical alert levels
- Automatic alert generation
- Alert resolution tracking

## Usage

### Basic Setup

The performance monitoring system is automatically initialized when the application starts. No additional setup is required for basic functionality.

```typescript
import { performanceCollector } from '@/lib/performance'

// The collector is automatically initialized and ready to use
```

### Manual Metric Recording

#### API Metrics
```typescript
import { trackAPIPerformance, measureOperation } from '@/lib/performance/middleware'

// Wrap API route handlers
export const GET = trackAPIPerformance(async (request: NextRequest) => {
  // Your API logic here
})

// Measure specific operations
const result = await measureOperation('database_query', async () => {
  return await database.query(sql)
}, { table: 'users', operation: 'select' })
```

#### Event Metrics
```typescript
import { performanceCollector } from '@/lib/performance'

await performanceCollector.recordEventMetric({
  eventType: 'CollectibleMinted',
  processingTime: 150,
  queueSize: 5,
  eventSource: 'flow',
  blockHeight: 12345,
  transactionId: 'abc123',
  tags: { contract: 'DapperCollectibles' }
})
```

#### Blockchain Metrics
```typescript
import { trackBlockchainOperation } from '@/lib/performance/middleware'

const result = await trackBlockchainOperation(
  'query',
  'testnet',
  '0x123...abc',
  async () => {
    return await fcl.query({ cadence: script })
  }
)
```

### Performance Dashboard

Access the performance dashboard at `/performance` to view:

- Real-time performance overview
- API endpoint performance breakdown
- Event processing metrics
- Blockchain operation statistics
- Active performance alerts

### API Endpoints

#### Get Dashboard Data
```
GET /api/performance?action=dashboard&timeRange=1h
```

#### Get Specific Metrics
```
GET /api/performance?action=metrics&category=api&timeRange=6h&limit=100
```

#### Get Performance Alerts
```
GET /api/performance?action=alerts
```

#### Resolve Alert
```
POST /api/performance?action=resolve-alert
Body: { "alertId": "alert-id-here" }
```

## Configuration

### Performance Thresholds

Configure performance thresholds in the collector initialization:

```typescript
import { performanceCollector } from '@/lib/performance'

performanceCollector.updateConfig({
  thresholds: {
    api: {
      responseTime: { warning: 1000, critical: 3000 }, // milliseconds
      errorRate: { warning: 5, critical: 10 } // percentage
    },
    events: {
      processingTime: { warning: 500, critical: 2000 },
      queueSize: { warning: 100, critical: 500 }
    },
    blockchain: {
      queryTime: { warning: 2000, critical: 5000 },
      transactionTime: { warning: 10000, critical: 30000 }
    }
  }
})
```

### Sample Rate

Control what percentage of requests to track:

```typescript
performanceCollector.updateConfig({
  sampleRate: 0.1 // Track 10% of requests
})
```

### Storage Configuration

Configure how metrics are stored:

```typescript
performanceCollector.updateConfig({
  storage: {
    type: 'memory', // or 'mongodb', 'redis'
    maxMemoryEntries: 10000
  },
  retentionDays: 7
})
```

## Monitoring Best Practices

### 1. Set Appropriate Thresholds
- Warning thresholds should catch performance degradation early
- Critical thresholds should indicate serious issues requiring immediate attention
- Adjust thresholds based on your application's normal performance patterns

### 2. Monitor Key Metrics
- **API Response Time**: Track P95 and P99 percentiles, not just averages
- **Error Rates**: Monitor both absolute error counts and error percentages
- **Event Processing**: Watch for queue buildup and processing delays
- **Blockchain Operations**: Monitor for network congestion and timeout issues

### 3. Alert Management
- Resolve alerts promptly to maintain alert effectiveness
- Review alert patterns to identify systemic issues
- Adjust thresholds based on alert frequency and relevance

### 4. Performance Optimization
- Use performance data to identify bottlenecks
- Monitor the impact of code changes on performance
- Track performance trends over time

## Architecture

### Components

1. **PerformanceCollector**: Core metrics collection and storage
2. **PerformanceStorage**: Pluggable storage backends (memory, MongoDB, Redis)
3. **Middleware**: Automatic API and operation tracking
4. **EventMonitor**: Enhanced event processing with performance tracking
5. **Dashboard**: React components for performance visualization

### Data Flow

```
API Request → Middleware → Performance Collector → Storage
                ↓
Event Processing → Event Monitor → Performance Collector → Storage
                ↓
Blockchain Ops → Blockchain Tracker → Performance Collector → Storage
                ↓
Dashboard API → Storage → Dashboard UI
```

### Metric Types

- **APIPerformanceMetric**: HTTP request/response metrics
- **EventPerformanceMetric**: Event processing metrics
- **BlockchainPerformanceMetric**: Blockchain operation metrics
- **UIPerformanceMetric**: Frontend performance metrics

## Testing

### Test Performance Monitoring

Use the test endpoint to verify performance monitoring is working:

```bash
# Test API tracking
curl "http://localhost:3000/api/performance/test?delay=500"

# Test error tracking
curl "http://localhost:3000/api/performance/test?error=true"

# Test blockchain metrics
curl -X POST "http://localhost:3000/api/performance/test" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### View Test Results

Check the performance dashboard at `/performance` to see the test metrics.

## Troubleshooting

### Common Issues

1. **No Metrics Appearing**
   - Check that performance monitoring is initialized
   - Verify sample rate is not set too low
   - Ensure API routes are wrapped with tracking middleware

2. **High Memory Usage**
   - Reduce `maxMemoryEntries` in storage configuration
   - Implement periodic cleanup
   - Consider using external storage (MongoDB/Redis)

3. **Too Many Alerts**
   - Adjust performance thresholds
   - Increase warning/critical levels
   - Review alert resolution process

4. **Missing External API Metrics**
   - Ensure external API calls use `trackExternalAPICall`
   - Check that API clients are properly instrumented
   - Verify network connectivity for external services

## Future Enhancements

- MongoDB storage backend for persistent metrics
- Redis storage backend for high-performance scenarios
- Grafana/Prometheus integration
- Advanced alerting (Slack, email, PagerDuty)
- Performance regression detection
- Automated performance testing integration