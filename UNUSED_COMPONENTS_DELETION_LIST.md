# Unused Hooks & Components - Deletion List

## 🗑️ DELETE THESE (UNUSED/PROBLEMATIC)

### High Priority - DELETE Immediately

| Name | Location | Lines | Reason | Impact |
|------|----------|-------|--------|--------|
| `VideoPlayerSection.tsx` | `hooks/` | 376 | NOT a component - returns state object, not JSX. Architectural anti-pattern | Causes MainContentInner to be overly complex |
| `ProgressSection.tsx` | `hooks/` | 163 | NOT a component - returns state object, not JSX. Architectural anti-pattern | Unused complexity |
| `useVideoPreloading.ts` | `hooks/` | ~50 | Experimental hook for preloading, not used | Dead code |
| `useMilestoneTracker.ts` | `hooks/` | ~80 | Tracks milestones but not integrated | Dead code |

**Total Lines to Delete: 669 lines**

### Medium Priority - DEPRECATE/REFACTOR

| Name | Location | Lines | Reason | Action |
|------|----------|-------|--------|--------|
| `useVideoPlayer.ts` | `components/video/hooks/` | 664 | TOO LARGE - 664 lines in single hook | Split into 4 smaller hooks |
| `VideoPlayer.tsx` | `components/video/components/` | 1478 | TOO LARGE - 1478 lines in single component | Split into 5 smaller components |
| `MainContentInner.tsx` | `components/` | 795 | TOO LARGE - orchestrating everything | Split into 3 focused components |
| `PlayerControls.tsx` | `components/video/components/` | 671 | TOO LARGE - all controls in one component | Split into 5 sub-components |

**Total Lines to Refactor: 3,608 lines → Target: 1,600 lines (55% reduction)**

---

## 📋 Specific Hooks in Components

### In `app/dashboard/course/[slug]/components/`

**Used Hooks:**
- ✅ `useAuth()` - External, needed
- ✅ `useAppDispatch()` - Redux, needed
- ✅ `useAppSelector()` - Redux, needed
- ✅ `useRouter()` - Navigation, needed
- ✅ `useToast()` - UI feedback, needed
- ✅ `useCourseModule()` - Context hook, needed
- ✅ `useUnifiedProgress()` - Progress tracking, needed
- ✅ `useCourseProgressSync()` - API sync, needed
- ✅ `useBookmarks()` - Bookmarks feature, needed
- ✅ `useVideoState()` - Video state, needed
- ✅ `useVideoPlayer()` - Video controls (LARGE but needed)

**Unused Hooks:**
- ❌ `VideoPlayerSection()` - NOT A HOOK, returns state object
- ❌ `ProgressSection()` - NOT A HOOK, returns state object

---

## 🔄 Replacement Strategy

### What to Delete
```
VideoPlayerSection.tsx (376 lines)
├─ Was extracting: videoDurations, currentVideoProgress, handlers
├─ Should be replaced by: Direct use of useVideoPlayer hook in VideoPlayer
└─ Delete immediately

ProgressSection.tsx (163 lines)
├─ Was extracting: progress handlers
├─ Should be replaced by: Context callbacks in components
└─ Delete immediately
```

### What to Refactor

#### `useVideoPlayer.ts` (664 → 200 lines)
**Split into:**
1. `useVideoPlayerState.ts` - State management (100 lines)
2. `useVideoPlayerHandlers.ts` - Event handlers (150 lines)
3. `useVideoPlayerProgress.ts` - Progress tracking (80 lines)
4. `useVideoPlayerKeyboard.ts` - Keyboard shortcuts (80 lines)

#### `VideoPlayer.tsx` (1478 → 400 lines)
**Split into:**
1. `VideoPlayer.tsx` - Main wrapper (300 lines)
2. `VideoPlayerContent.tsx` - Core player (400 lines)
3. `VideoPlayerOverlays.tsx` - UI overlays (300 lines)
4. `VideoPlayerNotifications.tsx` - Notifications (200 lines)
5. `VideoPlayerBookmarks.tsx` - Bookmarks UI (100 lines)

#### `PlayerControls.tsx` (671 → 200 lines)
**Split into:**
1. `PlayerControls.tsx` - Main container (150 lines)
2. `PlayerProgressBar.tsx` - Progress display (100 lines)
3. `PlayerVolumeControl.tsx` - Volume UI (80 lines)
4. `PlayerPlaybackMenu.tsx` - Playback options (80 lines)
5. `PlayerSettingsMenu.tsx` - Settings UI (100 lines)

#### `MainContentInner.tsx` (795 → 400 lines)
**Split into:**
1. `CoursePageShell.tsx` - Main layout (200 lines)
2. `CourseVideoSection.tsx` - Video area (200 lines)
3. `CoursePlaylistSection.tsx` - Sidebar (150 lines)

---

## ✅ After Cleanup Architecture

