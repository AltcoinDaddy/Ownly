"use client"

import { ClientOnly } from "./client-only"
import { useHydrated } from "./use-hydrated"
import { SafeLocalStorage } from "./safe-local-storage"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect"
import { useState } from "react"

/**
 * Example component demonstrating hydration-safe patterns
 * This is for documentation purposes and shows how to use the utilities
 */
export function HydrationExampleComponent() {
  const { isHydrated } = useHydrated()
  const [storedValue, setStoredValue] = useState<string | null>(null)

  // Use isomorphic layout effect for consistent behavior
  useIsomorphicLayoutEffect(() => {
    // This effect runs on both server and client consistently
    console.log("Component mounted")
  }, [])

  // Load from localStorage only after hydration
  useIsomorphicLayoutEffect(() => {
    if (isHydrated) {
      const value = SafeLocalStorage.getItem("example-key")
      setStoredValue(value)
    }
  }, [isHydrated])

  const handleSave = () => {
    const newValue = `Saved at ${new Date().toISOString()}`
    SafeLocalStorage.setItem("example-key", newValue)
    setStoredValue(newValue)
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Hydration Example</h3>
      
      {/* Always safe to render */}
      <p>Hydration status: {isHydrated ? "Hydrated" : "Not hydrated"}</p>
      
      {/* Browser-dependent features wrapped in ClientOnly */}
      <ClientOnly fallback={<p>Loading browser features...</p>}>
        <div className="mt-2">
          <p>Stored value: {storedValue || "None"}</p>
          <button 
            onClick={handleSave}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save to LocalStorage
          </button>
        </div>
      </ClientOnly>

      {/* Another example: clipboard API */}
      <ClientOnly fallback={<p>Clipboard not available</p>}>
        <button
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText("Hello from hydration-safe component!")
            }
          }}
          className="mt-2 ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Copy to Clipboard
        </button>
      </ClientOnly>
    </div>
  )
}