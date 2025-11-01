"use client"

import React, { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { markChapterCompleted } from "@/store/slices/courseProgress-slice"
import { setPiPActive, setPiPVideoData } from "@/store/slices/course-slice"
import { useToast } from "@/components/ui/use-toast"
import { setCurrentVideoApi } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import { formatDuration } from "../utils/formatUtils"
import { getColorClasses } from "@/lib/utils"
import type { BookmarkData } from "./video/types"
import { useVideoState } from "./video/hooks/useVideoState"
import { useProgressMutation, flushProgress } from "@/services/enhanced-progress/client_progress_queue"
import { SignInPrompt } from "@/components/shared"
import { migratedStorage } from "@/lib/storage"
import { setVideoProgress } from "@/store/slices/courseProgress-slice"
import { useSession } from "next-auth/react"
import { storageManager } from "@/utils/storage-manager"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { renderCourseDashboard } from "./CourseDetailsShell"
import CertificateModal from "./CertificateModal"
import AnimatedCourseAILogo from "./video/components/AnimatedCourseAILogo"
import { CourseModuleProvider, useCourseModule, useCoursePermissions, useCourseProgressData, type ChapterEntry } from "../context/CourseModuleContext"
import { VideoPlayerSection } from "./sections/VideoPlayerSection"
import MainContentInner from "./MainContentInner"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
  isFullscreen?: boolean
}

// State management with useReducer
interface ComponentState {
  showCertificate: boolean
  resumePromptShown: boolean
  isVideoLoading: boolean
  hasPlayedFreeVideo: boolean
  showAuthPrompt: boolean
  mobilePlaylistOpen: boolean
  autoplayMode: boolean
  headerCompact: boolean
  sidebarCollapsed: boolean
  isTheaterMode: boolean
  mounted: boolean
}

type ComponentAction =
  | { type: "SET_CERTIFICATE_VISIBLE"; payload: boolean }
  | { type: "SET_RESUME_PROMPT_SHOWN"; payload: boolean }
  | { type: "SET_VIDEO_LOADING"; payload: boolean }
  | { type: "SET_FREE_VIDEO_PLAYED"; payload: boolean }
  | { type: "SET_AUTH_PROMPT"; payload: boolean }
  | { type: "SET_MOBILE_PLAYLIST_OPEN"; payload: boolean }
  | { type: "SET_AUTOPLAY_MODE"; payload: boolean }
  | { type: "SET_HEADER_COMPACT"; payload: boolean }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "SET_THEATER_MODE"; payload: boolean }
  | { type: "SET_MOUNTED"; payload: boolean }

const initialState: ComponentState = {
  showCertificate: false,
  resumePromptShown: false,
  isVideoLoading: true,
  hasPlayedFreeVideo: false,
  showAuthPrompt: false,
  mobilePlaylistOpen: false,
  autoplayMode: false,
  headerCompact: false,
  sidebarCollapsed: false,
  isTheaterMode: false,
  mounted: false,
}

function stateReducer(state: ComponentState, action: ComponentAction): ComponentState {
  switch (action.type) {
    case "SET_CERTIFICATE_VISIBLE":
      return { ...state, showCertificate: action.payload }
    case "SET_RESUME_PROMPT_SHOWN":
      return { ...state, resumePromptShown: action.payload }
    case "SET_VIDEO_LOADING":
      return { ...state, isVideoLoading: action.payload }
    case "SET_FREE_VIDEO_PLAYED":
      return { ...state, hasPlayedFreeVideo: action.payload }
    case "SET_AUTH_PROMPT":
      return { ...state, showAuthPrompt: action.payload }
    case "SET_MOBILE_PLAYLIST_OPEN":
      return { ...state, mobilePlaylistOpen: action.payload }
    case "SET_AUTOPLAY_MODE":
      return { ...state, autoplayMode: action.payload }
    case "SET_HEADER_COMPACT":
      return { ...state, headerCompact: action.payload }
    case "SET_SIDEBAR_COLLAPSED":
      return { ...state, sidebarCollapsed: action.payload }
    case "SET_THEATER_MODE":
      return { ...state, isTheaterMode: action.payload }
    case "SET_MOUNTED":
      return { ...state, mounted: action.payload }
    default:
      return state
  }
}

// Helper function to validate chapter
function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
    typeof chapter === "object" &&
    chapter.id &&
    (typeof chapter.id === "string" || typeof chapter.id === "number"),
  )
}



// ============================================================================
// Wrapper Component - Provides CourseModuleContext
// ============================================================================
const MainContent: React.FC<ModernCoursePageProps> = ({ course, initialChapterId, isFullscreen = false }) => {
  // Build chapters list for context
  const chapters: ChapterEntry[] = useMemo(() => {
    const chaptersList: ChapterEntry[] = []
    
    if (!course?.courseUnits) return chaptersList
    
    course.courseUnits.forEach((unit, unitIndex) => {
      if (!unit.chapters) return
      
      unit.chapters
        .filter((chapter) => Boolean(chapter && chapter.id && chapter.videoId))
        .forEach((chapter, chapterIndex) => {
          chaptersList.push({
            chapter: {
              id: Number(chapter.id),
              title: chapter.title || `Chapter ${unitIndex + 1}.${chapterIndex + 1}`,
              description: chapter.description || undefined,
              orderIndex: chapterIndex,
              isFree: Boolean(chapter.isFree) || chapterIndex < 2,
              duration: (chapter as any).videoDuration || (chapter as any).duration || 0,
            },
            videoId: chapter.videoId!,
            isCompleted: false, // Will be populated by context
          })
        })
    })
    
    return chaptersList
  }, [course])
  
  return (
    <CourseModuleProvider course={course} chapters={chapters}>
      <MainContentInner 
        course={course} 
        initialChapterId={initialChapterId} 
        isFullscreen={isFullscreen} 
      />
    </CourseModuleProvider>
  )
}

export default React.memo(MainContent)