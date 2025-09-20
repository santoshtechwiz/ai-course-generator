"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef, useReducer } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { 
  Lock, 
  User as UserIcon, 
  Play, 
  ChevronLeft, 
  Star,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle,
  Menu,
  X,
  BookOpen,
  Award,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react"
import { store } from "@/store"
import { setCurrentVideoApi } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsTabs, { AccessLevels } from "./CourseDetailsTabs"
import { formatDuration } from "../utils/formatUtils"
import { VideoDebug } from "./video/components/VideoDebug"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/modules/auth"
import ActionButtons from "./ActionButtons"
import ReviewsSection from "./ReviewsSection"
import { cn } from "@/lib/utils"
import type { BookmarkData } from "./video/types"
import { fetchRelatedCourses, fetchQuizSuggestions } from "@/services/recommendationsService"
import type { RelatedCourse, PersonalizedRecommendation, QuizSuggestion } from "@/services/recommendationsService"
import { isClient } from "@/lib/seo/core-utils"
import { useCourseProgressSync } from "@/hooks/useCourseProgressSync"
import { fetchPersonalizedRecommendations } from "@/app/services/recommendationsService"
import { useVideoState } from "./video/hooks/useVideoState"
import { migratedStorage } from "@/lib/storage"
import VideoGenerationSection from "./VideoGenerationSection"
import MobilePlaylistCount from "@/components/course/MobilePlaylistCount"
import { markChapterCompleted } from "@/store/slices/courseProgress-slice"
import { setVideoProgress } from "@/store/slices/courseProgress-slice"
import { progressQueue } from "@/lib/queues/ProgressQueue"
import { useProgressEvents } from '@/utils/progress-events';
import { syncEventsWithServer } from '@/store/slices/progress-events-slice';

