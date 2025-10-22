"use client"

import { useEffect } from "react"
import { initializeSafeRandom } from "@/lib/hydration"

/**
 * Component to initialize hydration-safe utilities
 * Should be included early in the app lifecycle
 */
export function HydrationInit() {
  useEffect(() => {
    // Initialize safe random with a consistent seed
    initializeSafeRandom(12345)
  }, [])

  // This component doesn't render anything
  return null
}