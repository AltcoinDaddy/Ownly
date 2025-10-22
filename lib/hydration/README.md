# Hydration Utilities

This directory contains utilities and hooks to prevent React hydration mismatch errors in Next.js applications.

## Components and Hooks

### ClientOnly

A wrapper component that only renders its children on the client side, preventing hydration mismatches for browser-dependent features.

```tsx
import { ClientOnly } from "@/lib/hydration"

function MyComponent() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <BrowserOnlyFeature />
    </ClientOnly>
  )
}
```

### useHydrated

A hook that tracks whether the component has hydrated on the client side.

```tsx
import { useHydrated } from "@/lib/hydration"

function MyComponent() {
  const { isHydrated } = useHydrated()
  
  return (
    <div>
      {isHydrated ? "Client-side content" : "Server-side content"}
    </div>
  )
}
```

### SafeLocalStorage

A utility that provides SSR-safe access to localStorage, preventing hydration errors.

```tsx
import { SafeLocalStorage } from "@/lib/hydration"

// Safe to use during SSR - returns null on server
const value = SafeLocalStorage.getItem("my-key")

// Safe to call during SSR - no-op on server
SafeLocalStorage.setItem("my-key", "my-value")
```

### useIsomorphicLayoutEffect

A hook that uses `useLayoutEffect` on the client and `useEffect` on the server to prevent hydration warnings.

```tsx
import { useIsomorphicLayoutEffect } from "@/lib/hydration"

function MyComponent() {
  useIsomorphicLayoutEffect(() => {
    // This effect runs consistently on both server and client
    console.log("Component mounted")
  }, [])
}
```

## Common Patterns

### Browser API Usage

```tsx
import { ClientOnly } from "@/lib/hydration"

function ClipboardButton() {
  return (
    <ClientOnly fallback={<span>Clipboard not available</span>}>
      <button onClick={() => navigator.clipboard.writeText("Hello!")}>
        Copy to Clipboard
      </button>
    </ClientOnly>
  )
}
```

### Conditional Rendering Based on Hydration

```tsx
import { useHydrated } from "@/lib/hydration"

function ConditionalComponent() {
  const { isHydrated } = useHydrated()
  
  if (!isHydrated) {
    return <div>Loading...</div>
  }
  
  return <InteractiveComponent />
}
```

### Safe Storage Access

```tsx
import { SafeLocalStorage } from "@/lib/hydration"
import { useHydrated } from "@/lib/hydration"
import { useState, useEffect } from "react"

function StorageComponent() {
  const { isHydrated } = useHydrated()
  const [value, setValue] = useState<string | null>(null)
  
  useEffect(() => {
    if (isHydrated) {
      setValue(SafeLocalStorage.getItem("my-key"))
    }
  }, [isHydrated])
  
  const handleSave = (newValue: string) => {
    SafeLocalStorage.setItem("my-key", newValue)
    setValue(newValue)
  }
  
  return (
    <div>
      <p>Stored value: {value}</p>
      <button onClick={() => handleSave("new value")}>
        Save
      </button>
    </div>
  )
}
```

## Best Practices

1. **Use ClientOnly for browser APIs**: Wrap any component that uses `window`, `document`, `navigator`, or other browser-specific APIs.

2. **Defer storage operations**: Use `useHydrated` to ensure localStorage/sessionStorage operations only happen after hydration.

3. **Consistent initial state**: Ensure the initial state is the same on both server and client.

4. **Use SafeLocalStorage**: Always use the SafeLocalStorage utility instead of direct localStorage access.

5. **Avoid dynamic content in SSR**: Don't use `Math.random()`, `Date.now()`, or other dynamic values that differ between server and client renders.

## Testing

The utilities include comprehensive tests to ensure they work correctly in both SSR and client environments. Run tests with:

```bash
npm test -- test/unit/hydration-utilities.test.ts
```