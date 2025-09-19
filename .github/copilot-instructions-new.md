# CourseAI Platform - AI Agent Development Guidelines

## Platform Overview
**CourseAI** is a Next.js 14 educational platform with AI-powered course generation, video content delivery, quiz systems, and subscription-based access control. The platform uses Redux for state management, NextAuth for authentication, Prisma with PostgreSQL for data persistence, and React Player for video delivery.

## Core Architecture Understanding

### Essential Data Flow
```
User Auth (NextAuth) → Redux Store → API Routes → Prisma/DB
    ↑                      ↓
Subscription System ← Progress Tracking → Video Player
```

**Key State Slices:**
- `courseProgress-slice`: Chapter/video progress tracking
- `course-slice`: Video playback, bookmarks, user progress
- `subscription-slice`: Plan status, credits, permissions
- `enhanced-progress-slice`: Centralized progress with batching
- `quiz/flashcard-slice`: Quiz state and results

### Authentication & Permissions
- **Auth Provider**: `modules/auth/providers/AuthProvider.tsx` - unified session-based auth
- **Credit System**: `utils/credit-utils.ts` - calculates remaining credits from user.credits, subscription.tokensUsed
- **PlanAwareButton**: `app/dashboard/(quiz)/components/PlanAwareButton.tsx` - handles subscription/credit checks for actions

### Course & Video Architecture
- **Main Course Page**: `app/dashboard/course/[slug]/components/MainContent.tsx`
- **Video Player**: Complex state management in `video/components/VideoPlayer.tsx` with hooks in `video/hooks/useVideoPlayer.ts`
- **Progress Tracking**: Event-driven with batching/deduplication (`hooks/useCourseProgressSync.ts`)
- **Chapter Navigation**: Sidebar at `VideoNavigationSidebar.tsx` with completion tracking

## Critical Development Patterns

### Progress & State Synchronization
```typescript
// ALWAYS use both callbacks for chapter completion
await markChapterCompleted({
  onProgressRefresh: courseProgressSync?.refetch,
  onCacheInvalidate: courseProgressSync?.invalidateCache
});

// Update Redux immediately, then sync to API
dispatch(setVideoProgress()); // Instant UI feedback
await persistVideoProgress(); // Background API sync
```

### API Route Structure
```
/api/course/[slug] - Course data & status
/api/progress/[courseId] - Progress CRUD operations  
/api/coursequiz/ - AI quiz generation
/api/quizzes/[type]/[slug] - Quiz management
/api/user/* - User stats, courses, progress
```

### Subscription & Credit Checks
```typescript
// Use PlanAwareButton for any credit-consuming action
<PlanAwareButton
  label="Create Course"
  creditsRequired={1}
  requiredPlan="FREE"
  onClick={handleCreateCourse}
  customStates={{
    noCredits: { label: "Need 1 Credit", tooltip: "..." }
  }}
/>
```

## Essential Development Commands

### Development Workflow
```bash
npm run dev                    # Start dev server
npm run test                   # Run test suite
npm run dev:migrate           # Run Prisma migrations in dev
npm run check-consistency     # Check subscription data consistency
npm run video-fix             # Health check for video components
```

### Database Operations
```bash
npx prisma generate           # Generate Prisma client
npx prisma db push           # Push schema changes
npx prisma studio            # Open database GUI
```

## Component Patterns

### State Management Rules
- **Immediate UI Updates**: Always update Redux state first for instant feedback
- **API Sync**: Use SWR with 30s cache for progress, 5min for course data  
- **Error Boundaries**: Wrap dashboard/course/quiz components with retry capability
- **Loading States**: Use existing `components/loader.tsx` + NProgress

### Video Player Integration
```typescript
// Essential video player props pattern
<VideoPlayer
  youtubeVideoId={videoId}
  chapterId={chapter.id}
  onProgress={handleVideoProgress}
  onEnded={handleVideoEnded}
  courseId={course.id}
  initialSeekSeconds={resumePoint}
  isTheaterMode={state.isTheaterMode}
/>
```

### File Organization Conventions
```
app/dashboard/course/[slug]/   # Course pages
components/course/             # Course-specific components  
hooks/use*                     # Custom hooks (useCourseProgress, etc.)
store/slices/                  # Redux state management
services/                      # API service layer
types/                         # TypeScript definitions
```

## Performance & UX Guidelines

### Data Fetching Optimization
- Use **SWR** everywhere with abort controllers for cleanup
- Implement **request deduplication** for concurrent progress updates
- Cache with `CACHE_DURATION`: 30s progress, 5min course data
- Add **200ms delays** for database consistency before refresh

### Video & Progress Performance  
- **Debounce progress updates**: 500ms for progress, 100ms for completion
- **Smart progress tracking**: Only track >5% progress thresholds
- **Completion triggers**: video_end, next_click, seek_to_end
- **Autoplay logic**: Respect user preferences with proper state management

## Common Debugging Patterns

### Subscription Issues
- Check `user.credits` vs `subscription.tokensUsed` for accurate credit counts
- Verify subscription status in `/dashboard/subscription` for state consistency
- Use `components/development/CourseAIState.tsx` for debugging Redux state

### Progress Tracking Problems  
- Monitor network tab for duplicate API calls to `/api/progress/`
- Check Redux DevTools for proper state updates in `courseProgress` slice
- Verify chapter completion events are properly batched and synchronized

---

**Key Insight**: This platform requires careful coordination between subscription state, progress tracking, and video playback. Always consider the user's credit balance and subscription status when implementing new features, and ensure progress updates provide immediate UI feedback while syncing reliably in the background.