# Quiz Loader System

This directory contains the unified quiz loader system that provides consistent loading states across all quiz-related components.

## Components

### QuizLoader
The main loader component with Neobrutalism styling that supports different contexts, variants, and states.

**Props:**
- `state`: "loading" | "success" | "error" | "idle"
- `variant`: "spinner" | "dots" | "progress" | "skeleton" | "pulse"
- `size`: "xs" | "sm" | "md" | "lg" | "xl"
- `context`: "initial" | "submission" | "navigation" | "calculation" | "page"
- `message`: Custom loading message
- `progress`: Progress percentage (0-100)
- `overlay`: Show as overlay
- `fullPage`: Show as full-page loader
- `inline`: Show as inline loader

### Context-Specific Loaders

#### QuizPageLoader
Full-page loader for initial page loads.
```tsx
<QuizPageLoader message="Loading quiz..." />
```

#### QuizSubmissionLoader
Overlay loader for quiz submissions.
```tsx
<QuizSubmissionLoader message="Submitting quiz..." />
```

#### QuizCalculationLoader
Loader for result calculations.
```tsx
<QuizCalculationLoader message="Calculating results..." />
```

#### QuizNavigationLoader
Inline loader for navigation states.
```tsx
<QuizNavigationLoader message="Loading next question..." />
```

#### QuizInlineLoader
General inline loader.
```tsx
<QuizInlineLoader message="Loading..." size="sm" />
```

### QuizLoaderContext
Context provider for managing loader states globally and preventing multiple loaders from appearing simultaneously.

**Usage:**
```tsx
import { QuizLoaderProvider, useQuizLoader } from '@/components/quiz'

// Wrap your app/component
<QuizLoaderProvider>
  <YourComponent />
</QuizLoaderProvider>

// In your component
const { showPageLoader, hideLoader, isLoading } = useQuizLoader()

// Show loader
const loaderId = showPageLoader("Loading quiz...")

// Hide loader
hideLoader(loaderId)
```

## Styling

The loader uses Neobrutalism design principles:
- **Bold borders**: 4px solid borders
- **Flat colors**: High contrast colors without gradients
- **Sharp shadows**: 4px offset shadows
- **Playful animations**: Subtle, accessible animations
- **Dark mode support**: Automatic theme adaptation

## Context Colors

Each context has its own color scheme:
- **Initial**: Yellow (default loading)
- **Submission**: Green (success-oriented)
- **Calculation**: Purple (processing)
- **Navigation**: Blue (movement)
- **Page**: Orange (page-level)

## Migration from Old Loaders

Replace old loader imports:
```tsx
// Old
import { UnifiedLoader } from "@/components/loaders"
import { Loader } from "@/components/loader"

// New
import { QuizLoader, QuizPageLoader } from "@/components/quiz/QuizLoader"
```

Update usage:
```tsx
// Old
<UnifiedLoader state="loading" variant="spinner" size="lg" />

// New
<QuizLoader state="loading" context="initial" variant="spinner" size="lg" />

// Or use context-specific loaders
<QuizPageLoader message="Loading..." />
```

## Benefits

1. **Unified UX**: Consistent loading experience across all quiz components
2. **No Duplicates**: Context system prevents multiple loaders from appearing
3. **Accessible**: Proper ARIA attributes and reduced motion support
4. **Themeable**: Automatic dark/light mode support
5. **Performant**: Optimized animations and minimal re-renders
6. **Type Safe**: Full TypeScript support with proper prop validation