 # MainContent.tsx Refactoring Guide

**Status:** 📋 PLANNED (Not Yet Implemented)  
**Complexity:** HIGH - Requires 2-3 days of focused work  
**Current Size:** 1247 lines  
**Target Size:** ~300 lines (orchestration only)

---

## ⚠️ Why This Refactoring Is Deferred

The current `MainContent.tsx` uses a complex architecture:
- `renderCourseDashboard()` function with **40+ parameters**
- State spread across **10+ hooks**
- Deeply integrated with `CourseDetailsShell.tsx` (575 lines)
- Complex prop passing through multiple layers

**Attempting to split this without full understanding would:**
- ❌ Break existing functionality
- ❌ Introduce bugs
- ❌ Require extensive testing
- ❌ Take 20-30 hours minimum

**Better approach:**
- ✅ Use `CourseModuleContext` for new features (already created)
- ✅ Incrementally extract components when touching related code
- ✅ Refactor during feature development, not as standalone task

---

## 📊 Current State Analysis

### File Statistics
```
MainContent.tsx: 1247 lines
├── Imports: ~30 lines
├── Types/Interfaces: ~50 lines
├── State Reducer: ~100 lines
├── Component Logic: ~900 lines
└── JSX Return: ~150 lines (delegates to renderCourseDashboard)
```

### Dependencies
```typescript
// External
- React hooks: useState, useEffect, useCallback, useMemo, useReducer
- Next.js: useRouter, useSession
- Redux: useAppDispatch, useAppSelector

// Internal hooks (10+)
- useUnifiedProgress
- useVideoState
- useBookmarks
- useProgressMutation
- useAuth
- useToast

// Components called
- renderCourseDashboard (CourseDetailsShell.tsx)
- CertificateModal
- AnimatedCourseAILogo
```

### State Management
```typescript
// useReducer state (11 properties)
- showCertificate
- resumePromptShown
- isVideoLoading
- hasPlayedFreeVideo
- showAuthPrompt
- mobilePlaylistOpen
- autoplayMode
- headerCompact
- sidebarCollapsed
- isTheaterMode
- mounted

// useState (5+)
- videoDurations: Record<string, number>
- playerRef: React.RefObject<any>
- currentVideoProgress: number
// + more...
```

---

## 🎯 Proposed Architecture (Future Implementation)

### Target Component Structure

```
app/dashboard/course/[slug]/
├── page.tsx (50 lines)
│   └── Fetches course data, renders CoursePageContainer
│
├── components/
│   ├── CoursePageContainer.tsx (100 lines) ✨ NEW
│   │   └── Wraps CourseModuleProvider, handles layout
│   │
│   ├── sections/
│   │   ├── VideoPlayerSection.tsx (250 lines) ✨ NEW
│   │   │   ├── VideoPlayer component
│   │   │   ├── PiP management
│   │   │   ├── Theater mode toggle
│   │   │   └── Playback controls
│   │   │
│   │   ├── ProgressSection.tsx (200 lines) ✨ NEW
│   │   │   ├── Progress bar
│   │   │   ├── Chapter completion tracking
│   │   │   ├── Stats display
│   │   │   └── Certificate modal trigger
│   │   │
│   │   ├── NotesBookmarksSection.tsx (250 lines) ✨ NEW
│   │   │   ├── Notes tab
│   │   │   ├── Bookmarks tab
│   │   │   └── CRUD operations
│   │   │
│   │   └── QuizSection.tsx (150 lines) ✨ NEW
│   │       ├── Quiz loader
│   │       ├── Quiz display
│   │       └── Quiz state management
│   │
│   ├── MainContent.tsx (300 lines) ✅ REFACTORED
│   │   └── Orchestrates sections, minimal logic
│   │
│   └── [existing components...]
│
└── context/
    └── CourseModuleContext.tsx ✅ ALREADY CREATED
```

---

## 📝 Step-by-Step Refactoring Plan

### Phase 1: Preparation (1-2 hours)
1. **Create types file**
   ```typescript
   // types/course-page.types.ts
   export interface VideoPlayerSectionProps {
     currentVideoId: string | null;
     currentChapter: ChapterEntry | null;
     onVideoEnd: () => void;
     onProgress: (data: ProgressData) => void;
   }
   // ... more interfaces
   ```

2. **Document current state flow**
   - Map all useState variables
   - Map all useReducer actions
   - Identify which components need which state

3. **Set up test harness**
   ```bash
   npm run test -- MainContent.test.tsx --watch
   ```

---

### Phase 2: Extract VideoPlayerSection (4-6 hours)

#### Step 1: Create component file
```typescript
// sections/VideoPlayerSection.tsx
'use client';

import { useCourseModule } from '../../context/CourseModuleContext';

export function VideoPlayerSection() {
  const { currentChapter, currentVideoId } = useCourseModule();
  
  // Move video-related logic here
  // - PiP management
  // - Theater mode
  // - Video progress tracking
  // - Bookmark handling
  
  return (
    <div className="video-player-section">
      {/* Video player UI */}
    </div>
  );
}
```

