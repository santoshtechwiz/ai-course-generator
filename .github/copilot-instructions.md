# AI Learning Platform - Development Guidelines & Best Practices# AI Learning Platform - Cleanup & Stabilization Instructions



## Goal## Goal

Maintain and enhance the CourseAI platform with focus on performance, user experience, and code quality.  Stabilize the CourseAI platform by eliminating blank pages, fixing loaders, removing unused code, and enforcing consistency across the app.  

Follow these guidelines for consistent development and long-term maintainability.Follow these instructions for automated cleanup and long-term maintainability.



------



## 1. Performance Optimization 🚀## 1. Blank Page Fixes

- Use **SWR + abort controllers** everywhere for data fetching.

### API Call Management- Wrap all dashboard/course/quiz components in **error boundaries with retry**.

- **Eliminate duplicate API calls** using global caching and request coalescing- Replace `fetch(..., { cache: 'no-store' })` with **SWR caching** unless personalization is required.

- Use **throttling mechanisms** (200-500ms) for progress updates- Ensure all `page.tsx` routes return a fallback UI while data is loading.

- Implement **abort controllers** for cleanup on component unmount

- Cache progress data with **CACHE_DURATION** (30 seconds for progress, 5 minutes for course data)---



### React Component Optimization  ## 2. Loader Consistency

- **Optimize dependency arrays** in useCallback/useMemo to prevent unnecessary re-renders- Always use the **existing Loader component + NProgress**.

- Use **stable references** for videoStateStore and other global stores- Loader must:

- Avoid duplicate state derivations - compute once and reuse  - Be **centered** using `flex` or `grid`.

- Implement **smart memoization** for expensive calculations  - Show a **contextual message** (e.g., “Loading quiz…”, “Fetching courses…”).

- Hook loader visibility into **SWR states**:  

### Progress Tracking System  - `isLoading` → initial load  

- Use **event-driven architecture** with batching and deduplication  - `isValidating` → background refresh  

- Implement **DEBOUNCE_DELAYS** for different event types (progress: 500ms, completion: 100ms)

- Ensure **immediate UI feedback** with Redux state updates before API calls---

- Add **progress refresh triggers** after completion events

## 3. Unused Code Cleanup

