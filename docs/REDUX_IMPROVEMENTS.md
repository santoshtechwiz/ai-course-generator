# Redux Improvements: Race Condition Prevention & Blank Screen Fixes

## Overview

This document outlines the comprehensive Redux improvements implemented to fix blank pages, race conditions, and inconsistent loading states in the AI Course Generator application.

## Problems Addressed

### 1. Blank Pages Due to Data Clearing
**Issue**: Quiz and flashcard slices unconditionally cleared data on any fetch failure, causing blank screens.

**Fix**: Modified extraReducers to:
- Only clear data if no existing data or initial load failure
- Preserve existing data for subsequent request failures
- Handle cancelled requests gracefully without clearing data

```typescript
// Before: Always cleared data
.addCase(fetchQuiz.rejected, (state, action) => {
  state.questions = [] // ❌ Always cleared
  state.answers = {}
  // ...
})

// After: Conditional data clearing
.addCase(fetchQuiz.rejected, (state, action) => {
  if (payload === 'Request was cancelled') {
    return // ✅ Don't change anything for cancelled requests
  }
  
  // Only clear data if no existing data
  if (!state.questions.length || !state.slug) {
    state.questions = []
    // ...
  }
})
```

### 2. Race Conditions Between Async Thunks
**Issue**: Multiple simultaneous requests could overwrite each other's data.

**Fix**: Implemented RequestManager with abort controllers:
- Each request gets a unique key
- Previous requests are cancelled when new ones start
- Timestamp-based state updates prevent stale data overwrites

```typescript
// New pattern with abort controller support
export const fetchQuiz = createAsyncThunk(
  "quiz/fetch",
  async (payload, { rejectWithValue, signal }) => {
    const requestKey = `quiz-${type}-${slug}`
    
    // Set up abort controller
    const abortController = RequestManager.create(requestKey)
    
    // Combine with thunk signal
    signal?.addEventListener('abort', () => {
      RequestManager.cancel(requestKey)
    })
    
    // Make request with abort signal
    const response = await fetch(url, {
      signal: abortController.signal
    })
    
    // Cleanup on completion
    RequestManager.cancel(requestKey)
  }
)
```

### 3. Inconsistent Loading/Error States
**Issue**: Mixed patterns across slices (`status` vs `isLoading` + `error`).

**Fix**: Standardized on `status` pattern with helper hooks:
- All slices use `status: 'idle' | 'loading' | 'succeeded' | 'failed'`
- Added unified hooks for accessing loading states
- Created component-specific state hooks

### 4. Stale Data Overwrites
**Issue**: Older async responses could overwrite newer data.

**Fix**: Added timestamp validation:
- All successful responses include `__lastUpdated` timestamp
- State only updates if incoming data is newer
- `shouldUpdateState()` utility prevents stale overwrites

## New Utilities

### RequestManager
Centralized abort controller management:
```typescript
// Cancel previous requests automatically
const controller = RequestManager.create('unique-key')

// Cancel all requests (useful for cleanup)
RequestManager.cancelAll()
```

### Async State Utilities
```typescript
// Check if state should update
shouldUpdateState(currentState, incomingTimestamp)

// Create standardized state updates
createPendingUpdate(state, requestId)
createFulfilledUpdate(data, timestamp)
createRejectedUpdate(error, preserveData)
```

### Enhanced Hooks
```typescript
// Get loading state from all slices
const { isLoading, quiz, flashcard } = useLoadingState()

// Get error state from all slices  
const { hasError, firstError } = useErrorState()

// Feature-specific hooks
const { isLoading, hasData, isNotFound } = useQuizState()
const { shouldShowSkeleton, shouldShowError } = useComponentState('quiz')
```

## Error Boundaries

### ReduxErrorBoundary
Prevents crashes and provides fallback UI:
```tsx
<ReduxErrorBoundary>
  <QuizComponent />
</ReduxErrorBoundary>
```