// Import components
import CertificateModal from "./CertificateModal"
import PlaylistSidebar from "./PlaylistSidebar"
import MobilePlaylistOverlay from "./MobilePlaylistOverlay"
import VideoPlayer from "./video/components/VideoPlayer"
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
  isPiPActive: boolean
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
  | { type: 'SET_PIP_ACTIVE'; payload: boolean }
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
  isPiPActive: false,
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
    case 'SET_PIP_ACTIVE':
      return { ...state, isPiPActive: action.payload }
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
  <div className="aspect-video bg-muted animate-pulse rounded-lg flex items-center justify-center">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
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
  const { user, subscription } = useAuth()

  // Use reducer for state management
  const [state, dispatch2] = useReducer(stateReducer, initialState)

  // Additional state that doesn't need to be in reducer
  const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([])
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [quizSuggestions, setQuizSuggestions] = useState<QuizSuggestion[]>([])
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)
  const [currentVideoProgress, setCurrentVideoProgress] = useState<number>(0)

  const isOwner = user?.id === course.userId

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const courseProgress = useCourseProgressSync(course.id)
  
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

  // Completed chapters tracking - get from Redux state directly
  const reduxProgress = useAppSelector((state) => selectCourseProgressById(state, course.id))
  const completedChapters = useMemo(() => {
    // First check Redux state for immediate updates
    if (reduxProgress?.videoProgress?.completedChapters) {
      return reduxProgress.videoProgress.completedChapters.map(String)
    }
    
    // Fallback to sync hook data
    if (courseProgress?.videoProgress?.completedChapters) {
      return courseProgress.videoProgress.completedChapters.map(String)
    }
    
    // No legacy fallback needed
    return []
  }, [reduxProgress, courseProgress])

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
    if (!subscription) return null
    return subscription.plan || null
  }, [subscription])

  // Video access permission
  const canPlayVideo = useMemo(() => {
    const allowedByChapter = currentChapter?.isFree === true
    return allowedByChapter || !!userSubscription
  }, [currentChapter?.isFree, userSubscription])

  // Course statistics
  const courseStats = useMemo(() => ({
    completedCount: completedChapters?.length || 0,
    totalChapters: videoPlaylist.length,
    progressPercentage: videoPlaylist.length > 0 
      ? Math.round(((completedChapters?.length || 0) / videoPlaylist.length) * 100) 
      : 0
  }), [completedChapters, videoPlaylist.length])

  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    dispatch2({ type: 'SET_CERTIFICATE_VISIBLE', payload: true })
  }, [])

  // Progress tracking with new event system
  const { dispatchVideoWatched, dispatchChapterCompleted } = useProgressEvents();

  // Navigation handlers
  // Advance to next video (chapters are only marked complete when video ends)
  const handleNextVideo = useCallback(() => {
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
    
    // Mark current chapter as completed when manually advancing to next video
    if (currentChapter && user?.id) {
      const currentChapterId = Number(currentChapter.id);
      const courseId = Number(course.id);
      const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id));
      
      if (!isAlreadyCompleted) {
        console.log(`Marking current chapter ${currentChapterId} as completed before advancing`);
        
        // Update Redux state
        dispatch(markChapterCompleted({ courseId, chapterId: currentChapterId, userId: user.id }));
        
        // Mark as completed in ChapterProgress table
        const updateCurrentChapterProgress = async () => {
          try {
            const response = await fetch('/api/progress/chapter', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                courseId: courseId,
                chapterId: currentChapterId,
                progress: 100,
                timeSpent: Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0)),
                completed: true,
                lastWatchedAt: new Date().toISOString()
              }),
            });
            
            if (response.ok) {
              console.log(`ChapterProgress updated for current chapter ${currentChapterId}`);
            } else {
              console.error('Failed to update current ChapterProgress:', await response.text());
            }
          } catch (error) {
            console.error('Error updating current ChapterProgress:', error);
          }
        };
        
        updateCurrentChapterProgress();
        
        // Dispatch chapter completed event
        dispatchChapterCompleted(
          user.id,
          String(currentChapterId),
          String(courseId),
          Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0))
        );
      }
    }
    
    dispatch(setCurrentVideoApi(nextVid))
    
    try {
      videoStateStore.getState().setCurrentVideo(nextVid, course.id)
      
      // Track transition to next video in event system
      if (user?.id && nextVideoEntry.chapter?.id) {
        console.log(`Recording video start event for chapter ${nextVideoEntry.chapter.id}`)
        
        // Mark video as started in progress events system
        dispatchVideoWatched(
          user.id,
          String(nextVideoEntry.chapter.id),
          course.id.toString(),
          0, // initial progress
          0, // initial played seconds
          0  // duration will be updated when metadata loads
        )
        
        // Force immediate sync with server
        setTimeout(() => {
          console.log(`Syncing video start event for chapter ${nextVideoEntry.chapter.id}`)
          dispatch(syncEventsWithServer()).catch((error) => {
            console.error('Failed to sync video start event:', error);
          });
        }, 200)
        
        // Track if this chapter was already completed
        if (completedChapters.includes(String(nextVideoEntry.chapter.id))) {
          console.log(`Chapter ${nextVideoEntry.chapter.id} was already completed. Re-watching.`)
        }
      } else {
        console.warn('User ID or chapter ID not available. Cannot record video start event.')
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
    dispatchVideoWatched,
    dispatch,
    syncEventsWithServer,
    currentChapter,
    completedChapters,
    currentVideoProgress,
    videoDurations,
    currentVideoId,
    dispatchChapterCompleted,
    markChapterCompleted
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
        if (!allowed) {
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

        // Always track chapter selection event regardless of completion status
        if (user?.id) {
          console.log(`Video selected: ${videoId} for chapter ${safeChapter.id}`)
          
          // Mark video as started in progress events system
          // We track all video views, even for completed chapters
          dispatchVideoWatched(
            user.id,
            safeChapter.id.toString(),
            course.id.toString(),
            0, // initial progress
            0, // initial played seconds
            0  // duration will be updated when metadata loads
          )
          
          // Force immediate sync with server
          setTimeout(() => {
            console.log(`Syncing video selection event for chapter ${safeChapter.id}`)
            dispatch(syncEventsWithServer()).catch((error) => {
              console.error('Failed to sync video selection event:', error);
            });
          }, 200)
          
          // Create/update ChapterProgress entry for video start
          const updateChapterProgressStart = async () => {
            try {
              const response = await fetch('/api/progress/chapter', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  courseId: Number(course.id),
                  chapterId: Number(safeChapter.id),
                  progress: 0,
                  timeSpent: 0,
                  completed: false,
                  lastWatchedAt: new Date().toISOString()
                }),
              });
              
              if (response.ok) {
                console.log(`ChapterProgress started for chapter ${safeChapter.id}`);
              } else {
                console.error('Failed to start ChapterProgress:', await response.text());
              }
            } catch (error) {
              console.error('Error starting ChapterProgress:', error);
            }
          };
          
          updateChapterProgressStart();
          
          // Log completion status for debugging
          const isAlreadyCompleted = completedChapters.includes(String(safeChapter.id))
          if (isAlreadyCompleted) {
            console.log(`Chapter ${safeChapter.id} was already completed. Re-watching.`)
          }
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
    [dispatch, course.id, videoStateStore, toast, userSubscription, user?.id, completedChapters, dispatchVideoWatched, syncEventsWithServer]
  )

  // Video event handlers
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      setVideoDurations((prev) => ({
        ...prev, 
        [currentVideoId || ""]: metadata.duration
      }))
      dispatch2({ type: 'SET_VIDEO_LOADING', payload: false })
      
      // Record video load event to ensure we track that the video was accessed
      if (user?.id && currentChapter?.id && currentVideoId) {
        console.log(`Video loaded: ${currentVideoId} with duration ${metadata.duration}s for chapter ${currentChapter.id}`)
        
        // Update the initial video watched event with actual duration
        dispatchVideoWatched(
          user.id,
          currentChapter.id.toString(),
          course.id.toString(),
          0, // Still at 0% progress
          0, // 0 seconds played
          metadata.duration
        )
      }
    },
    [currentVideoId, user?.id, currentChapter?.id, course.id, dispatchVideoWatched]
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
    console.log(`Chapter completed: ${chapterId}`)
  }, [])

  const handlePIPToggle = useCallback((isPiPActive: boolean) => {
    dispatch2({ type: 'SET_PIP_ACTIVE', payload: isPiPActive })
    if (isPiPActive) {
      toast({
        title: "Picture-in-Picture",
        description: "Video is now playing in a separate window."
      })
    }
  }, [toast])

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

  // Progress tracking using new event system
  const handleVideoProgress = useCallback((progressState: { played: number, playedSeconds: number }) => {
    // Update local state for current video progress
    setCurrentVideoProgress(progressState.played)

    // Only send meaningful progress updates (skip very early progress)
    if (progressState.played > 0.05) { // Skip first 5% to reduce noise
      if (user?.id && currentChapter?.id && currentVideoId) {
        console.log(`Video progress: ${progressState.played * 100}% for chapter ${currentChapter.id}`)
        dispatchVideoWatched(
          user.id,
          currentChapter.id.toString(),
          course.id.toString(),
          progressState.played * 100,
          progressState.playedSeconds,
          videoDurations[currentVideoId] || 0
        )
        
        // Sync progress periodically (every 25% completion or major milestones)
        const progressPercent = Math.floor(progressState.played * 100)
        if (progressPercent % 25 === 0 && progressPercent > 0) {
          setTimeout(() => {
            console.log(`Syncing progress at ${progressPercent}% for chapter ${currentChapter.id}`)
            dispatch(syncEventsWithServer()).catch((error) => {
              console.error('Failed to sync progress events:', error);
            });
          }, 100)
          
          // Also update ChapterProgress table at milestones
          const updateChapterProgressMilestone = async () => {
            try {
              const response = await fetch('/api/progress/chapter', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  courseId: Number(course.id),
                  chapterId: Number(currentChapter.id),
                  progress: progressPercent,
                  timeSpent: Math.round(progressState.playedSeconds),
                  completed: false,
                  lastWatchedAt: new Date().toISOString()
                }),
              });
              
              if (response.ok) {
                console.log(`ChapterProgress updated to ${progressPercent}% for chapter ${currentChapter.id}`);
              }
            } catch (error) {
              console.error('Error updating ChapterProgress milestone:', error);
            }
          };
          
          updateChapterProgressMilestone();
        }
      }
    }
  }, [dispatchVideoWatched, user?.id, currentChapter?.id, course.id, currentVideoId, videoDurations, setCurrentVideoProgress, dispatch, syncEventsWithServer])

  const handleVideoEnded = useCallback(() => {
    console.log(`Video ended handler called - currentChapter: ${currentChapter?.id}, isCompleted: ${completedChapters.includes(String(currentChapter?.id))}`)
    
    // Immediately update Redux state for UI responsiveness
    if (currentChapter) {
      const chapterId = Number(currentChapter.id);
      const courseId = Number(course.id);
      const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id));
      
      if (!isAlreadyCompleted) {
        // Mark as completed in Redux state (local UI update)
        console.log(`Marking chapter ${chapterId} as completed for course ${courseId}`);
        dispatch(markChapterCompleted({ courseId, chapterId, userId: user?.id || '' }));
      } else {
        console.log(`Chapter ${chapterId} was already completed. Updating progress only.`);
      }
      
      // Update video progress in Redux state
      dispatch(setVideoProgress({
        courseId: String(courseId),
        chapterId: chapterId,
        progress: 100,
        playedSeconds: Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0)),
        completed: true,
        userId: user?.id || ''
      }));
      
      // Send completion to new event system
      if (user?.id) {
        console.log(`Chapter ${chapterId} completed for course ${courseId} - Recording in learning events`);
        
        // Always dispatch chapter completed event to ensure it's recorded
        dispatchChapterCompleted(
          user.id,
          String(chapterId),
          String(courseId),
          Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0))
        );
        
        // Create/update ChapterProgress entry in database
        const updateChapterProgress = async () => {
          try {
            const response = await fetch('/api/progress/chapter', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                courseId: courseId,
                chapterId: chapterId,
                progress: 100,
                timeSpent: Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0)),
                completed: true,
                lastWatchedAt: new Date().toISOString()
              }),
            });
            
            if (response.ok) {
              console.log(`ChapterProgress updated for chapter ${chapterId}`);
            } else {
              console.error('Failed to update ChapterProgress:', await response.text());
            }
          } catch (error) {
            console.error('Error updating ChapterProgress:', error);
          }
        };
        
        updateChapterProgress();
        
        // Force immediate sync with server to ensure events are recorded
        setTimeout(() => {
          console.log('Syncing chapter completion events with server');
          dispatch(syncEventsWithServer()).catch((error) => {
            console.error('Failed to sync events with server:', error);
          });
        }, 100); // Reduced delay for faster sync
        
        // Handle autoplay if enabled
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
      } else {
        console.warn('User ID not available. Cannot record learning event for chapter completion.');
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
    currentVideoProgress,
    videoDurations,
    currentVideoId,
    dispatchChapterCompleted,
    isLastVideo,
    handleCertificateClick,
    user?.id,
    state.autoplayMode,
    hasNextVideo,
    nextVideoEntry,
    handleNextVideo,
    dispatch,
    syncEventsWithServer
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

  // Fetch recommendations
  useEffect(() => {
    fetchRelatedCourses(course.id, 5).then(setRelatedCourses).catch(console.error)
  }, [course.id])

  // Access levels
  const accessLevels: AccessLevels = useMemo(() => ({
    isSubscribed: !!userSubscription,
    isAdmin: !!user?.isAdmin,
    isAuthenticated: !!user,
  }), [userSubscription, user])

  // Sidebar course data
  const sidebarCourse = useMemo(() => ({
    id: String(course.id),
    title: course.title,
    chapters: videoPlaylist.map(v => ({
      id: String(v.chapter.id),
      title: v.chapter.title,
      videoId: v.chapter.videoId || undefined,
      duration: typeof v.chapter.duration === 'number' ? v.chapter.duration : undefined,
      isFree: v.chapter.isFree
    }))
  }), [course.id, course.title, videoPlaylist])
  
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
        <Card className="border shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Unlock This Lesson</h3>
              <p className="text-muted-foreground text-sm">
                Subscribe to access all course content and premium features.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => (window.location.href = "/dashboard/subscription")} 
                className="w-full" 
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Subscribe Now
              </Button>
              <Button 
                variant="outline" 
                onClick={() => (window.location.href = "/api/auth/signin")} 
                className="w-full"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => dispatch2({ type: 'SET_AUTH_PROMPT', payload: false })} 
                className="w-full"
              >
                Back to Course
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  ) : null

  // Main content
  return (
    <div className="min-h-screen bg-background relative">
      {authPromptOverlay}
      {/* Simplified header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b transition-all duration-300",
          state.headerCompact ? "py-3" : "py-6"
        )}
      >
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <h1 className={cn(
                  "font-bold truncate transition-all duration-300",
                  state.headerCompact ? "text-xl" : "text-2xl lg:text-3xl"
                )}>
                  {course.title}
                </h1>
                {!state.headerCompact && (
                  <p className="text-muted-foreground text-sm truncate mt-1">
                    {state.mounted && currentChapter?.title || 'Select a chapter to begin'}
                  </p>
                )}
              </div>

              {/* Progress indicator */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>
                    {state.mounted ? `${courseStats.completedCount}/${courseStats.totalChapters}` : `0/${courseStats.totalChapters}`} chapters
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <Progress value={state.mounted ? courseStats.progressPercentage : 0} className="h-2" />
                  </div>
                  <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary px-3 py-1">
                    {state.mounted ? courseStats.progressPercentage : 0}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
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
              />
            </div>
          </div>

          {/* Mobile progress */}
          <div className="lg:hidden mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{state.mounted ? courseStats.completedCount : 0} of {courseStats.totalChapters} chapters</span>
              </div>
              <Badge variant="secondary" className="font-medium bg-primary/10 text-primary">
                {state.mounted ? courseStats.progressPercentage : 0}% Complete
              </Badge>
            </div>
            <Progress value={state.mounted ? courseStats.progressPercentage : 0} className="h-2" />
          </div>
        </div>
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
              variant="outline"
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
        "transition-all duration-300",
        state.isTheaterMode && "bg-black"
      )}>
        <div className={cn(
          "mx-auto transition-all duration-300",
          state.isTheaterMode ? "max-w-none px-0" : "max-w-screen-2xl px-4 lg:px-6 py-6"
        )}>
          <div className={cn(
            "transition-all duration-300",
            state.sidebarCollapsed || state.isTheaterMode
              ? "flex flex-col max-w-5xl mx-auto"
              : "grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8"
          )}>
            {/* Video and content area */}
            <div className="space-y-6 min-w-0">
              {/* Video player section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                {state.isPiPActive ? (
                  <Card className="overflow-hidden">
                    <div className={cn(
                      "bg-muted flex items-center justify-center transition-all duration-300",
                      state.isTheaterMode ? "aspect-[21/9]" : "aspect-video"
                    )}>
                      <div className="text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                          <Play className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Picture-in-Picture Active</h3>
                        <p className="text-muted-foreground text-sm">
                          Video is playing in a separate window. Click the PIP button to return.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className={cn(
                    "overflow-hidden shadow-lg",
                    state.isTheaterMode && "bg-transparent border-0 shadow-none"
                  )}>
                    <div className={cn(
                      "bg-black relative transition-all duration-300",
                      state.isTheaterMode ? "aspect-[21/9]" : "aspect-video"
                    )}>
                      {state.isVideoLoading && <VideoSkeleton />}
                      
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
                        onTheaterModeToggle={handleTheaterModeToggle}
                        isTheaterMode={state.isTheaterMode}
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

              {/* Course details tabs */}
              {!state.isTheaterMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <MemoizedCourseDetailsTabs
                        course={course}
                        currentChapter={currentChapter}
                        accessLevels={accessLevels}
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
                  <Card>
                    <CardContent className="p-6">
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
                  className="hidden xl:block space-y-4 min-w-0 max-w-md"
                >
                  {/* Sidebar header */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Course Content
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch2({ type: 'SET_SIDEBAR_COLLAPSED', payload: true })}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Progress Stats */}
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span>{courseStats.completedCount} of {courseStats.totalChapters} chapters</span>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                            {courseStats.progressPercentage}% Complete
                          </Badge>
                        </div>
                        <Progress value={courseStats.progressPercentage} className="h-2" />
                        
                        {/* Additional stats */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{courseStats.totalChapters - courseStats.completedCount} remaining</span>
                          <span>{courseStats.completedCount > 0 ? 'Keep going!' : 'Get started!'}</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Playlist */}
                  <Card className="flex-1">
                    <CardContent className="p-0">
                      {sidebarCourse.chapters.length === 0 ? (
                        <div className="p-6 text-center">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <h3 className="font-medium mb-1">No Videos Available</h3>
                          <p className="text-sm text-muted-foreground">
                            This course doesn't have any video content yet.
                          </p>
                        </div>
                      ) : (
                        <PlaylistSidebar
                          course={sidebarCourse}
                          currentChapter={sidebarCurrentChapter}
                          courseId={course.id.toString()}
                          currentVideoId={currentVideoId || ''}
                          isAuthenticated={!!user}
                          completedChapters={completedChapters.map(String)}
                          formatDuration={formatDuration}
                          videoDurations={videoDurations}
                          courseStats={courseStats}
                          onChapterSelect={handleChapterSelect}
                          isPiPActive={state.isPiPActive}
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
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              size="lg"
              onClick={() => (window.location.href = "/dashboard/subscription")}
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Zap className="h-4 w-4 mr-2" />
              Subscribe to Unlock
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