interface SafeLocalStorageInterface {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

/**
 * SSR-safe localStorage utility
 * Prevents hydration mismatches by safely handling localStorage operations
 */
class SafeLocalStorageImpl implements SafeLocalStorageInterface {
  private isClient(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  }

  getItem(key: string): string | null {
    if (!this.isClient()) {
      return null
    }

    try {
      return window.localStorage.getItem(key)
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to get item "${key}"`, error)
      return null
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isClient()) {
      return
    }

    try {
      window.localStorage.setItem(key, value)
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to set item "${key}"`, error)
    }
  }

  removeItem(key: string): void {
    if (!this.isClient()) {
      return
    }

    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to remove item "${key}"`, error)
    }
  }

  clear(): void {
    if (!this.isClient()) {
      return
    }

    try {
      window.localStorage.clear()
    } catch (error) {
      console.warn("SafeLocalStorage: Failed to clear storage", error)
    }
  }
}

export const SafeLocalStorage = new SafeLocalStorageImpl()