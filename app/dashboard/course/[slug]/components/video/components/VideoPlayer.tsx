"use client"

import React, { useEffect, useMemo, useCallback, useState, useRef } from "react"
import ReactPlayer from "react-player/youtube"
import { cn } from "@/lib/tailwindUtils"
import { useVideoPlayer } from "../hooks/useVideoPlayer"

import VideoLoadingOverlay from "./VideoLoadingOverlay"
import VideoErrorState from "./VideoErrorState"
import PlayerControls from "./PlayerControls"
import BookmarkManager from "./BookmarkManager"
import BookmarkTimeline from "./BookmarkTimeline"
import { TheaterModeManager } from "../Theatre"
import { CourseAILogo } from "../../CourseAILogo"
import VideoErrorBoundary from "./VideoErrorBoundary"
import KeyboardShortcutsModal from "../../KeyboardShortcutsModal"
import AutoplayOverlay from "../../AutoplayOverlay"
import { motion, AnimatePresence } from "framer-motion"
import { useAppSelector } from "@/store/hooks"

import type { VideoPlayerProps, ProgressState } from "../types"
import { useProgressTracking } from "../hooks/useProgressTracking"
import { formatTime } from "../hooks/progressUtils"

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onEnded,
  onProgress,
  onTimeUpdate,
  rememberPlaybackPosition = true,
  rememberPlaybackSettings = true,
  onBookmark,
  autoPlay = false,
  onVideoLoad,
  onCertificateClick,
  height = "100%",
  width = "100%",
  className = "",
  showControls = true,
  bookmarks = [],
  isAuthenticated = false,
  playerConfig,
  onChapterComplete,
  onNextVideo,
  nextVideoTitle,
  courseName,
}) => {
  // Hooks
  const { state, playerRef, containerRef, bufferHealth, youtubeUrl, handleProgress, handlers } = useVideoPlayer({
    videoId,
    onEnded,
    onProgress,
    onTimeUpdate,
    rememberPlaybackPosition,
    rememberPlaybackSettings,
    onBookmark,
    autoPlay,
    onVideoLoad,
    onCertificateClick,
  })

  // Progress tracking (only if we have course context)
  const courseId = useAppSelector((state) => state.course?.currentCourse?.id)
  const chapterId = useAppSelector((state) => state.course?.currentChapter?.id)

  const progressTracking = useProgressTracking({
    courseId: courseId || "",
    chapterId: chapterId || "",
    videoId,
    onMilestoneReached: useCallback((milestone: number) => {
      if (milestone === 0.1) {
        setShowBrandOverlay(true)
        setTimeout(() => setShowBrandOverlay(false), 5000)
      }
    }, []),
  })

  // Local state
  const [showControlsInternal, setShowControlsInternal] = useState(true)
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(5)
  const [showBrandOverlay, setShowBrandOverlay] = useState(false)
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false)

  // Refs
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get bookmarks from Redux store
  const storedBookmarks = useAppSelector((state) => state.course?.bookmarks[videoId] || [])

  // Memoized values
  const shouldLoadVideo = useMemo(
    () => autoPlay || state.userInteracted || state.playing || state.hasStarted,
    [autoPlay, state.userInteracted, state.playing, state.hasStarted],
  )

  const currentTime = useMemo(() => state.duration * state.played, [state.duration, state.played])

  // YouTube player config
  const youtubeConfig = useMemo(
    () => ({
      youtube: {
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 1,
          controls: 0,
          disablekb: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
          cc_load_policy: playerConfig?.showCaptions ? 1 : 0,
          preload: shouldLoadVideo ? "auto" : "none",
        },
      },
    }),
    [autoPlay, shouldLoadVideo, playerConfig?.showCaptions],
  )

  // Control visibility management
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (state.playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsInternal(false)
        setShowBookmarkPanel(false)
      }, 3000)
    }
  }, [state.playing])

  const handleShowControls = useCallback(() => {
    setShowControlsInternal(true)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  const handleUserInteraction = useCallback(() => {
    handlers.onPlay()
    handleShowControls()
  }, [handlers, handleShowControls])

  // Enhanced progress handler with tracking
  const handleVideoProgress = useCallback(
    (progress: ProgressState) => {
      handleProgress(progress)

      // Track progress for course completion
      if (courseId && chapterId) {
        progressTracking.trackProgress(progress)
      }
    },
    [handleProgress, courseId, chapterId, progressTracking],
  )

  // Enhanced onEnded handler
  const handleOnEnded = useCallback(() => {
    // Mark chapter as completed
    if (courseId && chapterId) {
      progressTracking.markChapterComplete()
    }

    if (onChapterComplete) {
      onChapterComplete()
    }

    if (onEnded) {
      onEnded()
    }

    // Automatically move to the next video if available
    if (onNextVideo) {
      onNextVideo()
    }
  }, [courseId, chapterId, progressTracking, onChapterComplete, onEnded, onNextVideo])

  // Bookmark panel toggle
  const toggleBookmarkPanel = useCallback(() => {
    setShowBookmarkPanel((prev) => !prev)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  // Cancel autoplay
  const handleCancelAutoplay = useCallback(() => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current)
      autoplayTimeoutRef.current = null
    }
    setShowAutoplayOverlay(false)
  }, [])

  // Bookmark seeking
  const onSeekToBookmark = useCallback(
    (time: number) => {
      handlers.onSeek(time)
    },
    [handlers],
  )

  // Render placeholder for unstarted videos
  const renderPlaceholder = useCallback(() => {
    if (autoPlay || state.userInteracted) return null

    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-black cursor-pointer"
        onClick={handleUserInteraction}
      >
        <div className="flex flex-col items-center text-white">
          <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="mt-3 text-sm text-white/90">Click to play</div>
        </div>
      </div>
    )
  }, [autoPlay, state.userInteracted, handleUserInteraction])

  // Effects
  useEffect(() => {
    resetControlsTimeout()
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [state.playing, resetControlsTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current)
      }

      // Save progress on unmount
      if (courseId && chapterId) {
        progressTracking.saveProgress()
      }
    }
  }, [courseId, chapterId, progressTracking])

  return (
    <VideoErrorBoundary>
      <div
        ref={containerRef}
        className={cn(
          "video-player-wrapper relative w-full aspect-video overflow-hidden bg-black rounded-lg",
          state.theaterMode && "video-player-theater-mode fixed inset-0 h-screen w-screen z-50",
          className,
        )}
        style={{ height, width }}
        onMouseMove={handleShowControls}
        onMouseLeave={() => {
          if (state.playing) {
            resetControlsTimeout()
          }
        }}
        onClick={handleUserInteraction}
        onFocus={handleUserInteraction}
        tabIndex={0}
        aria-label={`Video player: ${courseName || "Course video"}`}
      >
        {/* Loading overlay - only show when actually loading */}
        {state.isLoading && !state.playerError && <VideoLoadingOverlay isVisible={true} />}

        {/* Video player */}
        {!state.playerError && (
          <div className="relative w-full h-full">
            {shouldLoadVideo && (
              <ReactPlayer
                ref={playerRef}
                url={youtubeUrl}
                playing={state.playing}
                volume={state.volume}
                muted={state.muted}
                playbackRate={state.playbackRate}
                width="100%"
                height="100%"
                onPlay={handlers.onPlay}
                onPause={handlers.onPause}
                onEnded={handleOnEnded}
                onReady={handlers.onReady}
                onBuffer={handlers.onBuffer}
                onBufferEnd={handlers.onBufferEnd}
                onError={handlers.onError}
                onProgress={handleVideoProgress}
                config={youtubeConfig}
                style={{ position: "absolute", top: 0, left: 0 }}
                progressInterval={500}
                playsinline={true}
                fallback={<div className="w-full h-full bg-black" />}
              />
            )}

            {renderPlaceholder()}
          </div>
        )}

        {/* Error state */}
        {state.playerError && (
          <VideoErrorState
            onReload={() => window.location.reload()}
            onRetry={() => {
              if (playerRef.current) {
                playerRef.current.seekTo(0)
                handlers.onPlay()
              }
            }}
            error={state.playerError}
          />
        )}

        {/* CourseAI Logo */}
        <CourseAILogo
          show={state.isPlayerReady && !state.playerError && !state.isLoading}
          theaterMode={state.theaterMode}
          showControls={showControlsInternal}
        />

        {/* Brand overlay */}
        <AnimatePresence>
          {showBrandOverlay && (
            <motion.div
              className="absolute top-8 right-8 z-30 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/30"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-3">
                <div className="text-primary font-semibold">{courseName || "CourseAI"}</div>
                <div className="h-4 w-px bg-white/20"></div>
                <div className="text-white/70 text-sm">Interactive Learning</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookmark timeline */}
        {storedBookmarks.length > 0 && (
          <div className="absolute bottom-16 left-0 right-0 px-4 z-20">
            <BookmarkTimeline
              bookmarks={storedBookmarks}
              duration={state.duration}
              currentTime={currentTime}
              onSeekToBookmark={onSeekToBookmark}
              formatTime={formatTime}
            />
          </div>
        )}

        {/* Player controls */}
        {showControls && (
          <PlayerControls
            playing={state.playing}
            muted={state.muted}
            volume={state.volume}
            playbackRate={state.playbackRate}
            played={state.played}
            loaded={state.loaded}
            duration={state.duration}
            isFullscreen={state.isFullscreen}
            isBuffering={state.isBuffering}
            bufferHealth={bufferHealth}
            onPlayPause={handlers.onPlayPause}
            onMute={handlers.onMute}
            onVolumeChange={handlers.onVolumeChange}
            onSeekChange={handlers.onSeek}
            onPlaybackRateChange={handlers.onPlaybackRateChange}
            onToggleFullscreen={handlers.onToggleFullscreen}
            onAddBookmark={handlers.addBookmark}
            formatTime={formatTime}
            bookmarks={storedBookmarks.map((b) => b.time)}
            onSeekToBookmark={onSeekToBookmark}
            isAuthenticated={isAuthenticated}
            onCertificateClick={onCertificateClick}
            playerConfig={playerConfig}
            show={showControlsInternal}
            onShowKeyboardShortcuts={state.userInteracted ? handlers.handleShowKeyboardShortcuts : undefined}
            onTheaterMode={handlers.handleTheaterModeToggle}
            onNextVideo={onNextVideo}
            onToggleBookmarkPanel={toggleBookmarkPanel}
          />
        )}

        {/* Bookmark panel */}
        <AnimatePresence>
          {showBookmarkPanel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute right-6 bottom-20 z-40 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg w-80 max-h-[60vh] overflow-hidden"
            >
              <div className="p-4">
                <BookmarkManager
                  videoId={videoId}
                  bookmarks={storedBookmarks}
                  currentTime={currentTime}
                  duration={state.duration}
                  onSeekToBookmark={onSeekToBookmark}
                  onAddBookmark={handlers.addBookmark}
                  onRemoveBookmark={handlers.removeBookmark}
                  formatTime={formatTime}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theater mode manager */}
        <TheaterModeManager
          isTheaterMode={state.theaterMode}
          onToggle={handlers.handleTheaterModeToggle}
          onExit={() => {
            if (state.theaterMode) {
              handlers.handleTheaterModeToggle()
            }
          }}
          className="absolute top-4 right-4 z-50"
        />

        {/* Keyboard shortcuts modal */}
        {state.showKeyboardShortcuts && (
          <KeyboardShortcutsModal onClose={handlers.handleHideKeyboardShortcuts} show={state.showKeyboardShortcuts} />
        )}

        {/* Autoplay overlay */}
        {showAutoplayOverlay && onNextVideo && (
          <AutoplayOverlay
            countdown={autoplayCountdown}
            onCancel={handleCancelAutoplay}
            onNextVideo={onNextVideo}
            nextVideoTitle={nextVideoTitle}
          />
        )}
      </div>
    </VideoErrorBoundary>
  )
}

export default React.memo(VideoPlayer)
