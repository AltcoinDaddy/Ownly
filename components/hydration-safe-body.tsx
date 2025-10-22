"use client"

import React, { useEffect } from "react"
import { useHydrated } from "@/lib/hydration/use-hydrated"

interface HydrationSafeBodyProps {
  className?: string
}

/**
 * Component to safely apply body classes after hydration
 * Prevents hydration mismatches from dynamic body className changes
 */
export function HydrationSafeBody({ className }: HydrationSafeBodyProps) {
  const { isHydrated } = useHydrated()

  useEffect(() => {
    if (isHydrated && className) {
      // Apply additional classes after hydration
      const body = document.body
      const classes = className.split(' ').filter(Boolean)
      
      classes.forEach(cls => {
        if (!body.classList.contains(cls)) {
          body.classList.add(cls)
        }
      })

      // Cleanup function to remove classes when component unmounts
      return () => {
        classes.forEach(cls => {
          body.classList.remove(cls)
        })
      }
    }
  }, [isHydrated, className])

  // This component doesn't render anything
  return null
}