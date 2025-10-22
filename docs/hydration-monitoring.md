# Hydration Monitoring System

The hydration monitoring system provides comprehensive error handling and monitoring for React hydration issues in the Ownly application.

## Components

### HydrationErrorBoundary

A React error boundary specifically designed to catch and handle hydration errors.

```tsx
import { HydrationErrorBoundary } from '@/components/hydration-error-boundary'

<HydrationErrorBoundary
  enableRecovery={true}
  showErrorDetails={process.env.NODE_ENV === 'development'}
  onError={(error, errorInfo) => {
    // Custom error handling
    console.log('Hydration error:', error)
  }}
>
  <YourComponent />
</HydrationErrorBoundary>
```

**Props:**
- `enableRecovery` - Enables automatic recovery attempts for hydration errors
- `showErrorDetails` - Shows detailed error information in development
- `onError` - Custom error handler callback
- `fallback` - Custom fallback UI to render when errors occur

### HydrationDashboard

Development-time dashboard for monitoring hydration issues (only renders in development).

```tsx
import { HydrationDashboard } from '@/components/hydration-dashboard'

// Add to your app root
<HydrationDashboard />
```

The dashboard automatically appears when hydration issues are detected and provides:
- Real-time warning and error tracking
- Categorized issue types (mismatches, browser APIs, dynamic content)
- Clear buttons to reset monitoring state
- Summary statistics and recommendations

### withHydrationMonitoring HOC

Higher-order component that wraps components with automatic hydration monitoring.

```tsx
import { withHydrationMonitoring } from '@/lib/hydration/with-hydration-monitoring'

const MonitoredComponent = withHydrationMonitoring(YourComponent, {
  componentName: 'YourComponent',
  enableErrorBoundary: true,
  enableRecovery: true
})
```

## Hooks

### useHydrationSelfMonitoring

Hook for components to self-report potential hydration issues.

```tsx
import { useHydrationSelfMonitoring } from '@/lib/hydration/with-hydration-monitoring'

function YourComponent() {
  const { reportIssue, checkBrowserAPI, checkDynamicContent } = useHydrationSelfMonitoring('YourComponent')
  
  useEffect(() => {
    // Report when using browser APIs
    checkBrowserAPI('localStorage')
    
    // Report when using dynamic content
    checkDynamicContent('Math.random()')
    
    // Report custom issues
    reportIssue('mismatch', 'Custom hydration issue detected')
  }, [])
  
  return <div>Your component</div>
}
```

### useHydrationWarnings

Hook to access current hydration warnings.

```tsx
import { useHydrationWarnings } from '@/lib/hydration/hydration-monitor'

function MonitoringComponent() {
  const { warnings, clearWarnings, getWarningsByType } = useHydrationWarnings()
  
  return (
    <div>
      <p>Total warnings: {warnings.length}</p>
      <p>Mismatch warnings: {getWarningsByType('mismatch').length}</p>
      <button onClick={clearWarnings}>Clear All</button>
    </div>
  )
}
```

### useHydrationErrors

Hook to access stored hydration errors.

```tsx
import { useHydrationErrors } from '@/components/hydration-error-boundary'

function ErrorMonitoringComponent() {
  const { errors, clearErrors } = useHydrationErrors()
  
  return (
    <div>
      <p>Total errors: {errors.length}</p>
      <button onClick={clearErrors}>Clear Errors</button>
    </div>
  )
}
```

## Manual Reporting

You can manually report hydration issues using the monitoring functions:

```tsx
import { 
  reportHydrationIssue, 
  checkBrowserAPI, 
  checkDynamicContent 
} from '@/lib/hydration/hydration-monitor'

// Report a hydration issue
reportHydrationIssue('mismatch', 'Server and client rendered different content', 'ComponentName')

// Check browser API usage
checkBrowserAPI('ComponentName', 'localStorage')

// Check dynamic content usage
checkDynamicContent('ComponentName', 'Math.random()')
```

## Common Hydration Issues and Solutions

### 1. Browser API Usage

**Problem:** Using `localStorage`, `sessionStorage`, `navigator`, etc. during SSR
```tsx
// ❌ Bad - causes hydration mismatch
const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
```

**Solution:** Use SafeLocalStorage or ClientOnly wrapper
```tsx
// ✅ Good - SSR safe
import { SafeLocalStorage, ClientOnly } from '@/lib/hydration'

const [user, setUser] = useState(null)

useEffect(() => {
  const userData = SafeLocalStorage.getItem('user')
  if (userData) {
    setUser(JSON.parse(userData))
  }
}, [])

// Or wrap in ClientOnly
<ClientOnly fallback={<div>Loading...</div>}>
  <ComponentThatUsesLocalStorage />
</ClientOnly>
```

### 2. Dynamic Content

**Problem:** Using `Math.random()`, `Date.now()`, etc. that generate different values on server vs client
```tsx
// ❌ Bad - different values on server and client
const [id] = useState(() => Math.random().toString())
```

**Solution:** Use consistent alternatives or defer until after hydration
```tsx
// ✅ Good - consistent values
import { safeGenerateId } from '@/lib/hydration'

const [id] = useState(() => safeGenerateId())

// Or defer until hydration
const { isHydrated } = useHydrated()
const [id, setId] = useState('')

useEffect(() => {
  if (isHydrated) {
    setId(Math.random().toString())
  }
}, [isHydrated])
```

### 3. Event Listeners

**Problem:** Adding window event listeners during SSR
```tsx
// ❌ Bad - window doesn't exist during SSR
window.addEventListener('resize', handleResize)
```

**Solution:** Use useEffect to add listeners only on client
```tsx
// ✅ Good - client-side only
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  }
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

## Development Workflow

1. **Enable monitoring** by adding `HydrationErrorBoundary` and `HydrationDashboard` to your app root
2. **Run your app** in development mode
3. **Monitor the dashboard** for any hydration warnings or errors
4. **Fix issues** using the patterns described above
5. **Test thoroughly** to ensure hydration consistency

## Testing

The system includes comprehensive tests for all components and hooks:

```bash
# Run hydration error boundary tests
npm test test/unit/hydration-error-boundary.test.tsx

# Run integration tests
npm test test/integration/hydration-error-boundary-integration.test.tsx
```

## Production Considerations

- The monitoring dashboard only renders in development mode
- Error boundaries still catch and handle errors in production
- Errors are logged to the console in production for debugging
- Consider integrating with error tracking services (Sentry, LogRocket) for production monitoring

## Best Practices

1. **Wrap your app root** with `HydrationErrorBoundary`
2. **Use SafeLocalStorage** instead of direct localStorage access
3. **Wrap browser-dependent components** in `ClientOnly`
4. **Use consistent data sources** for SSR and client rendering
5. **Add useEffect guards** for event listeners and browser APIs
6. **Test hydration** by disabling JavaScript and checking for layout shifts
7. **Monitor regularly** using the development dashboard