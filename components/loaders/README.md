# Modern Loader System

A deterministic, accessible, and modern loading system for CourseAI built with React, Framer Motion, and Zustand.

## Features

### 🎯 Deterministic Progress
- Smooth, predictable progress animations instead of random jumps
- Configurable auto-progress with easing functions
- Manual progress control for precise feedback

### ♿ Accessibility
- Proper ARIA labels and roles
- Screen reader support with `aria-live` regions
- Keyboard navigation support
- Focus management for modal loaders

### 🎨 Modern Design
- Clean SVG-based icons (no external dependencies)
- Smooth Framer Motion animations
- Consistent theming with CSS variables
- Responsive design across all devices

### ⚡ Performance
- Optimized animations with proper cleanup
- Minimal re-renders with Zustand state management
- Efficient timeout and interval handling
- Reduced bundle size by removing react-spinners dependency

## Components

### GlobalLoader
The main full-screen loader component with blocking and non-blocking modes.

```tsx
import { GlobalLoader } from "@/components/loaders/GlobalLoader"

// Automatically rendered by GlobalLoaderProvider
<GlobalLoader />
```

### LoadingSpinner
A standalone spinner component for larger contexts.

```tsx
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"

<LoadingSpinner size={48} />
```

### InlineSpinner
A small spinner for inline use cases like buttons and forms.

```tsx
import { InlineSpinner } from "@/components/loaders/GlobalLoader"

<InlineSpinner size={16} />
```

## Usage

### Basic Usage

```tsx
import { useGlobalLoader } from "@/store/loaders/global-loader"

function MyComponent() {
  const { startLoading, stopLoading, setSuccess, setError } = useGlobalLoader()

  const handleAsyncOperation = async () => {
    startLoading({
      message: "Processing...",
      subMessage: "This will take a moment",
      isBlocking: true,
      autoProgress: true,
      deterministic: true,
    })

    try {
      await someAsyncOperation()
      setSuccess("Operation completed!")
    } catch (error) {
      setError("Something went wrong")
    }
  }

  return <button onClick={handleAsyncOperation}>Start Operation</button>
}
```

### Advanced Usage with Progress

```tsx
import { useGlobalLoader } from "@/store/loaders/global-loader"

function MyComponent() {
  const { startLoading, setProgress, setSuccess } = useGlobalLoader()

  const handleProgressOperation = async () => {
    startLoading({
      message: "Uploading files...",
      isBlocking: true,
      progress: 0,
    })

    // Simulate progress updates
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setProgress(i)
    }

    setSuccess("Upload completed!")
  }

  return <button onClick={handleProgressOperation}>Upload Files</button>
}
```

### Using the withLoading Helper

```tsx
import { useGlobalLoader } from "@/store/loaders/global-loader"

function MyComponent() {
  const { withLoading } = useGlobalLoader()

  const handleAsyncOperation = async () => {
    const result = await withLoading(
      fetchData(),
      {
        message: "Fetching data...",
        isBlocking: true,
        autoProgress: true,
        deterministic: true,
        onSuccess: (data) => console.log("Success:", data),
        onError: (error) => console.error("Error:", error),
      }
    )
  }

  return <button onClick={handleAsyncOperation}>Fetch Data</button>
}
```

## Configuration Options

### LoaderOptions

```tsx
interface LoaderOptions {
  message?: string              // Main message to display
  subMessage?: string           // Secondary message
  progress?: number            // Initial progress (0-100)
  isBlocking?: boolean         // Whether to block user interaction
  minVisibleMs?: number        // Minimum time to show loader
  autoProgress?: boolean       // Enable automatic progress animation
  deterministic?: boolean      // Use deterministic progress (default: true)
}
```

### State Management

The loader uses Zustand for state management with the following state:

```tsx
interface GlobalLoaderStore {
  state: "idle" | "loading" | "success" | "error"
  isLoading: boolean
  message?: string
  subMessage?: string
  progress?: number
  isBlocking: boolean
  error?: string
  deterministic: boolean
}
```

