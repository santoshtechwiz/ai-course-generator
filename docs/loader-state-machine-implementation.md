# Loader State Machine Implementation

## Overview

We've implemented a centralized global loader using a state machine pattern in the Course AI application. This document outlines the implementation details, architecture decisions, and best practices.

## State Machine

The loader state machine consists of four primary states:

1. **idle**: No active loaders
2. **loading**: One or more loaders are active
3. **success**: The last operation completed successfully
4. **error**: The last operation failed with an error

## Core Components

### 1. Global Loading Store (Zustand)

The state machine is implemented in `store/slices/global-loading-slice.ts` using Zustand. Key features:

- State machine with four states (idle, loading, success, error)
- Priority queue for multiple concurrent loaders
- State transitions with validation
- Automatic timeout for success/error states
- Detailed loader configuration options
- Async operation helper (`withLoading`)

### 2. Global Loader Component

The UI component in `components/ui/loader/global-loader.tsx` renders different UI based on the current state:

- Loading state: Shows spinner, dots, pulse, or skeleton
- Success state: Shows a success icon with animation
- Error state: Shows an error icon with message
- Support for progress indicators
- Blocking and non-blocking variants
- Theme support (primary, secondary, accent, neutral)

### 3. Global Loader Provider

The provider component in `components/ui/loader/global-loader-provider.tsx` initializes the state machine and manages cleanup:

- Initializes the state machine to idle
- Cleans up stray loaders on mount/unmount
- Includes navigation loader integration

### 4. Navigation Loader

The navigation loader in `components/ui/loader/use-navigation-loader.tsx` automatically shows loaders during page transitions:

- Detects route changes
- Shows loader with delay to prevent flicker
- Automatically cleans up on route change completion
- Shows success state on navigation completion

## Key Implementation Details

### State Transitions

State transitions follow these rules:
- From idle → any state: Allowed
- From loading → any state: Allowed
- From success/error → idle/loading: Allowed
- From success → error or error → success: Not allowed (must go through idle or loading first)

### Auto-Reset Behavior

- Success state automatically resets to idle after 1.5 seconds
- Error state automatically resets to idle after 3 seconds

### Priority System

Loaders are sorted by:
1. Priority (highest first)
2. Creation timestamp (most recent first)

### Testing

The loader system can be tested using the test page at `/test-loader`:
- Test different loader variants
- Test success and error states
- Test concurrent loaders
- Test async operations

## Migration Notes

1. **Replaced Components**:
   - Individual loading components have been replaced with the global loader
   - Legacy `isLoading` flags have been removed in favor of the state machine

2. **Updated APIs**:
   - `showLoading` / `hideLoading` for basic loading
   - `setSuccess` / `setError` for state transitions
   - `withLoading` for automatic async handling

## Best Practices

1. **Always clean up loaders**:
   ```typescript
   const loaderId = showLoading({...})
   try {
     // operations
   } finally {
     hideLoading(loaderId)
   }
   ```

2. **Use appropriate priority levels**:
   - Navigation: 10 (highest)
   - Critical operations: 8-9
   - Form submissions: 5-7
   - Background tasks: 1-3

3. **Handle errors properly**:
   ```typescript
   try {
     await operation()
     setSuccess(loaderId)
   } catch (error) {
     setError(loaderId, error.message)
   }
   ```

4. **Use the `withLoading` helper for async operations**:
   ```typescript
   await withLoading(
     api.getData(),
     {
       loadingOptions: { message: "Loading data..." },
       onSuccess: (result) => { ... },
       onError: (error) => { ... }
     }
   )
   ```

## Future Extensions

The state machine design allows for easy extensions:
- Additional states (e.g., "warning", "partial")
- More UI variants (e.g., "progress bar", "bouncing")
- Enhanced debugging with state transition tracking
- Analytics integration for loading performance metrics
