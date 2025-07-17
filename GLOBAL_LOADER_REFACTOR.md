# GlobalLoader Refactor - State-Based Loading System

## Overview

The GlobalLoader has been completely refactored to be fully state-based using Zustand for centralized state management. This eliminates prop-based usage and ensures consistent loading experiences across the entire application.

## Key Improvements

✅ **Centralized State Management**: All loading controlled by Zustand store  
✅ **Modern AI SaaS Design**: Elegant animations with multiple variants  
✅ **No More Props**: Completely state-driven approach  
✅ **Multiple Loader Variants**: Spinner, shimmer, dots, pulse, progress  
✅ **Theme Support**: Primary, secondary, accent, minimal themes  
✅ **Size Variants**: xs, sm, md, lg, xl  
✅ **Priority System**: Multiple loaders with intelligent priority handling  
✅ **Auto-cleanup**: Success/error states auto-remove  
✅ **TypeScript Ready**: Full type safety  

## Usage Examples

### Basic Loading

```tsx
import { useGlobalLoader } from "@/store/global-loader"

function MyComponent() {
  const { startLoading, stopLoading } = useGlobalLoader()
  
  const handleSubmit = async () => {
    const loaderId = startLoading({
      message: "Saving changes...",
      subMessage: "This may take a moment",
      theme: "primary",
      variant: "spinner",
      isBlocking: true
    })
    
    try {
      await saveData()
      // Auto-success handling
    } catch (error) {
      // Auto-error handling
    }
  }
}
```

### Advanced Loading with Progress

```tsx
const handleUpload = async () => {
  const loaderId = startLoading({
    message: "Uploading file...",
    variant: "progress",
    theme: "primary",
    progress: 0
  })
  
  // Update progress
  setProgress(50, loaderId)
  
  // Complete
  setSuccess(loaderId, "Upload complete!")
}
```

### Using withLoading Helper

```tsx
const { withLoading } = useGlobalLoader()

const fetchData = () => withLoading(
  fetch('/api/data').then(res => res.json()),
  {
    message: "Loading data...",
    theme: "accent",
    variant: "shimmer",
    onSuccess: (data) => console.log('Loaded:', data),
    onError: (error) => console.error('Failed:', error)
  }
)
```

## Loader Variants

### Spinner (Default)
```tsx
startLoading({ variant: "spinner" })
```

### Shimmer (Modern)
```tsx
startLoading({ variant: "shimmer", theme: "primary" })
```

### Dots (Playful)
```tsx
startLoading({ variant: "dots", theme: "accent" })
```

### Pulse (Subtle)
```tsx
startLoading({ variant: "pulse", theme: "minimal" })
```

### Progress (Detailed)
```tsx
startLoading({ variant: "progress", progress: 45 })
```

## Themes

### Primary (Blue)
```tsx
startLoading({ theme: "primary" })
```

### Secondary (Purple)
```tsx
startLoading({ theme: "secondary" })
```

### Accent (Green)
```tsx
startLoading({ theme: "accent" })
```

### Minimal (Gray)
```tsx
startLoading({ theme: "minimal" })
```

## Size Variants

```tsx
// Extra small inline loader
startLoading({ size: "xs", isBlocking: false })

// Large fullscreen loader
startLoading({ size: "lg", isBlocking: true })
```

## Migration Guide

### Before (Props-based)
```tsx
// ❌ OLD: Props-based usage
<GlobalLoader text="Loading..." theme="primary" size="sm" />

// ❌ OLD: Multiple loader instances
{isLoading && <GlobalLoader />}
{isSubmitting && <LoadingSpinner />}
```

### After (State-based)
```tsx
// ✅ NEW: State-based usage
const { startLoading, stopLoading } = useGlobalLoader()

useEffect(() => {
  if (isLoading) {
    startLoading({
      message: "Loading...",
      theme: "primary", 
      size: "sm"
    })
  } else {
    stopLoading()
  }
}, [isLoading])

// ✅ NEW: Single global loader controlled by state
// No JSX needed - loader appears automatically
```

### Replacing Skeleton Loaders
```tsx
// ❌ OLD: Individual loaders
{items.map(i => <GlobalLoader key={i} text={`Loading ${i}`} />)}

// ✅ NEW: Proper skeleton UI
{items.map(i => <QuizCardSkeleton key={i} />)}
```

## Implementation Details

### Store Structure
```tsx
interface GlobalLoaderStore {
  activeLoaders: Map<string, LoaderInstance>
  currentLoader: LoaderInstance | null
  isLoading: boolean
  
  startLoading: (options?: LoaderOptions) => string
  stopLoading: (id?: string) => void
  setProgress: (progress: number, id?: string) => void
  setSuccess: (id?: string, message?: string) => void
  setError: (id?: string, error?: string) => void
}
```

### Priority System
- Higher priority numbers show first
- Blocking loaders take precedence
- Newer loaders of same priority override older ones
- Auto-cleanup prevents loader accumulation

### Performance Features
- Optimized animations with Framer Motion
- Backdrop blur for modern feel
- Minimal re-renders with Zustand
- Smart state updates

## Breaking Changes

1. **No More Props**: All `<GlobalLoader />` props are ignored
2. **Import Changes**: Import hook from `@/store/global-loader`
3. **Skeleton UI**: Use `<Skeleton />` for content placeholders
4. **LoadingSpinner**: Deprecated, use `<Loader2 />` from lucide-react

## Component Locations

- **GlobalLoader**: `components/loaders/GlobalLoader.tsx`
- **Store**: `store/global-loader.ts`
- **Provider**: `components/GlobalLoaderProvider.tsx`
- **Types**: All types in store file

## Provider Setup

The GlobalLoaderProvider is already set up in your app layout:

```tsx
// app/layout.tsx
import GlobalLoaderProvider from "@/components/GlobalLoaderProvider"

export default function Layout({ children }) {
  return (
    <GlobalLoaderProvider>
      {children}
      {/* GlobalLoader appears here automatically */}
    </GlobalLoaderProvider>
  )
}
```

## Best Practices

1. **Use state management**: Never render `<GlobalLoader />` directly
2. **Appropriate variants**: Match loader style to context
3. **Clear messages**: Provide helpful loading messages
4. **Auto-cleanup**: Let success/error states auto-remove
5. **Skeleton for content**: Use skeleton UI for list/card placeholders
6. **Priority awareness**: Use priority for critical operations

## Examples in Codebase

Check these updated files for real examples:
- `app/dashboard/(quiz)/openended/page.tsx`
- `app/dashboard/(quiz)/document/components/QuizPlay.tsx`
- `app/dashboard/(quiz)/flashcard/components/FlashcardQuiz.tsx`
- `components/quiz/QuizFooter.tsx`

The refactored system provides a consistent, elegant, and performant loading experience that matches modern AI SaaS design standards while being fully type-safe and developer-friendly.