"use client"

import { useEffect } from 'react'
import { initializePerformanceMonitoring } from '@/lib/performance/init'

export function PerformanceInit() {
  useEffect(() => {
    // Initialize performance monitoring on the client side
    initializePerformanceMonitoring()
  }, [])

  return null // This component doesn't render anything
}