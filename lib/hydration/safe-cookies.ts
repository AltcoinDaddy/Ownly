interface SafeCookiesInterface {
  get: (name: string) => string | null
  set: (name: string, value: string, options?: { maxAge?: number; path?: string }) => void
  remove: (name: string, options?: { path?: string }) => void
}

/**
 * SSR-safe cookie utility
 * Prevents hydration mismatches by safely handling cookie operations
 */
class SafeCookiesImpl implements SafeCookiesInterface {
  private isClient(): boolean {
    return typeof document !== "undefined"
  }

  get(name: string): string | null {
    if (!this.isClient()) {
      return null
    }

    try {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift()
        return cookieValue || null
      }
    } catch (error) {
      console.warn(`SafeCookies: Failed to get cookie "${name}"`, error)
    }
    return null
  }

  set(name: string, value: string, options: { maxAge?: number; path?: string } = {}): void {
    if (!this.isClient()) {
      return
    }

    try {
      const { maxAge = 60 * 60 * 24 * 7, path = '/' } = options
      document.cookie = `${name}=${value}; path=${path}; max-age=${maxAge}`
    } catch (error) {
      console.warn(`SafeCookies: Failed to set cookie "${name}"`, error)
    }
  }

  remove(name: string, options: { path?: string } = {}): void {
    if (!this.isClient()) {
      return
    }

    try {
      const { path = '/' } = options
      document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } catch (error) {
      console.warn(`SafeCookies: Failed to remove cookie "${name}"`, error)
    }
  }
}

export const SafeCookies = new SafeCookiesImpl()