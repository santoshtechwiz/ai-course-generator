# Enhanced Loader Component

The Enhanced Loader is the unified loading solution for CourseAI that works globally during navigation changes and can be used conditionally for async operations. This is the only loading component that should be used throughout the application.

## Features

- **Global loading** during navigation transitions
- **Async operation support** with simple hooks and wrappers
- **Multiple animation variants**: shimmer, pulse, progress, dots, and glow
- **Progress tracking** for long-running operations
- **Dark/Light mode** support
- **Fully responsive** and customizable
- **Non-intrusive** design

## Important Guidelines

1. This is the **ONLY** loader that should be used in CourseAI
2. Do not use the deprecated `LoadingProvider` or `SectionLoader` components
3. Do not add multiple instances of `EnhancedLoaderProvider` in the component tree
4. The `GlobalLoadingHandler` component is already included in the client layout wrapper
5. All navigation should use `AsyncNavLink` instead of plain `Link` when loading feedback is desired

## Usage

### Basic Usage in Components

```tsx
import { useEnhancedLoader } from "@/components/ui/enhanced-loader";

export function MyComponent() {
  const { showLoader, hideLoader, updateLoader } = useEnhancedLoader();
  
  const handleAction = async () => {
    showLoader({ message: "Loading data..." });
    
    try {
      // Your async operation here
      await someAsyncOperation();
      
      // Optional: update loader with a different message
      updateLoader({ message: "Processing data..." });
      
      // More async operations...
      await moreProcessing();
      
    } catch (error) {
      console.error(error);
    } finally {
      hideLoader();
    }
  };
  
  return (
    <button onClick={handleAction}>Load Data</button>
  );
}
```

### With Async Operations Helper

```tsx
import { useAsyncWithLoader } from "@/components/ui/enhanced-loader";

export function MyComponent() {
  const { withLoader } = useAsyncWithLoader();
  
  const handleAction = withLoader(
    async () => {
      // Your async operation here
      const data = await fetchData();
      return data;
    },
    { 
      message: "Loading data...",
      variant: "progress",
      showProgress: true
    }
  );
  
  return (
    <button onClick={handleAction}>Load Data</button>
  );
}
```

### For Navigation Links

```tsx
import { AsyncNavLink } from "@/components/ui/enhanced-loader";

export function Navigation() {
  return (
    <nav>
      <AsyncNavLink 
        href="/dashboard" 
        loaderOptions={{
          variant: "shimmer",
          message: "Loading Dashboard..."
        }}
        className="text-blue-500 hover:underline"
      >
        Dashboard
      </AsyncNavLink>
    </nav>
  );
}
```

### Component-Level Loader

```tsx
import { EnhancedLoader } from "@/components/ui/enhanced-loader";
import { useState } from "react";

export function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  const handleAction = async () => {
    setLoading(true);
    // Some async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };
  
  return (
    <div className="relative min-h-[300px]">
      <EnhancedLoader 
        isLoading={loading}
        variant="dots"
        fullscreen={false}
        message="Loading content..."
      />
      
      {!loading && (
        <div>
          <h2>Your Content</h2>
          <p>Content only shown when not loading</p>
          <button onClick={handleAction}>Load</button>
        </div>
      )}
    </div>
  );
}
```

## Configuration Options

The Enhanced Loader supports these configuration options:

- `isLoading`: Boolean to control visibility
- `message`: Main message to display
- `subMessage`: Secondary message below the main message
- `fullscreen`: Whether to cover the entire screen with backdrop
- `variant`: Animation style ("shimmer", "pulse", "progress", "dots", "glow")
- `showProgress`: Show percentage progress (0-100)
- `progress`: Custom progress value (0-100)
- `speed`: Animation speed ("slow", "normal", "fast")
- `className`: Additional CSS classes
- `showLogo`: Show CourseAI logo at the top
- `children`: Custom content to render inside the loader

## Implementation Notes

- The loader is globally available through the `useEnhancedLoader` hook
- Global navigation loading is automatically handled
- Avoid using the fullscreen loader for small components - set `fullscreen: false`
- For longer operations, use the progress variant to provide feedback
