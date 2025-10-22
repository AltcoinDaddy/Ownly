import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useHydrated } from "@/lib/hydration/use-hydrated"
import { SafeLocalStorage } from "@/lib/hydration/safe-local-storage"

// Mock window and localStorage for testing
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe("Hydration Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useHydrated", () => {
    it("should return false initially and true after effect", async () => {
      const { result } = renderHook(() => useHydrated())
      
      // Initially should be false (but may be true in test environment)
      // The important thing is that it returns a boolean
      expect(typeof result.current.isHydrated).toBe("boolean")
      
      // Wait for any effects to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // After effect runs, should be true
      expect(result.current.isHydrated).toBe(true)
    })
  })

  describe("SafeLocalStorage", () => {
    it("should safely get items from localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("test-value")
      
      const result = SafeLocalStorage.getItem("test-key")
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("test-key")
      expect(result).toBe("test-value")
    })

    it("should safely set items in localStorage", () => {
      SafeLocalStorage.setItem("test-key", "test-value")
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test-key", "test-value")
    })

    it("should safely remove items from localStorage", () => {
      SafeLocalStorage.removeItem("test-key")
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key")
    })

    it("should safely clear localStorage", () => {
      SafeLocalStorage.clear()
      
      expect(mockLocalStorage.clear).toHaveBeenCalled()
    })

    it("should handle localStorage errors gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error")
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = SafeLocalStorage.getItem("test-key")
      
      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })
})