// ============================================================================
// Inner Component - Uses CourseModuleContext

import { FullChapterType, FullCourseType } from "@/app/types/course-types"
import { SignInPrompt } from "@/components/shared"
import { useToast } from "@/hooks"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { migratedStorage } from "@/lib/storage"
import { flushProgress } from "@/services/enhanced-progress/client_progress_queue"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCurrentVideoApi } from "@/store/slices/course-slice"
import { storageManager } from "@/utils/storage-manager"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useReducer, useEffect, useCallback, useMemo } from "react"
import { useCourseModule } from "../context/CourseModuleContext"
import { validateChapterWithVideo } from "../utils/validators"
import CertificateModal from "./CertificateModal"
import { renderCourseDashboard } from "./CourseDetailsShell"
import { useVideoPlayerSection } from "./sections/VideoPlayerSection"
import { useProgressSection } from "./sections/ProgressSection"
import AnimatedCourseAILogo from "./video/components/AnimatedCourseAILogo"
import { useVideoState } from "./video/hooks/useVideoState"
import { BookmarkData } from "./video/types"

// Component State Types
interface LocalComponentState {
  showCertificate: boolean
  autoplayMode: boolean
  isTheaterMode: boolean
  isVideoLoading: boolean
  mobilePlaylistOpen: boolean
  sidebarCollapsed: boolean
  authPromptVisible: boolean
  headerCompact: boolean
  mounted: boolean
  freeVideoPlayed: boolean
}

type LocalComponentAction =
  | { type: "SET_CERTIFICATE_VISIBLE"; payload: boolean }
  | { type: "SET_AUTOPLAY_MODE"; payload: boolean }
  | { type: "SET_THEATER_MODE"; payload: boolean }
  | { type: "SET_VIDEO_LOADING"; payload: boolean }
  | { type: "SET_MOBILE_PLAYLIST_OPEN"; payload: boolean }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "SET_AUTH_PROMPT"; payload: boolean }
  | { type: "SET_HEADER_COMPACT"; payload: boolean }
  | { type: "SET_MOUNTED"; payload: boolean }
  | { type: "SET_FREE_VIDEO_PLAYED"; payload: boolean }

const initialState: LocalComponentState = {
  showCertificate: false,
  autoplayMode: false,
  isTheaterMode: false,
  isVideoLoading: true,
  mobilePlaylistOpen: false,
  sidebarCollapsed: false,
  authPromptVisible: false,
  headerCompact: false,
  mounted: false,
  freeVideoPlayed: false,
}

const stateReducer = (state: LocalComponentState, action: LocalComponentAction): LocalComponentState => {
  switch (action.type) {
    case "SET_CERTIFICATE_VISIBLE":
      return { ...state, showCertificate: action.payload }
    case "SET_AUTOPLAY_MODE":
      return { ...state, autoplayMode: action.payload }
    case "SET_THEATER_MODE":
      return { ...state, isTheaterMode: action.payload }
    case "SET_VIDEO_LOADING":
      return { ...state, isVideoLoading: action.payload }
    case "SET_MOBILE_PLAYLIST_OPEN":
      return { ...state, mobilePlaylistOpen: action.payload }
    case "SET_SIDEBAR_COLLAPSED":
      return { ...state, sidebarCollapsed: action.payload }
    case "SET_AUTH_PROMPT":
      return { ...state, authPromptVisible: action.payload }
    case "SET_HEADER_COMPACT":
      return { ...state, headerCompact: action.payload }
    case "SET_MOUNTED":
      return { ...state, mounted: action.payload }
    case "SET_FREE_VIDEO_PLAYED":
      return { ...state, freeVideoPlayed: action.payload }
    default:
      return state
  }
}

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
}

