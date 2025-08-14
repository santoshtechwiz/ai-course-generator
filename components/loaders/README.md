# Global Loader System

A simplified, deterministic loading system that follows best practices and eliminates infinite loops.

## Features

- ✅ **Deterministic behavior** - No random progress increments or infinite loops
- ✅ **Memory leak prevention** - Proper cleanup of timeouts and intervals
- ✅ **Type-safe** - Full TypeScript support with comprehensive types
- ✅ **Accessible** - Screen reader support and proper ARIA attributes
- ✅ **Flexible** - Support for both blocking and non-blocking loaders
- ✅ **Progress tracking** - Optional progress bar with deterministic updates
- ✅ **Auto-dismiss** - Configurable auto-dismiss timers
- ✅ **Error handling** - Built-in error state management

## Components

### GlobalLoader
The main loader component that displays loading states, success messages, and error messages.

```tsx
import { GlobalLoader } from '@/components/loaders'

// Automatically rendered in your layout
<GlobalLoader />
```

### LoadingSpinner
A simple spinner component for inline loading states.

```tsx
import { LoadingSpinner } from '@/components/loaders'

<LoadingSpinner size={24} className="text-primary" />
```

### InlineSpinner
A smaller spinner for buttons and small components.

```tsx
import { InlineSpinner } from '@/components/loaders'

<InlineSpinner size={16} className="mr-2" />
```

### AsyncNavLink
A navigation link that shows a loading state during route transitions.

```tsx
import { AsyncNavLink } from '@/components/loaders'

<AsyncNavLink href="/dashboard" loadingMessage="Loading dashboard...">
  Dashboard
</AsyncNavLink>
```

### SuspenseGlobalFallback
A fallback component for React Suspense boundaries.

```tsx
import SuspenseGlobalFallback from '@/components/loaders/SuspenseGlobalFallback'

<Suspense fallback={<SuspenseGlobalFallback message="Loading content..." />}>
  <AsyncComponent />
</Suspense>
```

## Hooks

### useGlobalLoader
Direct access to the global loader store.

```tsx
import { useGlobalLoader } from '@/store/loaders/global-loader'

const { startLoading, stopLoading, setSuccess, setError } = useGlobalLoader()

// Start loading
startLoading({
  message: 'Processing...',
  isBlocking: true,
  minVisibleMs: 1000
})

// Stop loading
stopLoading()

// Show success
setSuccess('Operation completed!')

// Show error
setError('Something went wrong')
```

### useLoader
A simplified hook with better defaults and error handling.

```tsx
import { useLoader } from '@/hooks/useLoader'

const loader = useLoader({
  defaultMessage: 'Processing...',
  defaultMinVisibleMs: 1000
})

// Simple loading
loader.show('Starting operation...')
await someAsyncOperation()
loader.success('Operation completed!')

// With progress
loader.show('Processing...', true)
for (let i = 0; i <= 100; i += 10) {
  loader.progress(i)
  await processStep(i)
}
loader.success('Processing completed!')

// Execute with automatic loading
const result = await loader.execute(
  fetchData(),
  {
    message: 'Fetching data...',
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error)
  }
)
```

## API Reference

### LoaderOptions

```tsx
interface LoaderOptions {
  message?: string              // Loading message
  subMessage?: string           // Secondary message
  progress?: number             // Progress percentage (0-100)
  isBlocking?: boolean          // Whether to show fullscreen loader
  minVisibleMs?: number         // Minimum time to show loader
  autoDismissMs?: number        // Auto-dismiss timeout
  type?: LoaderType            // Loader type (default, card, etc.)
}
```

### LoaderState

```tsx
type LoaderState = "idle" | "loading" | "success" | "error"
```

## Best Practices

### 1. Use Deterministic Progress
```tsx
// ✅ Good - Deterministic progress
for (let i = 0; i <= 100; i += 10) {
  loader.progress(i)
  await processStep(i)
}

// ❌ Bad - Random progress
loader.progress(Math.random() * 100)
```

### 2. Always Clean Up
```tsx
// ✅ Good - Proper cleanup
useEffect(() => {
  loader.show('Loading...')
  return () => loader.hide()
}, [])

// ❌ Bad - No cleanup
useEffect(() => {
  loader.show('Loading...')
}, [])
```

### 3. Use Appropriate Timeouts
```tsx
// ✅ Good - Reasonable timeouts
loader.show('Loading...', false, 500)  // 500ms minimum

// ❌ Bad - Too short or too long
loader.show('Loading...', false, 50)   // Too short
loader.show('Loading...', false, 10000) // Too long
```

### 4. Handle Errors Properly
```tsx
// ✅ Good - Proper error handling
try {
  await loader.execute(
    riskyOperation(),
    {
      onError: (error) => {
        console.error('Operation failed:', error)
        // Handle error appropriately
      }
    }
  )
} catch (error) {
  // Error is already handled by loader
}

// ❌ Bad - No error handling
await riskyOperation()
```

### 5. Use Non-blocking for Quick Operations
```tsx
// ✅ Good - Non-blocking for quick operations
loader.show('Saving...', false)

// ❌ Bad - Blocking for quick operations
loader.show('Saving...', true)
```

## Migration Guide

### From Old Auto-Progress System

**Old:**
```tsx
startLoading({
  message: "Loading...",
  autoProgress: true  // ❌ Removed
})
```

**New:**
```tsx
// For manual progress
loader.show('Loading...')
for (let i = 0; i <= 100; i += 10) {
  loader.progress(i)
  await processStep(i)
}

// For automatic progress (if needed)
loader.show('Loading...')
// Progress will be set by your business logic
```

### From Complex State Management

**Old:**
```tsx
const { autoResetTimeoutId, autoProgressIntervalId } = useGlobalLoader()
// Complex timeout management
```

**New:**
```tsx
const loader = useLoader()
// Simple, clean API
loader.show('Loading...')
loader.success('Done!')
```

## Examples

See `LoaderExample.tsx` for comprehensive usage examples.

## Troubleshooting

### Loader Not Showing
1. Ensure `GlobalLoader` is rendered in your layout
2. Check that `GlobalLoaderProvider` wraps your app
3. Verify the loader state is not 'idle'

### Loader Stuck
1. Check for proper cleanup in useEffect hooks
2. Ensure `stopLoading()` or `reset()` is called
3. Verify no infinite loops in your async operations

### Performance Issues
1. Use non-blocking loaders for quick operations
2. Set appropriate `minVisibleMs` values
3. Avoid frequent progress updates (use reasonable intervals)