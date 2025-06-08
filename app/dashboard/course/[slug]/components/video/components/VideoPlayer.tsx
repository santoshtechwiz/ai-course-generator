"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import ReactPlayer from "react-player/youtube"
import { useSession } from "next-auth/react"
import { useVideoPlayer } from "../hooks/useVideoPlayer"
import PlayerControls from "./PlayerControls"
import VideoLoadingOverlay from "./VideoLoadingOverlay"
import VideoErrorState from "./VideoErrorState"
import BookmarkManager from "./BookmarkManager"
import KeyboardShortcutsModal from "../../KeyboardShortcutsModal"
import AnimatedCourseAILogo from "./AnimatedCourseAILogo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Lock, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
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
  const { data: session } = useSession()
  const { toast } = useToast()
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false)
  const [showLogoOverlay, setShowLogoOverlay] = useState(false)
  const [videoEnding, setVideoEnding] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [isLoadingDuration, setIsLoadingDuration] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [canPlayVideo, setCanPlayVideo] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [showControlsState, setShowControlsState] = useState(showControls)

  // Check if user can play video (authenticated or first free video)
  useEffect(() => {
    const freeVideoPlayed = localStorage.getItem("hasPlayedFreeVideo")
    const hasPlayed = freeVideoPlayed === "true"
    setHasPlayedFreeVideo(hasPlayed)

    if (isAuthenticated || !hasPlayed) {
      setCanPlayVideo(true)
    } else {
      setCanPlayVideo(false)
      setShowAuthPrompt(true)
    }
  }, [isAuthenticated])

  // Initialize video player hook
  const { state, playerRef, containerRef, bufferHealth, youtubeUrl, handleProgress, handlers } = useVideoPlayer({
    videoId,
    onEnded: () => {
      // Mark free video as played if not authenticated
      if (!isAuthenticated && !hasPlayedFreeVideo) {
        localStorage.setItem("hasPlayedFreeVideo", "true")
        setHasPlayedFreeVideo(true)
      }
      onEnded?.()
    },
    onProgress,
    onTimeUpdate,
    rememberPlaybackPosition,
    rememberPlaybackSettings,
    onBookmark,
    autoPlay: autoPlay && canPlayVideo,
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

  // Handle player ready and fetch duration
  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true)
    setIsLoadingDuration(false)

    if (playerRef.current) {
      const duration = playerRef.current.getDuration()
      if (duration && duration > 0) {
        setVideoDuration(duration)
        onVideoLoad?.({
          title: courseName || "Video",
          duration,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        })
      }
    }

    handlers.onReady()
  }, [handlers, onVideoLoad, courseName, videoId])

  // Enhanced play handler with authentication check
  const handlePlayClick = useCallback(() => {
    if (!canPlayVideo) {
      if (!isAuthenticated && hasPlayedFreeVideo) {
        toast({
          title: "Sign in required",
          description: "Please sign in to watch more videos. You've used your free preview.",
          variant: "destructive",
        })
        return
      }
    }

    if (!playerReady) {
      toast({
        title: "Video loading",
        description: "Please wait for the video to finish loading.",
      })
      return
    }

    handlers.onPlayPause()
  }, [canPlayVideo, isAuthenticated, hasPlayedFreeVideo, playerReady, handlers, toast])

  // Handle bookmark actions
  const handleAddBookmark = useCallback(
    (time: number, title?: string) => {
      if (!isAuthenticated) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add bookmarks.",
          variant: "destructive",
        })
        return
      }
      handlers.addBookmark(time, title)
    },
    [handlers, isAuthenticated, toast],
  )

  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
      handlers.removeBookmark(bookmarkId)
    },
    [handlers],
  )

  const handleSeekToBookmark = useCallback(
    (time: number) => {
      if (!canPlayVideo) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use video controls.",
          variant: "destructive",
        })
        return
      }
      handlers.onSeek(time)
    },
    [handlers, canPlayVideo, toast],
  )

  // Toggle bookmark panel
  const handleToggleBookmarkPanel = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to access bookmarks.",
        variant: "destructive",
      })
      return
    }
    setShowBookmarkPanel((prev) => !prev)
  }, [isAuthenticated, toast])

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
    if (state.lastPlayedTime > 0 && videoDuration > 0) {
      const timeRemaining = videoDuration - state.lastPlayedTime

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
  }, [state.lastPlayedTime, videoDuration, videoEnding])

  // Authentication prompt overlay
  if (showAuthPrompt && !canPlayVideo) {
    return (
      <div
        className={cn(
          "relative w-full h-full bg-black overflow-hidden group flex items-center justify-center",
          className,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)`,
          }}
        />

        <Card className="relative z-10 max-w-md mx-4 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign in to continue watching</h3>
            <p className="text-muted-foreground mb-6">
              You've used your free video preview. Sign in to access all course content and features.
            </p>
            <div className="space-y-3">
              <Button onClick={() => (window.location.href = "/api/auth/signin")} className="w-full" size="lg">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button variant="outline" onClick={() => setShowAuthPrompt(false)} className="w-full">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative object-contain w-full h-full bg-black overflow-hidden group",
        state.theaterMode && "theater-mode",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* YouTube Player */}
      <div className="absolute inset-0">
        <ReactPlayer
          ref={playerRef}
          url={youtubeUrl}
          width="100%"
          height="100%"
          playing={state.playing && canPlayVideo}
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
          onReady={handlePlayerReady}
          onDuration={(duration) => {
            setVideoDuration(duration)
            setIsLoadingDuration(false)
          }}
          config={{
          
              playerVars: {
                autoplay: 0, // Always start paused for better UX
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                fs: 1, // Enable fullscreen
                controls: 0, // Hide YouTube controls
                disablekb: 0, // Enable keyboard controls
                playsinline: 1,
                enablejsapi: 1,
                origin: typeof window !== "undefined" ? window.location.origin : "",
                widget_referrer: typeof window !== "undefined" ? window.location.origin : "",
            
            },
          }}
        />
      </div>

      {/* Click overlay for play/pause */}
      <div className="absolute inset-0 z-10 cursor-pointer" onClick={handlePlayClick} />

      {/* Loading overlay */}
      {(state.isLoading || state.isBuffering || isLoadingDuration) && (
        <VideoLoadingOverlay
          isVisible={true}
          message={
            isLoadingDuration
              ? "Loading video information..."
              : state.isLoading
                ? "Loading video player..."
                : "Buffering..."
          }
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

      {/* Play button overlay when paused */}
      {!state.playing && playerReady && canPlayVideo && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className="bg-black/60 backdrop-blur-sm rounded-full p-4 cursor-pointer pointer-events-auto hover:bg-black/80 transition-all duration-200 hover:scale-110"
            onClick={handlePlayClick}
          >
            <Play className="h-12 w-12 text-white ml-1" />
          </div>
        </div>
      )}

      {/* CourseAI Logo Overlay */}
      <AnimatedCourseAILogo
        show={showLogoOverlay}
        videoEnding={videoEnding}
        onAnimationComplete={() => setShowLogoOverlay(false)}
      />

      {/* Custom controls */}
      {canPlayVideo && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300",
            !showControlsState && !isHovering && state.playing && "opacity-0",
          )}
        >
          <PlayerControls
            playing={state.playing}
            muted={state.muted}
            volume={state.volume}
            playbackRate={state.playbackRate}
            played={state.played}
            loaded={state.loaded}
            duration={videoDuration || state.duration}
            isFullscreen={state.isFullscreen}
            isBuffering={state.isBuffering}
            bufferHealth={bufferHealth}
            onPlayPause={handlePlayClick}
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
      )}

      {/* Bookmark panel */}
      {showBookmarkPanel && isAuthenticated && (
        <div className="absolute top-0 right-0 bottom-16 w-72 bg-black/80 backdrop-blur-sm z-20 border-l border-white/10">
          <BookmarkManager
            videoId={videoId}
            bookmarks={bookmarks}
            currentTime={state.lastPlayedTime}
            duration={videoDuration || state.duration}
            onSeekToBookmark={handleSeekToBookmark}
            onAddBookmark={handleAddBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            formatTime={formatTime}
          />
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {state.showKeyboardShortcuts && (
        <KeyboardShortcutsModal onClose={handlers.handleHideKeyboardShortcuts} show={state.showKeyboardShortcuts} />
      )}
    </div>
  )
}

export default VideoPlayer
