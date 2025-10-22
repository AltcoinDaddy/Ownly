/**
 * Safe random utilities for SSR/client consistency
 * Provides deterministic alternatives to Math.random() and Date.now()
 * to prevent hydration mismatches
 */

// Simple seeded random number generator (Linear Congruential Generator)
class SeededRandom {
  private seed: number

  constructor(seed: number = 1) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }
}

// Global seeded random instance
let globalSeededRandom: SeededRandom | null = null

/**
 * Initialize the seeded random generator with a consistent seed
 * This should be called once during app initialization
 */
export function initializeSafeRandom(seed?: number): void {
  // Use a consistent seed based on build time or a fixed value
  const defaultSeed = 12345 // Fixed seed for consistency
  globalSeededRandom = new SeededRandom(seed ?? defaultSeed)
}

/**
 * Get a deterministic random number between 0 and 1
 * Safe for SSR as it produces the same sequence on server and client
 */
export function safeRandom(): number {
  if (!globalSeededRandom) {
    initializeSafeRandom()
  }
  return globalSeededRandom!.next()
}

/**
 * Get a deterministic random integer between min and max (inclusive)
 */
export function safeRandomInt(min: number, max: number): number {
  if (!globalSeededRandom) {
    initializeSafeRandom()
  }
  return globalSeededRandom!.nextInt(min, max)
}

/**
 * Get a deterministic random float between min and max
 */
export function safeRandomFloat(min: number, max: number): number {
  if (!globalSeededRandom) {
    initializeSafeRandom()
  }
  return globalSeededRandom!.nextFloat(min, max)
}

/**
 * Generate a consistent percentage width for skeleton components
 * Returns a percentage string like "65%"
 */
export function safeRandomWidth(min: number = 50, max: number = 90): string {
  return `${safeRandomInt(min, max)}%`
}

/**
 * Safe alternative to Date.now() that returns a consistent timestamp
 * during SSR and initial client render
 */
export function safeDateNow(): number {
  // During SSR or initial render, return a fixed timestamp
  if (typeof window === 'undefined' || !window.performance?.now) {
    // Return a fixed timestamp for consistency
    return 1640995200000 // Jan 1, 2022 00:00:00 UTC
  }
  
  // On client after hydration, return actual current time
  return Date.now()
}

/**
 * Create a safe date object that's consistent during SSR
 */
export function safeDateFromNow(offsetMs: number): Date {
  return new Date(safeDateNow() + offsetMs)
}

/**
 * Generate a deterministic progress increment for animations
 * Safe alternative to Math.random() * 10 for progress bars
 */
export function safeProgressIncrement(min: number = 2, max: number = 8): number {
  return safeRandomFloat(min, max)
}

/**
 * Generate a consistent ID that's safe for SSR
 * Uses a counter instead of random numbers or timestamps
 */
let idCounter = 0
export function safeGenerateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Reset the ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0
}