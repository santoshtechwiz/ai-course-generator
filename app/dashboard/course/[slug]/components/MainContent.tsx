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
// Inner Component - Uses CourseModuleContext
// ============================================================================
const MainContentInner: React.FC<ModernCoursePageProps> = ({ course, initialChapterId, isFullscreen = false }) => {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { status } = useSession()
  const { buttonPrimary, buttonSecondary, buttonIcon, cardPrimary, cardSecondary, badge } =
    getColorClasses()

  // Global PiP state
  const { isPiPActive } = useAppSelector((state) => state.course)

  // ✅ PHASE 2 FIX: Use CourseModuleContext instead of individual hooks
  const {
    user,
    isOwner: contextIsOwner,
    isGuest,
    progress: unifiedProgress,
    completedChapters: contextCompletedChapters,
    courseStats: contextCourseStats,
    markChapterCompleted: markChapterComplete,
    setCurrentChapter: setCurrentChapterProgress,
    refreshProgress: refreshProgressFromServer,
    isLoadingProgress: progressLoading,
    currentVideoId: contextCurrentVideoId,
    currentChapter: contextCurrentChapter,
  } = useCourseModule()

  // Use context values
  const isOwner = contextIsOwner
  const currentVideoId = contextCurrentVideoId

  // Use reducer for state management
  const [state, dispatch2] = useReducer(stateReducer, initialState)

  // Additional state
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)
  const [currentVideoProgress, setCurrentVideoProgress] = useState<number>(0)
  
  // Throttle progress events - only send every 3 seconds
  const lastProgressEventTime = React.useRef<number>(0)
  const PROGRESS_THROTTLE_MS = 3000

  // Get video state store
  const videoStateStore = useVideoState

  // Load bookmarks from database
  const { bookmarks: dbBookmarks, loading: bookmarksLoading } = useBookmarks({
    courseId: course.id,
    limit: 5,
  })

  // Sync database bookmarks with Redux state
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
        console.warn("Failed to sync bookmarks:", error)
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

  // ✅ PHASE 2 FIX: Use completedChapters from context instead of computing locally
  const completedChapters = contextCompletedChapters

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

  // Memoized video playlist
  const videoPlaylist = useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapterType }[] = []

    if (!course?.courseUnits) {
      return playlist
    }

    let globalIndex = 0

    try {
      course.courseUnits.forEach((unit) => {
        if (!unit.chapters) return

        unit.chapters
          .filter((chapter) => {
            return Boolean(
              chapter &&
              typeof chapter === "object" &&
              chapter.id &&
              chapter.videoId &&
              typeof chapter.videoId === "string",
            )
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

  // Pre-populate videoDurations
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
  
  // ✅ AUTO-SHOW CERTIFICATE: Detect 100% completion and open modal
  useEffect(() => {
    if (!user?.id) return // Only for authenticated users
    
    const totalChapters = videoPlaylist.length
    const completedCount = completedChapters.length
    const isFullyCompleted = totalChapters > 0 && completedCount === totalChapters
    
    if (isFullyCompleted && !state.showCertificate && !state.resumePromptShown) {
      console.log('[MainContent] 🎉 Course 100% complete! Opening certificate modal')
      dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: true })
    }
  }, [completedChapters.length, videoPlaylist.length, user?.id, state.showCertificate, state.resumePromptShown])

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

  // ✅ PHASE 2 FIX: Use courseStats from context
  const courseStats = contextCourseStats

  // Calculate total course duration
  const totalCourseDuration = useMemo(() => {
    return videoPlaylist.reduce((total, { videoId }) => {
      return total + (videoDurations[videoId] || 0)
    }, 0)
  }, [videoPlaylist, videoDurations])

  // Enhanced progress tracking
  const { enqueueProgress, flushQueue, isLoading: mutationLoading } = useProgressMutation()

  // Build progress object
  const progressByVideoId = useMemo(() => {
    const progress: Record<string, number> = {}

    try {
      // ✅ PHASE 2 FIX: Use unified progress from context
      let progressData = unifiedProgress ? {
        progress: unifiedProgress.progress,
        completedChapters: unifiedProgress.completedChapters,
        currentChapterId: unifiedProgress.currentChapterId,
        lastPositions: unifiedProgress.lastPositions,
        playedSeconds: unifiedProgress.playedSeconds,
      } : null

      if (videoPlaylist.length > 0 && progressData) {
        videoPlaylist.forEach(({ videoId, chapter }) => {
          if (videoId) {
            const chapterId = String(chapter.id)
            const savedSecondsForChapter = progressData?.lastPositions
              ? (progressData.lastPositions as Record<string, number>)[chapterId]
              : undefined
            let videoDuration = videoDurations[videoId]
            if (!videoDuration) {
              if (typeof savedSecondsForChapter === "number" && savedSecondsForChapter > 0) {
                videoDuration = Math.max(savedSecondsForChapter, 60)
              } else {
                videoDuration = 1
              }
            }

            const isCompleted = completedChapters.includes(chapterId)
            if (isCompleted) {
              progress[videoId] = 100
            } else if (String(progressData?.currentChapterId) === chapterId) {
              const playedSeconds = progressData?.playedSeconds || 0
              const percent = Math.min((playedSeconds / videoDuration) * 100, 100)
              progress[videoId] = percent
            } else if (progressData?.lastPositions && (progressData.lastPositions as Record<string, number>)[chapterId]) {
              const savedSeconds = (progressData.lastPositions as Record<string, number>)[chapterId]
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
  }, [unifiedProgress, videoPlaylist, videoDurations, completedChapters])

  // Extract lastPositions map
  const chapterLastPositions = useMemo(() => {
    try {
      const unifiedLast = unifiedProgress?.lastPositions || {}
      return unifiedLast as Record<string, number>
    } catch (e) {
      console.warn("Failed to get last positions:", e)
      return {}
    }
  }, [unifiedProgress])

  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: true })
  }, [])

  // Navigation handlers
  const handleNextVideo = useCallback(async () => {
    if (!hasNextVideo || !nextVideoEntry) {
      if (isLastVideo) {
        handleCertificateClick()
      }
      return
    }

    const nextVid = nextVideoEntry.videoId
    if (!nextVid) {
      console.error("Next video entry has no videoId")
      return
    }

    // Mark current chapter as completed if authenticated
    if (currentChapter && user?.id && !course.isShared) {
      const currentChapterId = Number(currentChapter.id)
      const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id))

      if (!isAlreadyCompleted) {
        const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0))
        
        const success = enqueueProgress(user.id, course.id, currentChapterId, "chapter_progress", 100, timeSpent, {
          completed: true,
          courseId: String(course.id),
          chapterId: String(currentChapterId),
          trigger: "next_click",
          videoDuration: videoDurations[currentVideoId || ""] || 0,
          watchedSeconds: timeSpent,
          completedAt: Date.now(),
        })

        console.log('[MainContent] ✅ Chapter completion enqueued:', currentChapterId);

        if (success) {
          dispatch(
            markChapterCompleted({
              courseId: Number(course.id),
              chapterId: currentChapterId,
              userId: user.id,
            }),
          )

          // Trigger immediate cache invalidation and refetch
          console.log('[MainContent] 🎯 Dispatching progressSynced event after markChapterCompleted');
          window.dispatchEvent(new CustomEvent('progressSynced', {
            detail: {
              requiresRefetch: true,
              completedChaptersMap: { [String(course.id)]: [currentChapterId] },
              courseId: String(course.id),
              chapterId: String(currentChapterId)
            }
          }));

          try {
            await flushQueue()
            await refreshProgressFromServer()
            console.log('[MainContent] ✅ Progress synced for chapter:', currentChapterId);
          } catch (err) {
            console.error("[MainContent] ❌ Failed to sync progress:", err)
          }
        }
      }
    }

    // Set next video
    dispatch(setCurrentVideoApi(nextVid))

    try {
      videoStateStore.getState().setCurrentVideo(nextVid, course.id)

      if (user?.id && !course.isShared && nextVideoEntry.chapter?.id) {
        enqueueProgress(user.id, course.id, nextVideoEntry.chapter.id, "chapter_start", 0, 0, {
          courseId: String(course.id),
          chapterId: String(nextVideoEntry.chapter.id),
          progress: 0,
          playedSeconds: 0,
          duration: 0,
          videoId: nextVid,
          startedAt: Date.now(),
          previouslyCompleted: completedChapters.includes(String(nextVideoEntry.chapter.id)),
        })
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
    currentChapter,
    completedChapters,
    currentVideoProgress,
    videoDurations,
    currentVideoId,
    enqueueProgress,
    flushQueue,
    refreshProgressFromServer,
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
            description: "This chapter appears to be invalid.",
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
          enqueueProgress(user.id, course.id, safeChapter.id, "chapter_start", 0, 0, {
            videoId: videoId,
            startedAt: Date.now(),
            previouslyCompleted: completedChapters.includes(String(safeChapter.id)),
          })
        }

        dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: false })
        dispatch2({ type: "SET_VIDEO_LOADING", payload: true })
      } catch (error) {
        console.error("Error selecting chapter:", error)
        toast({
          title: "Selection Error",
          description: "There was a problem selecting this chapter.",
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
        enqueueProgress(user.id, course.id, currentChapter.id, "chapter_progress", 0, 0, {
          courseId: String(course.id),
          chapterId: String(currentChapter.id),
          progress: 0,
          playedSeconds: 0,
          duration: metadata.duration,
          videoId: currentVideoId,
          loadedAt: Date.now(),
          eventSubtype: "video_metadata_loaded",
        })
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
      (async () => {
        const chapterIdNum = Number(chapterId)
        const courseIdNum = Number(course.id)

        if (user?.id && !course.isShared) {
          const isAlreadyCompleted = completedChapters.includes(String(chapterId))

          if (!isAlreadyCompleted) {
            dispatch(
              markChapterCompleted({
                courseId: courseIdNum,
                chapterId: chapterIdNum,
                userId: user.id,
              }),
            )

            // Trigger immediate cache invalidation and refetch
            console.log('[MainContent] 🎯 Dispatching progressSynced event after markChapterCompleted');
            window.dispatchEvent(new CustomEvent('progressSynced', {
              detail: {
                requiresRefetch: true,
                completedChaptersMap: { [String(courseIdNum)]: [chapterIdNum] },
                courseId: String(courseIdNum),
                chapterId: String(chapterIdNum)
              }
            }));

            const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0))
            const success = enqueueProgress(user.id, courseIdNum, chapterIdNum, "chapter_progress", 100, timeSpent, {
              completed: true,
              courseId: String(courseIdNum),
              chapterId: String(chapterIdNum),
              trigger: "playlist_callback",
              videoDuration: videoDurations[currentVideoId || ""] || 0,
              watchedSeconds: timeSpent,
              completedAt: Date.now(),
            })

            if (success) {
              try {
                await flushQueue()
                await refreshProgressFromServer()
              } catch (err) {
                console.error("Failed to flush progress:", err)
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
      refreshProgressFromServer,
    ],
  )

  // Handle progress update
  const handleProgressUpdate = useCallback(
    (chapterId: string, progress: number) => {
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
    [currentVideoId, currentChapter, course.id, course.title, videoStateStore, dispatch, toast],
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

  // Progress tracking
  const handleVideoProgress = useCallback(
    (progressState: { played: number; playedSeconds: number }) => {
      setCurrentVideoProgress(progressState.played)

      if (progressState.played > 0.05) {
        if (currentChapter?.id && currentVideoId) {
          if (user?.id && !course.isShared) {
            // Always update Redux state for instant UI feedback
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

            // Throttle API events - only send every 3 seconds
            const now = Date.now()
            const timeSinceLastEvent = now - lastProgressEventTime.current
            
            if (timeSinceLastEvent >= PROGRESS_THROTTLE_MS) {
              lastProgressEventTime.current = now
              
              enqueueProgress(
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
            }

            // Milestone tracking - still track 25%, 50%, 75%, 100%
            const progressPercent = Math.floor(progressState.played * 100)
            if (progressPercent % 25 === 0 && progressPercent > 0) {
              enqueueProgress(
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
            }
          } else {
            // ✅ PHASE 2 FIX: Progress tracking through context (removed updateVideoProgressTracking)
            console.log('[MainContent] Video progress tracked:', {
              chapterId: currentChapter?.id,
              progress: progressState.playedSeconds,
            })
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
    ],
  )

  const handleVideoEnded = useCallback(() => {
    if (currentChapter) {
      const chapterId = Number(currentChapter.id)
      const courseId = Number(course.id)

      if (user?.id && !course.isShared) {
        const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id))

        if (!isAlreadyCompleted) {
          dispatch(markChapterCompleted({ courseId, chapterId, userId: user.id }))
          
          // Trigger immediate cache invalidation and refetch
          console.log('[MainContent] 🎯 Dispatching progressSynced event after markChapterCompleted (video ended)');
          window.dispatchEvent(new CustomEvent('progressSynced', {
            detail: {
              requiresRefetch: true,
              completedChaptersMap: { [String(courseId)]: [chapterId] },
              courseId: String(courseId),
              chapterId: String(chapterId)
            }
          }));
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

        const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ""] || 0))
        enqueueProgress(
          user.id,
          courseId,
          chapterId,
          "chapter_progress",
          100,
          timeSpent,
          {
            completed: true,
            courseId: String(courseId),
            chapterId: String(chapterId),
            videoId: currentVideoId,
            completedAt: Date.now(),
            completedVia: "video_end",
            finalProgress: 100,
            totalDuration: videoDurations[currentVideoId || ""] || 0,
            playedSeconds: timeSpent,
          },
        )

        // ✅ CRITICAL: Flush progress immediately after chapter completion
        // This ensures completedChapters are synced before page navigation
        setTimeout(() => {
          flushQueue().catch(err => console.error('[handleVideoEnded] Flush failed:', err))
        }, 100)
      } else {
        // ✅ PHASE 1 FIX: Use unified progress tracking for guests
        markChapterComplete(chapterId)
      }

      if (state.autoplayMode && hasNextVideo && nextVideoEntry) {
        setTimeout(() => {
          handleNextVideo()
        }, 1000)
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
    flushQueue,
    markChapterComplete,
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

    // ✅ PHASE 1 FIX: Use unified progress for current chapter
    if (!targetVideo && unifiedProgress?.currentChapterId) {
      targetVideo = videoPlaylist.find(
        (entry) => String(entry.chapter.id) === String(unifiedProgress.currentChapterId),
      )
    }

    if (!targetVideo && videoPlaylist.length > 0) {
      targetVideo = videoPlaylist[0]
    }

    if (targetVideo?.videoId) {
      dispatch(setCurrentVideoApi(targetVideo.videoId))
      videoStateStore.getState().setCurrentVideo(targetVideo.videoId, course.id)
    }
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, unifiedProgress])

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

  // Flush progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushProgress().catch(console.error)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Sidebar course data
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

  // Enhanced course stats
  const enhancedCourseStats = useMemo(() => {
    const totalVideos = videoPlaylist.length
    const completedVideos = completedChapters.length
    const totalDuration = formatDuration(totalCourseDuration)

    return {
      totalVideos,
      completedVideos,
      totalDuration,
      progressPercentage: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
    }
  }, [videoPlaylist.length, completedChapters.length, totalCourseDuration])

  // Progress bar component
  const ChapterProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-lime-500 dark:bg-lime-400 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
        aria-label={`Chapter progress: ${progress}%`}
      />
    </div>
  )

  return (
    <>
      {renderCourseDashboard(
        course,
        authPromptOverlay,
        state,
        enhancedCourseStats,
        dispatch2,
        isOwner,
        user,
        dispatch,
        currentChapter,
        currentIndex,
        videoPlaylist,
        totalCourseDuration,
        isPiPActive,
        currentVideoId,
        bookmarkItems,
        handleVideoProgress,
        handleVideoEnded,
        handleVideoLoad,
        handlePlayerReady,
        handlePIPToggle,
        handleTheaterModeToggle,
        unifiedProgress,
        handleAutoplayToggle,
        handleNextVideo,
        nextVideoId,
        nextVideoTitle,
        hasNextVideo,
        videoDurations,
        handleSeekToBookmark,
        completedChapters,
        sidebarCourse,
        sidebarCurrentChapter,
        userSubscription,
        courseStats,
        handleChapterSelect,
        progressByVideoId,
        handleProgressUpdate,
        handleChapterComplete,
        progressLoading,
        chapterLastPositions,
        ChapterProgressBar,
        router
      )}
      
      {/* ✅ FLOATING COURSEAI LOGO: Bottom-right with animations */}
      <AnimatedCourseAILogo 
        position="floating" 
        size="md" 
        animated={true}
      />
      
      {/* ✅ CERTIFICATE MODAL: Auto-shows when course is 100% complete */}
      <CertificateModal
        show={state.showCertificate}
        onClose={() => dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: false })}
        courseId={course.id}
        courseTitle={course.title}
        userName={user?.name || null}
        totalLessons={videoPlaylist.length}
      />
    </>
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