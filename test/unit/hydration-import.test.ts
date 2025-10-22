import { describe, it, expect } from "vitest"

describe("Hydration Utilities Import Test", () => {
  it("should import all hydration utilities without errors", async () => {
    // Test that all utilities can be imported
    const { ClientOnly, useHydrated, SafeLocalStorage, useIsomorphicLayoutEffect } = await import("@/lib/hydration")
    
    expect(ClientOnly).toBeDefined()
    expect(useHydrated).toBeDefined()
    expect(SafeLocalStorage).toBeDefined()
    expect(useIsomorphicLayoutEffect).toBeDefined()
    
    // Test SafeLocalStorage methods exist
    expect(typeof SafeLocalStorage.getItem).toBe("function")
    expect(typeof SafeLocalStorage.setItem).toBe("function")
    expect(typeof SafeLocalStorage.removeItem).toBe("function")
    expect(typeof SafeLocalStorage.clear).toBe("function")
  })
})