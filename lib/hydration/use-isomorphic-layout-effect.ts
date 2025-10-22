import { useEffect, useLayoutEffect } from "react"

/**
 * useIsomorphicLayoutEffect hook for consistent effects
 * Uses useLayoutEffect on client and useEffect on server to prevent hydration warnings
 */
export const useIsomorphicLayoutEffect = 
  typeof window !== "undefined" ? useLayoutEffect : useEffect