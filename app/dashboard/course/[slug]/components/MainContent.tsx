"use client"

import React, { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { markChapterCompleted } from "@/store/slices/courseProgress-slice"
import { setPiPActive, setPiPVideoData } from "@/store/slices/course-slice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Play, CheckCircle, Menu, X, BookOpen, Zap, Loader2, Clock, Users, Star } from "lucide-react"
import { setCurrentVideoApi } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsTabs from "./CourseDetailsTabs"
import { formatDuration } from "../utils/formatUtils"
import { VideoDebug } from "./video/components/VideoDebug"
import { useAuth } from "@/modules/auth"
import ActionButtons from "./ActionButtons"
import ReviewsSection from "./ReviewsSection"
import { getColorClasses } from "@/lib/utils"
import type { BookmarkData } from "./video/types"
import { useCourseProgressSync } from "@/hooks/useCourseProgressSync"
import { useVideoState } from "./video/hooks/useVideoState"
import { useProgressMutation, flushProgress } from "@/services/enhanced-progress/client_progress_queue"
import { SignInPrompt } from "@/components/shared"
import { migratedStorage } from "@/lib/storage"
import VideoGenerationSection from "./VideoGenerationSection"
import MobilePlaylistCount from "@/components/course/MobilePlaylistCount"
import { setVideoProgress } from "@/store/slices/courseProgress-slice"
import { useGuestProgress } from "@/hooks/useGuestProgress"
import { GuestProgressIndicator, ContextualSignInPrompt } from "@/components/guest"
import { useSession } from "next-auth/react"
import VideoPlayer from "./video/components/VideoPlayer"
import neo from "@/components/neo/tokens"
import { cn } from "@/lib/utils"
import CertificateModal from "./CertificateModal"
import VideoNavigationSidebar from "./ChapterPlaylist"
import MobilePlaylistOverlay from "./MobilePlaylistOverlay"
import { storageManager } from "@/utils/storage-manager"
import { useBookmarks } from "@/hooks/use-bookmarks"

// Simple stat badge component - compact design
const CourseStatBadge = ({ icon: Icon, value, label }: { icon: any; value: string; label: string }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
    <Icon className="h-3.5 w-3.5 text-black flex-shrink-0" />
    <div className="flex flex-col leading-tight">
      <span className="text-xs font-black text-black">{value}</span>
      <span className="text-[10px] font-bold text-gray-600 uppercase">{label}</span>
    </div>
  </div>
)

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

// Enhanced loading skeleton with neo-brutalist styling
const VideoSkeleton = () => (
  <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20 rounded-lg border-4 border-black">
    <div className="flex flex-col items-center gap-4 text-white">
      <div className="w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
      <span className="text-sm font-black uppercase tracking-wide">Loading Video...</span>
    </div>
  </div>
)

// Helper function to validate chapter
function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
      typeof chapter === "object" &&
      chapter.id &&
      (typeof chapter.id === "string" || typeof chapter.id === "number"),
  )
}

const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)

