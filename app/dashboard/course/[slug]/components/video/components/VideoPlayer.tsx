"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import ReactPlayer from "react-player/youtube"
import { useVideoPlayer } from "../hooks/useVideoPlayer"
import PlayerControls from "./PlayerControls"
import VideoLoadingOverlay from "./VideoLoadingOverlay"
import VideoErrorState from "./VideoErrorState"
import BookmarkManager from "./BookmarkManager"
import KeyboardShortcutsModal from "../../KeyboardShortcutsModal"
import AnimatedCourseAILogo from "./AnimatedCourseAILogo"
import { cn } from "@/lib/utils"
import type { VideoPlayerProps } from "../types"

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
  className,
  showControls = true,
  bookmarks = [],
  isAuthenticated = false,
  playerConfig,
  onChapterComplete,
  onNextVideo,
  nextVideoTitle,
  courseName,
}) => {
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false)
  const [showLogoOverlay, setShowLogoOverlay] = useState(false)
  const [videoEnding, setVideoEnding] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [showControlsState, setShowControlsState] = useState(showControls) // Declare setShowControls

  // Initialize video player hook
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

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`
  }, [])

  // Handle bookmark actions
  const handleAddBookmark = useCallback(
    (time: number, title?: string) => {
      handlers.addBookmark(time, title)
    },
    [handlers],
  )

  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
      handlers.removeBookmark(bookmarkId)
    },
    [handlers],
  )

  const handleSeekToBookmark = useCallback(
    (time: number) => {
      handlers.onSeek(time)
    },
    [handlers],
  )

  // Toggle bookmark panel
  const handleToggleBookmarkPanel = useCallback(() => {
    setShowBookmarkPanel((prev) => !prev)
  }, [])

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControlsState(true)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      if (state.playing && !isHovering) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControlsState(false)
        }, 3000)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("click", handleMouseMove)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
        container.removeEventListener("click", handleMouseMove)
      }

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [containerRef, state.playing, isHovering])

  // Show logo overlay before video ends
  useEffect(() => {
    if (state.lastPlayedTime > 0 && state.duration > 0) {
      const timeRemaining = state.duration - state.lastPlayedTime

      // Show logo 5 seconds before video ends
      if (timeRemaining <= 5 && timeRemaining > 0 && !videoEnding) {
        setVideoEnding(true)
        setShowLogoOverlay(true)
      }

      // Reset for next video
      if (state.lastPlayedTime < 2 && videoEnding) {
        setVideoEnding(false)
        setShowLogoOverlay(false)
      }
    }
  }, [state.lastPlayedTime, state.duration, videoEnding])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative  object-contain w-full h-full bg-black overflow-hidden group",
        state.theaterMode && "theater-mode",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* YouTube Player */}
      <div className="absolute inset-0 pointer-events-none">
        <ReactPlayer
          ref={playerRef}
          url={youtubeUrl}
          width="100%"
          height="100%"
          playing={state.playing}
          volume={state.volume}
          muted={state.muted}
          playbackRate={state.playbackRate}
          onProgress={handleProgress}
          onPlay={handlers.onPlay}
          onPause={handlers.onPause}
          onBuffer={handlers.onBuffer}
          onBufferEnd={handlers.onBufferEnd}
          onError={handlers.onError}
          onEnded={onEnded}
          onReady={handlers.onReady}
          config={{
            youtube: {
              playerVars: {
                autoplay: autoPlay ? 1 : 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                fs: 0, // Disable fullscreen button
                controls: 0, // Hide controls
                disablekb: 1, // Disable keyboard controls
                playsinline: 1,
                enablejsapi: 1,
                origin: typeof window !== "undefined" ? window.location.origin : "",
                widget_referrer: typeof window !== "undefined" ? window.location.origin : "",
              },
            },
          }}
          style={{
            pointerEvents: "none", // Prevent direct interaction with YouTube player
          }}
        />
      </div>

      {/* Overlay to capture clicks and prevent YouTube UI interaction */}
      <div className="absolute inset-0 z-10" onClick={handlers.onPlayPause} />

      {/* Loading overlay */}
      {(state.isLoading || state.isBuffering) && (
        <VideoLoadingOverlay
          isVisible={state.isLoading || state.isBuffering}
          message={state.isLoading ? "Loading video..." : "Buffering..."}
        />
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

      {/* CourseAI Logo Overlay */}
      <AnimatedCourseAILogo show={showLogoOverlay} videoEnding={videoEnding} onAnimationComplete={() => {}} />

      {/* Custom controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300",
          !showControlsState && !isHovering && "opacity-0",
        )}
      >
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
          onAddBookmark={handleAddBookmark}
          formatTime={formatTime}
          bookmarks={bookmarks.map((b) => b.time)}
          onSeekToBookmark={handleSeekToBookmark}
          isAuthenticated={isAuthenticated}
          onCertificateClick={onCertificateClick}
          playerConfig={playerConfig}
          show={showControlsState}
          onShowKeyboardShortcuts={handlers.handleShowKeyboardShortcuts}
          onTheaterMode={handlers.handleTheaterModeToggle}
          onNextVideo={onNextVideo}
          onToggleBookmarkPanel={handleToggleBookmarkPanel}
        />
      </div>

      {/* Bookmark panel */}
      {showBookmarkPanel && (
        <div className="absolute top-0 right-0 bottom-16 w-72 bg-black/80 backdrop-blur-sm z-20 border-l border-white/10">
          <BookmarkManager
            videoId={videoId}
            bookmarks={bookmarks}
            currentTime={state.lastPlayedTime}
            duration={state.duration}
            onSeekToBookmark={handleSeekToBookmark}
            onAddBookmark={handleAddBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            formatTime={formatTime}
          />
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {state.showKeyboardShortcuts && <KeyboardShortcutsModal onClose={handlers.handleHideKeyboardShortcuts} show={false} />}
    </div>
  )
}

export default VideoPlayer
