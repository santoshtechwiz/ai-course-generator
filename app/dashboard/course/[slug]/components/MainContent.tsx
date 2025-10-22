"use client"

import React, { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { markChapterCompleted } from "@/store/slices/courseProgress-slice"
import { setPiPActive, setPiPVideoData } from "@/store/slices/course-slice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Menu,
  X,
  BookOpen,
  Zap,
  Loader2
} from "lucide-react"
import { setCurrentVideoApi } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsTabs from "./CourseDetailsTabs"
import { formatDuration } from "../utils/formatUtils"
import { VideoDebug } from "./video/components/VideoDebug"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/modules/auth"
import ActionButtons from "./ActionButtons"
import ReviewsSection from "./ReviewsSection"
import { cn, getColorClasses } from "@/lib/utils"
import type { BookmarkData } from "./video/types"
import { useCourseProgressSync } from "@/hooks/useCourseProgressSync"
import { useVideoState } from "./video/hooks/useVideoState"
import { useProgressMutation, flushProgress } from "@/services/enhanced-progress/client_progress_queue"
import { SignInPrompt, SubscriptionUpgrade } from "@/components/shared"
import { migratedStorage } from "@/lib/storage"
import VideoGenerationSection from "./VideoGenerationSection"
import MobilePlaylistCount from "@/components/course/MobilePlaylistCount"
import { setVideoProgress } from "@/store/slices/courseProgress-slice"
import { ProgressEventType } from "@/types/progress-events"

// Guest system imports
import { useGuestProgress } from "@/hooks/useGuestProgress"
import { GuestProgressIndicator, ContextualSignInPrompt } from "@/components/guest"
import { useSession } from "next-auth/react"

// Import components
import DraggablePiPPlayer from "./video/components/DraggablePiPPlayer"
import VideoPlayer from "./video/components/VideoPlayer"
import CertificateModal from "./CertificateModal"
import VideoNavigationSidebar from "./ChapterPlaylist"
import MobilePlaylistOverlay from "./MobilePlaylistOverlay"
import { storageManager } from "@/utils/storage-manager"
import { useBookmarks } from "@/hooks/use-bookmarks"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
  isFullscreen?: boolean
}

// State management with useReducer for better organization
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
  | { type: 'SET_CERTIFICATE_VISIBLE'; payload: boolean }
  | { type: 'SET_RESUME_PROMPT_SHOWN'; payload: boolean }
  | { type: 'SET_VIDEO_LOADING'; payload: boolean }
  | { type: 'SET_FREE_VIDEO_PLAYED'; payload: boolean }
  | { type: 'SET_AUTH_PROMPT'; payload: boolean }
  | { type: 'SET_MOBILE_PLAYLIST_OPEN'; payload: boolean }
  | { type: 'SET_AUTOPLAY_MODE'; payload: boolean }
  | { type: 'SET_HEADER_COMPACT'; payload: boolean }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_THEATER_MODE'; payload: boolean }
  | { type: 'SET_MOUNTED'; payload: boolean }

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
    case 'SET_CERTIFICATE_VISIBLE':
      return { ...state, showCertificate: action.payload }
    case 'SET_RESUME_PROMPT_SHOWN':
      return { ...state, resumePromptShown: action.payload }
    case 'SET_VIDEO_LOADING':
      return { ...state, isVideoLoading: action.payload }
    case 'SET_FREE_VIDEO_PLAYED':
      return { ...state, hasPlayedFreeVideo: action.payload }
    case 'SET_AUTH_PROMPT':
      return { ...state, showAuthPrompt: action.payload }
    case 'SET_MOBILE_PLAYLIST_OPEN':
      return { ...state, mobilePlaylistOpen: action.payload }
    case 'SET_AUTOPLAY_MODE':
      return { ...state, autoplayMode: action.payload }
    case 'SET_HEADER_COMPACT':
      return { ...state, headerCompact: action.payload }
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload }
    case 'SET_THEATER_MODE':
      return { ...state, isTheaterMode: action.payload }
    case 'SET_MOUNTED':
      return { ...state, mounted: action.payload }
    default:
      return state
  }
}

// Loading skeleton component
const VideoSkeleton = () => (
  <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20 rounded-lg">
    <div className="flex flex-col items-center gap-3 text-white">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="text-sm font-medium">Loading video...</span>
    </div>
  </div>
)

// Helper function to validate chapter
function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
      typeof chapter === "object" &&
      chapter.id && 
      (typeof chapter.id === "string" || typeof chapter.id === "number")
  )
}

const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)

