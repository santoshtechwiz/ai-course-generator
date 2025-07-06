# State Machine-Based Global Loader System

The Course AI application uses a centralized global loader system based on a state machine pattern. This document provides guidance on how to use the loader throughout the application.

## State Machine States

The loader has four primary states:

1. **idle**: No active loaders
2. **loading**: One or more loaders are active
3. **success**: The last operation completed successfully
4. **error**: The last operation failed with an error

## Basic Usage

### Import the Hook

```typescript
import { useGlobalLoading } from '@/store/slices/global-loading-slice'
```

### Use the Hook in Components

```typescript
function MyComponent() {
  const { 
    showLoading,
    hideLoading, 
    updateLoading, 
    setSuccess, 
    setError, 
    withLoading,
    state,
    isLoading,
    currentLoader,
    error
  } = useGlobalLoading()

  // Start a loader
  const loaderId = showLoading({
    message: "Loading data...",
    variant: 'spinner',
    theme: 'primary',
    isBlocking: true,
    priority: 5
  })

  // Hide a loader
  hideLoading(loaderId)

  // Update a loader (e.g., progress)
  updateLoading(loaderId, { progress: 50 })

  // Mark as success (shows success state briefly)
  setSuccess(loaderId)

  // Mark as error (shows error state)
  setError(loaderId, "An error occurred")
}
```

### Automatic Async Helper

The `withLoading` helper automatically manages loading states for promises:

```typescript
const fetchData = async () => {
  await withLoading(
    api.getData(), // Your promise
    {
      loadingOptions: {
        message: "Loading data...",
        theme: 'primary',
        isBlocking: true
      },
      onSuccess: (result) => {
        console.log("Success:", result)
      },
      onError: (error) => {
        console.error("Error:", error)
      }
    }
  )
}
```

## Loader Options

When calling `showLoading()`, you can provide these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `message` | string | "Loading..." | Primary message to display |
| `subMessage` | string | undefined | Secondary message to display |
| `progress` | number | undefined | Progress percentage (0-100) |
| `variant` | 'spinner' \| 'dots' \| 'pulse' \| 'skeleton' | 'spinner' | Loader style |
| `size` | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Loader size |
| `theme` | 'primary' \| 'secondary' \| 'accent' \| 'neutral' | 'primary' | Color theme |
| `isBlocking` | boolean | false | Whether to show a fullscreen blocking loader |
| `priority` | number | 0 | Priority level (higher numbers take precedence) |

## Best Practices

### Priority Levels

Use appropriate priority levels to ensure the most important loaders are shown:

- **10**: Navigation (highest)
- **8-9**: Critical operations
- **5-7**: Form submissions
- **1-3**: Background tasks

### Use Blocking Wisely

- **Blocking loaders** (`isBlocking: true`): Use for critical operations that require user attention
- **Non-blocking loaders** (`isBlocking: false`): Use for background tasks or optional loading

### Always Clean Up

Always clean up loaders when components unmount or operations complete:

```typescript
// In useEffect
useEffect(() => {
  const loaderId = showLoading(config)
  return () => hideLoading(loaderId)
}, [])

// With try/finally
const loaderId = showLoading(config)
try {
  await operation()
} finally {
  hideLoading(loaderId)
}
```

### Error Handling

Use the `setError` function to display error states:

```typescript
try {
  await operation()
  setSuccess(loaderId) // Shows success state
} catch (error) {
  setError(loaderId, error.message) // Shows error state
}
```

## Migration from Old Patterns

### Replace Local Loading States

Instead of:

```typescript
const [isLoading, setIsLoading] = useState(false)

const fetchData = async () => {
  setIsLoading(true)
  try {
    await api.getData()
  } finally {
    setIsLoading(false)
  }
}

return isLoading ? <LoadingSpinner /> : <Content />
```

Use:

```typescript
const { withLoading } = useGlobalLoading()

const fetchData = async () => {
  await withLoading(
    api.getData(),
    { loadingOptions: { message: "Loading data..." } }
  )
}

return <Content /> // GlobalLoader handles the loading UI
```

### Replace Custom Loading Components

Replace custom loading components with the GlobalLoader:

Instead of:
```typescript
{isLoading && <CustomLoader message="Loading..." />}
```

Use:
```typescript
// GlobalLoader will automatically show based on state
// You don't need to conditionally render anything
```

## Performance Considerations

- The loader system is optimized to prevent unnecessary re-renders
- Priority system ensures only the most important loader is shown
- Automatic cleanup prevents memory leaks and stuck loaders
- Animation transitions are hardware-accelerated for smooth performance