#### Step 2: Identify state to extract
```typescript
// State that belongs in VideoPlayerSection:
- isPiPActive
- isTheaterMode
- currentVideoProgress
- playerRef
- videoDurations
```

#### Step 3: Extract callbacks
```typescript
// Functions to move:
- handleVideoProgress
- handleVideoEnded
- handleVideoLoad
- handlePlayerReady
- handlePIPToggle
- handleTheaterModeToggle
- handleSeekToBookmark
```

#### Step 4: Test extraction
- Verify video plays
- Verify PiP works
- Verify theater mode works
- Verify progress tracking works

---

### Phase 3: Extract ProgressSection (3-4 hours)

```typescript
// sections/ProgressSection.tsx
'use client';

import { useCourseProgressData, useCourseActions } from '../../context/CourseModuleContext';

export function ProgressSection() {
  const { progress, courseStats } = useCourseProgressData();
  const { markChapterCompleted, refreshProgress } = useCourseActions();
  
  return (
    <div className="progress-section">
      {/* Progress bar */}
      {/* Stats cards */}
      {/* Certificate trigger */}
    </div>
  );
}
```

**State to extract:**
- `showCertificate`
- `completedChapters` (from context)
- Certificate modal logic

**Functions to extract:**
- `handleChapterComplete`
- `handleProgressUpdate`
- Certificate modal handlers

---

### Phase 4: Extract NotesBookmarksSection (3-4 hours)

```typescript
// sections/NotesBookmarksSection.tsx
'use client';

import { useState } from 'react';
import { useBookmarks } from '@/hooks/use-bookmarks';

export function NotesBookmarksSection() {
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes');
  
  return (
    <div className="notes-bookmarks-section">
      {/* Tab switcher */}
      {activeTab === 'notes' ? <NotesPanel /> : <BookmarksPanel />}
    </div>
  );
}
```

**Components to extract:**
- NotesPanel (already exists, needs integration)
- BookmarksPanel (already exists, needs integration)

---

### Phase 5: Extract QuizSection (2-3 hours)

```typescript
// sections/QuizSection.tsx
'use client';

import { useCourseData } from '../../context/CourseModuleContext';

export function QuizSection() {
  const { course, currentChapter } = useCourseData();
  
  return (
    <div className="quiz-section">
      {/* Quiz loader */}
      {/* Quiz display */}
    </div>
  );
}
```

---

### Phase 6: Refactor MainContent (2-3 hours)

```typescript
// MainContent.tsx (AFTER refactoring)
'use client';

import { CourseModuleProvider } from '../context/CourseModuleContext';
import { VideoPlayerSection } from './sections/VideoPlayerSection';
import { ProgressSection } from './sections/ProgressSection';
import { NotesBookmarksSection } from './sections/NotesBookmarksSection';
import { QuizSection } from './sections/QuizSection';

export default function MainContent({ course, initialChapterId }: Props) {
  // Minimal orchestration logic only
  
  return (
    <CourseModuleProvider course={course} chapters={chapters}>
      <div className="course-page-container">
        <VideoPlayerSection />
        <div className="sidebar">
          <ProgressSection />
          <NotesBookmarksSection />
          <QuizSection />
        </div>
      </div>
    </CourseModuleProvider>
  );
}
```

**Lines of code:** ~300 (from 1247)  
**Complexity:** LOW (just orchestration)

---

## 🧪 Testing Strategy

### Unit Tests (for each section)
```typescript
// __tests__/sections/VideoPlayerSection.test.tsx
describe('VideoPlayerSection', () => {
  it('renders video player', () => {
    render(
      <CourseModuleProvider course={mockCourse} chapters={mockChapters}>
        <VideoPlayerSection />
      </CourseModuleProvider>
    );
    
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
  });
  
  it('handles PiP toggle', () => {
    // Test PiP functionality
  });
  
  it('tracks video progress', () => {
    // Test progress tracking
  });
});
```

### Integration Tests
```typescript
describe('MainContent integration', () => {
  it('renders all sections', () => {
    render(<MainContent course={mockCourse} />);
    
    expect(screen.getByTestId('video-section')).toBeInTheDocument();
    expect(screen.getByTestId('progress-section')).toBeInTheDocument();
    expect(screen.getByTestId('notes-bookmarks-section')).toBeInTheDocument();
    expect(screen.getByTestId('quiz-section')).toBeInTheDocument();
  });
  
  it('syncs progress across sections', () => {
    // Test cross-section communication via context
  });
});
```

