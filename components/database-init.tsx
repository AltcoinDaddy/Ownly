'use client'

import { useEffect } from 'react'
import { initializeOnStartup } from '@/lib/database/startup'

/**
 * Database initialization component
 * Initializes MongoDB caching and background sync services on app startup
 */
export function DatabaseInit() {
  useEffect(() => {
    // Initialize database services on client-side mount
    // This ensures the services start when the app loads
    const initialize = async () => {
      try {
        await initializeOnStartup()
      } catch (error) {
        console.error('Failed to initialize database services:', error)
      }
    }

    initialize()
  }, [])

  // This component doesn't render anything
  return null
}