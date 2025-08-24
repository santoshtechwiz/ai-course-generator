"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { store } from "@/store"
import { setCurrentVideoApi } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import { AccessLevels } from "./CourseDetailsTabs"
import { VideoDebug } from "./video/components/VideoDebug"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "@/modules/auth"
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
import { useVideoProgressTracker } from "@/hooks/useVideoProgressTracker"

// Extracted components
import CertificateModal from "./CertificateModal"
import PlaylistSidebar from "./PlaylistSidebar"
import MobilePlaylistOverlay from "./MobilePlaylistOverlay"
import { CourseHeader } from "./CourseHeader"
import MobilePlaylistToggle from "./MobilePlaylistToggle"
import AuthPrompt from "./AuthPrompt"
import MainContentGrid from "./MainContentGrid"
import ActionButtons from "./ActionButtons"
import ReviewsSection from "./ReviewsSection"
import CourseErrorBoundary from "./CourseErrorBoundary"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
  isFullscreen?: boolean
}

// Helper function to validate chapter
function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
      typeof chapter === "object" &&
      chapter.id && 
      (typeof chapter.id === "string" || typeof chapter.id === "number") // Allow number IDs too
  );
}

// CourseDetailsTabs is still memoized for better performance
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

  // Local state - simplified from original
  const [showCertificate, setShowCertificate] = useState(false)
  const [certificateShown, setCertificateShown] = useState(false) // Track if certificate was already shown
  const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([])
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [quizSuggestions, setQuizSuggestions] = useState<QuizSuggestion[]>([])
  const [resumePromptShown, setResumePromptShown] = useState(false)
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [mobilePlaylistOpen, setMobilePlaylistOpen] = useState(false)
  const [autoplayMode, setAutoplayMode] = useState(false)
  const [headerCompact, setHeaderCompact] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Mark when client is mounted to safely render client-only derived data (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true)
    
    // Add error boundary for blank refresh issue
    const handleError = (error: ErrorEvent) => {
      console.error('Course page error:', error)
      // Optionally redirect or show error state
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  const isOwner = user?.id === course.userId

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const legacyCourseProgress = useAppSelector((state) => state.course.courseProgress[course.id])
  const courseProgress = useCourseProgressSync(course.id)
  const twoCol = useMemo(() => !isFullscreen, [isFullscreen])
  
  // Get direct access to the Zustand video state store and its methods
  const videoStateStore = useVideoState
  const getVideoBookmarks = useCallback((videoId?: string | null) => {
    if (!videoId) return []
    try {
      return videoStateStore.getState().bookmarks[videoId] || []
    } catch {
      return []
    }
  }, [videoStateStore])

  // Get bookmarks for the current video
  const bookmarks = useMemo(() => {
    return getVideoBookmarks(currentVideoId)
  }, [currentVideoId, getVideoBookmarks])

  // Adapt raw bookmark times to BookmarkData objects expected by VideoPlayer
  const bookmarkItems: BookmarkData[] = useMemo(() => {
    if (!currentVideoId) return []
    return (bookmarks || []).map((time: number, idx: number) => ({
      id: `${currentVideoId}-${time}-${idx}`,
      videoId: currentVideoId,
      time,
      title: `Bookmark ${formatDuration(time)}`,
      createdAt: new Date().toISOString(),
      description: undefined,
    }))
  }, [bookmarks, currentVideoId, formatDuration])

  // Initialize completedChapters safely
  const completedChapters = useMemo(() => {
    if (courseProgress?.videoProgress?.completedChapters) {
      return courseProgress.videoProgress.completedChapters.map(String)
    }
    return (legacyCourseProgress?.completedChapters || []).map(String)
  }, [courseProgress, legacyCourseProgress])

  // Check free video status on mount
  useEffect(() => {
    const freeVideoPlayed = migratedStorage.getPreference("played_free_video", false)
    setHasPlayedFreeVideo(Boolean(freeVideoPlayed))
    
    // Restore auto-play mode preference
    try {
      const savedAutoplay = localStorage.getItem(`autoplay_mode_course_${course.id}`)
      if (savedAutoplay === 'true') {
        setAutoplayMode(true)
      }
    } catch {}
  }, [course.id])

  // Memoized video playlist
  const videoPlaylist = useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapterType }[] = []
    
    if (!course?.courseUnits) {
      return playlist
    }

    // Global index across all units/chapters to support implicit free gating
    let globalIndex = 0

    course.courseUnits.forEach((unit) => {
      if (!unit.chapters) return

      unit.chapters
        .filter((chapter) => {
          // Enhanced validation to make sure we have valid chapters
          const isValid = Boolean(
            chapter &&
              typeof chapter === "object" &&
              chapter.id &&
              chapter.videoId &&
              typeof chapter.videoId === "string",
          )

          if (!isValid && chapter) {
            // Log invalid chapter in development for debugging
            if (process.env.NODE_ENV !== "production") {
              console.debug(`Skipping invalid chapter:`, {
                id: chapter.id,
                title: chapter.title,
                hasVideoId: !!chapter.videoId,
              })
            }
          }

          return isValid
        })
        .forEach((chapter) => {
          // Ensure description is never null, only string or undefined
          const safeChapter = {
            ...chapter,
            description: chapter.description === null ? undefined : chapter.description,
            // Implicit free gating for first two videos
            isFree: Boolean(chapter.isFree) || globalIndex < 2,
            // Unlock only the first quiz (after two free videos we unlock the first quiz slot)
            isFreeQuiz: globalIndex === 1,
          } as FullChapterType & { isFreeQuiz?: boolean }

          playlist.push({ videoId: chapter.videoId!, chapter: safeChapter })
          globalIndex += 1
        })
    })

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

  // Determine if current chapter is a key chapter
  const isKeyChapter = useMemo(() => {
    return currentIndex > 0 && ((currentIndex + 1) % 3 === 0 || isLastVideo)
  }, [currentIndex, isLastVideo])

  // Certificate handler (moved up to avoid TDZ when referenced by other callbacks)
  const handleCertificateClick = useCallback(() => {
    // Only show certificate once per session to prevent duplicates
    if (certificateShown) return
    
    const courseProgress = selectCourseProgressById(store.getState(), String(course.id))
    if (courseProgress?.videoProgress?.isCompleted) {
      setShowCertificate(true)
      setCertificateShown(true)
    } else {
      // Allow manual access if course not completed yet (for testing/admin)
      setShowCertificate(true)
      setCertificateShown(true)
    }
  }, [course.id, certificateShown])

  // Compute next video details for autoplay/navigation
  const nextVideoEntry = useMemo(() => {
    if (currentIndex >= 0 && currentIndex + 1 < videoPlaylist.length) {
      return videoPlaylist[currentIndex + 1]
    }
    return null
  }, [currentIndex, videoPlaylist])

  const nextVideoId = nextVideoEntry?.videoId || null
  const nextVideoTitle = nextVideoEntry?.chapter?.title || ''
  const hasNextVideo = Boolean(nextVideoEntry)

  // Handler to advance to the next chapter/video
  const handleNextVideo = useCallback(() => {
    if (!hasNextVideo || !nextVideoEntry) {
      // If no next video, do nothing (or show certificate)
      if (isLastVideo) {
        handleCertificateClick()
      }
      return
    }

    const nextVid = nextVideoEntry.videoId
    if (!nextVid) return

    // Update Redux and Zustand stores so the player will switch
    dispatch(setCurrentVideoApi(nextVid))
    try {
      videoStateStore.getState().setCurrentVideo(nextVid, course.id)
    } catch (e) {}

    // Ensure UI reflects a loading state while the next video initializes
    setIsVideoLoading(true)
  }, [hasNextVideo, nextVideoEntry, isLastVideo, handleCertificateClick, dispatch, videoStateStore, course.id])

  // Progress tracking
  const progress = useAppSelector(state => selectCourseProgressById(state, course?.id || 0))

  // Determine user subscription
  const userSubscription = useMemo(() => {
    if (!subscription) return null
    return subscription.plan || null
  }, [subscription])

  // Check if user can play this video
  const canPlayVideo = useMemo(() => {
    const allowedByChapter = currentChapter?.isFree === true
    return allowedByChapter || !!userSubscription
  }, [currentChapter?.isFree, userSubscription])

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
    if (!targetVideo && progress?.videoProgress?.currentChapterId) {
      targetVideo = videoPlaylist.find(
        (entry) => String(entry.chapter.id) === String(progress.videoProgress.currentChapterId)
      )
    }

    // If still not found, try to use the last watched lecture from the course progress
    try {
      if (!targetVideo && courseProgress?.videoProgress?.currentChapterId) {
        targetVideo = videoPlaylist.find(
          (entry) => String(entry.chapter.id) === String(courseProgress.videoProgress.currentChapterId)
        ) || null
      }
    } catch {}

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
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, progress, courseProgress])

  // Resume prompt
  useEffect(() => {
    if (progress && !resumePromptShown && progress.videoProgress?.currentChapterId && !currentVideoId && user) {
      const resumeChapter = videoPlaylist.find(
        (entry) => entry.chapter.id.toString() === progress.videoProgress?.currentChapterId?.toString(),
      )

      if (resumeChapter) {
        setResumePromptShown(true)
        toast({
          title: "Resume Learning",
          description: `Continue from \"${resumeChapter.chapter.title}\"? (Resume feature available in your dashboard)`
        })
      }
    }
  }, [progress, resumePromptShown, currentVideoId, videoPlaylist, toast, user])
  


  // Update the handleVideoLoad callback
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      // Store the duration for the current video
      setVideoDurations((prev) => ({
        ...prev, 
        [currentVideoId || ""]: metadata.duration
      }))
      
      // Make sure loading state is updated
      setIsVideoLoading(false)
      
      // Store duration for future reference
      if (currentVideoId && metadata.duration) {
        // We're using videoDurations object directly
      }
    },
    [currentVideoId],
  )

  // Update the handlePlayerReady function
  const handlePlayerReady = useCallback((player: React.RefObject<any>) => {
    setPlayerRef(player)
    // Ensure loading is completed
    setIsVideoLoading(false)
  }, [])

  // Handle bookmark seeking
  const handleSeekToBookmark = useCallback(
    (time: number, title?: string) => {
      if (playerRef?.current) {
        playerRef.current.seekTo(time)
        if (title) {
          toast({
            title: "Seeking to Bookmark",
            description: `Jumping to "${title}" at ${formatDuration(time)}`
          })
        }
      }
    },
    [playerRef, toast, formatDuration],
  )

  // Handle chapter complete callback
  const handleChapterComplete = useCallback((chapterId: string) => {
    console.log(`Chapter completed: ${chapterId}`)
  }, [])

  // Enhanced PIP handling
  const handlePIPToggle = useCallback((isPiPActive: boolean) => {
    setIsPiPActive(isPiPActive)
  }, [])

  // Autoplay toggle handler (replaces broken inline code)
  const handleAutoplayToggle = useCallback(() => {
    setAutoplayMode(prev => {
      const next = !prev
      try { localStorage.setItem(`autoplay_mode_course_${course.id}`, String(next)) } catch {}
      toast({
        title: next ? "Auto-advance enabled" : "Manual advance mode",
        description: next
          ? "Chapters will automatically advance when completed"
          : "You'll be prompted before each chapter transition",
      })
      return next
    })
  }, [course.id, toast])

  // Collapse header on scroll to give more vertical space for the player
  useEffect(() => {
    const onScroll = () => {
      try {
        setHeaderCompact(window.scrollY > 32)
      } catch { }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Mobile playlist toggle
  const handleMobilePlaylistToggle = useCallback(() => {
    setMobilePlaylistOpen(prev => !prev)
  }, [])
  // Ensure CourseID is set when changing videos
  // This version of handleChapterSelect works with both Chapter type from sidebar and FullChapterType
  const handleChapterSelect = useCallback(
    (chapter: { id: string | number; title: string; videoId?: string; isFree?: boolean }) => {
      // Create a safe chapter object with properly formatted ID
      let safeChapter
      try {
        if (!chapter) {
          throw new Error("No chapter provided")
        }

        safeChapter = {
          ...chapter,
          id: String(chapter.id), // Convert ID to string to ensure consistency
        }
        
        // Find the corresponding full chapter from the playlist if needed
        const fullChapter = typeof chapter.id === 'string' 
          ? videoPlaylist.find(v => String(v.chapter.id) === chapter.id)?.chapter 
          : videoPlaylist.find(v => v.chapter.id === chapter.id)?.chapter
        
        // First, check if the chapter actually exists and is valid
        if (!validateChapter(safeChapter)) {
          console.error("Invalid chapter selected:", safeChapter)
          toast({
            title: "Error",
            description: "Invalid chapter selected. Please try another chapter.",
            variant: "destructive",
          })
          return
        }

        // Check if user can play the selected video (free chapter or subscribed)
        const allowed = Boolean(safeChapter.isFree || userSubscription)
        if (!allowed) {
          setShowAuthPrompt(true)
          return
        }

        // Use videoId from the parameter or from the full chapter object
        const videoId = safeChapter.videoId || (fullChapter ? fullChapter.videoId : null)
        
        // Check if the chapter has a videoId - this is critical
        if (!videoId) {
          console.error(`Chapter has no videoId: ${safeChapter.id} - ${safeChapter.title}`)
          toast({
            title: "Video Unavailable",
            description: "This chapter doesn't have a video available.",
            variant: "destructive",
          })
          return
        }

        // Update Redux state
        dispatch(setCurrentVideoApi(videoId))

        // Update Zustand store with both videoId and courseId
        videoStateStore.getState().setCurrentVideo(videoId, course.id)

        console.log(`[MainContent] Selected chapter: ${safeChapter.title}, videoId: ${videoId}, id: ${safeChapter.id}`)

        setMobilePlaylistOpen(false)
        setIsVideoLoading(true)
      } catch (error) {
        console.error("Error selecting chapter:", error)
        toast({
          title: "Error",
          description: "There was a problem selecting this chapter. Please try again.",
          variant: "destructive",
        })
      }
    },
    [dispatch, course.id, videoStateStore, toast, userSubscription, videoPlaylist]
  )


  // Fetch related courses
  useEffect(() => {
    fetchRelatedCourses(course.id, 5).then(setRelatedCourses)
  }, [course.id])

  // Fetch personalized recommendations when course is completed
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (isLastVideo && user) {
        const result = await fetchPersonalizedRecommendations(course.id, 3)
        // Ensure matchReason is always a string
        setPersonalizedRecommendations(
          result.map(r => ({
            ...r,
            matchReason: typeof r.matchReason === "string" ? r.matchReason : ""
          }))
        )
      }
    }
    fetchRecommendations()
  }, [isLastVideo, user, completedChapters, course])

  // Fetch quiz suggestions for key chapters
  useEffect(() => {
    if (isKeyChapter && currentChapter) {
      fetchQuizSuggestions(
        course.id,
        currentChapter.id,
        currentChapter.title
      ).then(setQuizSuggestions)
    } else {
      setQuizSuggestions([])
    }
  }, [isKeyChapter, currentChapter, course.id])

  // Define sidebarCourse and sidebarCurrentChapter with proper types
  const sidebarCourse = useMemo(() => ({
    id: String(course.id),  // Convert to string for compatibility
    title: course.title,
    chapters: videoPlaylist.map(v => ({
      id: String(v.chapter.id),
      title: v.chapter.title,
      videoId: v.chapter.videoId || undefined,  // Convert null to undefined for type compatibility
      duration: typeof v.chapter.duration === 'number' ? v.chapter.duration : undefined,
      isFree: v.chapter.isFree
    }))
  }), [course.id, course.title, videoPlaylist])
  
  const sidebarCurrentChapter = currentChapter ? {
    id: String(currentChapter.id),
    title: currentChapter.title,
    videoId: currentChapter.videoId || undefined,  // Convert null to undefined
    duration: typeof currentChapter.duration === 'number' ? currentChapter.duration : undefined,
    isFree: currentChapter.isFree
  } : null

  // Calculate course stats for display in sidebar
  const courseStats = useMemo(() => ({
    completedCount: completedChapters?.length || 0,
    totalChapters: videoPlaylist.length,
    progressPercentage: videoPlaylist.length > 0 
      ? Math.round(((completedChapters?.length || 0) / videoPlaylist.length) * 100) 
      : 0
  }), [completedChapters, videoPlaylist.length])

  // Memoized grid layout classes for better performance
  const gridLayoutClasses = useMemo(() => {
    if (isPiPActive) {
      // When PIP is active, use single column layout to move video to top
      return "grid-cols-1"
    }
    
    if (twoCol) {
      // Udemy-style layout: video/content left, playlist right
      return "md:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]"
    }
    
    return "grid-cols-1"
  }, [twoCol, isPiPActive])

  // Enhanced grid container with smooth transitions
  const gridContainerClasses = useMemo(() => {
    return cn(
      "grid gap-4 transition-all duration-300 ease-in-out",
      gridLayoutClasses
    )
  }, [gridLayoutClasses])
  

  // Define video progress tracking functions
  // Use the centralized progress tracker which will update Redux and persist via thunk
  const {
    handleVideoProgress: trackedHandleVideoProgress,
    handleVideoEnd: trackedHandleVideoEnd,
    setVideoDuration,
  } = useVideoProgressTracker({
    courseId: course.id,
    chapterId: currentChapter?.id ?? null,
    videoId: currentVideoId ?? null,
    isLastVideo,
    onCompletion: () => {
      if (currentChapter) handleChapterComplete(String(currentChapter.id))
    },
  })

  // Expose functions matching previous names used by VideoPlayer
  const handleVideoProgress = useCallback((state: { played: number, playedSeconds: number }) => {
    trackedHandleVideoProgress(state)
  }, [trackedHandleVideoProgress])

  const handleVideoEnded = useCallback(() => {
    trackedHandleVideoEnd()
    if (isLastVideo) {
      handleCertificateClick()
    }
  }, [trackedHandleVideoEnd, isLastVideo, handleCertificateClick])

  // Determine access levels based on subscription
  const accessLevels: AccessLevels = useMemo(() => {
    return {
      isSubscribed: !!userSubscription,
      isAdmin: !!user?.isAdmin,
      isAuthenticated: !!user,
    }
  }, [userSubscription, user])

  // Auth prompt handlers
  const handleUpgrade = useCallback(() => {
    window.location.href = "/dashboard/subscription"
  }, [])

  const handleSignIn = useCallback(() => {
    window.location.href = "/api/auth/signin"
  }, [])

  const handleBackToCourse = useCallback(() => {
    setShowAuthPrompt(false)
  }, [])

  // Regular content
  const regularContent = (
    <div className="min-h-screen bg-background">
      {/* Main content layout */}
      <div className="flex">
        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Udemy-like sticky header */}
          <CourseHeader
            courseTitle={course.title}
            chapterTitle={mounted && currentChapter?.title ? currentChapter.title : undefined}
            isCompact={headerCompact}
            progress={{
              completedCount: mounted ? courseStats.completedCount : 0,
              totalChapters: courseStats.totalChapters,
              progressPercentage: mounted ? courseStats.progressPercentage : 0
            }}
            ratingInfo={{
              averageRating: 4.8, // TODO: Get from course data
              ratingCount: 1234 // TODO: Get from course data
            }}
            instructor={course.userId} // TODO: Get instructor name
            actions={
              <ActionButtons 
                slug={course.slug} 
                isOwner={isOwner} 
                variant="compact" 
                title={course.title} 
              />
            }
          />

          {/* Video Generation Section */}
          {(isOwner || user?.isAdmin) && (
            <VideoGenerationSection 
              course={course}
              onVideoGenerated={(chapterId, videoId) => {
                console.log(`Video generated for chapter ${chapterId}: ${videoId}`)
                // Optionally auto-select the newly generated video
                if (videoId) {
                  dispatch(setCurrentVideoApi(videoId))
                }
              }}
            />
          )}

          {/* Mobile playlist toggle */}
          <MobilePlaylistToggle
            onToggle={handleMobilePlaylistToggle}
            currentIndex={currentIndex}
            currentChapter={currentChapter}
            totalVideos={videoPlaylist.length}
          />

          {/* Main grid layout with video player and playlist */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 xl:max-w-[1400px] mx-auto w-full"> 
            {/* Left column: Video and tabs */}
            <motion.div 
              key="video-content"
              layout
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-w-0 order-2 xl:order-1"
            >
              {/* Video player component */}
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                {/* Player area: header moved to sticky top header above to match Udemy layout */}

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
                  autoPlay={autoplayMode}
                  onToggleAutoPlay={() => handleAutoplayToggle()}
                  onNextVideo={handleNextVideo}
                  nextVideoId={nextVideoId || undefined}
                  nextVideoTitle={nextVideoTitle}
                  hasNextVideo={hasNextVideo}
                  autoAdvanceNext={autoplayMode}
                />
              </div>

              {/* Tabs below video: Summary, Quiz, Bookmarks, etc */}
              <div className="rounded-xl border bg-card shadow-sm mt-4 min-h-[400px]">
                <MemoizedCourseDetailsTabs
                  course={course}
                  currentChapter={currentChapter}
                  accessLevels={accessLevels}
                  onSeekToBookmark={handleSeekToBookmark}
                />
              </div>

              {/* Reviews Section */}
              <ReviewsSection slug={course.slug} />
            </motion.div>

            {/* Right column: Playlist sidebar (desktop) */}
            <AnimatePresence mode="wait">
              {!isPiPActive && (
                <div className="order-1 xl:order-2 hidden xl:block">
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
                    isPiPActive={isPiPActive}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile playlist overlay */}
      <MobilePlaylistOverlay
        isOpen={mobilePlaylistOpen}
        onClose={() => setMobilePlaylistOpen(false)}
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

      {/* Floating subscribe CTA for guests/free users */}
      {!userSubscription && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            size="lg"
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="shadow-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 transition-transform hover:scale-[1.02] rounded-full"
          >
            Subscribe to Unlock
          </Button>
        </div>
      )}

      {/* Certificate modal */}
      <CertificateModal
        show={showCertificate}
        onClose={() => setShowCertificate(false)}
        courseId={course.id}
        courseTitle={course.title}
        userName={user?.name || null}
        totalLessons={videoPlaylist.length}
      />

      {/* Add debug component in development */}
      {process.env.NODE_ENV !== "production" && (
        <VideoDebug
          videoId={typeof currentVideoId === 'string' ? currentVideoId : ''}
          courseId={course.id}
          chapterId={currentChapter?.id ? String(currentChapter.id) : ''}
        />
      )}
    </div>
  )

  // Return the correct content based on auth state
  return (
    <CourseErrorBoundary>
      {showAuthPrompt ? (
        <AuthPrompt
          onUpgrade={handleUpgrade}
          onSignIn={handleSignIn}
          onBack={handleBackToCourse}
        />
      ) : (
        regularContent
      )}
    </CourseErrorBoundary>
  )
}

export default React.memo(MainContent)
