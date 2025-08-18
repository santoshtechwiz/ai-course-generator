# Subscription Management System

## Overview

The new subscription management system provides a robust, performant, and user-friendly way to handle user subscriptions, credits, and feature access. It prevents duplicate subscriptions, enforces business rules, and optimizes API calls.

## Key Features

### 🚫 Duplicate Subscription Prevention
- Users cannot subscribe to the same plan twice
- Automatic detection of existing subscriptions
- Clear messaging when duplicate attempts are detected

### 📋 Plan & Credit Awareness
- **Active Subscription Required**: Users must have an active (non-expired) subscription
- **Credits Required**: Users must have available credits
- **Combined Rules**: Both conditions must be met for content creation
- **Expired Subscriptions**: Cannot create content even with credits

### 🚀 Performance Optimization
- Smart caching based on subscription status
- Only fetches data when necessary
- Prevents unnecessary API calls
- Optimized selectors with memoization

### 🎯 Redux State Improvements
- Normalized, lightweight state structure
- Clear selectors for business logic
- Performance tracking and cache management
- Backward-compatible with existing code

## Architecture

### State Structure

```typescript
interface NormalizedSubscriptionState {
  // Core subscription data
  currentSubscription: SubscriptionData | null
  
  // Loading states
  isLoading: boolean
  isFetching: boolean
  
  // Error handling
  error: string | null
  
  // Cache management
  lastFetched: number | null
  lastRefreshed: number | null
  
  // Performance tracking
  fetchCount: number
  lastSuccessfulFetch: number | null
}
```

### Smart Caching

The system implements intelligent caching based on subscription status:

- **Free Users**: 5 minutes cache
- **Active Subscribers**: 10 minutes cache
- **Expired/Canceled**: 30 minutes cache
- **Default**: 15 minutes cache

## Core Selectors

### Business Logic Selectors

```typescript
// Check if user has an active subscription
const hasActiveSubscription = useAppSelector(selectHasActiveSubscription)

// Check if user has available credits
const hasCredits = useAppSelector(selectHasCredits)

// Check if user can create quiz or course (BOTH conditions must be met)
const canCreateQuizOrCourse = useAppSelector(selectCanCreateQuizOrCourse)
```

### Performance Selectors

```typescript
// Check if subscription should be refreshed
const shouldRefresh = useAppSelector(selectShouldRefreshSubscription)

// Get cache status
const cacheStatus = useAppSelector(selectSubscriptionCacheStatus)
```

## Usage Examples

### 1. Basic Subscription Check

```tsx
import { useSubscription } from '@/modules/auth'

function MyComponent() {
  const { hasActiveSubscription, hasCredits, canCreateQuizOrCourse } = useSubscription()
  
  if (!canCreateQuizOrCourse) {
    return <div>You need an active subscription and credits to use this feature.</div>
  }
  
  return <div>Feature content here</div>
}
```

### 2. PlanAwareButton with Enhanced Logic

```tsx
import PlanAwareButton from '@/components/PlanAwareButton'

function CreateQuizButton() {
  return (
    <PlanAwareButton
      label="Create Quiz"
      requiredPlan="PREMIUM"
      creditsRequired={2}
      onClick={handleCreateQuiz}
      customStates={{
        expiredSubscription: {
          label: "Reactivate Subscription",
          tooltip: "Your subscription has expired. Please reactivate to continue."
        }
      }}
    />
  )
}
```

### 3. Subscription Wrapper

```tsx
import SubscriptionWrapper from '@/components/subscription/SubscriptionWrapper'

function PremiumFeature() {
  return (
    <SubscriptionWrapper
      requiredPlan="PREMIUM"
      requireActiveSubscription={true}
      requireCredits={true}
      fallback={<UpgradePrompt />}
    >
      <div>Premium feature content here</div>
    </SubscriptionWrapper>
  )
}
```

### 4. Subscription Provider

```tsx
import { SubscriptionProvider } from '@/components/subscription/SubscriptionProvider'

function App() {
  return (
    <SubscriptionProvider
      autoRefresh={true}
      refreshOnMount={true}
      refreshOnFocus={true}
    >
      <YourAppContent />
    </SubscriptionProvider>
  )
}
```

## Business Rules

### Content Creation Rules

