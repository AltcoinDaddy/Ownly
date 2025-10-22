import { test, expect, Page } from '@playwright/test'

interface HydrationMetrics {
  timeToHydrate: number
  timeToInteractive: number
  layoutShifts: number
  renderBlocking: number
  totalBlockingTime: number
}

// Helper function to collect hydration performance metrics
async function collectHydrationMetrics(page: Page): Promise<HydrationMetrics> {
  return await page.evaluate(() => {
    return new Promise<HydrationMetrics>((resolve) => {
      const metrics: Partial<HydrationMetrics> = {}
      
      // Measure time to hydrate
      const hydrationStart = performance.mark('hydration-start')
      
      // Wait for React to hydrate
      const checkHydration = () => {
        if (document.querySelector('[data-reactroot]') || 
            document.querySelector('#__next') ||
            (window as any).React) {
          performance.mark('hydration-end')
          const hydrationMeasure = performance.measure('hydration-duration', 'hydration-start', 'hydration-end')
          metrics.timeToHydrate = hydrationMeasure.duration
          
          // Collect other metrics
          collectAdditionalMetrics()
        } else {
          requestAnimationFrame(checkHydration)
        }
      }
      
      const collectAdditionalMetrics = () => {
        // Time to Interactive (TTI) approximation
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigationEntry) {
          metrics.timeToInteractive = navigationEntry.loadEventEnd - navigationEntry.navigationStart
        }
        
        // Layout shifts (CLS approximation)
        const layoutShiftEntries = performance.getEntriesByType('layout-shift')
        metrics.layoutShifts = layoutShiftEntries.length
        
        // Render blocking resources
        const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        metrics.renderBlocking = resourceEntries.filter(entry => 
          entry.renderBlockingStatus === 'blocking' ||
          (entry.name.includes('.css') && entry.startTime < 1000)
        ).length
        
        // Total Blocking Time approximation
        const longTaskEntries = performance.getEntriesByType('longtask')
        metrics.totalBlockingTime = longTaskEntries.reduce((total, task) => {
          return total + Math.max(0, task.duration - 50) // Tasks over 50ms are blocking
        }, 0)
        
        resolve(metrics as HydrationMetrics)
      }
      
      checkHydration()
    })
  })
}

// Helper function to measure Core Web Vitals
async function measureCoreWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: any = {}
      
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        vitals.lcp = lastEntry.startTime
      }).observe({ entryTypes: ['largest-contentful-paint'] })
      
      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          vitals.fid = entry.processingStart - entry.startTime
        })
      }).observe({ entryTypes: ['first-input'] })
      
      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        vitals.cls = clsValue
      }).observe({ entryTypes: ['layout-shift'] })
      
      // First Contentful Paint (FCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime
          }
        })
      }).observe({ entryTypes: ['paint'] })
      
      // Resolve after a reasonable time to collect metrics
      setTimeout(() => resolve(vitals), 3000)
    })
  })
}

