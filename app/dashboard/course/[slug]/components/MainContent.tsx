"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useProgress } from '@/hooks'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setCurrentVideoApi } from '@/store/slices/course-slice'
import { useAuth } from '@/modules/auth'
import { useVideoState } from './video/hooks/useVideoState'
import { cn } from '@/lib/utils'
import { formatDuration } from '../utils/formatUtils'
import { AnimatePresence, motion } from 'framer-motion'

// Custom hooks
import { useVideoManagement } from '../hooks/useVideoManagement'
import { useAutoplay } from '../hooks/useAutoplay'
import { useLayoutManagement } from '../hooks/useLayoutManagement'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

// Components
import CourseToolbar from './CourseToolbar'
import VideoPlayer from './video/components/VideoPlayer'
import VideoNavigationSidebar from './video/components/VideoNavigationSidebar'
import CourseDetailsTabs from './CourseDetailsTabs'
import VideoGenerationSection from './VideoGenerationSection'
import AutoplayOverlay from './AutoplayOverlay'
import CertificateGenerator from './CertificateGenerator'
import RecommendedSection from '@/components/shared/RecommendedSection'
import VideoDebug from './video/components/VideoDebug'
import { PageLoading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// Types
import type { FullCourseType, FullChapterType } from '@/app/types/types'
import type { BookmarkData } from './video/types'

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
  // Accept layout state from parent to simplify internal layout management
  theatreMode?: boolean
  isFullscreen?: boolean
  onTheaterModeToggle?: () => void
}

// Memoized components for better performance
const MemoizedVideoNavigationSidebar = React.memo(VideoNavigationSidebar)
const MemoizedVideoPlayer = React.memo(VideoPlayer)
const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)

