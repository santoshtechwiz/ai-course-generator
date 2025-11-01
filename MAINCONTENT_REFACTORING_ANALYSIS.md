# MainContent Component - Complete Analysis & Refactoring Plan

## 🔍 Issues Identified

### 1. **ChapterProgressBar Component Not Rendering** ❌
- **Location**: `MainContentInner.tsx` lines 726-732
- **Issue**: Component is defined but never used in render output
- **Impact**: Progress bar feature not visible to users
- **Root Cause**: Passed to `renderCourseDashboard` but function doesn't render it
- **Solution**: Remove unused component (ChapterPlaylist has its own progress bars)

### 2. **No Infinite Scroll Implementation** ❌
- **Location**: `ChapterPlaylist.tsx` line 303
- **Current**: Simple overflow scroll with hidden scrollbar
- **Issue**: Performance problems with 50+ chapters
- **Missing**: IntersectionObserver, virtual scrolling, lazy loading
- **Solution**: Implement react-window or intersection observer

### 3. **Incorrect Hook Usage** ❌ **CRITICAL**
- **Location**: `MainContentInner.tsx` lines 296-305
- **Issue**: `VideoPlayerSection` and `ProgressSection` are **hooks** but called like components
- **Current Code**:
  ```tsx
  const videoPlayerState = VideoPlayerSection({ ... }) // ❌ WRONG
  ```
- **Should Be**:
  ```tsx
  const videoPlayerState = useVideoPlayerSection({ ... }) // ✅ CORRECT
  ```
- **Impact**: React hook rules violations, potential bugs
- **Files to Fix**:
  - Rename `VideoPlayerSection` → `useVideoPlayerSection`
  - Rename `ProgressSection` → `useProgressSection`
  - Update all imports

### 4. **Component Size Violations** ❌
- **MainContentInner.tsx**: 795 lines (should be <300)
- **CourseDetailsShell.tsx**: 571 lines (should be <400)
- **Impact**: Hard to maintain, test, and understand
- **Solution**: Extract into focused components

### 5. **Code Duplication** ❌
- `formatSeconds`: Defined in MainContentInner AND CourseDetailsShell
- `validateChapter`: Defined in MainContent AND MainContentInner  
- State reducers: Duplicate state management in wrapper and inner
- **Solution**: Create shared utilities file

---

## 📋 Refactoring Plan

### **Phase 1: Fix Critical Architecture Issues** 🔥
**Priority**: HIGHEST

#### 1.1 Rename Hooks Properly
- [ ] Rename `VideoPlayerSection.tsx` → Keep filename, rename export
- [ ] Export `useVideoPlayerSection` instead of `VideoPlayerSection`
- [ ] Rename `ProgressSection.tsx` → Keep filename, rename export
- [ ] Export `useProgressSection` instead of `ProgressSection`
- [ ] Update `MainContentInner.tsx` to use correct hook names

#### 1.2 Remove Unused Code
- [ ] Delete `ChapterProgressBar` component from `MainContentInner.tsx`
- [ ] Remove it from `renderCourseDashboard` parameters
- [ ] Clean up unused imports

#### 1.3 Create Shared Utilities
- [ ] Create `app/dashboard/course/[slug]/utils/formatters.ts`
  - Move `formatSeconds` function
  - Move `formatDuration` function
- [ ] Create `app/dashboard/course/[slug]/utils/validators.ts`
  - Move `validateChapter` function

---

### **Phase 2: Extract Components** 📦
**Priority**: HIGH

#### 2.1 Extract CourseHeader Component
```tsx
// app/dashboard/course/[slug]/components/CourseHeader.tsx
interface CourseHeaderProps {
  course: FullCourseType
  totalVideos: number
  completedVideos: number
  totalDuration: string
  progressPercentage: number
  isShared: boolean
}
```
- Extracts lines 176-265 from CourseDetailsShell
- Handles sticky header, course info, progress display

#### 2.2 Extract CourseStats Component
```tsx
// app/dashboard/course/[slug]/components/CourseStats.tsx
interface CourseStatsProps {
  totalChapters: number
  completedCount: number
  totalDuration: string
  progressPercentage: number
}
```
- Clean, reusable statistics display
- Used in header and sidebar

#### 2.3 Extract VideoControls Component
```tsx
// app/dashboard/course/[slug]/components/VideoControls.tsx
interface VideoControlsProps {
  autoplayMode: boolean
  isTheaterMode: boolean
  isPiPActive: boolean
  onAutoplayToggle: () => void
  onTheaterModeToggle: (mode: boolean) => void
  onPIPToggle: () => void
}
```
- Handles video player control buttons
- Separates UI from player logic

