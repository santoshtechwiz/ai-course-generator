"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useProgress } from "@/hooks"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Lock, 
  User as UserIcon, 
  Award, 
  Badge, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Maximize2, 
  Minimize2, 
  Download, 
  Share2,
  PictureInPicture,
  Settings,
  RotateCcw
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCurrentVideoApi, markChapterAsCompleted } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsTabs, { AccessLevels } from "./CourseDetailsTabs"
import { formatDuration } from "../utils/formatUtils"
import VideoPlayer from "./video/components/VideoPlayer"
import VideoNavigationSidebar from "./video/components/VideoNavigationSidebar"
import { migratedStorage } from "@/lib/storage"
import AnimatedCourseAILogo from "./video/components/AnimatedCourseAILogo"
import AutoplayOverlay from "./AutoplayOverlay"
import VideoGenerationSection from "./VideoGenerationSection"
import { MarkdownRenderer } from "./markdownUtils"
import { useVideoState, getVideoBookmarks } from "./video/hooks/useVideoState"
import { VideoDebug } from "./video/components/VideoDebug"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/modules/auth"
import { isAdmin } from "@/lib/auth"
import CourseActions from "./CourseActions"
import { cn } from "@/lib/utils"
import { PDFDownloadLink } from "@react-pdf/renderer"
import CertificateGenerator from "./CertificateGenerator"
import RecommendedSection from "@/components/shared/RecommendedSection"
import type { BookmarkData } from "./video/types"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
}

// Memoized components for better performance
const MemoizedVideoNavigationSidebar = React.memo(VideoNavigationSidebar)
const MemoizedVideoPlayer = React.memo(VideoPlayer)
const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)
const MemoizedAnimatedCourseAILogo = React.memo(AnimatedCourseAILogo)