const MainContent: React.FC<ModernCoursePageProps> = ({ 
  course, 
  initialChapterId,
  isFullscreen = false
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { status } = useSession()
  const { buttonPrimary, buttonSecondary, buttonIcon, cardPrimary, cardSecondary, badgeType, badgeStatus } = getColorClasses()

  // Global PiP state
  const { isPiPActive } = useAppSelector((state) => state.course)

  // Guest system hooks
  const {
    isGuest,
    currentCourseProgress,
    markGuestChapterCompleted,
    setGuestCurrentChapter,
    getGuestCompletionStats,
    trackGuestVideoWithCourse
  } = useGuestProgress(course.id)

  // Debug logging removed

  // Use reducer for state management
  const [state, dispatch2] = useReducer(stateReducer, initialState)

  // Additional state that doesn't need to be in reducer
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)
  const [currentVideoProgress, setCurrentVideoProgress] = useState<number>(0)

  const isOwner = Boolean(user?.id && user.id === course.userId)

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const { courseProgress, refetch: refreshProgressFromServer } = useCourseProgressSync(course.id)
  
  // Get video state store
  const videoStateStore = useVideoState


  // Load bookmarks from database and sync with Redux
  const { bookmarks: dbBookmarks, loading: bookmarksLoading } = useBookmarks({ 
    courseId: course.id,
    limit: 5 // Limit to 5 bookmarks
  })

  // Sync database bookmarks with Redux state on mount
  useEffect(() => {
    if (!bookmarksLoading && dbBookmarks.length > 0 && currentVideoId) {
      try {
        const state = videoStateStore.getState()
        const existingBookmarks = (state?.bookmarks as Record<string, any[]>) || {}
        
        // Only update if we don't already have bookmarks for this video
        if (!existingBookmarks[currentVideoId] || existingBookmarks[currentVideoId].length === 0) {
          const videoBookmarks = dbBookmarks
            .filter((bookmark: { videoId: string }) => bookmark.videoId === currentVideoId)
            .map((bookmark: any) => ({
              id: bookmark.id,
              videoId: bookmark.videoId || currentVideoId,
              time: bookmark.timestamp || 0,
              title: bookmark.note || `Bookmark at ${Math.floor((bookmark.timestamp || 0) / 60)}:${((bookmark.timestamp || 0) % 60).toString().padStart(2, '0')}`,
              description: bookmark.note || '',
              createdAt: bookmark.createdAt
            }))
          
          if (videoBookmarks.length > 0) {
            // Update Redux state with database bookmarks
            const updatedBookmarks = {
              ...existingBookmarks,
              [currentVideoId]: videoBookmarks
            }
            videoStateStore.setState({ bookmarks: updatedBookmarks })
          }
        }
      } catch (error) {
        console.warn('Failed to sync bookmarks from database:', error)
      }
    }
  }, [dbBookmarks, bookmarksLoading, currentVideoId, videoStateStore])
  const getVideoBookmarks = useCallback((videoId?: string | null) => {
    try {
      const key = String(videoId ?? "")
      const state = videoStateStore.getState()
      const bookmarks = (state?.bookmarks as Record<string, any[]>) || {}
      return Array.isArray(bookmarks[key]) ? bookmarks[key] : []
    } catch (e) {
      console.warn("Failed to get video bookmarks:", e)
      return []
    }
  }, [videoStateStore])

  // Memoized video bookmarks
  const bookmarkItems: BookmarkData[] = useMemo(() => {
    try {
      const raw = getVideoBookmarks(currentVideoId)
      if (!Array.isArray(raw)) return []
      return raw.slice(0, 5) // Limit bookmarks to 5
    } catch {
      return []
    }
  }, [currentVideoId, getVideoBookmarks])

  // Completed chapters tracking - support both authenticated and guest users
  const reduxProgress = useAppSelector((state) => selectCourseProgressById(state, course.id))
  const completedChapters = useMemo(() => {
    if (user?.id) {
      // Authenticated user - get from Redux state
      // First check Redux state for immediate updates
      if (reduxProgress?.videoProgress?.completedChapters) {
        return reduxProgress.videoProgress.completedChapters.map(String)
      }
      
      // Fallback to sync hook data
      if (courseProgress?.videoProgress?.completedChapters) {
        return courseProgress.videoProgress.completedChapters.map(String)
      }
      
      return []
    } else {
      // Guest user - get from guest progress
      const guestProgress = currentCourseProgress;
      if (guestProgress?.completedChapters && Array.isArray(guestProgress.completedChapters)) {
        // Return array of completed chapter IDs (as strings)
        return guestProgress.completedChapters.map(String)
      }
      return []
    }
  }, [user?.id, reduxProgress, courseProgress, currentCourseProgress])

  // Defensive runtime check: log if completedChapters is not an array to help debug "completedChapters is not a function"
  useEffect(() => {
    try {
      if (!Array.isArray(completedChapters)) {
        console.error('[MainContent] completedChapters has unexpected type', typeof completedChapters, completedChapters)
      }
    } catch (e) {
      console.error('[MainContent] Error during completedChapters type check', e)
    }
  }, [completedChapters])

  // Redux state debug removed

  // Initialize mounted state and preferences
  useEffect(() => {
    dispatch2({ type: 'SET_MOUNTED', payload: true })
    
    const freeVideoPlayed = migratedStorage.getPreference("played_free_video", false)
    dispatch2({ type: 'SET_FREE_VIDEO_PLAYED', payload: Boolean(freeVideoPlayed) })
    
    try {
      const courseSettings = storageManager.getCourseSettings(course.id.toString())
      dispatch2({ type: 'SET_AUTOPLAY_MODE', payload: courseSettings.autoplayMode || false })
    } catch (error) {
      console.warn("Failed to load course settings:", error)
    }
  }, [course.id])

  // Memoized video playlist with error handling
  const videoPlaylist = useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapterType }[] = []
    
    if (!course?.courseUnits) {
      console.warn("No course units available for playlist")
      return playlist
    }

    let globalIndex = 0

    try {
      course.courseUnits.forEach((unit) => {
        if (!unit.chapters) return

        unit.chapters
          .filter((chapter) => {
            const isValid = Boolean(
              chapter &&
                typeof chapter === "object" &&
                chapter.id &&
                chapter.videoId &&
                typeof chapter.videoId === "string"
            )

            if (!isValid && chapter) {
              console.debug(`Skipping invalid chapter:`, {
                id: chapter.id,
                title: chapter.title,
                hasVideoId: !!chapter.videoId,
              })
            }

            return isValid
          })
          .forEach((chapter) => {
            const safeChapter = {
              ...chapter,
              description: chapter.description === null ? undefined : chapter.description,
              isFree: Boolean(chapter.isFree) || globalIndex < 2,
            } as FullChapterType

            playlist.push({ videoId: chapter.videoId!, chapter: safeChapter })
            globalIndex += 1
          })
      })
    } catch (error) {
      console.error("Error processing course units:", error)
    }

    return playlist
  }, [course.courseUnits])

  // Pre-populate videoDurations from chapter data to enable progress display on initial load
  useEffect(() => {
    const durations: Record<string, number> = {}
    
    videoPlaylist.forEach(({ videoId, chapter }) => {
      // Try to get duration from chapter data
      if (chapter?.videoDuration && typeof chapter.videoDuration === 'number' && chapter.videoDuration > 0) {
        durations[videoId] = chapter.videoDuration
      } else if (chapter?.duration && typeof chapter.duration === 'number' && chapter.duration > 0) {
        // Fallback to duration property
        durations[videoId] = chapter.duration
      }
      // Else: Will be updated when handleVideoLoad is called
    })
    
    if (Object.keys(durations).length > 0) {
      // Pre-populated video durations from chapter metadata
      setVideoDurations(prev => ({ ...prev, ...durations }))
    }
  }, [videoPlaylist])

  // Current chapter and navigation
  const currentChapter = useMemo(() => {
    if (!currentVideoId) return undefined
    return videoPlaylist.find((entry) => entry.videoId === currentVideoId)?.chapter
  }, [currentVideoId, videoPlaylist])

  const currentIndex = useMemo(() => {
    return videoPlaylist.findIndex((entry) => entry.videoId === currentVideoId)
  }, [currentVideoId, videoPlaylist])

  const isLastVideo = useMemo(() => {
    return currentIndex === videoPlaylist.length - 1
  }, [currentIndex, videoPlaylist])

  // Next video details
  const nextVideoEntry = useMemo(() => {
    if (currentIndex >= 0 && currentIndex + 1 < videoPlaylist.length) {
      return videoPlaylist[currentIndex + 1]
    }
    return null
  }, [currentIndex, videoPlaylist])

  const nextVideoId = nextVideoEntry?.videoId || null
  const nextVideoTitle = nextVideoEntry?.chapter?.title || ''
  const hasNextVideo = Boolean(nextVideoEntry)

  // User subscription status
  const userSubscription = useMemo(() => {
    return user?.subscriptionPlan || null
  }, [user?.subscriptionPlan])

  // Video access permission - allow all videos for shared courses
  const canPlayVideo = useMemo(() => {
    if (course.isShared) return true // All videos accessible for shared courses
    const allowedByChapter = currentChapter?.isFree === true
    return allowedByChapter || !!userSubscription
  }, [course.isShared, currentChapter?.isFree, userSubscription])

  // Course statistics
  const courseStats = useMemo(() => ({
    completedCount: completedChapters?.length || 0,
    totalChapters: videoPlaylist.length,
    progressPercentage: videoPlaylist.length > 0 
      ? Math.round(((completedChapters?.length || 0) / videoPlaylist.length) * 100) 
      : 0
  }), [completedChapters, videoPlaylist.length])

  // Build progress object from database for ChapterPlaylist display
  const progressByVideoId = useMemo(() => {
    const progress: Record<string, number> = {}
    
    try {
      // Get progress data from Redux or sync hook. Prefer the freshest source (by lastUpdatedAt).
      let progressData = reduxProgress?.videoProgress || courseProgress?.videoProgress
      try {
        const reduxUpdated = reduxProgress?.lastUpdatedAt || 0
        const courseUpdated = courseProgress?.lastUpdatedAt || 0

        // Prefer the freshest object for scalar fields but always merge lastPositions
        if (reduxProgress && courseProgress) {
          progressData = courseUpdated >= reduxUpdated ? courseProgress.videoProgress : reduxProgress.videoProgress
        }

        // Always merge lastPositions from both sources into a combined map.
        // For each chapter key prefer the value from the freshest source (courseUpdated vs reduxUpdated).
        const reduxLast: Record<string, number> = (reduxProgress?.videoProgress?.lastPositions) || {}
        const courseLast: Record<string, number> = (courseProgress?.videoProgress?.lastPositions) || {}

        const mergedLast: Record<string, number> = { ...reduxLast }
        // Copy courseLast entries, preferring course value when course is newer
        Object.keys(courseLast).forEach((k) => {
          const courseVal = courseLast[k]
          const reduxVal = mergedLast[k]
          if (typeof reduxVal === 'undefined') {
            mergedLast[k] = courseVal
          } else {
            // If both exist, choose based on which source is newer
            mergedLast[k] = courseUpdated >= reduxUpdated ? courseVal : reduxVal
          }
        })

        // Ensure progressData has the merged lastPositions map
        progressData = { ...(progressData || {}), lastPositions: mergedLast }
      } catch (e) {
        console.warn('[MainContent] Error selecting/merging progress sources:', e)
      }
      
  // Building progressByVideoId (debug logs removed)
      
  if (videoPlaylist.length > 0) {
        videoPlaylist.forEach(({ videoId, chapter }) => {
          if (videoId) {
            // Prefer known duration; fallback to a sensible estimate when missing.
            // If savedSeconds exist, use max(savedSeconds, 60) as a conservative duration estimate so percent is meaningful.
            const savedSecondsForChapter = progressData?.lastPositions ? progressData.lastPositions[String(chapter.id)] : undefined
            let videoDuration = videoDurations[videoId]
            if (!videoDuration) {
              if (typeof savedSecondsForChapter === 'number' && savedSecondsForChapter > 0) {
                videoDuration = Math.max(savedSecondsForChapter, 60) // treat saved seconds as minimum duration if unknown
              } else {
                videoDuration = 1 // final fallback to avoid division by zero
              }
            }
    
            // Development-only debug output to help diagnose missing progress
            if (process.env.NODE_ENV !== 'production') {
              try {
                const reduxLast = reduxProgress?.videoProgress?.lastPositions || {}
                const courseLast = courseProgress?.videoProgress?.lastPositions || {}
                const reduxUpdated = reduxProgress?.lastUpdatedAt || 0
                const courseUpdated = courseProgress?.lastUpdatedAt || 0
                console.debug('[MainContent][progressDebug]', {
                  reduxUpdated,
                  courseUpdated,
                  reduxLastSample: Object.keys(reduxLast).slice(0,5),
                  courseLastSample: Object.keys(courseLast).slice(0,5),
                  mergedLastSample: Object.keys(progressData?.lastPositions || {}).slice(0,5),
                  completedChapters: completedChapters.slice(0,10),
                  progressByVideoIdSample: Object.entries(progress).slice(0,10)
                })
              } catch (e) {
                console.debug('[MainContent][progressDebug] failed to print debug info', e)
              }
            }
            
            // Check if this chapter is completed
            const isCompleted = completedChapters.includes(String(chapter.id))
            if (isCompleted) {
              progress[videoId] = 100 // Mark as fully watched
            } 
            // If this is the current chapter, use played seconds
            else if (String(progressData?.currentChapterId) === String(chapter.id)) {
              const playedSeconds = progressData?.playedSeconds || 0
              const percent = Math.min((playedSeconds / videoDuration) * 100, 100)
              progress[videoId] = percent
            }
            // For non-current chapters, check if there's saved progress for this chapter
            else if (progressData?.lastPositions && progressData.lastPositions[String(chapter.id)]) {
              const savedSeconds = progressData.lastPositions[String(chapter.id)]
              const percent = Math.min((savedSeconds / videoDuration) * 100, 100)
              progress[videoId] = percent
            }
            // Otherwise, chapter has no progress
            else {
              progress[videoId] = 0
            }
          }
        })
      }
    } catch (error) {
      console.warn('Failed to build progress object:', error)
    }
    
  // Final progress mapping built (debug logs removed)
    return progress
  }, [reduxProgress, courseProgress, videoPlaylist, videoDurations, completedChapters])

  // Extract lastPositions map for ChapterPlaylist display
  const chapterLastPositions = useMemo(() => {
    try {
      const reduxLast = reduxProgress?.videoProgress?.lastPositions || {}
      const courseLast = courseProgress?.videoProgress?.lastPositions || {}
      const reduxUpdated = reduxProgress?.lastUpdatedAt || 0
      const courseUpdated = courseProgress?.lastUpdatedAt || 0

      // Merge both sources, preferring the fresher data
      const merged: Record<string, number> = { ...reduxLast }
      Object.keys(courseLast).forEach((k) => {
        const courseVal = courseLast[k]
        const reduxVal = merged[k]
        if (typeof reduxVal === 'undefined') {
          merged[k] = courseVal
        } else {
          merged[k] = courseUpdated >= reduxUpdated ? courseVal : reduxVal
        }
      })
      return merged
    } catch (e) {
      console.warn('[MainContent] Error extracting lastPositions:', e)
      return {}
    }
  }, [reduxProgress, courseProgress])

  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    dispatch2({ type: 'SET_CERTIFICATE_VISIBLE', payload: true })
  }, [])

  // Enhanced progress tracking with TanStack Query - only when authenticated
  const { enqueueProgress, flushQueue, isLoading: progressLoading } = useProgressMutation()
  
  // ✅ Chapter progress is now available through useCourseProgressSync (courseProgress)
  // which includes completedChapters, lastPositions, and current chapter data

  // Navigation handlers
  // Advance to next video (chapters are only marked complete when video ends)
  const handleNextVideo = useCallback(async () => {
    if (!hasNextVideo || !nextVideoEntry) {
      if (isLastVideo) {
        console.log('Last video reached. Showing certificate.')
        handleCertificateClick()
      } else {
        console.log('No next video available.')
      }
      return
    }

    const nextVid = nextVideoEntry.videoId
    if (!nextVid) {
      console.error('Next video entry has no videoId')
      return
    }

    console.log(`Advancing to next video: ${nextVid} for chapter ${nextVideoEntry.chapter?.id}`)
    
    // Mark current chapter as completed when manually advancing to next video - ONLY if authenticated AND not a shared view
    if (currentChapter && user?.id && !course.isShared) {
      const currentChapterId = Number(currentChapter.id);
      const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id));
      
      if (!isAlreadyCompleted) {
        console.log(`[Authenticated] Marking current chapter ${currentChapterId} as completed before advancing`);
        
        // Use enhanced progress system for completion
        const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0))
        const success = enqueueProgress(
          user.id,
          course.id,
          currentChapterId,
          ProgressEventType.CHAPTER_COMPLETED,
          100,
          timeSpent,
          {
            courseId: String(course.id),
            chapterId: String(currentChapterId),
            trigger: 'next_click',
            videoDuration: videoDurations[currentVideoId || ''] || 0,
            watchedSeconds: timeSpent,
            completedAt: Date.now()
          }
        )
        
        if (success) {
          // Optimistically update completed chapters
          dispatch(markChapterCompleted({ 
            courseId: Number(course.id), 
            chapterId: currentChapterId, 
            userId: user.id 
          }))
          
          // Trigger background flush for immediate processing
          try {
            await flushQueue()
            // After events are flushed, refresh progress from server so Redux gets updated lastPositions
            await refreshProgressFromServer()
          } catch (err) {
            console.error('Failed to flush progress queue or refresh progress:', err)
          }
        } else {
          console.error('Failed to enqueue chapter completion')
        }
      }
    } else if (!user?.id) {
      console.log('[Unauthenticated] Skipping chapter completion tracking - user not signed in')
    }
    
    dispatch(setCurrentVideoApi(nextVid))
    
    try {
      videoStateStore.getState().setCurrentVideo(nextVid, course.id)
      
      // Track transition to next video with enhanced progress system - ONLY if authenticated AND not a shared view
      if (user?.id && !course.isShared && nextVideoEntry.chapter?.id) {
        console.log(`[Authenticated] Recording video start event for chapter ${nextVideoEntry.chapter.id}`)
        
        // Mark video as started in enhanced progress system
        const success = enqueueProgress(
          user.id,
          course.id,
          nextVideoEntry.chapter.id,
          ProgressEventType.VIDEO_WATCHED,
          0, // initial progress
          0, // initial time spent
          {
            courseId: String(course.id),
            chapterId: String(nextVideoEntry.chapter.id),
            progress: 0,
            playedSeconds: 0,
            duration: 0,
            videoId: nextVid,
            startedAt: Date.now(),
            previouslyCompleted: completedChapters.includes(String(nextVideoEntry.chapter.id))
          }
        )
        
        if (success) {
          console.log(`Video start event queued for chapter ${nextVideoEntry.chapter.id}`)
        } else {
          console.error('Failed to queue video start event')
        }
      } else if (!user?.id) {
        console.log('[Unauthenticated] Skipping video start tracking - user not signed in')
      }
    } catch (e) {
      console.error("Failed to set current video:", e)
    }

    dispatch2({ type: 'SET_VIDEO_LOADING', payload: true })
  }, [
    hasNextVideo,
    nextVideoEntry,
    isLastVideo,
    handleCertificateClick,
    dispatch,
    videoStateStore,
    course.id,
    user?.id,
    dispatch,
    currentChapter,
    completedChapters,
    currentVideoProgress,
    videoDurations,
    currentVideoId,
    markChapterCompleted,
    enqueueProgress
  ])

  // Chapter selection handler with improved error handling
  const handleChapterSelect = useCallback(
    (chapter: { id: string | number; title: string; videoId?: string; isFree?: boolean }) => {
      try {
        if (!chapter) {
          throw new Error("No chapter provided")
        }

        const safeChapter = {
          ...chapter,
          id: String(chapter.id),
        }
        
        if (!validateChapter(safeChapter)) {
          toast({
            title: "Invalid Chapter",
            description: "This chapter appears to be invalid. Please try another one.",
            variant: "destructive",
          })
          return
        }

        const allowed = Boolean(safeChapter.isFree || userSubscription)
        if (!allowed && !course.isShared) {
          dispatch2({ type: 'SET_AUTH_PROMPT', payload: true })
          return
        }

        const videoId = safeChapter.videoId
        if (!videoId) {
          toast({
            title: "Video Unavailable",
            description: "This chapter doesn't have a video available.",
            variant: "destructive",
          })
          return
        }

        dispatch(setCurrentVideoApi(videoId))
        videoStateStore.getState().setCurrentVideo(videoId, course.id)

        // Track chapter selection event - ONLY if authenticated AND not a shared view
        if (user?.id && !course.isShared) {
          console.log(`[Authenticated] Video selected: ${videoId} for chapter ${safeChapter.id}`)
          
          // Mark video as started in enhanced progress system
          // We track all video views, even for completed chapters
          const success = enqueueProgress(
            user.id,
            course.id,
            safeChapter.id,
            'chapter_start',
            0, // initial progress
            0, // initial time spent
            {
              videoId: videoId,
              startedAt: Date.now(),
              previouslyCompleted: completedChapters.includes(String(safeChapter.id))
            }
          )
          
          if (success) {
            console.log(`Video selection event queued for chapter ${safeChapter.id}`)
          } else {
            console.error('Failed to queue video selection event')
          }
          
          // Log completion status for debugging
          const isAlreadyCompleted = completedChapters.includes(String(safeChapter.id))
          if (isAlreadyCompleted) {
            console.log(`Chapter ${safeChapter.id} was already completed. Re-watching.`)
          }
        } else {
          console.log('[Unauthenticated] Skipping chapter selection tracking - user not signed in')
        }

        dispatch2({ type: 'SET_MOBILE_PLAYLIST_OPEN', payload: false })
        dispatch2({ type: 'SET_VIDEO_LOADING', payload: true })
      } catch (error) {
        console.error("Error selecting chapter:", error)
        toast({
          title: "Selection Error",
          description: "There was a problem selecting this chapter. Please try again.",
          variant: "destructive",
        })
      }
    },
    [dispatch, course.id, videoStateStore, toast, userSubscription, user?.id, completedChapters, enqueueProgress]
  )

  // Video event handlers
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      setVideoDurations((prev) => ({
        ...prev, 
        [currentVideoId || ""]: metadata.duration
      }))
      dispatch2({ type: 'SET_VIDEO_LOADING', payload: false })
      
      // Record video load event - ONLY if authenticated AND not a shared view
      if (user?.id && !course.isShared && currentChapter?.id && currentVideoId) {
        console.log(`[Authenticated] Video loaded: ${currentVideoId} with duration ${metadata.duration}s for chapter ${currentChapter.id}`)
        
        // Update the initial video watched event with actual duration using enhanced progress system
        const success = enqueueProgress(
          user.id,
          course.id,
          currentChapter.id,
          ProgressEventType.VIDEO_WATCHED,
          0, // Still at 0% progress
          0, // 0 seconds played
          {
            courseId: String(course.id),
            chapterId: String(currentChapter.id),
            progress: 0,
            playedSeconds: 0,
            duration: metadata.duration,
            videoId: currentVideoId,
            loadedAt: Date.now(),
            eventSubtype: 'video_metadata_loaded'
          }
        )
        
        if (success) {
          console.log(`Video metadata load event queued for chapter ${currentChapter.id}`)
        } else {
          console.error('Failed to queue video metadata load event')
        }
      } else if (!user?.id) {
        console.log(`[Unauthenticated] Video loaded: ${currentVideoId} - skipping progress tracking`)
      }
    },
    [currentVideoId, user?.id, course.isShared, currentChapter?.id, course.id, enqueueProgress]
  )

  const handlePlayerReady = useCallback((player: React.RefObject<any>) => {
    setPlayerRef(player)
    dispatch2({ type: 'SET_VIDEO_LOADING', payload: false })
  }, [])

  const handleSeekToBookmark = useCallback(
    (time: number, title?: string) => {
      if (playerRef?.current) {
        playerRef.current.seekTo(time)
        if (title) {
          toast({
            title: "Bookmark",
            description: `Seeking to "${title}" at ${formatDuration(time)}`
          })
        }
      }
    },
    [playerRef, toast, formatDuration]
  )

  const handleChapterComplete = useCallback((chapterId: string) => {
    // make async by wrapping inner logic in an IIFE to avoid changing signature
    (async () => {
    console.log(`[ChapterPlaylist Callback] Chapter completed: ${chapterId}`)
    
    const chapterIdNum = Number(chapterId)
    const courseIdNum = Number(course.id)
    
    // Only process if authenticated and not a shared view
  if (user?.id && !course.isShared) {
      const isAlreadyCompleted = completedChapters.includes(String(chapterId))
      
      if (!isAlreadyCompleted) {
        console.log(`[ChapterPlaylist] Marking chapter ${chapterId} as completed in database`)
        
        // Update Redux state immediately for UI responsiveness
        dispatch(markChapterCompleted({ 
          courseId: courseIdNum, 
          chapterId: chapterIdNum, 
          userId: user.id 
        }))
        
        // Queue completion event to database
        const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0))
        const success = enqueueProgress(
          user.id,
          courseIdNum,
          chapterIdNum,
          ProgressEventType.CHAPTER_COMPLETED,
          100,
          timeSpent,
          {
            courseId: String(courseIdNum),
            chapterId: String(chapterIdNum),
            trigger: 'playlist_callback',
            videoDuration: videoDurations[currentVideoId || ''] || 0,
            watchedSeconds: timeSpent,
            completedAt: Date.now()
          }
        )
        
        if (success) {
          console.log(`[ChapterPlaylist] Chapter completion queued`)
          try {
            await flushQueue()
            await refreshProgressFromServer()
          } catch (err) {
            console.error('Failed to flush progress or refresh progress:', err)
          }
        }
      }
    }
    })()
  }, [user?.id, course.id, course.isShared, completedChapters, currentVideoProgress, videoDurations, currentVideoId, dispatch, enqueueProgress, flushQueue])

  // Handle progress update from ChapterPlaylist
  const handleProgressUpdate = useCallback((chapterId: string, progress: number) => {
    console.log(`[ChapterPlaylist Callback] Progress update - Chapter: ${chapterId}, Progress: ${progress}%`)
    
    if (user?.id && !course.isShared && currentVideoId) {
      // Find the chapter to get its video ID
      const chapter = videoPlaylist.find(v => String(v.chapter.id) === String(chapterId))
      if (chapter && chapter.videoId === currentVideoId) {
        // Update Redux state
        dispatch(setVideoProgress({
          courseId: String(course.id),
          chapterId: Number(chapterId),
          progress,
          playedSeconds: Math.round((progress / 100) * (videoDurations[currentVideoId] || 0)),
          completed: progress >= 95,
          userId: user.id
        }))
        
        console.log(`[ChapterPlaylist] Progress state updated: ${progress}%`)
      }
    }
  }, [user?.id, course.id, course.isShared, currentVideoId, videoPlaylist, videoDurations, dispatch])

  const handlePIPToggle = useCallback((activatePiP?: boolean, currentTime?: number) => {
    const shouldActivate = activatePiP ?? false

    dispatch(setPiPActive(shouldActivate))
    if (shouldActivate) {
      // Get current video time from parameter or fallback to video state store
      const videoTime = currentTime || videoStateStore.getState().videoProgress[currentVideoId || '']?.playedSeconds || 0

      // Set PiP video data with current playback time
      dispatch(setPiPVideoData({
        youtubeVideoId: currentVideoId || '',
        chapterId: currentChapter?.id?.toString(),
        courseId: course.id,
        courseName: course.title,
        chapterTitle: currentChapter?.title || '',
        currentTime: videoTime
      }))
      toast({
        title: "Picture-in-Picture",
        description: "Video is now playing in a separate window."
      })
    } else {
      // Clear PiP video data
      dispatch(setPiPVideoData(undefined))
    }
  }, [currentVideoId, currentChapter, course.id, course.title, videoStateStore])

  const handleTheaterModeToggle = useCallback((newTheaterMode: boolean) => {
    dispatch2({ type: 'SET_THEATER_MODE', payload: newTheaterMode })
  }, [])

  const handleAutoplayToggle = useCallback(() => {
    const newMode = !state.autoplayMode
    dispatch2({ type: 'SET_AUTOPLAY_MODE', payload: newMode })
    
    try { 
      storageManager.saveCourseSettings(course.id.toString(), { autoplayMode: newMode }) 
    } catch (error) {
      console.warn("Failed to save autoplay preference:", error)
    }
    
    toast({
      title: newMode ? "Auto-advance Enabled" : "Manual Mode",
      description: newMode
        ? "Chapters will advance automatically when completed"
        : "You'll be prompted before each chapter transition",
    })
  }, [course.id, toast, state.autoplayMode])

  // (moved) progress tracking hook is now declared earlier

  // Progress tracking using new event system - handles both authenticated and guest users
  const handleVideoProgress = useCallback((progressState: { played: number, playedSeconds: number }) => {
    // Update local state for current video progress (always do this for UI)
    setCurrentVideoProgress(progressState.played)

    // Only send meaningful progress updates (skip very early progress)
    if (progressState.played > 0.05) { // Skip first 5% to reduce noise
      if (currentChapter?.id && currentVideoId) {
        
        if (user?.id && !course.isShared) {
          // Authenticated user - track in database (ONLY if not a shared view)
          console.log(`[Authenticated] Video progress: ${progressState.played * 100}% for chapter ${currentChapter.id}`)
          
          // Update Redux store for immediate UI feedback
          dispatch(setVideoProgress({
            courseId: String(course.id),
            chapterId: Number(currentChapter.id),
            progress: progressState.played * 100,
            playedSeconds: progressState.playedSeconds,
            completed: false, // Don't mark as completed during progress updates
            userId: user.id
          }))
          
          // Track continuous progress with enhanced system
          const success = enqueueProgress(
            user.id,
            course.id,
            currentChapter.id,
            ProgressEventType.VIDEO_WATCHED,
            progressState.played * 100,
            progressState.playedSeconds,
            {
              courseId: String(course.id),
              chapterId: String(currentChapter.id),
              progress: progressState.played * 100,
              playedSeconds: progressState.playedSeconds,
              duration: videoDurations[currentVideoId] || 0,
              videoId: currentVideoId,
              totalDuration: videoDurations[currentVideoId] || 0,
              timestamp: Date.now(),
              eventSubtype: 'continuous_progress'
            }
          )
          
          if (success) {
            console.log(`Progress update queued: ${Math.floor(progressState.played * 100)}% for chapter ${currentChapter.id}`)
          }
          
          // Sync progress periodically (every 25% completion or major milestones)
          const progressPercent = Math.floor(progressState.played * 100)
          if (progressPercent % 25 === 0 && progressPercent > 0) {
            // Track milestone progress with enhanced system
            const success = enqueueProgress(
              user.id,
              course.id,
              currentChapter.id,
              ProgressEventType.VIDEO_WATCHED,
              progressPercent,
              Math.round(progressState.playedSeconds),
              {
                courseId: String(course.id),
                chapterId: String(currentChapter.id),
                progress: progressPercent,
                playedSeconds: Math.round(progressState.playedSeconds),
                duration: videoDurations[currentVideoId] || 0,
                videoId: currentVideoId,
                milestone: progressPercent,
                totalDuration: videoDurations[currentVideoId] || 0,
                timestamp: Date.now(),
                eventSubtype: 'progress_milestone'
              }
            )
            
            if (success) {
              console.log(`Progress milestone ${progressPercent}% queued for chapter ${currentChapter.id}`)
            } else {
              console.error(`Failed to queue progress milestone ${progressPercent}%`)
            }
          }
        } else {
          // Guest user OR shared view - track in local storage
          console.log(`[Guest/Shared] Video progress: ${progressState.played * 100}% for chapter ${currentChapter.id}`)
          
          trackGuestVideoWithCourse(
            currentVideoId,
            progressState.played * 100,
            progressState.playedSeconds,
            videoDurations[currentVideoId] || 0,
            course.id
          )
        }
      }
    }
  }, [user?.id, course.isShared, currentChapter?.id, course.id, currentVideoId, videoDurations, setCurrentVideoProgress, dispatch, enqueueProgress, trackGuestVideoWithCourse])

  const handleVideoEnded = useCallback(() => {
    console.log(`Video ended handler called - currentChapter: ${currentChapter?.id}, isCompleted: ${completedChapters.includes(String(currentChapter?.id))}`)
    
    // Immediately update Redux state for UI responsiveness
    if (currentChapter) {
      const chapterId = Number(currentChapter.id);
      const courseId = Number(course.id);
      
      if (user?.id && !course.isShared) {
        // Authenticated user - handle database completion (ONLY if not a shared view)
        const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id));
        
        if (!isAlreadyCompleted) {
          // Mark as completed in Redux state (local UI update)
          console.log(`[Authenticated] Marking chapter ${chapterId} as completed for course ${courseId}`);
          dispatch(markChapterCompleted({ courseId, chapterId, userId: user.id }));
        } else {
          console.log(`[Authenticated] Chapter ${chapterId} was already completed. Updating progress only.`);
        }
        
        // Update video progress in Redux state
        dispatch(setVideoProgress({
          courseId: String(courseId),
          chapterId: chapterId,
          progress: 100,
          playedSeconds: Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0)),
          completed: true,
          userId: user.id
        }));
        
        // Send completion to enhanced progress system
        console.log(`[Authenticated] Chapter ${chapterId} completed for course ${courseId} - Recording in enhanced progress system`);
        
        // Always dispatch chapter completed event to ensure it's recorded
        const success = enqueueProgress(
          user.id,
          courseId,
          chapterId,
          ProgressEventType.CHAPTER_COMPLETED,
          100, // 100% progress
          Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0)),
          {
            courseId: String(courseId),
            chapterId: String(chapterId),
            videoId: currentVideoId,
            completedAt: Date.now(),
            completedVia: 'video_end',
            finalProgress: 100,
            totalDuration: videoDurations[currentVideoId || ''] || 0
          }
        )
        
        if (success) {
          console.log(`Chapter completion queued for chapter ${chapterId}`)
        } else {
          console.error('Failed to queue chapter completion')
        }
      } else {
        // Guest user OR shared view - handle local storage completion
        console.log(`[Guest/Shared] Marking chapter ${chapterId} as completed for course ${courseId}`);
        
        markGuestChapterCompleted(chapterId);
        
        // Track guest video completion
        trackGuestVideoWithCourse(
          currentVideoId || '',
          100,
          Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0)),
          videoDurations[currentVideoId] || 0,
          course.id
        );
      }
      
      // Handle autoplay if enabled - for both authenticated and guest users
      if (state.autoplayMode && hasNextVideo && nextVideoEntry) {
        console.log(`Autoplay enabled. Advancing to next video in 1 second`);
        setTimeout(() => {
          handleNextVideo();
        }, 1000); // Small delay before advancing
      } else if (!state.autoplayMode) {
        console.log('Autoplay disabled. Not advancing to next video automatically.');
      } else if (!hasNextVideo) {
        console.log('No next video available. Reached end of playlist.');
      }
    }

    // Show certificate if last video
    if (isLastVideo) {
      handleCertificateClick()
    }
  }, [
    currentChapter,
    completedChapters,
    dispatch,
    course.id,
    course.isShared,
    currentVideoProgress,
    videoDurations,
    currentVideoId,
    isLastVideo,
    handleCertificateClick,
    user?.id,
    state.autoplayMode,
    hasNextVideo,
    nextVideoEntry,
    handleNextVideo,
    enqueueProgress,
    markGuestChapterCompleted,
    trackGuestVideoWithCourse
  ])

  // Initialize video selection
  useEffect(() => {
    if (videoPlaylist.length === 0) return

    let targetVideo = initialChapterId
      ? videoPlaylist.find((entry) => String(entry.chapter.id) === initialChapterId)
      : null

    if (!targetVideo && currentVideoId) {
      targetVideo = videoPlaylist.find((entry) => entry.videoId === currentVideoId)
    }

    if (!targetVideo && courseProgress?.videoProgress?.currentChapterId) {
      targetVideo = videoPlaylist.find(
        (entry) => String(entry.chapter.id) === String(courseProgress.videoProgress.currentChapterId)
      )
    }

    if (!targetVideo && videoPlaylist.length > 0) {
      targetVideo = videoPlaylist[0]
    }

    if (targetVideo?.videoId) {
      dispatch(setCurrentVideoApi(targetVideo.videoId))
      videoStateStore.getState().setCurrentVideo(targetVideo.videoId, course.id)
    }
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, courseProgress])

  // Reset current video progress when video changes
  useEffect(() => {
    setCurrentVideoProgress(0)
  }, [currentVideoId])

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      dispatch2({ type: 'SET_HEADER_COMPACT', payload: window.scrollY > 100 })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Flush progress on page unload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force flush any pending progress events
      flushProgress().catch(console.error)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Sidebar course data - deduplicated by videoId
  const sidebarCourse = useMemo(() => {
    // Deduplicate chapters by videoId to prevent YouTube-style playlist duplication
    const seen = new Set<string>()
    const uniqueChapters = videoPlaylist
      .filter(v => {
        const vid = v.chapter.videoId
        if (!vid || seen.has(vid)) return false
        seen.add(vid)
        return true
      })
      .map(v => ({
        id: String(v.chapter.id),
        title: v.chapter.title,
        videoId: v.chapter.videoId || undefined,
        duration: typeof v.chapter.duration === 'number' ? v.chapter.duration : undefined,
        isFree: v.chapter.isFree
      }))

    return {
      id: String(course.id),
      title: course.title,
      chapters: uniqueChapters
    }
  }, [course.id, course.title, videoPlaylist])
  
  const sidebarCurrentChapter = currentChapter ? {
    id: String(currentChapter.id),
    title: currentChapter.title,
    videoId: currentChapter.videoId || undefined,
    duration: typeof currentChapter.duration === 'number' ? currentChapter.duration : undefined,
    isFree: currentChapter.isFree
  } : null

  // Instead of early return, render auth prompt overlay to preserve hook order stability
  const authPromptOverlay = state.showAuthPrompt ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {!user ? (
          <SignInPrompt
            variant="card"
            context="course"
            feature="course-videos"
            callbackUrl={typeof window !== 'undefined' ? window.location.href : undefined}
            onClose={() => dispatch2({ type: 'SET_AUTH_PROMPT', payload: false })}
          />
        ) : (
          <></>
        )}
      </motion.div>
    </div>
  ) : null

  // Main content
  return (
    <div className="min-h-screen bg-background relative">
      {/* Share course notice banner */}
      {course.isShared && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-2"
        >
          <div className="max-w-screen-2xl mx-auto px-1 sm:px-2">
            <p className="text-sm font-medium text-blue-900">
              📚 <strong>Shared Course Preview</strong> — Watch all videos • Take quiz • Save bookmarks (local only)
            </p>
          </div>
        </motion.div>
      )}

      {/* Debug indicator for testing - REMOVE IN PRODUCTION */}
     
      
      {authPromptOverlay}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b transition-all duration-300",
          state.headerCompact ? "py-0.5" : "py-1"
        )}
      >
        <div className="max-w-screen-2xl mx-auto px-1 sm:px-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <h1 className={cn(
                  "font-bold truncate transition-all duration-300",
                  state.headerCompact ? "text-lg" : "text-xl lg:text-2xl"
                )}>
                  {course.title}
                </h1>
                {!state.headerCompact && (
                  <p className="text-muted-foreground text-xs truncate mt-0.5">
                    {state.mounted && currentChapter?.title || 'Select a chapter to begin'}
                  </p>
                )}
              </div>

              {/* Progress indicator */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>
                    {state.mounted ? `${courseStats.completedCount}/${courseStats.totalChapters}` : `0/${courseStats.totalChapters}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Progress value={state.mounted ? courseStats.progressPercentage : 0} className="h-1.5" />
                  </div>
                  <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary px-2 py-0.5 text-xs">
                    {state.mounted ? courseStats.progressPercentage : 0}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => dispatch2({ type: 'SET_SIDEBAR_COLLAPSED', payload: !state.sidebarCollapsed })}
                className="hidden xl:flex"
              >
                {state.sidebarCollapsed ? (
                  <>
                    <Menu className="h-4 w-4 mr-2" />
                    Show Sidebar
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Hide Sidebar
                  </>
                )}
              </Button>
              <ActionButtons
                slug={course.slug}
                isOwner={isOwner}
                variant="compact"
                title={course.title}
                courseId={course.id}
              />
            </div>
          </div>

          {/* Mobile progress */}
          <div className="lg:hidden mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{courseStats.completedCount} of {courseStats.totalChapters} chapters</span>
              </div>
              <Badge variant="secondary" className="font-medium bg-primary/10 text-primary">
                {courseStats.progressPercentage}% Complete
              </Badge>
            </div>
            <Progress value={courseStats.progressPercentage} className="h-2" />
          </div>
        </div>
        {/* Progress fetch error notice (non-blocking) */}
        {false && (
          <div className="mt-3">
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-destructive h-4 w-4" />
                  <CardTitle className="text-sm">Progress Sync Issue</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    We couldn’t fetch your chapter progress. Some progress indicators may be out of date.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="default" onClick={() => refreshProgressFromServer()}>
                      Retry
                    </Button>
                    <Button size="sm" variant="noShadow" onClick={() => {}}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.header>

      {/* Video generation section for owners */}
      <AnimatePresence>
        {(isOwner || user?.isAdmin) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 border-b"
          >
            <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-4">
              <VideoGenerationSection 
                course={course}
                onVideoGenerated={(chapterId, videoId) => {
                  if (videoId) {
                    dispatch(setCurrentVideoApi(videoId))
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile playlist toggle */}
      {!state.isTheaterMode && (
        <div className="lg:hidden border-b bg-muted/20">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-3">
            <Button
              variant="neutral"
              onClick={() => dispatch2({ type: 'SET_MOBILE_PLAYLIST_OPEN', payload: !state.mobilePlaylistOpen })}
              className="w-full justify-between h-12"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Course Content</div>
                  <div className="text-xs text-muted-foreground">
                    {currentChapter?.title || 'Select a chapter'}
                  </div>
                </div>
              </div>
              <MobilePlaylistCount
                currentIndex={currentIndex}
                hasCurrentChapter={Boolean(currentChapter)}
                total={videoPlaylist.length}
              />
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={cn(
        "transition-all duration-300 scroll-smooth",
        state.isTheaterMode && "bg-black"
      )}>
        <div className={cn(
          "mx-auto transition-all duration-300",
          state.isTheaterMode ? "max-w-none px-0" : "max-w-[1920px] px-1 sm:px-2 py-0.5"
        )}>
          <div className={cn(
            "transition-all duration-300",
            state.sidebarCollapsed || state.isTheaterMode
              ? "flex flex-col max-w-7xl mx-auto"
              : "flex flex-col lg:grid lg:grid-cols-[4fr_320px] xl:grid-cols-[4.5fr_320px] 2xl:grid-cols-[5fr_350px] gap-3 lg:gap-4"
          )}>  
            {/* Video and content area */}
            <div className="space-y-0.5 min-w-0">
              {/* Guest Progress Indicator for unauthenticated users */}
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2"
                >
                  <GuestProgressIndicator 
                    courseId={course.id}
                  />
                </motion.div>
              )}
              
            

              {/* Video player section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative"
              >
                {isPiPActive ? (
                  <Card className={cn(cardSecondary, "overflow-hidden")}>
                    <div className={cn(
                      "bg-muted flex items-center justify-center transition-all duration-300",
                      state.isTheaterMode ? "aspect-[21/9]" : "aspect-video"
                    )}>
                      <div className="text-center p-8">
                        <div className={cn(
                          "w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl",
                          "border-2 border-border",
                          "flex items-center justify-center"
                        )}>
                          <Play className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-black mb-2">Picture-in-Picture Active</h3>
                        <p className="text-muted-foreground text-sm font-medium">
                          Video is playing in a separate window. Click the PIP button to return.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className={cn(
                    cardPrimary,
                    "overflow-hidden w-full aspect-video",
                    state.isTheaterMode && "bg-transparent border-0 shadow-none"
                  )}>  
                    <div className={cn(
                      "bg-black relative transition-all duration-300 w-full",
                      state.isTheaterMode ? "aspect-[21/9]" : "aspect-video"
                    )}>
                      <VideoPlayer
                        youtubeVideoId={currentVideoId || ''}
                        chapterId={currentChapter?.id?.toString()}
                        chapterTitle={currentChapter?.title || ''}
                        bookmarks={bookmarkItems}
                        onProgress={handleVideoProgress}
                        onEnded={handleVideoEnded}
                        onVideoLoad={handleVideoLoad}
                        onPlayerReady={handlePlayerReady}
                        onPictureInPictureToggle={handlePIPToggle}
                        isPiPActive={isPiPActive}
                        onTheaterModeToggle={handleTheaterModeToggle}
                        isTheaterMode={state.isTheaterMode}
                        isLoading={state.isVideoLoading}
                        initialSeekSeconds={(function(){
                          try {
                            if (courseProgress?.videoProgress?.playedSeconds &&
                                String(courseProgress.videoProgress.currentChapterId) === String(currentChapter?.id)) {
                              const ts = Number(courseProgress.videoProgress.playedSeconds)
                              if (!isNaN(ts) && ts > 0) return ts
                            }
                          } catch {}
                          return undefined
                        })()}
                        courseId={course.id}
                        courseName={course.title}
                        autoPlay={state.autoplayMode}
                        onToggleAutoPlay={handleAutoplayToggle}
                        onNextVideo={handleNextVideo}
                        nextVideoId={nextVideoId || undefined}
                        nextVideoTitle={nextVideoTitle}
                        hasNextVideo={hasNextVideo}
                        autoAdvanceNext={state.autoplayMode}
                      />
                    </div>
                  </Card>
                )}
              </motion.div>

              {/* Contextual Sign-In Prompt for Guest Users */}
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="my-4 bg-blue-200 border-2 border-blue-500 p-4 rounded"
                >
                  <div className="text-black font-bold mb-2">SIGN-IN PROMPT TEST</div>
                  <ContextualSignInPrompt 
                    action="continue_course"
                    courseId={String(course.id)}
                  />
                </motion.div>
              )}

              {/* Course details tabs */}
              {!state.isTheaterMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-3">
                      <MemoizedCourseDetailsTabs
                        course={course}
                        currentChapter={currentChapter}
                        onSeekToBookmark={handleSeekToBookmark}
                        completedChapters={completedChapters}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Reviews section */}
              {!state.isTheaterMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-3">
                      <ReviewsSection slug={course.slug} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
              {!state.sidebarCollapsed && !state.isTheaterMode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="hidden lg:block space-y-3 min-w-0 w-full overflow-y-auto scrollbar-hide"
                >
              

                  {/* Playlist */}
                  <Card className={cn(cardSecondary, "flex-1 h-full")}>
                    <CardContent className="p-0">
                      {sidebarCourse.chapters.length === 0 ? (
                        <div className="p-6 text-center">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <h3 className="font-bold mb-1">No Videos Available</h3>
                          <p className="text-sm text-muted-foreground font-medium">
                            This course doesn't have any video content yet.
                          </p>
                        </div>
                      ) : (
                        <VideoNavigationSidebar
                          course={sidebarCourse}
                          currentChapter={sidebarCurrentChapter}
                          courseId={course.id.toString()}
                          currentVideoId={currentVideoId || ''}
                          isAuthenticated={!!user}
                          userSubscription={userSubscription || null}
                          completedChapters={completedChapters.map(String)}
                          formatDuration={formatDuration}
                          videoDurations={videoDurations}
                          courseStats={courseStats}
                          onChapterSelect={handleChapterSelect}
                          progress={progressByVideoId}
                          onProgressUpdate={handleProgressUpdate}
                          onChapterComplete={handleChapterComplete}
                          isProgressLoading={progressLoading}
                          lastPositions={chapterLastPositions}
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile playlist overlay */}
      {!state.isTheaterMode && (
        <MobilePlaylistOverlay
          isOpen={state.mobilePlaylistOpen}
          onClose={() => dispatch2({ type: 'SET_MOBILE_PLAYLIST_OPEN', payload: false })}
          course={sidebarCourse}
          currentChapter={sidebarCurrentChapter}
          courseId={course.id.toString()}
          currentVideoId={currentVideoId || ''}
          isAuthenticated={!!user}
          userSubscription={userSubscription || null}
          completedChapters={completedChapters.map(String)}
          formatDuration={formatDuration}
          videoDurations={videoDurations}
          courseStats={courseStats}
          onChapterSelect={handleChapterSelect}
        />
      )}

      {/* Subscribe CTA */}
      <AnimatePresence>
        {!userSubscription && !state.isTheaterMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              size="lg"
              onClick={() => (window.location.href = "/dashboard/subscription")}
              className={cn(buttonPrimary, "shadow-[4px_4px_0px_0px_hsl(var(--border))]")}
            >
              <Zap className="h-4 w-4 mr-2" />
              <span className="font-bold">Subscribe to Unlock</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate modal */}
      <CertificateModal
        show={state.showCertificate}
        onClose={() => dispatch2({ type: 'SET_CERTIFICATE_VISIBLE', payload: false })}
        courseId={course.id}
        courseTitle={course.title}
        userName={user?.name || null}
        totalLessons={videoPlaylist.length}
      />

      {/* Debug component */}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-4 left-4 z-50">
          <VideoDebug
            videoId={currentVideoId || ''}
            courseId={course.id}
            chapterId={currentChapter?.id ? String(currentChapter.id) : ''}
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(MainContent)