const MainContent: React.FC<ModernCoursePageProps> = ({ 
  course, 
  initialChapterId,
  theatreMode,
  isFullscreen,
  onTheaterModeToggle
}) => {
  // ============================================================================
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO EARLY RETURNS OR CONDITIONS
  // ============================================================================
  
  const dispatch = useAppDispatch()
  const { user, subscription } = useAuth()
  
  // Progress tracking hook - MUST be called before any functions that use it
  const { progress, updateProgress, isLoading: progressLoading } = useProgress({
    courseId: Number(course.id),
    currentChapterId: undefined, // Will be set after currentChapter is determined
  })

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)

  // ============================================================================
  // LOCAL STATE DECLARATIONS
  // ============================================================================
  
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [mobilePlaylistOpen, setMobilePlaylistOpen] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)

  // ============================================================================
  // CUSTOM HOOKS
  // ============================================================================
  
  // Video management
  const { 
    videoPlaylist, 
    handleChapterSelect, 
    handleChapterComplete, 
    getCurrentChapterInfo 
  } = useVideoManagement(course, videoDurations)

  // Autoplay functionality
  const {
    autoplayMode,
    autoplayCountdown,
    nextChapterInfo,
    showChapterTransition,
    showAutoplayOverlay,
    handleAutoplayToggle,
    handleCancelAutoplay,
    handleVideoEnd
  } = useAutoplay()

  // Layout management
  const {
    wideMode,
    isPiPActive,
    isFullscreen: isFullscreenFromLayout,
    isTheaterMode,
    handlePIPToggle,
    handleWideModeToggle,
    handleFullscreenToggle,
    handleTheaterModeToggle,
    gridLayoutClasses
  } = useLayoutManagement(course.id)

  // ============================================================================
  // COMPUTED VALUES AND MEMOIZED DATA
  // ============================================================================
  
  // Current chapter info
  const { 
    currentChapter, 
    currentIndex, 
    nextChapter, 
    prevChapter, 
    isLastVideo 
  } = getCurrentChapterInfo(currentVideoId)

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

  // User ownership
  const isOwner = user?.id === course.userId

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
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
      const videoStateStore = useVideoState
      videoStateStore.getState().updateProgress(currentVideoId, state.playedSeconds)
    }
  }, [currentVideoId])

  const handleVideoEndWithAutoplay = useCallback(() => {
    if (nextChapter) {
      handleVideoEnd(nextChapter, () => handleChapterSelect(nextChapter.chapter))
    } else {
      // Show certificate when course is complete
      setTimeout(() => setShowCertificate(true), 1000)
    }
  }, [nextChapter, handleVideoEnd, handleChapterSelect])

  const handleNextVideo = useCallback(() => {
    if (!currentVideoId || !nextChapter) return
    handleChapterSelect(nextChapter.chapter)
  }, [currentVideoId, nextChapter, handleChapterSelect])

  const handlePrevVideo = useCallback(() => {
    if (!currentVideoId || !prevChapter) return
    handleChapterSelect(prevChapter.chapter)
  }, [currentVideoId, prevChapter, handleChapterSelect])

  const handleMobilePlaylistToggle = useCallback(() => {
    setMobilePlaylistOpen(!mobilePlaylistOpen)
  }, [mobilePlaylistOpen])

  const handleCertificateClick = useCallback(() => {
    setShowCertificate(true)
  }, [])

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
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
      const videoStateStore = useVideoState
      videoStateStore.getState().setCurrentVideo(targetVideo.videoId, course.id)

      console.log(`[MainContent] Initialized with video: ${targetVideo.videoId}, course: ${course.id}`)
    } else {
      console.error("Failed to select a video")
    }
  }, [course.id, initialChapterId, videoPlaylist, dispatch, currentVideoId, progress])

  // Reset video loading state whenever current video changes
  useEffect(() => {
    if (currentVideoId) {
      setIsVideoLoading(true)
    }
  }, [currentVideoId])

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  useKeyboardShortcuts({
    showChapterTransition,
    showAutoplayOverlay,
    isPiPActive,
    onCancelAutoplay: handleCancelAutoplay,
    onPIPToggle: handlePIPToggle,
    onAutoplayToggle: handleAutoplayToggle
  })

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================
  
  // Early return for loading state - only show loading if course is not available
  if (!course) {
    return <PageLoading text="Loading course..." />
  }

  // Show content even if videoPlaylist is empty (course might not have videos yet)
  const hasContent = course && (videoPlaylist.length > 0 || course.chapters?.length > 0)

  // Memoized props for child components
  const sidebarProps = useMemo(() => ({
    course: {
      id: course.id,
      title: course.title,
      chapters: course.chapters || []
    },
    currentChapter: currentChapter || null,
    courseId: course.id.toString(),
    onChapterSelect: handleChapterSelect,
    currentVideoId: currentVideoId || '',
    isAuthenticated: !!user,
    progress: progress?.chapters || {},
    completedChapters: progress?.completedChapters || [],
    videoDurations,
    formatDuration,
    courseStats: {
      totalChapters: videoPlaylist.length,
      completedChapters: progress?.completedChapters?.length || 0,
      progressPercentage: progress?.progressPercentage || 0
    }
  }), [
    course, 
    currentChapter, 
    currentVideoId, 
    handleChapterSelect, 
    user, 
    progress, 
    videoDurations, 
    formatDuration, 
    videoPlaylist.length
  ])

  const videoPlayerProps = useMemo(() => ({
    videoId: currentVideoId || '',
    courseId: course.id,
    onVideoLoad: (meta?: { duration?: number }) => {
      handleVideoLoad()
      if (meta && typeof meta.duration === 'number' && currentVideoId) {
        setVideoDurations(prev => ({ ...prev, [currentVideoId]: meta.duration }))
      }
    },
    onPlayerReady: handlePlayerReady,
    onSeekToBookmark: handleSeekToBookmark,
    onVideoProgress: handleVideoProgress,
    onVideoEnd: handleVideoEndWithAutoplay,
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
    handleVideoEndWithAutoplay, 
    handlePIPToggle, 
    handleFullscreenToggle, 
    isPiPActive
  ])

  // Access levels for CourseDetailsTabs
  const accessLevels = useMemo(() => ({
    isSubscribed: !!userSubscription,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN'
  }), [userSubscription, user])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Toolbar */}
      <CourseToolbar
        course={course}
        isOwner={isOwner}
        wideMode={wideMode}
        isPiPActive={isPiPActive}
        autoplayMode={autoplayMode}
        onWideModeToggle={handleWideModeToggle}
        onPIPToggle={handlePIPToggle}
        onAutoplayToggle={handleAutoplayToggle}
        onTheaterModeToggle={handleTheaterModeToggle}
        onFullscreenToggle={handleFullscreenToggle}
        isTheaterMode={isTheaterMode}
        isFullscreenActive={isFullscreenFromLayout}
      />

      {/* Sticky mobile progress bar */}
      {videoPlaylist.length > 0 && (
        <div className="md:hidden sticky top-14 z-30 bg-background/95 backdrop-blur border-b">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {progress?.progressPercentage || Math.round(((progress?.completedChapters?.length || 0) / videoPlaylist.length) * 100)}%
              </span>
            </div>
            <Progress
              value={progress?.progressPercentage || Math.round(((progress?.completedChapters?.length || 0) / videoPlaylist.length) * 100)}
              className="h-1.5"
            />
            <div className="mt-1 text-[11px] text-muted-foreground">
              Chapter {currentIndex + 1} of {videoPlaylist.length}
            </div>
          </div>
        </div>
      )}
 
      {/* Main Content Grid */}
      <div className={cn("grid gap-8 p-6", gridLayoutClasses)}>
        {/* Video and Tabs Column */}
        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative">
            {isVideoLoading && (
              <div className="absolute inset-0 rounded-lg z-10">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            )}
            
            {videoPlaylist.length > 0 ? (
              <MemoizedVideoPlayer {...videoPlayerProps} />
            ) : (
              <div className="w-full aspect-video bg-muted rounded-lg grid place-items-center p-6">
                <div className="text-center max-w-md">
                  <Image src="/images/placeholder.svg" alt="Empty course content" width={200} height={160} className="mx-auto mb-4 opacity-90" />
                  <h3 className="text-xl font-semibold mb-2">Course content will appear here once added</h3>
                  <p className="text-muted-foreground mb-4">Add your first lecture to get started, or explore other courses while this one grows.</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="default" asChild>
                      <a href="/dashboard/create">Upload video</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/dashboard/explore">Explore courses</a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Chapter Progress Indicator - only show if there are videos */}
            {videoPlaylist.length > 0 && (
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
            )}
          </div>

          {/* Course Details Tabs */}
          <MemoizedCourseDetailsTabs
            course={course}
            currentChapter={currentChapter}
            accessLevels={accessLevels}
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
            className="space-y-6 md:sticky md:top-20 self-start"
          >
            {isPiPActive ? (
              <div className="text-center p-8 text-muted-foreground">
                <div className="text-6xl mb-4">📺</div>
                <h3 className="text-lg font-semibold mb-2">Picture-in-Picture Mode</h3>
                <p className="text-sm mb-4">
                  Video is now playing in a floating window. 
                  Close PIP to return to normal view.
                </p>
                <button
                  onClick={() => handlePIPToggle(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Exit PIP Mode
                </button>
              </div>
            ) : (
              <MemoizedVideoNavigationSidebar {...sidebarProps} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Playlist Toggle - only show if there are videos */}
      {videoPlaylist.length > 0 && (
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={handleMobilePlaylistToggle}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      )}

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
                <button
                  onClick={handleMobilePlaylistToggle}
                  className="p-2 hover:bg-muted rounded-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <MemoizedVideoNavigationSidebar {...sidebarProps} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Transition Overlay - only show if there are videos */}
      {videoPlaylist.length > 0 && (
        <AnimatePresence>
          {showChapterTransition && nextChapterInfo && (
            showAutoplayOverlay && (
              <AutoplayOverlay
                countdown={autoplayCountdown}
                nextVideoTitle={nextChapterInfo.chapter.title}
                onCancel={handleCancelAutoplay}
                onNextVideo={handleNextVideo}
              />
            )
          )}
        </AnimatePresence>
      )}

      {/* Certificate Generator */}
      {showCertificate && (
        <div className="p-6">
          <CertificateGenerator course={course} onClose={() => setShowCertificate(false)} />
        </div>
      )}

      <div className="px-6 pb-10">
        <RecommendedSection title="Recommended for you">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-card text-sm text-muted-foreground">
              Explore top courses and quizzes curated for you.
            </div>
          </div>
        </RecommendedSection>
      </div>
    </div>
  )
}

export default MainContent
