"use client"

import { useEffect, useState } from "react"

export interface UseHydratedReturn {
  isHydrated: boolean
}

/**
 * Hook to track hydration state
 * Returns true once the component has hydrated on the client side
 */
export function useHydrated(): UseHydratedReturn {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return { isHydrated }
}