import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { safeGenerateId } from "@/lib/hydration/safe-random"

// Generate a unique ID (SSR-safe)
export function generateId(): string {
  return safeGenerateId()
}
