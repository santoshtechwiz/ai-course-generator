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

// Types
import type { FullCourseType, FullChapterType } from '@/app/types/types'
import type { BookmarkData } from './video/types'

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
}

// Memoized components for better performance
const MemoizedVideoNavigationSidebar = React.memo(VideoNavigationSidebar)
const MemoizedVideoPlayer = React.memo(VideoPlayer)
const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)

const MainContent: React.FC<ModernCoursePageProps> = ({ 
  course, 
  initialChapterId
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
    isFullscreen,
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
      />

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

      {/* Mobile Playlist Toggle */}
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
              
              <button
                onClick={handleCancelAutoplay}
                className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                Cancel Auto-play
              </button>
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