const MainContent: React.FC<ModernCoursePageProps> = ({ 
  course, 
  initialChapterId
}) => {
  // ============================================================================
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO EARLY RETURNS OR CONDITIONS
  // ============================================================================
  
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { user, subscription } = useAuth()
  
  // Progress tracking hook - MUST be called before any functions that use it
  const { progress, updateProgress, isLoading: progressLoading } = useProgress({
    courseId: Number(course.id),
    currentChapterId: undefined, // Will be set after currentChapter is determined
  })

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const courseProgress = useAppSelector((state) => state.course.progress)

  // ============================================================================
  // LOCAL STATE DECLARATIONS
  // ============================================================================
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [videoEnding, setVideoEnding] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [resumePromptShown, setResumePromptShown] = useState(false)
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false)
  const [showLogoOverlay, setShowLogoOverlay] = useState(false)
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)
  const [wideMode, setWideMode] = useState(false)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [mobilePlaylistOpen, setMobilePlaylistOpen] = useState(false)
  const [autoplayMode, setAutoplayMode] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(5)
  const [nextChapterInfo, setNextChapterInfo] = useState<{
    title: string
    description?: string
    thumbnail?: string
    duration?: number
  } | null>(null)
  const [showChapterTransition, setShowChapterTransition] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)

  // ============================================================================
  // REFS AND STORES
  // ============================================================================
  
  const pipStateRef = useRef(false)
  const videoStateStore = useVideoState
  const isOwner = user?.id === course.userId

  // ============================================================================
  // COMPUTED VALUES AND MEMOIZED DATA
  // ============================================================================
  
  // Video playlist with proper typing
  const videoPlaylist = useMemo(() => {
    if (!course?.chapters) return []
    
    return course.chapters
      .filter((chapter): chapter is FullChapterType => 
        Boolean(chapter?.videoId && chapter?.id)
      )
      .map((chapter) => ({
        chapter,
        videoId: chapter.videoId!,
        title: chapter.title,
        description: chapter.description,
        isFree: chapter.isFree || false,
        duration: videoDurations[chapter.videoId!] || 0,
      }))
      .sort((a, b) => (a.chapter.order || 0) - (b.chapter.order || 0))
  }, [course?.chapters, videoDurations])

  // Current chapter and index
  const currentChapter = useMemo(() => {
    if (!currentVideoId || !videoPlaylist.length) return null
    return videoPlaylist.find(item => item.videoId === currentVideoId)?.chapter || null
  }, [currentVideoId, videoPlaylist])

  const currentIndex = useMemo(() => {
    if (!currentVideoId || !videoPlaylist.length) return -1
    return videoPlaylist.findIndex(item => item.videoId === currentVideoId)
  }, [currentVideoId, videoPlaylist])

  // Navigation helpers
  const nextChapter = useMemo(() => {
    return currentIndex >= 0 && currentIndex < videoPlaylist.length - 1 
      ? videoPlaylist[currentIndex + 1] 
      : null
  }, [currentIndex, videoPlaylist])

  const prevChapter = useMemo(() => {
    return currentIndex > 0 ? videoPlaylist[currentIndex - 1] : null
  }, [currentIndex, videoPlaylist])

  const isLastVideo = useMemo(() => {
    return currentIndex === videoPlaylist.length - 1
  }, [currentIndex, videoPlaylist])

  // User subscription info
  const userSubscription = useMemo(() => {
    if (!subscription) return null
    return subscription.plan || null
  }, [subscription])

  // Video access permissions
  const canPlayVideo = useMemo(() => {
    const allowedByChapter = currentChapter?.isFree === true
    return allowedByChapter || !!userSubscription
  }, [currentChapter?.isFree, userSubscription])

  // Grid layout classes based on PIP state
  const gridLayoutClasses = useMemo(() => {
    if (isPiPActive) {
      return "grid-cols-1" // Single column when PIP is active
    }
    return wideMode 
      ? "md:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]" // Wide mode with sidebar
      : "md:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]" // Standard layout
  }, [isPiPActive, wideMode])

  // ============================================================================
  // EVENT HANDLERS - ALL USE CALLBACK TO PREVENT RE-CREATION
  // ============================================================================
  
  const handlePIPToggle = useCallback((isPiPActive: boolean) => {
    setIsPiPActive(isPiPActive)
    pipStateRef.current = isPiPActive
    
    // If PIP is activated in wide mode, smoothly scroll to top
    if (isPiPActive && wideMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [wideMode])

  const handleAutoplayToggle = useCallback(() => {
    const newMode = !autoplayMode
    setAutoplayMode(newMode)
    
    // Save preference to localStorage
    try {
      localStorage.setItem('autoplay_mode', String(newMode))
    } catch {}
    
    toast({
      title: newMode ? "Auto-play Mode Enabled" : "Auto-play Mode Disabled",
      description: newMode 
        ? "Videos will automatically advance to the next chapter" 
        : "Videos will pause at the end of each chapter",
    })
  }, [autoplayMode, toast])

  const handleMobilePlaylistToggle = useCallback(() => {
    setMobilePlaylistOpen(!mobilePlaylistOpen)
  }, [mobilePlaylistOpen])

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleTheaterModeToggle = useCallback(() => {
    setIsTheaterMode(!isTheaterMode)
  }, [isTheaterMode])

  const handleVideoLoad = useCallback(() => {
    setIsVideoLoading(false)
  }, [])

  const handlePlayerReady = useCallback(() => {
    setIsVideoLoading(false)
  }, [])

  const handleSeekToBookmark = useCallback((bookmark: BookmarkData) => {
    if (playerRef?.current) {
      playerRef.current.seekTo(bookmark.time)
    }
  }, [playerRef])

  const handleVideoProgress = useCallback((state: { playedSeconds: number }) => {
    if (currentVideoId) {
      videoStateStore.getState().updateProgress(currentVideoId, state.playedSeconds)
    }
  }, [currentVideoId, videoStateStore])

  const handleVideoEnd = useCallback(() => {
    setVideoEnding(true)
    
    if (autoplayMode && nextChapter) {
      setShowChapterTransition(true)
      setNextChapterInfo({
        title: nextChapter.chapter.title,
        description: nextChapter.chapter.description,
        thumbnail: nextChapter.chapter.thumbnail || undefined,
        duration: nextChapter.duration,
      })
      
      // Start countdown
      const countdown = setInterval(() => {
        setAutoplayCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown)
            handleChapterSelect(nextChapter.chapter)
            setShowChapterTransition(false)
            setNextChapterInfo(null)
            setAutoplayCountdown(5)
            return 5
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setShowAutoplayOverlay(true)
    }
  }, [autoplayMode, nextChapter, handleChapterSelect])

  const handleChapterComplete = useCallback(async () => {
    if (!currentChapter?.id || !user) return
    
    try {
      await dispatch(markChapterAsCompleted({
        chapterId: currentChapter.id.toString(),
        courseId: course.id.toString(),
      }))
      
      // Update progress
      if (updateProgress) {
        updateProgress({
          courseId: course.id,
          chapterId: currentChapter.id.toString(),
          completed: true,
        })
      }
      
      toast({
        title: "Chapter Completed!",
        description: "Great job! You've completed this chapter.",
      })
    } catch (error) {
      console.error("Error marking chapter as completed:", error)
      toast({
        title: "Error",
        description: "Failed to mark chapter as completed. Please try again.",
        variant: "destructive",
      })
    }
  }, [currentChapter?.id, user, dispatch, course.id, updateProgress, toast])

  const handleChapterSelect = useCallback(async (chapter: FullChapterType) => {
    if (!chapter?.id) {
      toast({
        title: "Invalid Chapter",
        description: "Please select a valid chapter.",
        variant: "destructive",
      })
      return
    }

    try {
      // Validate chapter has video
      if (!chapter.videoId) {
        toast({
          title: "Video Unavailable",
          description: "This chapter doesn't have a video available.",
          variant: "destructive",
        })
        return
      }

      // Update Redux state
      dispatch(setCurrentVideoApi(chapter.videoId))

      // Update Zustand store
      videoStateStore.getState().setCurrentVideo(chapter.videoId, course.id)

      // Close mobile playlist if open
      setMobilePlaylistOpen(false)

      // Show success feedback
      toast({
        title: "Chapter Selected",
        description: `Now playing: ${chapter.title}`,
      })
    } catch (error) {
      console.error("Error selecting chapter:", error)
      toast({
        title: "Error",
        description: "Failed to select chapter. Please try again.",
        variant: "destructive",
      })
    }
  }, [course.id, dispatch, toast, videoStateStore, setMobilePlaylistOpen])

  const handleNextVideo = useCallback(() => {
    if (!currentVideoId || !nextChapter) return
    handleChapterSelect(nextChapter.chapter)
  }, [currentVideoId, nextChapter, handleChapterSelect])

  const handlePrevVideo = useCallback(() => {
    if (!currentVideoId || !prevChapter) return
    handleChapterSelect(prevChapter.chapter)
  }, [currentVideoId, prevChapter, handleChapterSelect])

  const handleCancelAutoplay = useCallback(() => {
    setShowChapterTransition(false)
    setShowAutoplayOverlay(false)
    setNextChapterInfo(null)
    setAutoplayCountdown(5)
  }, [])

  const handleCertificateClick = useCallback(() => {
    setShowCertificate(true)
  }, [])

  const handleWideModeToggle = useCallback(() => {
    const newWideMode = !wideMode
    setWideMode(newWideMode)
    
    // Save preference to localStorage
    try {
      localStorage.setItem(`wide_mode_course_${course.id}`, String(newWideMode))
    } catch {}
    
    // Show feedback toast
    toast({
      title: newWideMode ? "Wide Mode Enabled" : "Wide Mode Disabled",
      description: newWideMode 
        ? "Video player now uses full width" 
        : "Video player now uses standard width",
    })
  }, [wideMode, course.id, toast])

  // ============================================================================
  // EFFECTS - ALL DEPENDENCIES MUST BE PROPERLY DECLARED
  // ============================================================================
  
  // Load wide mode preference from localStorage
  useEffect(() => {
    try {
      const savedWideMode = localStorage.getItem(`wide_mode_course_${course.id}`)
      if (savedWideMode !== null) {
        setWideMode(savedWideMode === 'true')
      }
    } catch {}
  }, [course.id])

  // Load autoplay mode preference from localStorage
  useEffect(() => {
    try {
      const savedAutoplayMode = localStorage.getItem('autoplay_mode')
      if (savedAutoplayMode !== null) {
        setAutoplayMode(savedAutoplayMode === 'true')
      }
    } catch {}
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // ESC key handler for exiting modes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'Escape':
          if (showChapterTransition) {
            handleCancelAutoplay()
          } else if (showAutoplayOverlay) {
            setShowAutoplayOverlay(false)
          } else if (isPiPActive) {
            handlePIPToggle(false)
          }
          break
        case 'p':
        case 'P':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handlePIPToggle(!isPiPActive)
          }
          break
        case 'a':
        case 'A':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleAutoplayToggle()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    showChapterTransition, 
    showAutoplayOverlay, 
    isPiPActive, 
    handleCancelAutoplay, 
    handlePIPToggle, 
    handleAutoplayToggle
  ])

  // Enhanced initialization logic for video selection
  useEffect(() => {
    if (videoPlaylist.length === 0) {
      console.warn("No videos available in the playlist")
      return
    }

    // First try to get the video from URL param (initialChapterId)
    let targetVideo = initialChapterId
      ? videoPlaylist.find((entry) => String(entry.chapter.id) === initialChapterId)
      : null

    // If not found, try to use the current video from Redux
    if (!targetVideo && currentVideoId) {
      targetVideo = videoPlaylist.find((entry) => entry.videoId === currentVideoId)
    }

    // If still not found, try to use the last watched video from progress
    if (!targetVideo && progress?.currentChapterId) {
      targetVideo = videoPlaylist.find(
        (entry) => String(entry.chapter.id) === String(progress.currentChapterId)
      )
    }

    // If all else fails, use the first video in the playlist
    if (!targetVideo && videoPlaylist.length > 0) {
      targetVideo = videoPlaylist[0]
    }

    if (targetVideo?.videoId) {
      // Update Redux state
      dispatch(setCurrentVideoApi(targetVideo.videoId))

      // Update Zustand store
      videoStateStore.getState().setCurrentVideo(targetVideo.videoId, course.id)

      console.log(`[MainContent] Initialized with video: ${targetVideo.videoId}, course: ${course.id}`)
    } else {
      console.error("Failed to select a video")
    }
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, progress])

  // Resume prompt
  useEffect(() => {
    if (progress && !resumePromptShown && progress.currentChapterId && !currentVideoId && user) {
      const resumeChapter = videoPlaylist.find(
        (entry) => entry.chapter.id.toString() === progress.currentChapterId?.toString(),
      )

      if (resumeChapter) {
        setResumePromptShown(true)
        toast({
          title: "Resume Learning",
          description: `Continue from "${resumeChapter.chapter.title}"? (Resume feature available in your dashboard)`
        })
      }
    }
  }, [progress, resumePromptShown, currentVideoId, videoPlaylist, toast, user])

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================
  
  // Early return for loading state
  if (!course || !videoPlaylist.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course content...</p>
        </div>
      </div>
    )
  }

  // Memoized props for child components
  const sidebarProps = useMemo(() => ({
    course,
    currentVideoId,
    videoPlaylist,
    onChapterSelect: handleChapterSelect,
    onChapterComplete: handleChapterComplete,
    userSubscription,
    isOwner,
  }), [course, currentVideoId, videoPlaylist, handleChapterSelect, handleChapterComplete, userSubscription, isOwner])

  const videoPlayerProps = useMemo(() => ({
    videoId: currentVideoId || '',
    courseId: course.id,
    onVideoLoad: handleVideoLoad,
    onPlayerReady: handlePlayerReady,
    onSeekToBookmark: handleSeekToBookmark,
    onVideoProgress: handleVideoProgress,
    onVideoEnd: handleVideoEnd,
    onPictureInPictureToggle: handlePIPToggle,
    onFullscreenToggle: handleFullscreenToggle,
    isPiPActive,
    playerRef: setPlayerRef,
  }), [
    currentVideoId, 
    course.id, 
    handleVideoLoad, 
    handlePlayerReady, 
    handleSeekToBookmark, 
    handleVideoProgress, 
    handleVideoEnd, 
    handlePIPToggle, 
    handleFullscreenToggle, 
    isPiPActive
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Toolbar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWideModeToggle}
                className={cn(
                  "flex items-center space-x-2",
                  wideMode && "bg-primary/10 text-primary"
                )}
              >
                <Maximize2 className="h-4 w-4" />
                <span>Wide Mode</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePIPToggle.bind(null, !isPiPActive)}
                className={cn(
                  "flex items-center space-x-2",
                  isPiPActive && "bg-primary/10 text-primary"
                )}
              >
                <PictureInPicture className="h-4 w-4" />
                <span>PIP</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAutoplayToggle}
                className={cn(
                  "flex items-center space-x-2",
                  autoplayMode && "bg-primary/10 text-primary"
                )}
              >
                <Play className="h-4 w-4" />
                <span>Auto-play</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isPiPActive && (
              <div className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                PIP Active
              </div>
            )}
            
            {autoplayMode && (
              <div className="px-3 py-1 bg-green-500/10 text-green-600 text-sm rounded-full">
                Auto-play Mode
              </div>
            )}
            
            <CourseActions course={course} isOwner={isOwner} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={cn("grid gap-6 p-6", gridLayoutClasses)}>
        {/* Video and Tabs Column */}
        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative">
            {isVideoLoading && (
              <div className="absolute inset-0 bg-muted/20 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading video...</p>
                </div>
              </div>
            )}
            
            <MemoizedVideoPlayer {...videoPlayerProps} />
            
            {/* Chapter Progress Indicator */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">Chapter {currentIndex + 1} of {videoPlaylist.length}</span>
                  {nextChapter && (
                    <span className="text-muted-foreground ml-2">
                      • Next: {nextChapter.chapter.title}
                    </span>
                  )}
                </div>
                {nextChapter?.duration && (
                  <span className="text-muted-foreground">
                    Est. {formatDuration(nextChapter.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Course Details Tabs */}
          <MemoizedCourseDetailsTabs
            course={course}
            currentChapter={currentChapter}
            userSubscription={userSubscription}
            isOwner={isOwner}
          />

          {/* Video Generation Section */}
          <VideoGenerationSection course={course} />
        </div>

        {/* Sidebar Column */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isPiPActive ? 'pip' : 'sidebar'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            {isPiPActive ? (
              <div className="text-center p-8 text-muted-foreground">
                <PictureInPicture className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Picture-in-Picture Mode</h3>
                <p className="text-sm mb-4">
                  Video is now playing in a floating window. 
                  Close PIP to return to normal view.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePIPToggle(false)}
                >
                  Exit PIP Mode
                </Button>
              </div>
            ) : (
              <MemoizedVideoNavigationSidebar {...sidebarProps} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Playlist Toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleMobilePlaylistToggle}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Play className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Playlist Overlay */}
      <AnimatePresence>
        {mobilePlaylistOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-background/95 backdrop-blur z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Course Chapters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMobilePlaylistToggle}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <MemoizedVideoNavigationSidebar {...sidebarProps} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Transition Overlay */}
      <AnimatePresence>
        {showChapterTransition && nextChapterInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-background/95 backdrop-blur z-50 flex items-center justify-center"
          >
            <div className="text-center max-w-md mx-auto p-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">Chapter Complete!</h2>
                <p className="text-muted-foreground">
                  Moving to next chapter in {autoplayCountdown} seconds...
                </p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-2">Next: {nextChapterInfo.title}</h3>
                {nextChapterInfo.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {nextChapterInfo.description}
                  </p>
                )}
                {nextChapterInfo.duration && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(nextChapterInfo.duration)}
                  </p>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={handleCancelAutoplay}
                className="w-full"
              >
                Cancel Auto-play
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Autoplay Overlay */}
      <AnimatePresence>
        {showAutoplayOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-background/95 backdrop-blur z-50 flex items-center justify-center"
          >
            <AutoplayOverlay
              onNextChapter={handleNextVideo}
              onCancel={handleCancelAutoplay}
              nextChapter={nextChapter}
              isLastVideo={isLastVideo}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <CertificateGenerator
                course={course}
                onClose={() => setShowCertificate(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommended Section */}
      <div className="p-6">
        <RecommendedSection />
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <VideoDebug
          currentVideoId={currentVideoId}
          courseId={course.id}
          isPiPActive={isPiPActive}
          wideMode={wideMode}
          autoplayMode={autoplayMode}
        />
      )}
    </div>
  )
}

export default React.memo(MainContent)