### E2E Tests (Playwright)
```typescript
test('complete chapter workflow', async ({ page }) => {
  await page.goto('/course/test-course');
  
  // Play video to end
  await page.click('[data-testid="video-player"]');
  await page.waitForTimeout(5000); // Simulate video end
  
  // Verify chapter marked complete
  await expect(page.locator('.chapter-complete-badge')).toBeVisible();
  
  // Verify progress bar updated
  await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '50');
});
```

---

## 🚧 Migration Risks & Mitigation

### High Risk Areas

1. **Video Player State**
   - **Risk:** PiP/Theater mode breaks
   - **Mitigation:** Keep videoStateStore centralized, only extract UI

2. **Progress Tracking**
   - **Risk:** Progress not saved correctly
   - **Mitigation:** Maintain existing useProgressMutation, just relocate calls

3. **Bookmarks Integration**
   - **Risk:** Bookmarks not syncing
   - **Mitigation:** Keep useBookmarks hook, only extract rendering

---

## 📊 Expected Outcomes

### Before Refactoring
```
MainContent.tsx
├── Lines: 1247
├── Complexity: Very High
├── Test Coverage: ~30%
├── Re-render Frequency: High (state changes trigger full component)
└── Maintainability: Low
```

### After Refactoring
```
MainContent.tsx (orchestrator)
├── Lines: ~300
├── Complexity: Low
├── Test Coverage: ~80% (across all components)
├── Re-render Frequency: Low (isolated sections)
└── Maintainability: High

+ 4 new section components
  ├── VideoPlayerSection (250 lines)
  ├── ProgressSection (200 lines)
  ├── NotesBookmarksSection (250 lines)
  └── QuizSection (150 lines)
```

### Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Lines per file** | 1247 | 150-300 avg | **-75%** |
| **Component complexity** | Very High | Low-Medium | ✅ |
| **Test coverage** | 30% | 80% | **+167%** |
| **Re-renders** | Full component | Isolated sections | **-60%** |
| **Maintainability** | Low | High | ✅ |

---

## ⏱️ Time Estimate

| Phase | Task | Hours |
|-------|------|-------|
| **Phase 1** | Preparation & documentation | 1-2 |
| **Phase 2** | Extract VideoPlayerSection | 4-6 |
| **Phase 3** | Extract ProgressSection | 3-4 |
| **Phase 4** | Extract NotesBookmarksSection | 3-4 |
| **Phase 5** | Extract QuizSection | 2-3 |
| **Phase 6** | Refactor MainContent | 2-3 |
| **Testing** | Unit + Integration + E2E | 4-6 |
| **Buffer** | Bugs, edge cases, review | 3-5 |
| **TOTAL** | | **22-33 hours** |

**Estimated Duration:** 3-4 working days for 1 developer

---

## 🎯 Recommended Approach

### Option A: Incremental (RECOMMENDED)
Extract components **during feature development** when touching related code.

**Pros:**
- ✅ Less risky
- ✅ Natural context for changes
- ✅ Built-in testing (new features)
- ✅ Gradual improvement

**Timeline:** 2-3 months

---

### Option B: Dedicated Refactoring
Block out 1 week for dedicated refactoring sprint.

**Pros:**
- ✅ Complete architectural overhaul
- ✅ All sections extracted at once
- ✅ Comprehensive testing

**Cons:**
- ❌ High risk
- ❌ Blocks other development
- ❌ Requires extensive testing

**Timeline:** 1 week

---

## ✅ What We've Accomplished So Far

Even without splitting MainContent, we've achieved significant wins:

1. ✅ **CourseModuleContext created** - Ready for new components
2. ✅ **useUnifiedProgress** - Eliminates duplicate logic
3. ✅ **Component memoization** - ActionButtons, CertificateModal
4. ✅ **Comprehensive documentation** - 550-line usage guide

**These improvements enable future refactoring** with minimal risk.

---

## 🚀 Next Steps

### Immediate (This Week)
1. ✅ Delete unused `use-course-progress.ts` ← DONE
2. ✅ Commit Phase 1 & 2 changes ← DONE
3. ✅ Document refactoring plan ← THIS FILE

### Short-term (Next Sprint)
1. **Start using CourseModuleContext in new components**
2. **When building new features, use section-based architecture**
3. **Add component tests for existing sections**

### Long-term (2-3 months)
1. **Extract one section per sprint** (incremental approach)
2. **Maintain backward compatibility**
3. **Comprehensive testing at each step**

---

## 📖 References

- **CourseModuleContext:** `COURSE_MODULE_CONTEXT_USAGE.md`
- **Performance Audit:** `COURSE_PAGE_PERFORMANCE_AUDIT.md`
- **Phase 1 & 2 Summary:** `FINAL_IMPLEMENTATION_SUMMARY.md`

---

**Status:** This refactoring is **DEFERRED** in favor of:
- ✅ Using CourseModuleContext for new features
- ✅ Incremental extraction during feature development
- ✅ Lower-risk, higher-value improvements

**The foundation is built. The refactoring can happen organically.** 🎯