1. **User must be authenticated**
2. **User must have active subscription** (not expired)
3. **User must have sufficient credits**
4. **All conditions must be met simultaneously**

### Subscription Status Hierarchy

```
ACTIVE > TRIALING > INACTIVE > EXPIRED > CANCELED
```

- Only `ACTIVE` and `TRIALING` statuses allow content creation
- `EXPIRED` subscriptions block access even with credits
- `INACTIVE` means no subscription (free user)

### Plan Hierarchy

```
ULTIMATE > PREMIUM > BASIC > FREE
```

- Higher plans include all features of lower plans
- Plan requirements are enforced at the component level

## Performance Features

### Smart Fetching

- **Initial Load**: Only fetches when user is authenticated
- **Auto-refresh**: Refreshes stale data automatically
- **Focus Refresh**: Refreshes when window regains focus
- **Manual Refresh**: Allows force refresh when needed

### Cache Management

- **Stale Data**: Automatically marks data as stale
- **Smart Intervals**: Different cache times for different user types
- **Error Handling**: Preserves existing data on API failures
- **Performance Tracking**: Monitors fetch frequency and success rates

## Migration Guide

### From Old System

1. **Update imports**:
   ```tsx
   // Old
   import { selectSubscription } from '@/store/slices/subscription-slice'
   
   // New
   import { useSubscription } from '@/modules/auth'
   ```

2. **Replace selectors**:
   ```tsx
   // Old
   const subscription = useAppSelector(selectSubscription)
   
   // New
   const { subscription, hasActiveSubscription, hasCredits } = useSubscription()
   ```

3. **Update PlanAwareButton**:
   ```tsx
   // Add expired subscription handling
   <PlanAwareButton
     onExpiredSubscription={handleExpiredSubscription}
     // ... other props
   />
   ```

### Backward Compatibility

- All existing selectors still work
- Old component APIs are preserved
- Gradual migration is supported

## Error Handling

### API Failures

- **Network Errors**: Falls back to cached data
- **Authentication Errors**: Returns to free user state
- **Server Errors**: Preserves existing subscription data
- **Timeout Errors**: Uses cached data with retry logic

### User Experience

- **Clear Error Messages**: Specific feedback for different issues
- **Graceful Degradation**: App continues working with cached data
- **Retry Mechanisms**: Automatic retry on recoverable errors
- **User Guidance**: Clear instructions for resolving issues

## Testing

### Unit Tests

```typescript
import { renderHook } from '@testing-library/react'
import { useSubscription } from '@/modules/auth'

test('should return correct subscription state', () => {
  const { result } = renderHook(() => useSubscription())
  
  expect(result.current.hasActiveSubscription).toBeDefined()
  expect(result.current.hasCredits).toBeDefined()
  expect(result.current.canCreateQuizOrCourse).toBeDefined()
})
```

### Integration Tests

```typescript
test('should prevent duplicate subscriptions', () => {
  // Test that users cannot subscribe to the same plan twice
})

test('should enforce expired subscription rules', () => {
  // Test that expired subscriptions block content creation
})
```

## Troubleshooting

### Common Issues

1. **Subscription not updating**: Check cache status and force refresh
2. **Permissions not working**: Verify both subscription and credits
3. **API calls too frequent**: Check smart caching configuration
4. **State inconsistencies**: Use `markStale()` to force refresh

### Debug Tools

```typescript
// Check cache status
const { cacheStatus, shouldRefresh } = useSubscription()

// Force refresh
const { refreshSubscription } = useSubscriptionActions()

// Mark as stale
const { markStale } = useSubscriptionActions()
```

## Future Enhancements

### Planned Features

- **Real-time Updates**: WebSocket integration for live subscription changes
- **Advanced Caching**: Redis-based caching for better performance
- **Analytics Integration**: Track subscription usage patterns
- **A/B Testing**: Test different subscription flows

### Performance Improvements

- **Lazy Loading**: Load subscription data only when needed
- **Background Sync**: Sync data in background without blocking UI
- **Predictive Fetching**: Pre-fetch data based on user behavior
- **Offline Support**: Cache subscription data for offline use

## Support

For questions or issues with the subscription system:

1. Check this documentation
2. Review the component examples
3. Check the Redux DevTools for state inspection
4. Contact the development team

---

*Last updated: [Current Date]*
*Version: 2.0.0*