// ============================================================================
const MainContentInner: React.FC<ModernCoursePageProps> = ({ course, initialChapterId }) => {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  // ✅ PHASE 2 FIX: Use CourseModuleContext instead of individual hooks
  const {
    user,
    isOwner: contextIsOwner,
    isGuest,
    progress: unifiedProgress,
    completedChapters: contextCompletedChapters,
    courseStats: contextCourseStats,
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

  // ✅ RESTORATION: Initialize current video from persisted Redux state
  const courseProgress = useAppSelector((state) => state.courseProgress)
  const isVideoInitialized = useAppSelector((state) => Boolean(state.course.currentVideoId))

  useEffect(() => {
    // Only run once on mount, after Redux rehydration, and only if video not already set
    if (isVideoInitialized) return
    
    const courseId = course.id.toString()
    const persistedProgress = courseProgress.byCourseId?.[courseId]
    const lastChapterId = persistedProgress?.videoProgress?.currentChapterId
    
    // Try to restore last watched chapter
    if (lastChapterId && videoPlaylist.some(v => v.videoId === lastChapterId)) {
      console.log(`[MainContentInner] ✅ Restoring last chapter: ${lastChapterId}`)
      dispatch(setCurrentVideoApi(lastChapterId))
    } 
    // Fallback: Use initialChapterId if provided
    else if (initialChapterId && videoPlaylist.some(v => v.videoId === initialChapterId)) {
      console.log(`[MainContentInner] ✅ Using initialChapterId: ${initialChapterId}`)
      dispatch(setCurrentVideoApi(initialChapterId))
    }
    // Fallback: Use first video in playlist
    else if (videoPlaylist.length > 0) {
      console.log(`[MainContentInner] ℹ️ No persisted chapter, using first video`)
      dispatch(setCurrentVideoApi(videoPlaylist[0].videoId))
    }
  }, [videoPlaylist.length]) // Only depend on playlist being ready

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
  
  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: true })
  }, [])

  // Video loading change handler (memoized to prevent infinite re-renders)
  const handleVideoLoadingChange = useCallback((isLoading: boolean) => {
    dispatch2({ type: "SET_VIDEO_LOADING", payload: isLoading })
  }, [])

  // ✅ PHASE 2: Use proper hooks for video player and progress logic
  const videoPlayerState = useVideoPlayerSection({
    course,
    currentChapter,
    currentIndex,
    videoPlaylist,
    isLastVideo,
    hasNextVideo,
    nextVideoEntry,
    autoplayMode: state.autoplayMode,
    isTheaterMode: state.isTheaterMode,
    onTheaterModeToggle: (newMode) => dispatch2({ type: "SET_THEATER_MODE", payload: newMode }),
    onNextVideo: async () => {}, // Will implement below
    onCertificateClick: handleCertificateClick,
    onVideoLoadingChange: handleVideoLoadingChange,
  })

  // Destructure video player state
  const {
    videoDurations,
    currentVideoProgress,
    setCurrentVideoProgress,
    isPiPActive,
    handlePIPToggle,
    handleTheaterModeToggle,
    handleVideoProgress,
    handleVideoEnded,
    handleVideoLoad,
    handlePlayerReady,
    handleSeekToBookmark,
  } = videoPlayerState
  
  // ✅ PHASE 3: Use proper hook for progress tracking logic
  const progressSection = useProgressSection({
    course,
    videoPlaylist,
    currentVideoId,
    currentVideoProgress,
    videoDurations,
    completedChapters,
  })
  
  // Destructure progress handlers
  const {
    handleChapterComplete,
    handleProgressUpdate,
  } = progressSection
  
  // ✅ AUTO-SHOW CERTIFICATE: Detect 100% completion and open modal
  useEffect(() => {
    if (!user?.id) return // Only for authenticated users
    
    const totalChapters = videoPlaylist.length
    const completedCount = completedChapters.length
    const isFullyCompleted = totalChapters > 0 && completedCount === totalChapters
    
    if (isFullyCompleted && !state.showCertificate) {
      console.log('[MainContent] 🎉 Course 100% complete! Opening certificate modal')
      dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: true })
    }
  }, [completedChapters.length, videoPlaylist.length, user?.id, state.showCertificate])

  // User subscription status
  const userSubscription = useMemo(() => {
    return user?.subscriptionPlan || null
  }, [user?.subscriptionPlan])

  // ✅ PHASE 2 FIX: Use courseStats from context
  const courseStats = contextCourseStats

  // Calculate total course duration
  const totalCourseDuration = useMemo(() => {
    return videoPlaylist.reduce((total, { videoId }) => {
      return total + (videoDurations[videoId] || 0)
    }, 0)
  }, [videoPlaylist, videoDurations])

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

  // Certificate handler - duplicate removed (already defined above for VideoPlayerSection)

  // Autoplay toggle (kept in MainContent, not video-specific)
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
        // ✅ PHASE 3: Use ProgressSection's handleChapterComplete
        await handleChapterComplete(currentChapterId)
        console.log('[MainContent] ✅ Chapter completed via next click:', currentChapterId)
      }
    }

    // Set next video
    dispatch(setCurrentVideoApi(nextVid))

    try {
      videoStateStore.getState().setCurrentVideo(nextVid, course.id)

      // ✅ PHASE 3: Chapter start tracking removed (not critical for progress)
      // Progress is tracked via VideoPlayerSection's handleVideoProgress
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
    handleChapterComplete,
    refreshProgressFromServer,
  ])

  // Chapter selection handler
  const handleChapterSelect = useCallback(
    (videoId: string) => {
      try {
        const selectedEntry = videoPlaylist.find((entry) => entry.videoId === videoId)
        
        if (!selectedEntry) {
          toast({
            title: "Chapter Not Found",
            description: "The requested chapter could not be found.",
            variant: "destructive",
          })
          return
        }

        const chapter = selectedEntry.chapter
        const safeChapter = {
          ...chapter,
          id: String(chapter.id),
        }

        if (!validateChapterWithVideo(safeChapter)) {
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

        dispatch(setCurrentVideoApi(videoId))
        videoStateStore.getState().setCurrentVideo(videoId, course.id)

        // ✅ PHASE 3: Chapter start tracking removed (not critical for progress)
        // Progress is tracked via VideoPlayerSection's handleVideoProgress

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
    [dispatch, course.id, videoStateStore, toast, userSubscription, user?.id, completedChapters, videoPlaylist],
  )

  // ✅ Video handlers are now provided by VideoPlayerSection hook (extracted above)
  
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

  // ✅ PHASE 3: Progress handlers now come from ProgressSection hook (extracted above)
  
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
  const authPromptOverlay = state.authPromptVisible ? (
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

  // Helper to format seconds
  const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return `${secs}s`
    }
  }

  // Enhanced course stats
  const enhancedCourseStats = useMemo(() => {
    const totalVideos = videoPlaylist.length
    const completedVideos = completedChapters.length
    const totalDuration = formatSeconds(totalCourseDuration)

    return {
      totalVideos,
      completedVideos,
      totalDuration,
      progressPercentage: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
    }
  }, [videoPlaylist.length, completedChapters.length, totalCourseDuration])

  return (
    <>
      {renderCourseDashboard(
        course,
        authPromptOverlay,
        state,
        enhancedCourseStats,
        dispatch2,
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
        router,
        // ✅ PHASE 3: Pass context directly to reduce individual parameters
        {
          user,
          isOwner,
          isGuest,
          canPlayVideo: Boolean(contextCurrentChapter?.chapter.isFree || !!userSubscription || course.isShared)
        }
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

export default MainContentInner