import { initializeDatabase } from './init'
import { enhancedCacheService } from './enhanced-cache'

let initialized = false

/**
 * Initialize database and cache services on application startup
 * This should be called once when the application starts
 */
export async function initializeOnStartup(): Promise<void> {
  if (initialized) {
    console.log('Database and cache services already initialized')
    return
  }

  try {
    console.log('Initializing database and cache services...')
    
    // Initialize database collections and indexes
    await initializeDatabase()
    
    // Initialize enhanced cache service (starts background sync)
    await enhancedCacheService.initialize()
    
    initialized = true
    console.log('Database and cache services initialized successfully')
    
  } catch (error) {
    console.error('Error during startup initialization:', error)
    
    // Don't throw error to prevent app from crashing
    // The services will attempt to initialize on first use
    console.log('Continuing without cache services - they will initialize on demand')
  }
}

/**
 * Graceful shutdown of cache services
 * This should be called when the application is shutting down
 */
export async function shutdownServices(): Promise<void> {
  if (!initialized) return

  try {
    console.log('Shutting down cache services...')
    
    await enhancedCacheService.shutdown()
    
    initialized = false
    console.log('Cache services shutdown completed')
    
  } catch (error) {
    console.error('Error during shutdown:', error)
  }
}

/**
 * Check if services are initialized
 */
export function isInitialized(): boolean {
  return initialized
}

// Handle process termination gracefully
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...')
    await shutdownServices()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...')
    await shutdownServices()
    process.exit(0)
  })
}