#### 2.4 Extract CourseTabs Component
```tsx
// app/dashboard/course/[slug]/components/CourseTabs.tsx
```
- Wrap CourseDetailsTabs for better organization
- Handle tab state internally

---

### **Phase 3: Add Infinite Scroll** 🔄
**Priority**: MEDIUM

#### 3.1 Option A: react-window (Recommended)
```bash
npm install react-window
npm install --save-dev @types/react-window
```
- Virtual scrolling for large lists
- Excellent performance
- Small bundle size

#### 3.2 Option B: IntersectionObserver
```tsx
// Implement in ChapterPlaylist.tsx
const observerRef = useRef<IntersectionObserver>()
```
- Native browser API
- No dependencies
- Good for lazy loading thumbnails

#### Implementation
- [ ] Add react-window dependency
- [ ] Create `VirtualizedChapterList.tsx`
- [ ] Implement item renderer
- [ ] Add lazy loading for thumbnails
- [ ] Test with 100+ chapters

---

### **Phase 4: State Management Cleanup** 🧹
**Priority**: MEDIUM

#### 4.1 Consolidate State
- MainContent wrapper has reducer state (unnecessary)
- MainContentInner has its own reducer state
- **Solution**: Remove MainContent reducer, use only MainContentInner

#### 4.2 Optimize Memoization
- Review all useMemo dependencies
- Remove unnecessary memoizations
- Add missing memoizations for expensive computations

#### 4.3 Clean Up Effects
- Combine related useEffects
- Remove duplicate effects
- Add cleanup functions where missing

---

### **Phase 5: Testing & Validation** ✅
**Priority**: HIGH (after Phase 1)

#### Test Cases
- [ ] Video playback works
- [ ] Progress tracking accurate
- [ ] Chapter navigation smooth
- [ ] Certificate modal appears at 100%
- [ ] Bookmarks save/load correctly
- [ ] PiP mode works
- [ ] Theater mode toggles
- [ ] Autoplay functions
- [ ] Mobile playlist works
- [ ] Shared course features work
- [ ] Guest mode restrictions work

---

## 📊 File Structure After Refactoring

```
app/dashboard/course/[slug]/
├── components/
│   ├── MainContent.tsx (wrapper, 50 lines)
│   ├── MainContentInner.tsx (400 lines - reduced from 795)
│   ├── CourseHeader.tsx (NEW - 100 lines)
│   ├── CourseStats.tsx (NEW - 50 lines)
│   ├── VideoControls.tsx (NEW - 80 lines)
│   ├── CourseTabs.tsx (NEW - 120 lines)
│   ├── VirtualizedChapterList.tsx (NEW - 150 lines)
│   ├── ChapterPlaylist.tsx (300 lines - with virtualization)
│   ├── CourseDetailsShell.tsx (250 lines - reduced from 571)
│   └── sections/
│       ├── VideoPlayerSection.tsx → exports useVideoPlayerSection
│       └── ProgressSection.tsx → exports useProgressSection
├── hooks/
│   ├── useVideoPlayerSection.ts (re-export from sections)
│   └── useProgressSection.ts (re-export from sections)
└── utils/
    ├── formatters.ts (NEW)
    └── validators.ts (NEW)
```

---

## 🎯 Success Metrics

### Code Quality
- ✅ No component over 400 lines
- ✅ All hooks follow naming convention (use*)
- ✅ No code duplication
- ✅ TypeScript strict mode passing
- ✅ ESLint warnings: 0

### Performance
- ✅ Initial render < 500ms
- ✅ Chapter list scroll 60fps
- ✅ Smooth video playback
- ✅ No memory leaks

### User Experience
- ✅ Progress bar always visible
- ✅ Smooth scrolling with 100+ chapters
- ✅ Instant UI feedback on actions
- ✅ Mobile responsive

---

## 🚀 Implementation Order

1. **Day 1**: Phase 1 (Critical fixes) ← START HERE
2. **Day 2**: Phase 2.1-2.2 (Extract header & stats)
3. **Day 3**: Phase 2.3-2.4 (Extract controls & tabs)
4. **Day 4**: Phase 3 (Infinite scroll)
5. **Day 5**: Phase 4 (Cleanup) + Phase 5 (Testing)

---

## 📝 Notes

- Keep existing functionality working throughout refactoring
- Test after each phase
- Create feature branch: `feature/maincontent-refactor`
- Review copilot-instructions.md before making changes
- Follow neobrutalism design system
