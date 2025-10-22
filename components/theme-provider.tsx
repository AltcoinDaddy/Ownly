'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { useHydrated } from '@/lib/hydration/use-hydrated'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { isHydrated } = useHydrated()

  // Prevent hydration mismatch by not applying theme until hydrated
  if (!isHydrated) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
