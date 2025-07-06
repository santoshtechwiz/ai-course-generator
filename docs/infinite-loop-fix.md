# Maximum Update Depth Fix - useSessionSubscriptionSync

## Problem
The `useSessionSubscriptionSync` hook was causing a "Maximum update depth exceeded" error due to a circular dependency in React's `useEffect`.

## Root Cause
The main `useEffect` that handles session changes had `subscription.data` in its dependency array:

```typescript
useEffect(() => {
  // ... sync logic that updates subscription.data
}, [session, status, dispatch, syncSubscription, subscription.data, config.enableAutoSync])
```

This created an infinite loop:
1. Effect runs when `subscription.data` changes
2. Effect calls `syncSubscription()`
3. `syncSubscription()` dispatches Redux actions that update `subscription.data`
4. This triggers the effect again → infinite loop

## Solution
**1. Removed circular dependency**: Removed `subscription.data` from the main effect's dependency array.

**2. Added separate tracking**: Used a ref (`hasSubscriptionDataRef`) to track subscription state without triggering re-renders:

```typescript
const hasSubscriptionDataRef = useRef(false)

// Main effect - no subscription.data dependency
useEffect(() => {
  // ... session change logic uses hasSubscriptionDataRef.current
}, [session, status, dispatch, syncSubscription, config.enableAutoSync])

// Separate effect to track subscription data
useEffect(() => {
  if (subscription.data && subscription.data.subscriptionPlan !== 'FREE') {
    hasSubscriptionDataRef.current = true
  } else {
    hasSubscriptionDataRef.current = false
  }
}, [subscription.data])
```

**3. Optimized useCallback**: Made `syncSubscription` dependencies more specific to prevent unnecessary re-creations:

```typescript
const syncSubscription = useCallback(async (force, reason) => {
  // ... sync logic
}, [dispatch, session?.user?.id, status, config.minSyncInterval])
```

## Benefits
- ✅ Eliminates infinite update loops
- ✅ Maintains all existing functionality
- ✅ Proper session-driven sync behavior
- ✅ Efficient performance with minimal re-renders
- ✅ Better error handling and debugging

## Files Changed
- `hooks/useSessionSubscriptionSync.ts` - Main fix
- Added documentation comments explaining the fix

## Testing
- No TypeScript errors
- Development server starts without infinite loops
- Session sync functionality preserved
- All subscription state management works as expected