---1. Remove unused dependencies:

   ```bash

## 2. UI State Management & Updates 🎯   npx depcheck


### Chapter Completion Flow
```typescript
// REQUIRED: Always include both callbacks for completion
await markChapterCompleted({
  // ... other params
  onProgressRefresh: courseProgressSync?.refetch,
  onCacheInvalidate: courseProgressSync?.invalidateCache
});
```

### Data Consistency Rules
- **Update Redux state immediately** for instant UI feedback
- **Invalidate cache** before refreshing data to ensure freshness  
- **Trigger progress refresh** after successful database updates
- Use **200ms delay** for database consistency before refresh

### Loading States
- Always use the **existing Loader component + NProgress**
- Show **contextual messages** ("Loading course...", "Updating progress...")
- Hook into **SWR states**: `isLoading` (initial) / `isValidating` (refresh)
- Implement **error boundaries** with retry functionality

---

## 3. Code Quality & Architecture 📋

### File Organization
```
hooks/          # Custom hooks (use-*, useCourseProgress, etc.)
utils/          # Pure functions and helpers
services/       # API service layer
store/slices/   # Redux state management
components/     # Reusable UI components
```

### TypeScript Standards
- Use **strict type checking** for all new code
- Define **clear interfaces** for component props and API responses  
- Implement **proper error handling** with typed error states
- Add **JSDoc comments** for complex functions

### Import Best Practices
```typescript
// Group imports: external → internal → relative
import { useState, useCallback } from 'react'
import { useAppSelector } from '@/hooks/redux'
import { courseService } from '../services/course.service'
```

---

## 4. Data Fetching & Caching 📡

### SWR Implementation
```typescript
// Use consistent SWR patterns
const { data, error, isLoading, mutate } = useSWR(
  key,
  fetcher,
  {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 2,
  }
)
```

### Progress Sync Guidelines
- Use **useCourseProgressSync** for course-level progress
- Implement **refetchAfterSync** for data consistency  
- Add **progressSynced** event listeners for cross-component updates
- Handle **request deduplication** for concurrent calls

---

## 5. Video Player & Progress Tracking 🎥

### Video State Management
- Use **unified videoStateStore** reference to prevent re-renders
- Implement **smart progress tracking** with meaningful thresholds (>5% progress)
- Add **completion triggers**: video_end, next_click, seek_to_end
- Track **video duration** and **played seconds** accurately

### Chapter Navigation
- **Mark chapters completed** on next video click
- Update **currentChapterId** when switching videos
- Sync **video start events** with 200ms delay for server updates
- Handle **autoplay logic** with user preference respect

---

## 6. Error Handling & Debugging 🐛

### Logging Standards
```typescript
console.log(`[ComponentName] Action description for ${identifier}`)
console.error('Error context:', error)
// Use structured logging for easier debugging
```

### Error Recovery
- Implement **graceful fallbacks** for failed API calls
- Show **user-friendly error messages** with retry options
- Log **detailed error context** for debugging
- Use **error boundaries** to prevent app crashes

### Performance Monitoring
- Monitor **API response times** (log if >1000ms)
- Track **re-render frequency** in development
- Identify **memory leaks** from uncleaned effects
- Watch for **infinite loops** in useEffect dependencies

---

## 7. Testing & Validation ✅

### Component Testing
- Test **completion flows** end-to-end
- Verify **progress updates** reflect in UI immediately
- Check **cache invalidation** works correctly
- Validate **error states** and recovery

### Performance Testing  
- Measure **initial load times** for course pages
- Test **progress sync speed** after completion events
- Verify **no duplicate API calls** in network tab
- Check **memory usage** during long sessions

---

## 8. Development Workflow 🔄

### Before Making Changes
1. **Read existing code** to understand current patterns
2. **Check for similar implementations** to maintain consistency  
3. **Identify performance implications** of changes
4. **Plan error handling** and edge cases

### After Implementation
1. **Test completion flows** manually
2. **Verify no TypeScript errors** remain
3. **Check network tab** for duplicate calls
4. **Validate UI updates** happen immediately

### Code Review Checklist
- [ ] No infinite loops or excessive re-renders
- [ ] Proper cleanup in useEffect hooks
- [ ] Consistent error handling
- [ ] TypeScript types are complete
- [ ] Performance optimizations applied
- [ ] UI updates work immediately

---

## 9. Platform-Specific Guidelines 🎓

### CourseAI Features
- **Course Progress**: Always sync between Redux, API, and UI
- **Video Player**: Handle autoplay, duration tracking, and completion
- **Chapter Navigation**: Ensure smooth transitions with progress preservation
- **User Experience**: Prioritize immediate feedback and smooth interactions

### Database Integration
- Use **ChapterProgress table** for granular tracking
- Sync with **CourseProgress** for summary data
- Handle **concurrent updates** gracefully
- Implement **optimistic updates** for better UX

---

## 10. Recent Optimizations Applied ✨

### Performance Fixes Completed
- ✅ **Eliminated infinite API calls** in useCourseProgressSync with global caching
- ✅ **Optimized MainContent re-renders** through dependency array fixes
- ✅ **Enhanced progress event deduplication** with smart batching
- ✅ **Fixed UI update delays** after chapter completion with cache invalidation
- ✅ **Added progress refresh triggers** for immediate state synchronization

### UI/UX Improvements  
- ✅ **Immediate chapter completion feedback** - UI updates instantly on next click
- ✅ **Consistent progress tracking** across all completion triggers
- ✅ **Reliable state synchronization** between Redux, API, and database
- ✅ **Optimized video player state management** with unified store references

This document should be reviewed and updated as the platform evolves. Focus on maintainability, performance, and excellent user experience.