```
CourseDetailsShell
├─ CourseModuleProvider (Context)
│  └─ MainContent (wrapper)
│     └─ CoursePageShell (layout)
│        ├─ CourseVideoSection
│        │  ├─ VideoPlayer (simplified)
│        │  │  ├─ PlayerControls (simplified)
│        │  │  ├─ VideoPlayerContent
│        │  │  └─ VideoPlayerOverlays
│        │  └─ VideoMetadata
│        │
│        └─ CoursePlaylistSection
│           ├─ ChapterPlaylist
│           └─ CourseProgress
│
└─ Hooks (used by components)
   ├─ useCourseModule() ✅
   ├─ useUnifiedProgress() ✅
   ├─ useCourseProgressSync() ✅
   ├─ useVideoPlayerState() ✅ (NEW - split from useVideoPlayer)
   ├─ useVideoPlayerHandlers() ✅ (NEW - split from useVideoPlayer)
   └─ useAuth() ✅
```

---

## 🗂️ File Structure Before & After

### Before (MESSY - 3,608 lines in 4 files)
```
components/
├─ MainContentInner.tsx (795 lines) ← Too large
├─ video/
│  ├─ components/
│  │  ├─ VideoPlayer.tsx (1478 lines) ← Way too large
│  │  ├─ PlayerControls.tsx (671 lines) ← Too large
│  │  └─ ... other components
│  └─ hooks/
│     └─ useVideoPlayer.ts (664 lines) ← Too large
hooks/
├─ VideoPlayerSection.tsx (376 lines) ← DELETE - not a component
├─ ProgressSection.tsx (163 lines) ← DELETE - not a component
└─ ... other hooks
```

### After (CLEAN - ~1,600 lines distributed)
```
components/
├─ CoursePageShell.tsx (200 lines)
├─ CourseVideoSection.tsx (200 lines)
├─ CoursePlaylistSection.tsx (150 lines)
├─ video/
│  ├─ components/
│  │  ├─ VideoPlayer.tsx (300 lines)
│  │  ├─ PlayerControls.tsx (150 lines)
│  │  ├─ PlayerProgressBar.tsx (100 lines)
│  │  ├─ PlayerVolumeControl.tsx (80 lines)
│  │  ├─ PlayerPlaybackMenu.tsx (80 lines)
│  │  ├─ VideoPlayerContent.tsx (400 lines)
│  │  ├─ VideoPlayerOverlays.tsx (300 lines)
│  │  └─ VideoPlayerNotifications.tsx (200 lines)
│  └─ hooks/
│     ├─ useVideoPlayerState.ts (100 lines)
│     ├─ useVideoPlayerHandlers.ts (150 lines)
│     ├─ useVideoPlayerProgress.ts (80 lines)
│     └─ useVideoPlayerKeyboard.ts (80 lines)
hooks/
├─ useCourseProgressSync.ts (245 lines)
├─ useUnifiedProgress.ts (186 lines)
└─ ... other hooks
```

---

## 📊 Complexity Reduction

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| **Total Lines** | 3,608 | 1,600 | **-56%** |
| **Max Component Size** | 1,478 | 400 | **-73%** |
| **Max Hook Size** | 664 | 200 | **-70%** |
| **Avg Component Size** | 902 | 200 | **-78%** |
| **File Count** | 4 large files | 15 focused files | +11 files |
| **Cyclomatic Complexity** | Very high | Low | Significantly reduced |

---

## 🎯 Implementation Order

### Step 1: Delete (15 min)
1. Delete `VideoPlayerSection.tsx`
2. Delete `ProgressSection.tsx`
3. Remove imports in `MainContentInner.tsx`
4. Fix compilation errors

### Step 2: Extract Hooks (45 min)
1. Create `useVideoPlayerState.ts`
2. Create `useVideoPlayerHandlers.ts`
3. Create `useVideoPlayerProgress.ts`
4. Create `useVideoPlayerKeyboard.ts`
5. Refactor `useVideoPlayer.ts` to use these new hooks

### Step 3: Split Components (1-2 hours)
1. Split `VideoPlayer.tsx` into 5 components
2. Split `PlayerControls.tsx` into 5 components
3. Split `MainContentInner.tsx` into 3 components
4. Update imports and exports

### Step 4: Test & Polish (30 min)
1. Test all functionality works
2. Verify no console errors
3. Check TypeScript compiles
4. Optimize performance if needed

---

## ✋ IMPORTANT: What NOT to Delete

❌ **Do NOT delete:**
- ✅ `useAuth()` - Needed
- ✅ `useAppDispatch()` - Redux
- ✅ `useAppSelector()` - Redux
- ✅ `useCourseProgressSync()` - Progress sync
- ✅ `useUnifiedProgress()` - Progress interface
- ✅ `useBookmarks()` - Bookmarks feature
- ✅ `useVideoState()` - Video state store
- ✅ `useCourseModule()` - Context hook
- ✅ `useRouter()` - Navigation
- ✅ `useToast()` - UI feedback

---

## 📌 Summary

- **539 lines** of truly unused code to delete
- **3,608 lines** to refactor into smaller, focused modules
- **55% reduction** in lines of code
- **Significantly improved** maintainability
- **Better separation** of concerns
- **Easier to test** individual features

---

## 🔗 Related Issues

This cleanup will fix:
- ✅ Complex data flow through too many layers
- ✅ Hard-to-debug re-render issues
- ✅ Type mismatch problems
- ✅ Maintenance burden
- ✅ Performance concerns

---

**Status**: Ready for Implementation  
**Estimated Time**: 2-3 hours  
**Risk Level**: Low (clear refactoring, no new features)  
**Testing**: Need to verify all features work after split