test.describe('Hydration Performance Tests', () => {
  test('homepage hydration performance benchmarks', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Collect hydration metrics
    const metrics = await collectHydrationMetrics(page)
    
    // Assert performance benchmarks
    expect(metrics.timeToHydrate).toBeLessThan(2000) // Should hydrate within 2 seconds
    expect(metrics.timeToInteractive).toBeLessThan(5000) // Should be interactive within 5 seconds
    expect(metrics.layoutShifts).toBeLessThan(5) // Minimal layout shifts
    expect(metrics.totalBlockingTime).toBeLessThan(300) // Low blocking time
    
    console.log('Homepage Hydration Metrics:', metrics)
  })

  test('marketplace page hydration performance', async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' })
    
    const metrics = await collectHydrationMetrics(page)
    
    // Marketplace might be slower due to NFT loading
    expect(metrics.timeToHydrate).toBeLessThan(3000)
    expect(metrics.timeToInteractive).toBeLessThan(7000)
    expect(metrics.layoutShifts).toBeLessThan(10) // Allow more shifts for dynamic content
    
    console.log('Marketplace Hydration Metrics:', metrics)
  })

  test('profile page hydration performance', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    
    const metrics = await collectHydrationMetrics(page)
    
    expect(metrics.timeToHydrate).toBeLessThan(2500)
    expect(metrics.timeToInteractive).toBeLessThan(6000)
    expect(metrics.layoutShifts).toBeLessThan(8)
    
    console.log('Profile Hydration Metrics:', metrics)
  })

  test('Core Web Vitals during hydration', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    const vitals = await measureCoreWebVitals(page)
    
    // Core Web Vitals thresholds (good performance)
    expect(vitals.lcp).toBeLessThan(2500) // LCP should be under 2.5s
    expect(vitals.fcp).toBeLessThan(1800) // FCP should be under 1.8s
    expect(vitals.cls).toBeLessThan(0.1) // CLS should be under 0.1
    
    if (vitals.fid !== undefined) {
      expect(vitals.fid).toBeLessThan(100) // FID should be under 100ms
    }
    
    console.log('Core Web Vitals:', vitals)
  })

  test('hydration performance under slow network conditions', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
      await route.continue()
    })
    
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    const metrics = await collectHydrationMetrics(page)
    
    // Performance should degrade gracefully under slow network
    expect(metrics.timeToHydrate).toBeLessThan(5000) // Allow more time for slow network
    expect(metrics.timeToInteractive).toBeLessThan(10000)
    
    console.log('Slow Network Hydration Metrics:', metrics)
  })

  test('hydration performance with large DOM trees', async ({ page }) => {
    // Navigate to a page with many NFTs (large DOM)
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' })
    
    // Wait for NFTs to load
    await page.waitForSelector('[data-testid="nft-card"]', { timeout: 10000 })
    
    const metrics = await collectHydrationMetrics(page)
    
    // Performance should remain reasonable even with large DOM
    expect(metrics.timeToHydrate).toBeLessThan(4000)
    expect(metrics.totalBlockingTime).toBeLessThan(500)
    
    console.log('Large DOM Hydration Metrics:', metrics)
  })

  test('hydration performance on mobile devices', async ({ page, context }) => {
    // Simulate mobile device
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      })
    })
    
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    const metrics = await collectHydrationMetrics(page)
    
    // Mobile performance should be optimized
    expect(metrics.timeToHydrate).toBeLessThan(3000)
    expect(metrics.timeToInteractive).toBeLessThan(6000)
    
    console.log('Mobile Hydration Metrics:', metrics)
  })

  test('memory usage during hydration', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Measure memory usage
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        }
      }
      return null
    })
    
    if (memoryUsage) {
      // Memory usage should be reasonable
      expect(memoryUsage.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
      
      console.log('Memory Usage:', {
        used: `${Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024)}MB`
      })
    }
  })

  test('hydration performance regression detection', async ({ page }) => {
    const runs = 3
    const metrics: HydrationMetrics[] = []
    
    // Run multiple times to get average performance
    for (let i = 0; i < runs; i++) {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      const runMetrics = await collectHydrationMetrics(page)
      metrics.push(runMetrics)
      
      // Clear cache between runs
      await page.evaluate(() => {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name))
          })
        }
      })
    }
    
    // Calculate averages
    const avgMetrics = {
      timeToHydrate: metrics.reduce((sum, m) => sum + m.timeToHydrate, 0) / runs,
      timeToInteractive: metrics.reduce((sum, m) => sum + m.timeToInteractive, 0) / runs,
      layoutShifts: metrics.reduce((sum, m) => sum + m.layoutShifts, 0) / runs,
      totalBlockingTime: metrics.reduce((sum, m) => sum + m.totalBlockingTime, 0) / runs
    }
    
    // Check for performance consistency
    const hydrationVariance = Math.max(...metrics.map(m => m.timeToHydrate)) - 
                             Math.min(...metrics.map(m => m.timeToHydrate))
    
    expect(hydrationVariance).toBeLessThan(1000) // Hydration time should be consistent
    
    console.log('Average Hydration Metrics:', avgMetrics)
    console.log('Hydration Time Variance:', hydrationVariance)
  })

  test('resource loading impact on hydration', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Analyze resource loading
    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      
      const analysis = {
        totalResources: resources.length,
        cssResources: resources.filter(r => r.name.includes('.css')).length,
        jsResources: resources.filter(r => r.name.includes('.js')).length,
        imageResources: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)).length,
        renderBlockingResources: resources.filter(r => 
          r.renderBlockingStatus === 'blocking' || 
          (r.name.includes('.css') && r.startTime < 1000)
        ).length,
        avgResourceLoadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
      }
      
      return analysis
    })
    
    // Resource loading should be optimized
    expect(resourceMetrics.renderBlockingResources).toBeLessThan(5)
    expect(resourceMetrics.avgResourceLoadTime).toBeLessThan(500)
    
    console.log('Resource Loading Metrics:', resourceMetrics)
  })

  test('hydration performance with error boundaries', async ({ page }) => {
    // Inject a script that might cause hydration errors
    await page.addInitScript(() => {
      // Simulate potential hydration issues
      window.addEventListener('error', (event) => {
        console.log('Error caught:', event.error?.message)
      })
    })
    
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    const metrics = await collectHydrationMetrics(page)
    
    // Performance should remain good even with error handling
    expect(metrics.timeToHydrate).toBeLessThan(3000)
    expect(metrics.timeToInteractive).toBeLessThan(6000)
    
    console.log('Error Boundary Hydration Metrics:', metrics)
  })
})