const MainContent: React.FC<ModernCoursePageProps> = ({ course, initialChapterId, isFullscreen = false }) => {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { status } = useSession()
  const { buttonPrimary, buttonSecondary, buttonIcon, cardPrimary, cardSecondary, badgeType, badgeStatus } =
    getColorClasses()

  // Global PiP state
  const { isPiPActive } = useAppSelector((state) => state.course)

  // Guest system hooks
  const {
    isGuest,
    currentCourseProgress,
    markGuestChapterCompleted,
    setGuestCurrentChapter,
    getGuestCompletionStats,
    trackGuestVideoWithCourse,
  } = useGuestProgress(course.id)

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
    limit: 5,
  })

  // Sync database bookmarks with Redux state on mount
  useEffect(() => {
    if (!bookmarksLoading && dbBookmarks.length > 0 && currentVideoId) {
      try {
        const state = videoStateStore.getState()
        const existingBookmarks = (state?.bookmarks as Record<string, any[]>) || {}

        if (!existingBookmarks[currentVideoId] || existingBookmarks[currentVideoId].length === 0) {
          const videoBookmarks = dbBookmarks
            .filter((bookmark: { videoId: string }) => bookmark.videoId === currentVideoId)
            .map((bookmark: any) => ({
              id: bookmark.id,
              videoId: bookmark.videoId || currentVideoId,
              time: bookmark.timestamp || 0,
              title:
                bookmark.note ||
                `Bookmark at ${Math.floor((bookmark.timestamp || 0) / 60)}:${((bookmark.timestamp || 0) % 60).toString().padStart(2, "0")}`,
              description: bookmark.note || "",
              createdAt: bookmark.createdAt,
            }))

          if (videoBookmarks.length > 0) {
            const updatedBookmarks = {
              ...existingBookmarks,
              [currentVideoId]: videoBookmarks,
            }
            videoStateStore.setState({ bookmarks: updatedBookmarks })
          }
        }
      } catch (error) {
        console.warn("Failed to sync bookmarks from database:", error)
      }
    }
  }, [dbBookmarks, bookmarksLoading, currentVideoId, videoStateStore])

  const getVideoBookmarks = useCallback(
    (videoId?: string | null) => {
      try {
        const key = String(videoId ?? "")
        const state = videoStateStore.getState()
        const bookmarks = (state?.bookmarks as Record<string, any[]>) || {}
        return Array.isArray(bookmarks[key]) ? bookmarks[key] : []
      } catch (e) {
        console.warn("Failed to get video bookmarks:", e)
        return []
      }
    },
    [videoStateStore],
  )

  // Memoized video bookmarks
  const bookmarkItems: BookmarkData[] = useMemo(() => {
    try {
      const raw = getVideoBookmarks(currentVideoId)
      if (!Array.isArray(raw)) return []
      return raw.slice(0, 5)
    } catch {
      return []
    }
  }, [currentVideoId, getVideoBookmarks])

  // Completed chapters tracking
  const reduxProgress = useAppSelector((state) => selectCourseProgressById(state, course.id))
  const completedChapters = useMemo(() => {
    if (user?.id) {
      if (reduxProgress?.videoProgress?.completedChapters) {
        return reduxProgress.videoProgress.completedChapters.map(String)
      }
      if (courseProgress?.videoProgress?.completedChapters) {
        return courseProgress.videoProgress.completedChapters.map(String)
      }
      return []
    } else {
      const guestProgress = currentCourseProgress
      if (guestProgress?.completedChapters && Array.isArray(guestProgress.completedChapters)) {
        return guestProgress.completedChapters.map(String)
      }
      return []
    }
  }, [user?.id, reduxProgress, courseProgress, currentCourseProgress])

  useEffect(() => {
    try {
      if (!Array.isArray(completedChapters)) {
        console.error(
          "[MainContent] completedChapters has unexpected type",
          typeof completedChapters,
          completedChapters,
        )
      }
    } catch (e) {
      console.error("[MainContent] Error during completedChapters type check", e)
    }
  }, [completedChapters])

  // Initialize mounted state and preferences
  useEffect(() => {
    dispatch2({ type: "SET_MOUNTED", payload: true })

    const freeVideoPlayed = migratedStorage.getPreference("played_free_video", false)
    dispatch2({ type: "SET_FREE_VIDEO_PLAYED", payload: Boolean(freeVideoPlayed) })

    try {
      const courseSettings = storageManager.getCourseSettings(course.id.toString())
      dispatch2({ type: "SET_AUTOPLAY_MODE", payload: courseSettings.autoplayMode || false })
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
                typeof chapter.videoId === "string",
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

  // Pre-populate videoDurations from chapter data
  useEffect(() => {
    const durations: Record<string, number> = {}

    videoPlaylist.forEach(({ videoId, chapter }) => {
      if (chapter?.videoDuration && typeof chapter.videoDuration === "number" && chapter.videoDuration > 0) {
        durations[videoId] = chapter.videoDuration
      } else if (chapter?.duration && typeof chapter.duration === "number" && chapter.duration > 0) {
        durations[videoId] = chapter.duration
      }
    })

    if (Object.keys(durations).length > 0) {
      setVideoDurations((prev) => ({ ...prev, ...durations }))
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
  const nextVideoTitle = nextVideoEntry?.chapter?.title || ""
  const hasNextVideo = Boolean(nextVideoEntry)

  // User subscription status
  const userSubscription = useMemo(() => {
    return user?.subscriptionPlan || null
  }, [user?.subscriptionPlan])

  // Video access permission
  const canPlayVideo = useMemo(() => {
    if (course.isShared) return true
    const allowedByChapter = currentChapter?.isFree === true
    return allowedByChapter || !!userSubscription
  }, [course.isShared, currentChapter?.isFree, userSubscription])

  // Course statistics
  const courseStats = useMemo(
    () => ({
      completedCount: completedChapters?.length || 0,
      totalChapters: videoPlaylist.length,
      progressPercentage:
        videoPlaylist.length > 0 ? Math.round(((completedChapters?.length || 0) / videoPlaylist.length) * 100) : 0,
    }),
    [completedChapters, videoPlaylist.length],
  )

  // Calculate total course duration
  const totalCourseDuration = useMemo(() => {
    return videoPlaylist.reduce((total, { videoId }) => {
      return total + (videoDurations[videoId] || 0)
    }, 0)
  }, [videoPlaylist, videoDurations])

  // Enhanced progress tracking
  const { enqueueProgress, flushQueue, isLoading: progressLoading } = useProgressMutation()

  // Build progress object from database for ChapterPlaylist display
  const progressByVideoId = useMemo(() => {
    const progress: Record<string, number> = {}

    try {
      let progressData = reduxProgress?.videoProgress || courseProgress?.videoProgress
      try {
        const reduxUpdated = reduxProgress?.lastUpdatedAt || 0
        const courseUpdated = courseProgress?.lastUpdatedAt || 0

        if (reduxProgress && courseProgress) {
          progressData = courseUpdated >= reduxUpdated ? courseProgress.videoProgress : reduxProgress.videoProgress
        }

        const reduxLast: Record<string, number> = reduxProgress?.videoProgress?.lastPositions || {}
        const courseLast: Record<string, number> = courseProgress?.videoProgress?.lastPositions || {}

        const mergedLast: Record<string, number> = { ...reduxLast }
        Object.keys(courseLast).forEach((k) => {
          const courseVal = courseLast[k]
          const reduxVal = mergedLast[k]
          if (typeof reduxVal === "undefined") {
            mergedLast[k] = courseVal
          } else {
            mergedLast[k] = courseUpdated >= reduxUpdated ? courseVal : reduxVal
          }
        })

        progressData = { ...(progressData || {}), lastPositions: mergedLast }
      } catch (e) {
        console.warn("[MainContent] Error selecting/merging progress sources:", e)
      }

      if (videoPlaylist.length > 0) {
        videoPlaylist.forEach(({ videoId, chapter }) => {
          if (videoId) {
            const savedSecondsForChapter = progressData?.lastPositions
              ? progressData.lastPositions[String(chapter.id)]
              : undefined
            let videoDuration = videoDurations[videoId]
            if (!videoDuration) {
              if (typeof savedSecondsForChapter === "number" && savedSecondsForChapter > 0) {
                videoDuration = Math.max(savedSecondsForChapter, 60)
              } else {
                videoDuration = 1
              }
            }

            const isCompleted = completedChapters.includes(String(chapter.id))
            if (isCompleted) {
              progress[videoId] = 100
            } else if (String(progressData?.currentChapterId) === String(chapter.id)) {
              const playedSeconds = progressData?.playedSeconds || 0
              const percent = Math.min((playedSeconds / videoDuration) * 100, 100)
              progress[videoId] = percent
            } else if (progressData?.lastPositions && progressData.lastPositions[String(chapter.id)]) {
              const savedSeconds = progressData.lastPositions[String(chapter.id)]
              const percent = Math.min((savedSeconds / videoDuration) * 100, 100)
              progress[videoId] = percent
            } else {
              progress[videoId] = 0
            }
          }
        })
      }
    } catch (error) {
      console.warn("Failed to build progress object:", error)
    }

    return progress
  }, [reduxProgress, courseProgress, videoPlaylist, videoDurations, completedChapters])

  // Extract lastPositions map for ChapterPlaylist display
  const chapterLastPositions = useMemo(() => {
    try {
      const reduxLast = reduxProgress?.videoProgress?.lastPositions || {}
      const courseLast = courseProgress?.videoProgress?.lastPositions || {}
      const reduxUpdated = reduxProgress?.lastUpdatedAt || 0
      const courseUpdated = courseProgress?.lastUpdatedAt || 0

      const merged: Record<string, number> = { ...reduxLast }
      Object.keys(courseLast).forEach((k) => {
        const courseVal = courseLast[k]
        const reduxVal = merged[k]
        if (typeof reduxVal === "undefined") {
          merged[k] = courseVal
        } else {
          merged[k] = courseUpdated >= reduxUpdated ? courseVal : reduxVal
        }
      })
      return merged
    } catch (e) {
      console.warn("[MainContent] Error extracting lastPositions:", e)
      return {}
    }
  }, [reduxProgress, courseProgress])

  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: true })
  }, [])

  // Navigation handlers
  const handleNextVideo = useCallback(async () => {
    if (!hasNextVideo || !nextVideoEntry) {
      if (isLastVideo) {
        console.log("Last video reached. Showing certificate.")
        handleCertificateClick()
      } else {
        console.log("No next video available.")
      }
      return
    }

    const nextVid = nextVideoEntry.videoId
    if (!nextVid) {
      console.error("Next video entry has no videoId")
      return
    }

    console.log(`Advancing to next video: ${nextVid} for chapter ${nextVideoEntry.chapter?.id}`)

    if (currentChapter && user?.id && !course.isShared) {
      const currentChapterId = Number(currentChapter.id)
      const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id))

      if (!isAlreadyCompleted) {
        console.log(`[Authenticated] Marking current chapter ${currentChapterId} as completed before advancing`)

        const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0))
        const success = enqueueProgress(
          user.id,
          course.id,
          currentChapterId,
          "chapter_progress",
          100,
          timeSpent,
          {
            completed: true,
            courseId: String(course.id),
            chapterId: String(currentChapterId),
            trigger: "next_click",
            videoDuration: videoDurations[currentVideoId || ""] || 0,
            watchedSeconds: timeSpent,
            completedAt: Date.now(),
          },
        )

        if (success) {
          dispatch(
            markChapterCompleted({
              courseId: Number(course.id),
              chapterId: currentChapterId,
              userId: user.id,
            }),
          )

          try {
            await flushQueue()
            await refreshProgressFromServer()
          } catch (err) {
            console.error("Failed to flush progress queue or refresh progress:", err)
          }
        } else {
          console.error("Failed to enqueue chapter completion")
        }
      }
    } else if (!user?.id) {
      console.log("[Unauthenticated] Skipping chapter completion tracking - user not signed in")
    }

    dispatch(setCurrentVideoApi(nextVid))

    try {
      videoStateStore.getState().setCurrentVideo(nextVid, course.id)

      if (user?.id && !course.isShared && nextVideoEntry.chapter?.id) {
        console.log(`[Authenticated] Recording video start event for chapter ${nextVideoEntry.chapter.id}`)

        const success = enqueueProgress(
          user.id,
          course.id,
          nextVideoEntry.chapter.id,
          "chapter_start",
          0,
          0,
          {
            courseId: String(course.id),
            chapterId: String(nextVideoEntry.chapter.id),
            progress: 0,
            playedSeconds: 0,
            duration: 0,
            videoId: nextVid,
            startedAt: Date.now(),
            previouslyCompleted: completedChapters.includes(String(nextVideoEntry.chapter.id)),
          },
        )

        if (success) {
          console.log(`Video start event queued for chapter ${nextVideoEntry.chapter.id}`)
        } else {
          console.error("Failed to queue video start event")
        }
      } else if (!user?.id) {
        console.log("[Unauthenticated] Skipping video start tracking - user not signed in")
      }
    } catch (e) {
      console.error("Failed to set current video:", e)
    }

    dispatch2({ type: "SET_VIDEO_LOADING", payload: true })
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
    enqueueProgress,
  ])

  // Chapter selection handler
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
          dispatch2({ type: "SET_AUTH_PROMPT", payload: true })
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

        if (user?.id && !course.isShared) {
          console.log(`[Authenticated] Video selected: ${videoId} for chapter ${safeChapter.id}`)

          const success = enqueueProgress(
            user.id,
            course.id,
            safeChapter.id,
            "chapter_start",
            0,
            0,
            {
              videoId: videoId,
              startedAt: Date.now(),
              previouslyCompleted: completedChapters.includes(String(safeChapter.id)),
            },
          )

          if (success) {
            console.log(`Video selection event queued for chapter ${safeChapter.id}`)
          } else {
            console.error("Failed to queue video selection event")
          }

          const isAlreadyCompleted = completedChapters.includes(String(safeChapter.id))
          if (isAlreadyCompleted) {
            console.log(`Chapter ${safeChapter.id} was already completed. Re-watching.`)
          }
        } else {
          console.log("[Unauthenticated] Skipping chapter selection tracking - user not signed in")
        }

        dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: false })
        dispatch2({ type: "SET_VIDEO_LOADING", payload: true })
      } catch (error) {
        console.error("Error selecting chapter:", error)
        toast({
          title: "Selection Error",
          description: "There was a problem selecting this chapter. Please try again.",
          variant: "destructive",
        })
      }
    },
    [dispatch, course.id, videoStateStore, toast, userSubscription, user?.id, completedChapters, enqueueProgress],
  )

  // Video event handlers
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      setVideoDurations((prev) => ({
        ...prev,
        [currentVideoId || ""]: metadata.duration,
      }))
      dispatch2({ type: "SET_VIDEO_LOADING", payload: false })

      if (user?.id && !course.isShared && currentChapter?.id && currentVideoId) {
        console.log(
          `[Authenticated] Video loaded: ${currentVideoId} with duration ${metadata.duration}s for chapter ${currentChapter.id}`,
        )

        const success = enqueueProgress(
          user.id,
          course.id,
          currentChapter.id,
          "chapter_progress",
          0,
          0,
          {
            courseId: String(course.id),
            chapterId: String(currentChapter.id),
            progress: 0,
            playedSeconds: 0,
            duration: metadata.duration,
            videoId: currentVideoId,
            loadedAt: Date.now(),
            eventSubtype: "video_metadata_loaded",
          },
        )

        if (success) {
          console.log(`Video metadata load event queued for chapter ${currentChapter.id}`)
        } else {
          console.error("Failed to queue video metadata load event")
        }
      } else if (!user?.id) {
        console.log(`[Unauthenticated] Video loaded: ${currentVideoId} - skipping progress tracking`)
      }
    },
    [currentVideoId, user?.id, course.isShared, currentChapter?.id, course.id, enqueueProgress],
  )

  const handlePlayerReady = useCallback((player: React.RefObject<any>) => {
    setPlayerRef(player)
    dispatch2({ type: "SET_VIDEO_LOADING", payload: false })
  }, [])

  const handleSeekToBookmark = useCallback(
    (time: number, title?: string) => {
      if (playerRef?.current) {
        playerRef.current.seekTo(time)
        if (title) {
          toast({
            title: "Bookmark",
            description: `Seeking to "${title}" at ${formatDuration(time)}`,
          })
        }
      }
    },
    [playerRef, toast, formatDuration],
  )

  const handleChapterComplete = useCallback(
    (chapterId: string) => {
      ;(async () => {
        console.log(`[ChapterPlaylist Callback] Chapter completed: ${chapterId}`)

        const chapterIdNum = Number(chapterId)
        const courseIdNum = Number(course.id)

        if (user?.id && !course.isShared) {
          const isAlreadyCompleted = completedChapters.includes(String(chapterId))

          if (!isAlreadyCompleted) {
            console.log(`[ChapterPlaylist] Marking chapter ${chapterId} as completed in database`)

            dispatch(
              markChapterCompleted({
                courseId: courseIdNum,
                chapterId: chapterIdNum,
                userId: user.id,
              }),
            )

            const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0))
            const success = enqueueProgress(
              user.id,
              courseIdNum,
              chapterIdNum,
              "chapter_progress",
              100,
              timeSpent,
              {
                completed: true,
                courseId: String(courseIdNum),
                chapterId: String(chapterIdNum),
                trigger: "playlist_callback",
                videoDuration: videoDurations[currentVideoId || ""] || 0,
                watchedSeconds: timeSpent,
                completedAt: Date.now(),
              },
            )

            if (success) {
              console.log(`[ChapterPlaylist] Chapter completion queued`)
              try {
                await flushQueue()
                await refreshProgressFromServer()
              } catch (err) {
                console.error("Failed to flush progress or refresh progress:", err)
              }
            }
          }
        }
      })()
    },
    [
      user?.id,
      course.id,
      course.isShared,
      completedChapters,
      currentVideoProgress,
      videoDurations,
      currentVideoId,
      dispatch,
      enqueueProgress,
      flushQueue,
    ],
  )

  // Handle progress update from ChapterPlaylist
  const handleProgressUpdate = useCallback(
    (chapterId: string, progress: number) => {
      console.log(`[ChapterPlaylist Callback] Progress update - Chapter: ${chapterId}, Progress: ${progress}%`)

      if (user?.id && !course.isShared && currentVideoId) {
        const chapter = videoPlaylist.find((v) => String(v.chapter.id) === String(chapterId))
        if (chapter && chapter.videoId === currentVideoId) {
          dispatch(
            setVideoProgress({
              courseId: String(course.id),
              chapterId: Number(chapterId),
              progress,
              playedSeconds: Math.round((progress / 100) * (videoDurations[currentVideoId] || 0)),
              completed: progress >= 95,
              userId: user.id,
            }),
          )

          console.log(`[ChapterPlaylist] Progress state updated: ${progress}%`)
        }
      }
    },
    [user?.id, course.id, course.isShared, currentVideoId, videoPlaylist, videoDurations, dispatch],
  )

  const handlePIPToggle = useCallback(
    (activatePiP?: boolean, currentTime?: number) => {
      const shouldActivate = activatePiP ?? false

      dispatch(setPiPActive(shouldActivate))
      if (shouldActivate) {
        const videoTime =
          currentTime || videoStateStore.getState().videoProgress[currentVideoId || ""]?.playedSeconds || 0

        dispatch(
          setPiPVideoData({
            youtubeVideoId: currentVideoId || "",
            chapterId: currentChapter?.id?.toString(),
            courseId: course.id,
            courseName: course.title,
            chapterTitle: currentChapter?.title || "",
            currentTime: videoTime,
          }),
        )
        toast({
          title: "Picture-in-Picture",
          description: "Video is now playing in a separate window.",
        })
      } else {
        dispatch(setPiPVideoData(undefined))
      }
    },
    [currentVideoId, currentChapter, course.id, course.title, videoStateStore],
  )

  const handleTheaterModeToggle = useCallback((newTheaterMode: boolean) => {
    dispatch2({ type: "SET_THEATER_MODE", payload: newTheaterMode })
  }, [])

  const handleAutoplayToggle = useCallback(() => {
    const newMode = !state.autoplayMode
    dispatch2({ type: "SET_AUTOPLAY_MODE", payload: newMode })

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

  // Progress tracking using new event system
  const handleVideoProgress = useCallback(
    (progressState: { played: number; playedSeconds: number }) => {
      setCurrentVideoProgress(progressState.played)

      if (progressState.played > 0.05) {
        if (currentChapter?.id && currentVideoId) {
          if (user?.id && !course.isShared) {
            console.log(
              `[Authenticated] Video progress: ${progressState.played * 100}% for chapter ${currentChapter.id}`,
            )

            dispatch(
              setVideoProgress({
                courseId: String(course.id),
                chapterId: Number(currentChapter.id),
                progress: progressState.played * 100,
                playedSeconds: progressState.playedSeconds,
                completed: false,
                userId: user.id,
              }),
            )

            const success = enqueueProgress(
              user.id,
              course.id,
              currentChapter.id,
              "chapter_progress",
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
                eventSubtype: "continuous_progress",
              },
            )

            if (success) {
              console.log(
                `Progress update queued: ${Math.floor(progressState.played * 100)}% for chapter ${currentChapter.id}`,
              )
            }

            const progressPercent = Math.floor(progressState.played * 100)
            if (progressPercent % 25 === 0 && progressPercent > 0) {
              const success = enqueueProgress(
                user.id,
                course.id,
                currentChapter.id,
                "chapter_progress",
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
                  eventSubtype: "progress_milestone",
                },
              )

              if (success) {
                console.log(`Progress milestone ${progressPercent}% queued for chapter ${currentChapter.id}`)
              } else {
                console.error(`Failed to queue progress milestone ${progressPercent}%`)
              }
            }
          } else {
            console.log(
              `[Guest/Shared] Video progress: ${progressState.played * 100}% for chapter ${currentChapter.id}`,
            )

            trackGuestVideoWithCourse(
              currentVideoId,
              progressState.played * 100,
              progressState.playedSeconds,
              videoDurations[currentVideoId] || 0,
              course.id,
            )
          }
        }
      }
    },
    [
      user?.id,
      course.isShared,
      currentChapter?.id,
      course.id,
      currentVideoId,
      videoDurations,
      setCurrentVideoProgress,
      dispatch,
      enqueueProgress,
      trackGuestVideoWithCourse,
    ],
  )

  const handleVideoEnded = useCallback(() => {
    console.log(
      `Video ended handler called - currentChapter: ${currentChapter?.id}, isCompleted: ${completedChapters.includes(String(currentChapter?.id))}`,
    )

    if (currentChapter) {
      const chapterId = Number(currentChapter.id)
      const courseId = Number(course.id)

      if (user?.id && !course.isShared) {
        const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id))

        if (!isAlreadyCompleted) {
          console.log(`[Authenticated] Marking chapter ${chapterId} as completed for course ${courseId}`)
          dispatch(markChapterCompleted({ courseId, chapterId, userId: user.id }))
        } else {
          console.log(`[Authenticated] Chapter ${chapterId} was already completed. Updating progress only.`)
        }

        dispatch(
          setVideoProgress({
            courseId: String(courseId),
            chapterId: chapterId,
            progress: 100,
            playedSeconds: Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0)),
            completed: true,
            userId: user.id,
          }),
        )

        console.log(
          `[Authenticated] Chapter ${chapterId} completed for course ${courseId} - Recording in enhanced progress system`,
        )

        const success = enqueueProgress(
          user.id,
          courseId,
          chapterId,
          "chapter_progress",
          100,
          Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0)),
          {
            completed: true,
            courseId: String(courseId),
            chapterId: String(chapterId),
            videoId: currentVideoId,
            completedAt: Date.now(),
            completedVia: "video_end",
            finalProgress: 100,
            totalDuration: videoDurations[currentVideoId || ""] || 0,
          },
        )

        if (success) {
          console.log(`Chapter completion queued for chapter ${chapterId}`)
        } else {
          console.error("Failed to queue chapter completion")
        }
      } else {
        console.log(`[Guest/Shared] Marking chapter ${chapterId} as completed for course ${courseId}`)

        markGuestChapterCompleted(chapterId)

        trackGuestVideoWithCourse(
          currentVideoId || "",
          100,
          Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0)),
          videoDurations[currentVideoId || ""] || 0,
          course.id,
        )
      }

      if (state.autoplayMode && hasNextVideo && nextVideoEntry) {
        console.log(`Autoplay enabled. Advancing to next video in 1 second`)
        setTimeout(() => {
          handleNextVideo()
        }, 1000)
      } else if (!state.autoplayMode) {
        console.log("Autoplay disabled. Not advancing to next video automatically.")
      } else if (!hasNextVideo) {
        console.log("No next video available. Reached end of playlist.")
      }
    }

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
    trackGuestVideoWithCourse,
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
        (entry) => String(entry.chapter.id) === String(courseProgress.videoProgress.currentChapterId),
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
      dispatch2({ type: "SET_HEADER_COMPACT", payload: window.scrollY > 100 })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Flush progress on page unload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushProgress().catch(console.error)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Sidebar course data - deduplicated by videoId
  const sidebarCourse = useMemo(() => {
    const seen = new Set<string>()
    const uniqueChapters = videoPlaylist
      .filter((v) => {
        const vid = v.chapter.videoId
        if (!vid || seen.has(vid)) return false
        seen.add(vid)
        return true
      })
      .map((v) => ({
        id: String(v.chapter.id),
        title: v.chapter.title,
        videoId: v.chapter.videoId || undefined,
        duration: typeof v.chapter.duration === "number" ? v.chapter.duration : undefined,
        isFree: v.chapter.isFree,
      }))

    return {
      id: String(course.id),
      title: course.title,
      chapters: uniqueChapters,
    }
  }, [course.id, course.title, videoPlaylist])

  const sidebarCurrentChapter = currentChapter
    ? {
        id: String(currentChapter.id),
        title: currentChapter.title,
        videoId: currentChapter.videoId || undefined,
        duration: typeof currentChapter.duration === "number" ? currentChapter.duration : undefined,
        isFree: currentChapter.isFree,
      }
    : null

  // Auth prompt overlay
  const authPromptOverlay = state.showAuthPrompt ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background/95 backdrop-blur-sm border-4 border-black">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        {!user ? (
          <SignInPrompt
            variant="card"
            context="course"
            feature="course-videos"
            callbackUrl={typeof window !== "undefined" ? window.location.href : undefined}
            onClose={() => dispatch2({ type: "SET_AUTH_PROMPT", payload: false })}
          />
        ) : (
          <></>
        )}
      </div>
    </div>
  ) : null

  // Enhanced course stats for the header
  const enhancedCourseStats = useMemo(() => {
    const totalVideos = videoPlaylist.length
    const completedVideos = completedChapters.length
    const totalDuration = formatDuration(totalCourseDuration)
    
    return {
      totalVideos,
      completedVideos,
      totalDuration,
      progressPercentage: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
    }
  }, [videoPlaylist.length, completedChapters.length, totalCourseDuration])

  return (
    <div className="min-h-screen bg-white relative">
      {/* Share course notice banner */}
      {course.isShared && (
        <div className="bg-blue-200 border-b-4 border-black p-4 transition-opacity duration-200">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
            <p className="text-sm font-black text-black uppercase tracking-tight">
              📚 Shared Course Preview — Watch all videos • Take quiz • Save bookmarks (local only)
            </p>
          </div>
        </div>
      )}

      {authPromptOverlay}

      {/* Enhanced Sticky Header */}
      <header className={cn(
        "sticky top-0 z-50 bg-white border-b-4 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300",
        state.headerCompact && "py-2"
      )}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Left: Course title and progress */}
            <div className="flex-1 min-w-0 flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-black" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className={cn(
                  "font-black uppercase tracking-tight truncate text-black",
                  state.headerCompact ? "text-lg" : "text-2xl lg:text-3xl"
                )}>
                  {course.title}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-sm font-black text-gray-700">
                    <Clock className="h-3 w-3" />
                    <span>{enhancedCourseStats.totalDuration}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-black text-gray-700">
                    <Play className="h-3 w-3" />
                    <span>{enhancedCourseStats.totalVideos} videos</span>
                  </div>
                  {state.headerCompact && (
                    <div className="flex items-center gap-1 text-sm font-black">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>{enhancedCourseStats.completedVideos}/{enhancedCourseStats.totalVideos}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Enhanced Progress */}
            {!state.headerCompact && (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white border-2 border-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-black text-sm">
                      {enhancedCourseStats.completedVideos}/{enhancedCourseStats.totalVideos}
                    </span>
                  </div>
                  <div className="w-32 h-3 bg-gray-200 border border-black">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${enhancedCourseStats.progressPercentage}%` }}
                    />
                  </div>
                  <div className="font-black text-sm min-w-[40px] text-center">
                    {enhancedCourseStats.progressPercentage}%
                  </div>
                </div>
              </div>
            )}

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => dispatch2({ type: "SET_SIDEBAR_COLLAPSED", payload: !state.sidebarCollapsed })}
                className="hidden xl:flex bg-blue-400 hover:bg-blue-500 text-black font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                {state.sidebarCollapsed ? (
                  <>
                    <Menu className="h-4 w-4 mr-2" />
                    Show Chapters
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Hide Chapters
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

          {/* Mobile progress - Enhanced */}
          <div className="md:hidden border-t-2 border-black pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-black">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{enhancedCourseStats.completedVideos} of {enhancedCourseStats.totalVideos} completed</span>
              </div>
              <div className="bg-white border-2 border-black px-2 py-1 font-black text-sm">
                {enhancedCourseStats.progressPercentage}%
              </div>
            </div>
            <div className="h-3 bg-gray-200 border border-black">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${enhancedCourseStats.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Video generation section for owners */}
      {(isOwner || user?.isAdmin) && (
        <div className="bg-yellow-100 border-b-4 border-black transition-all overflow-hidden">
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
        </div>
      )}

      {/* Enhanced Mobile playlist toggle */}
      {!state.isTheaterMode && (
        <div className="lg:hidden border-b-4 border-black bg-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-3">
            <Button
              variant="neutral"
              onClick={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: !state.mobilePlaylistOpen })}
              className="w-full justify-between h-14 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-black uppercase text-sm">Course Content</div>
                  <div className="text-xs font-bold text-gray-600">
                    {currentChapter?.title || "Select a chapter"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MobilePlaylistCount
                  currentIndex={currentIndex}
                  hasCurrentChapter={Boolean(currentChapter)}
                  total={videoPlaylist.length}
                />
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Main content */}
      <main className={cn("transition-all duration-100", state.isTheaterMode && "bg-black")}>
        {/* Top spacer for MainNavbar */}
        {!state.isTheaterMode && <div className="h-16" />}
        
        <div
          className={cn(
            "mx-auto transition-all duration-100",
            state.isTheaterMode ? "max-w-none px-0" : "max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4",
          )}
        >
          {/* Course Stats Bar */}
          {!state.isTheaterMode && (
            <div className="flex flex-wrap gap-2 mb-3">
              <CourseStatBadge 
                icon={Play} 
                value={videoPlaylist.length.toString()} 
                label="Videos" 
              />
              <CourseStatBadge 
                icon={Clock} 
                value={formatDuration(totalCourseDuration)} 
                label="Total Duration" 
              />
              <CourseStatBadge 
                icon={CheckCircle} 
                value={`${enhancedCourseStats.progressPercentage}%`} 
                label="Completed" 
              />
              {course.rating && (
                <CourseStatBadge 
                  icon={Star} 
                  value={course.rating.toString()} 
                  label="Rating" 
                />
              )}
            </div>
          )}

          <div
            className={cn(
              "transition-all duration-100",
              state.sidebarCollapsed || state.isTheaterMode
                ? "flex flex-col"
                : "flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-3 lg:gap-4",
            )}
          >
            {/* Video and content area */}
            <div className="space-y-3 min-w-0">
              {/* Guest Progress Indicator */}
              {!user && (
                <div className="mb-3 transition-transform duration-100">
                  <GuestProgressIndicator courseId={course.id} />
                </div>
              )}

              {/* Video Player - Clean minimal container */}
              <div className="relative">
                {isPiPActive ? (
                  <div className="bg-gray-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-20 h-20 mx-auto mb-4 bg-blue-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                          <Play className="h-10 w-10 text-black" />
                        </div>
                        <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Picture-in-Picture Active</h3>
                        <p className="text-gray-600 text-sm font-bold">Video is playing in a separate window</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-black overflow-hidden">
                    <VideoPlayer
                      youtubeVideoId={currentVideoId || ""}
                      chapterId={currentChapter?.id ? String(currentChapter.id) : ""}
                      chapterTitle={currentChapter?.title || ""}
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
                      initialSeekSeconds={(() => {
                        try {
                          if (
                            courseProgress?.videoProgress?.playedSeconds &&
                            String(courseProgress.videoProgress.currentChapterId) === String(currentChapter?.id)
                          ) {
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
                )}
              </div>

              {/* Current Chapter Info */}
              {!state.isTheaterMode && currentChapter && (
                <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-black text-lg uppercase tracking-tight truncate">{currentChapter.title}</h2>
                      {currentChapter.description && (
                        <p className="text-gray-600 font-bold text-sm mt-0.5 line-clamp-1">{currentChapter.description}</p>
                      )}
                    </div>
                    {videoDurations[currentVideoId || ""] && (
                      <div className="bg-yellow-400 border-2 border-black px-2.5 py-1 font-black text-xs whitespace-nowrap flex-shrink-0">
                        {formatDuration(videoDurations[currentVideoId || ""])}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contextual Sign-In Prompt */}
              {!user && (
                <div className="bg-blue-200 border-4 border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <ContextualSignInPrompt action="continue_course" courseId={String(course.id)} />
                </div>
              )}

              {!state.isTheaterMode && (
                <div className="transition-all duration-100">
                  <div className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <div className="p-3">
                      <MemoizedCourseDetailsTabs
                        course={course}
                        currentChapter={currentChapter}
                        onSeekToBookmark={handleSeekToBookmark}
                        completedChapters={completedChapters}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!state.isTheaterMode && (
                <div className="transition-all duration-100">
                  <div className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <div className="p-3">
                      <ReviewsSection slug={course.slug} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Sidebar */}
            {!state.sidebarCollapsed && !state.isTheaterMode && (
              <div className="hidden lg:block space-y-3 min-w-0 w-full">
                <div className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white h-full overflow-hidden">
                  <div className="p-0">
                    {sidebarCourse.chapters.length === 0 ? (
                      <div className="p-8 text-center">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 text-black" />
                        <h3 className="font-black text-lg mb-2 uppercase">No Videos Available</h3>
                        <p className="text-sm text-gray-600 font-bold">
                          This course doesn't have any video content yet.
                        </p>
                      </div>
                    ) : (
                      <VideoNavigationSidebar
                        course={sidebarCourse}
                        currentChapter={sidebarCurrentChapter}
                        courseId={course.id.toString()}
                        currentVideoId={currentVideoId || ""}
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
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile playlist overlay */}
      {!state.isTheaterMode && (
        <MobilePlaylistOverlay
          isOpen={state.mobilePlaylistOpen}
          onClose={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: false })}
          course={sidebarCourse}
          currentChapter={sidebarCurrentChapter}
          courseId={course.id.toString()}
          currentVideoId={currentVideoId || ""}
          isAuthenticated={!!user}
          userSubscription={userSubscription || null}
          completedChapters={completedChapters.map(String)}
          formatDuration={formatDuration}
          videoDurations={videoDurations}
          courseStats={courseStats}
          onChapterSelect={handleChapterSelect}
        />
      )}

      {/* Enhanced Subscribe CTA */}
      {!userSubscription && !state.isTheaterMode && (
        <div className="fixed bottom-6 right-6 z-40 transition-transform duration-200">
          <Button
            size="lg"
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase px-6 py-3"
          >
            <Zap className="h-5 w-5 mr-2" />
            <span>Unlock All Courses</span>
          </Button>
        </div>
      )}

      {/* Certificate modal */}
      <CertificateModal
        show={state.showCertificate}
        onClose={() => dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: false })}
        courseId={course.id}
        courseTitle={course.title}
        userName={user?.name || null}
        totalLessons={videoPlaylist.length}
      />

      {/* Debug component */}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-4 left-4 z-50">
          <VideoDebug
            videoId={currentVideoId || ""}
            courseId={course.id}
            chapterId={currentChapter?.id ? String(currentChapter.id) : ""}
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(MainContent)