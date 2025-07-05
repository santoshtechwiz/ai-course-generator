# Global Loader System

This document explains the unified global loader system implemented in the CourseAI platform.

## Overview

The global loader system provides a single, centralized way to manage loading states across the entire application. It eliminates loader duplication, prevents multiple loaders from appearing simultaneously, and ensures consistent UI/UX.

## Key Components

### 1. Global Loading Store (`store/slices/global-loading-slice.ts`)

Zustand-based store that manages all loading states:

```typescript
import { useGlobalLoading } from '@/store/slices/global-loading-slice'

const { showLoading, hideLoading, hideAllLoading } = useGlobalLoading()
```

**Features:**
- Multiple concurrent loaders with priority system
- Blocking vs non-blocking states
- Progress tracking
- Automatic cleanup

### 2. GlobalLoader Component (`components/ui/loader/global-loader.tsx`)

The single UI component that renders all loading states:

- **Variants**: spinner, dots, pulse, skeleton
- **Themes**: primary, secondary, accent, neutral  
- **Sizes**: xs, sm, md, lg, xl
- **Modes**: inline (non-blocking) vs fullscreen (blocking)

### 3. GlobalLoaderProvider (`components/ui/loader/global-loader-provider.tsx`)

Provides the GlobalLoader component globally and enables automatic navigation loading.

### 4. Navigation Loader (`components/ui/loader/use-navigation-loader.tsx`)

Automatically shows loading during route transitions.

## Usage Examples

### Basic Loading

```typescript
import { useGlobalLoading } from '@/store/slices/global-loading-slice'

function MyComponent() {
  const { showLoading, hideLoading } = useGlobalLoading()
  
  const handleAsyncAction = async () => {
    const loaderId = showLoading({
      message: "Processing...",
      variant: 'spinner',
      theme: 'primary',
      isBlocking: true,
      priority: 5
    })
    
    try {
      await someAsyncOperation()
    } finally {
      hideLoading(loaderId)
    }
  }
}
```

### Loading with Progress

```typescript
const loaderId = showLoading({
  message: "Uploading file...",
  subMessage: "Please wait while we process your upload",
  progress: 0,
  variant: 'spinner',
  isBlocking: true
})

// Update progress
updateLoading(loaderId, { progress: 50 })
updateLoading(loaderId, { progress: 100 })

hideLoading(loaderId)
```

### Async Thunk Integration (Redux)

```typescript
export const fetchData = createAsyncThunk(
  'data/fetch',
  async (payload, { rejectWithValue }) => {
    const globalLoading = useGlobalLoadingStore.getState()
    
    const loaderId = globalLoading.showLoading({
      message: "Loading data...",
      variant: 'spinner',
      theme: 'primary',
      isBlocking: true,
      priority: 5
    })

    try {
      const response = await api.getData(payload)
      globalLoading.hideLoading(loaderId)
      return response
    } catch (error) {
      globalLoading.hideLoading(loaderId)
      return rejectWithValue({ error: error.message })
    }
  }
)
```

## Migration Guide

### Before (Multiple Loaders)
```typescript
// ❌ Old way - local loaders everywhere
<LoadingCard message="Loading quiz..." />
<QuizLoader />
<VideoLoadingOverlay isVisible={loading} />
<div>{loading && <Spinner />}</div>
```

### After (Global Loader)
```typescript
// ✅ New way - single global system
const { showLoading, hideLoading } = useGlobalLoading()

useEffect(() => {
  const loaderId = showLoading({
    message: "Loading quiz...",
    variant: 'spinner',
    theme: 'primary'
  })
  
  return () => hideLoading(loaderId)
}, [])
```

## Best Practices

### 1. Use Appropriate Priority Levels
- **Navigation**: 10 (highest priority)
- **Critical operations**: 8-9  
- **Form submissions**: 5-7
- **Background tasks**: 1-3

### 2. Use Blocking Wisely
- **Blocking**: Use for critical operations that require user attention
- **Non-blocking**: Use for background tasks or optional loading

### 3. Provide Meaningful Messages
```typescript
// ✅ Good
showLoading({
  message: "Submitting quiz answers...",
  subMessage: "Calculating your score and feedback"
})

// ❌ Bad  
showLoading({ message: "Loading..." })
```

### 4. Always Clean Up
```typescript
// ✅ Always hide loaders
useEffect(() => {
  const loaderId = showLoading(config)
  return () => hideLoading(loaderId)
}, [])

// ✅ Or use try/finally
const loaderId = showLoading(config)
try {
  await operation()
} finally {
  hideLoading(loaderId)
}
```

## Architecture Benefits

1. **Single Source of Truth**: All loading states managed centrally
2. **No Conflicts**: Priority system prevents multiple loaders  
3. **Automatic Navigation**: Route changes trigger loading automatically
4. **Performance**: Optimized rendering and state updates
5. **Consistency**: Unified UI/UX across the entire app
6. **Developer Experience**: Simple, predictable API

## Removed Components

The following components have been deprecated/removed:
- `LoadingCard` → Use global loader
- `QuizLoader` → Use global loader  
- `VideoLoadingOverlay` → Use global loader
- `SkeletonLoader` (individual) → Use global loader with skeleton variant
- Legacy `CourseAILoader` → Use `GlobalLoader`
- Context-based loaders → Use Zustand store

## Configuration

The GlobalLoaderProvider is automatically included in the app through `providers/AppProviders.tsx`. No additional setup required.

```typescript
// Automatically included
<GlobalLoaderProvider>
  <YourApp />
</GlobalLoaderProvider>
```

## Debugging

Enable Redux DevTools to inspect loading states:

```typescript
// Check current loading states
const { loadingStates, currentLoader } = useGlobalLoading()
console.log('Active loaders:', loadingStates)
console.log('Current loader:', currentLoader)
```

## Performance Notes

- Zustand provides excellent performance with minimal re-renders
- Priority system ensures only the most important loader is shown
- Automatic cleanup prevents memory leaks
- Navigation loader is optimized to prevent flicker on fast transitions
