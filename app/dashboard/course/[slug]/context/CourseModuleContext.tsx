/**
 * Course Module Context - Phase 2 Optimization
 * 
 * Provides shared course and progress data to nested components
 * Eliminates prop drilling (8+ levels deep in MainContent.tsx)
 * Centralizes course-related state management
 * 
 * @example
 * ```tsx
 * <CourseModuleProvider course={course} chapters={chapters}>
 *   <VideoSection />
 *   <NavigationSection />
 *   <QuizSection />
 * </CourseModuleProvider>
 * ```
 */

'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type { FullCourseType } from '@/app/types/types';
import { useUnifiedProgress } from '@/hooks/useUnifiedProgress';
import { useAuth } from '@/modules/auth';
import { useAppSelector } from '@/store/hooks';

// ============================================================================
// Types
// ============================================================================

export interface ChapterEntry {
  chapter: {
    id: number;
    title: string;
    description?: string;
    orderIndex: number;
    isFree: boolean;
    duration?: number;
  };
  videoId: string;
  isCompleted: boolean;
}

export interface CourseStats {
  completedCount: number;
  totalChapters: number;
  progressPercentage: number;
  totalDuration: number;
}

export interface CourseModuleContextValue {
  // Course data
  course: FullCourseType;
  chapters: ChapterEntry[];
  currentChapter: ChapterEntry | null;
  
  // Progress data
  progress: ReturnType<typeof useUnifiedProgress>['progress'];
  completedChapters: string[];
  courseStats: CourseStats;
  
  // User context
  user: ReturnType<typeof useAuth>['user'];
  isGuest: boolean;
  isOwner: boolean;
  canAccessCourse: boolean;
  
  // Video state
  currentVideoId: string | null;
  
  // Actions
  markChapterCompleted: (chapterId: number) => Promise<void> | void;
  setCurrentChapter: (chapterId: number) => void;
  refreshProgress: () => Promise<void> | void;
  
  // Loading states
  isLoadingProgress: boolean;
}

// ============================================================================
// Context
// ============================================================================

const CourseModuleContext = createContext<CourseModuleContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

export interface CourseModuleProviderProps {
  course: FullCourseType;
  chapters: ChapterEntry[];
  children: ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

export function CourseModuleProvider({ 
  course, 
  chapters, 
  children 
}: CourseModuleProviderProps) {
  const { user } = useAuth();
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId);
  
  // ✅ PHASE 2: Unified progress with single source of truth
  const {
    progress,
    markChapterCompleted,
    setCurrentChapter,
    refetch: refreshProgress,
    isGuest,
    isLoading: isLoadingProgress,
  } = useUnifiedProgress(course.id);
  
  // ============================================================================
  // Computed Values
  // ============================================================================
  
  // Current chapter
  const currentChapter = useMemo(() => {
    if (!currentVideoId) return null;
    return chapters.find(ch => ch.videoId === currentVideoId) || null;
  }, [currentVideoId, chapters]);
  
  // Completed chapters list
  const completedChapters = useMemo(() => {
    if (!progress) return [];
    return progress.completedChapters.map(String);
  }, [progress]);
  
  // Course statistics
  const courseStats = useMemo((): CourseStats => {
    const completedCount = completedChapters.length;
    const totalChapters = chapters.length;
    const progressPercentage = totalChapters > 0 
      ? Math.round((completedCount / totalChapters) * 100) 
      : 0;
    const totalDuration = chapters.reduce((sum, ch) => sum + (ch.chapter.duration || 0), 0);
    
    return {
      completedCount,
      totalChapters,
      progressPercentage,
      totalDuration,
    };
  }, [completedChapters, chapters]);
  
  // User permissions
  const isOwner = Boolean(user?.id && user.id === course.userId);
  const canAccessCourse = useMemo(() => {
    if (course.isShared) return true;
    if (currentChapter?.chapter.isFree) return true;
    return !!user?.subscriptionPlan;
  }, [course.isShared, currentChapter, user?.subscriptionPlan]);
  
  // ============================================================================
  // Context Value
  // ============================================================================
  
  const value: CourseModuleContextValue = useMemo(() => ({
    // Course data
    course,
    chapters,
    currentChapter,
    
    // Progress data
    progress,
    completedChapters,
    courseStats,
    
    // User context
    user,
    isGuest,
    isOwner,
    canAccessCourse,
    
    // Video state
    currentVideoId,
    
    // Actions
    markChapterCompleted,
    setCurrentChapter,
    refreshProgress,
    
    // Loading states
    isLoadingProgress,
  }), [
    course,
    chapters,
    currentChapter,
    progress,
    completedChapters,
    courseStats,
    user,
    isGuest,
    isOwner,
    canAccessCourse,
    currentVideoId,
    markChapterCompleted,
    setCurrentChapter,
    refreshProgress,
    isLoadingProgress,
  ]);
  
  return (
    <CourseModuleContext.Provider value={value}>
      {children}
    </CourseModuleContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access course module context
 * 
 * @throws {Error} If used outside of CourseModuleProvider
 * 
 * @example
 * ```tsx
 * const { course, currentChapter, markChapterCompleted } = useCourseModule();
 * ```
 */
export function useCourseModule(): CourseModuleContextValue {
  const context = useContext(CourseModuleContext);
  
  if (!context) {
    throw new Error('useCourseModule must be used within a CourseModuleProvider');
  }
  
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to access only course data (lighter dependency)
 */
export function useCourseData() {
  const { course, chapters, currentChapter } = useCourseModule();
  return { course, chapters, currentChapter };
}

/**
 * Hook to access only progress data
 */
export function useCourseProgressData() {
  const { progress, completedChapters, courseStats, refreshProgress } = useCourseModule();
  return { progress, completedChapters, courseStats, refreshProgress };
}

/**
 * Hook to access only user permissions
 */
export function useCoursePermissions() {
  const { user, isGuest, isOwner, canAccessCourse } = useCourseModule();
  return { user, isGuest, isOwner, canAccessCourse };
}

/**
 * Hook to access chapter actions
 */
export function useCourseActions() {
  const { markChapterCompleted, setCurrentChapter, refreshProgress } = useCourseModule();
  return { markChapterCompleted, setCurrentChapter, refreshProgress };
}