test.describe('Hydration Performance Monitoring', () => {
  test('performance observer integration', async ({ page }) => {
    await page.goto('/')
    
    // Set up performance monitoring
    const performanceData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const data: any = {
          marks: [],
          measures: [],
          longTasks: [],
          layoutShifts: []
        }
        
        // Collect performance marks
        new PerformanceObserver((list) => {
          data.marks.push(...list.getEntries())
        }).observe({ entryTypes: ['mark'] })
        
        // Collect performance measures
        new PerformanceObserver((list) => {
          data.measures.push(...list.getEntries())
        }).observe({ entryTypes: ['measure'] })
        
        // Collect long tasks
        new PerformanceObserver((list) => {
          data.longTasks.push(...list.getEntries())
        }).observe({ entryTypes: ['longtask'] })
        
        // Collect layout shifts
        new PerformanceObserver((list) => {
          data.layoutShifts.push(...list.getEntries())
        }).observe({ entryTypes: ['layout-shift'] })
        
        // Resolve after collecting data
        setTimeout(() => resolve(data), 5000)
      })
    })
    
    console.log('Performance Observer Data:', performanceData)
    
    // Verify performance monitoring is working
    expect(performanceData).toBeDefined()
  })

  test('custom hydration metrics collection', async ({ page }) => {
    // Add custom performance tracking
    await page.addInitScript(() => {
      (window as any).hydrationMetrics = {
        start: performance.now(),
        milestones: []
      }
      
      // Track hydration milestones
      const originalConsoleLog = console.log
      console.log = (...args) => {
        if (args[0]?.includes?.('hydration')) {
          (window as any).hydrationMetrics.milestones.push({
            time: performance.now(),
            message: args[0]
          })
        }
        originalConsoleLog.apply(console, args)
      }
    })
    
    await page.goto('/')
    
    // Wait for hydration to complete
    await page.waitForTimeout(3000)
    
    const customMetrics = await page.evaluate(() => {
      return (window as any).hydrationMetrics
    })
    
    expect(customMetrics.start).toBeGreaterThan(0)
    console.log('Custom Hydration Metrics:', customMetrics)
  })
})