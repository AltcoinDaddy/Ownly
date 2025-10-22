import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingFallbackProps {
  variant?: "page" | "card" | "minimal"
  className?: string
}

export function LoadingFallback({ variant = "minimal", className = "" }: LoadingFallbackProps) {
  if (variant === "page") {
    return (
      <div className={`min-h-screen flex flex-col ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}