## Integration

### App-Level Setup

The loader is automatically integrated at the app level through `GlobalLoaderProvider`:

```tsx
// app/layout.tsx
import { GlobalLoaderProvider } from "@/components/GlobalLoaderProvider"

export default function RootLayout({ children }) {
  return (
    <GlobalLoaderProvider>
      <html>
        <body>
          {children}
        </body>
      </html>
    </GlobalLoaderProvider>
  )
}
```

### Route Changes

Route changes automatically trigger the loader through `useRouteLoaderBridge`:

```tsx
// Automatically handled by GlobalLoaderProvider
export function useRouteLoaderBridge() {
  const pathname = usePathname()
  const { startLoading, stopLoading } = useGlobalLoader()
  
  useEffect(() => {
    if (pathname) {
      startLoading({ 
        message: "Loading...", 
        isBlocking: true, 
        minVisibleMs: 300,
        autoProgress: true,
        deterministic: true,
      })
      
      const id = setTimeout(() => stopLoading(), 800)
      return () => clearTimeout(id)
    }
  }, [pathname, startLoading, stopLoading])
}
```

## Migration from Old System

### Before (Old System)
```tsx
import { HashLoader } from "react-spinners"

// Random progress with react-spinners
<HashLoader color="#3B82F6" size={40} />
```

### After (New System)
```tsx
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"

// Deterministic progress with modern design
<LoadingSpinner size={40} />
```

### Key Changes

1. **Removed react-spinners dependency** - Now uses custom SVG icons
2. **Deterministic progress** - Smooth, predictable animations
3. **Better accessibility** - Proper ARIA labels and screen reader support
4. **Consistent theming** - Uses CSS variables for colors
5. **Improved performance** - Optimized animations and state management

## Best Practices

### 1. Use Appropriate Loader Types
- **GlobalLoader**: For full-screen operations that block user interaction
- **LoadingSpinner**: For large content areas or page-level loading
- **InlineSpinner**: For buttons, forms, or small inline contexts

### 2. Provide Meaningful Messages
```tsx
// Good
startLoading({ message: "Saving your course..." })

// Better
startLoading({ 
  message: "Saving your course...",
  subMessage: "This will only take a moment"
})
```

### 3. Use Deterministic Progress
```tsx
// Good - deterministic progress
startLoading({ 
  autoProgress: true,
  deterministic: true,
  minVisibleMs: 500
})

// Avoid - random progress
startLoading({ 
  autoProgress: true,
  deterministic: false // Random jumps
})
```

### 4. Handle Errors Gracefully
```tsx
try {
  await withLoading(
    riskyOperation(),
    { message: "Processing..." }
  )
} catch (error) {
  // Error is automatically handled by withLoading
  // Additional error handling can be added here
}
```

### 5. Clean Up Properly
```tsx
useEffect(() => {
  const { startLoading, stopLoading } = useGlobalLoader()
  
  startLoading({ message: "Loading..." })
  
  return () => {
    stopLoading() // Clean up on unmount
  }
}, [])
```

## Troubleshooting

### Loader Not Showing
1. Ensure `GlobalLoaderProvider` is wrapping your app
2. Check that the loader state is not "idle"
3. Verify that `isBlocking` is set correctly for your use case

### Progress Not Updating
1. Make sure `autoProgress` is enabled or manually call `setProgress`
2. Check that the progress value is between 0 and 100
3. Verify that the loader is in "loading" state

### Performance Issues
1. Avoid frequent progress updates (use debouncing if needed)
2. Ensure proper cleanup of timeouts and intervals
3. Use `minVisibleMs` to prevent flickering for quick operations

## Contributing

When adding new loader features:

1. Follow the existing component patterns
2. Add proper TypeScript types
3. Include accessibility attributes
4. Test with screen readers
5. Update this documentation

## License

This loader system is part of the CourseAI project and follows the same licensing terms.