### QuizErrorBoundary
Specialized error boundary for quiz/flashcard content:
```tsx
<QuizErrorBoundary quizType="mcq" slug="javascript-basics">
  <QuizContent />
</QuizErrorBoundary>
```

## Skeleton Loaders

Prevent blank screens during loading:
```tsx
import { QuizSkeleton, FlashcardSkeleton } from '@/components/ui/skeleton'

function QuizPage() {
  const { shouldShowSkeleton, shouldShowContent } = useComponentState('quiz')
  
  if (shouldShowSkeleton) return <QuizSkeleton />
  if (shouldShowContent) return <QuizContent />
}
```

## Best Practices

### 1. Always Use Abort Controllers
```typescript
// ✅ Good: With abort controller
const response = await fetch(url, { signal: abortController.signal })

// ❌ Bad: No cancellation support
const response = await fetch(url)
```

### 2. Preserve Data on Errors
```typescript
// ✅ Good: Only clear if no existing data
if (!state.questions.length) {
  state.questions = []
}

// ❌ Bad: Always clear data
state.questions = []
```

### 3. Use Timestamp Validation
```typescript
// ✅ Good: Check if data is newer
if (!state.lastUpdated || incomingTs >= state.lastUpdated) {
  state.data = action.payload
  state.lastUpdated = incomingTs
}

// ❌ Bad: Always overwrite
state.data = action.payload
```

### 4. Handle Cancelled Requests
```typescript
// ✅ Good: Handle cancellation gracefully
if (payload === 'Request was cancelled') {
  return // Don't change state
}

// ❌ Bad: Treat as error
state.error = payload
```

### 5. Use Error Boundaries
```tsx
// ✅ Good: Wrapped in error boundary
<QuizErrorBoundary>
  <QuizComponent />
</QuizErrorBoundary>

// ❌ Bad: No error handling
<QuizComponent />
```

## Migration Guide

### Updating Components

1. **Replace loading checks**:
```tsx
// Before
const isLoading = useSelector(state => state.quiz.status === 'loading')

// After  
const { isLoading } = useQuizState()
```

2. **Add error boundaries**:
```tsx
// Before
<QuizPage />

// After
<QuizErrorBoundary quizType="mcq">
  <QuizPage />
</QuizErrorBoundary>
```

3. **Use skeleton loaders**:
```tsx
// Before
{isLoading ? <div>Loading...</div> : <Content />}

// After
{shouldShowSkeleton ? <QuizSkeleton /> : <Content />}
```

### Updating Async Thunks

1. **Add abort controller support**:
```typescript
// Add signal parameter and RequestManager
async (payload, { signal, rejectWithValue }) => {
  const requestKey = `feature-${id}`
  const abortController = RequestManager.create(requestKey)
  
  // ... rest of implementation
}
```

2. **Add timestamp to responses**:
```typescript
return {
  ...data,
  __lastUpdated: Date.now()
}
```

## Testing

The improvements include comprehensive tests for:
- Race condition prevention
- Data preservation on errors
- Timestamp-based updates
- Request cancellation

Run tests with:
```bash
npm test store/utils/__tests__/redux-improvements.test.ts
```

## Performance Impact

- **Reduced API calls**: Request deduplication prevents duplicate fetches
- **Faster perceived performance**: Skeleton loaders show immediately
- **Fewer crashes**: Error boundaries prevent application crashes
- **Memory cleanup**: Abort controllers prevent memory leaks

## Monitoring

To monitor the effectiveness of these improvements:

1. **Check for blank screens**: Should be eliminated
2. **Monitor error rates**: Should decrease with better error handling
3. **Track loading performance**: Skeleton loaders improve perceived performance
4. **Watch for race conditions**: RequestManager logs can help debug

## Future Enhancements

1. **Request deduplication**: Cache identical requests
2. **Optimistic updates**: Update UI before API confirmation
3. **Background refresh**: Refresh stale data automatically
4. **Retry logic**: Automatic retry for failed requests