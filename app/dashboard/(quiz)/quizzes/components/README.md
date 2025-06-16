# Quiz Components

This directory contains components used for the quiz-related functionality in CourseAI.

## Loading Strategy

We've migrated from component-specific loaders to using the global EnhancedLoader system. Here's how to use it:

### For Navigation

Use the `AsyncNavLink` component instead of regular `Link` or `useRouter().push()`:

```tsx
import { AsyncNavLink } from "@/components/ui/enhanced-loader"

// Inside your component
<AsyncNavLink 
  href="/your-path" 
  loaderOptions={{
    variant: "shimmer", // or "pulse", "progress", "dots", "glow"
    message: "Loading content...",
    fullscreen: true // Use false for inline loaders
  }}
>
  Your content here
</AsyncNavLink>
```

### For Async Operations

Use the `useAsyncWithLoader` hook for async operations:

```tsx
import { useAsyncWithLoader } from "@/components/ui/enhanced-loader"

// Inside your component
const { withLoader } = useAsyncWithLoader()

const handleSomeAsyncAction = withLoader(
  async () => {
    // Your async code here
    await fetchSomeData()
  }, 
  { 
    message: "Loading data...",
    variant: "shimmer"
  }
)
```

### Direct Control

For more manual control, use the `useEnhancedLoader` hook:

```tsx
import { useEnhancedLoader } from "@/components/ui/enhanced-loader"

// Inside your component
const { showLoader, hideLoader, updateLoader } = useEnhancedLoader()

const handleAction = async () => {
  showLoader({ message: "Processing..." })
  try {
    await someAsyncOperation()
  } finally {
    hideLoader()
  }
}
```

## Removed Components

The following components have been deprecated and should not be used:
- `LoadingCard` (replaced by `EnhancedLoader`)
- `NavigationEvents` (replaced by `GlobalLoadingHandler`)
- `LoadingProvider` (replaced by `EnhancedLoaderProvider`)
- `SectionLoader` (replaced by `EnhancedLoader` with `fullscreen: false`)
