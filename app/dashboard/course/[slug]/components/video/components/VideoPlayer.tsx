"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import ReactPlayer from "react-player/youtube"
import { useSession } from "next-auth/react"
import { useVideoPlayer } from "../hooks/useVideoPlayer"
import PlayerControls from "./PlayerControls"
import VideoLoadingOverlay from "./VideoLoadingOverlay"
import VideoErrorState from "./VideoErrorState"
import BookmarkManager from "./BookmarkManager"
import KeyboardShortcutsModal from "../../KeyboardShortcutsModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Lock, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { VideoPlayerProps } from "../types"
import ChapterStartOverlay from "./ChapterStartOverlay"
import ChapterEndOverlay from "./ChapterEndOverlay"

// Memoized authentication prompt to prevent unnecessary re-renders
const AuthPrompt = React.memo(
  ({
    videoId,
    onSignIn,
    onClose,
  }: {
    videoId: string
    onSignIn: () => void
    onClose: () => void
  }) => (
    <div className="relative w-full h-full bg-black overflow-hidden group flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90" />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)`,
        }}
      />
      <Card className="relative z-10 max-w-md mx-4 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Sign in to continue watching</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            You've used your free video preview. Sign in to access all course content and features.
          </p>
          <div className="space-y-3">
            <Button onClick={onSignIn} className="w-full" size="lg">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
)

AuthPrompt.displayName = "AuthPrompt"

// Memoized play button to prevent unnecessary re-renders
const PlayButton = React.memo(({ onClick }: { onClick: () => void }) => (
  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
    <button
      className="bg-black/60 backdrop-blur-sm rounded-full p-3 sm:p-4 cursor-pointer pointer-events-auto hover:bg-black/80 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50"
      onClick={onClick}
      aria-label="Play video"
      type="button"
    >
      <Play className="h-8 w-8 sm:h-12 sm:w-12 text-white ml-1" />
    </button>
  </div>
))

PlayButton.displayName = "PlayButton"

// Certificate download states
type CertificateState = "idle" | "downloading" | "success" | "error"

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
  onPlayerReady,
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
  chapterTitle,
}) => {
  const { data: session } = useSession()
  const { toast } = useToast()

  // State management with proper initialization
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false)
  const [showChapterStart, setShowChapterStart] = useState(false)
  const [showChapterEnd, setShowChapterEnd] = useState(false)
  const [chapterStartShown, setChapterStartShown] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [isLoadingDuration, setIsLoadingDuration] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [canPlayVideo, setCanPlayVideo] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showControlsState, setShowControlsState] = useState(showControls)
  const [isPiPSupported, setIsPiPSupported] = useState(false)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [certificateState, setCertificateState] = useState<CertificateState>("idle")
  const [isMounted, setIsMounted] = useState(false)

  // Refs for cleanup and performance
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chapterTitleRef = useRef(chapterTitle)
  const videoIdRef = useRef(videoId)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  // Track mounting state to prevent "element not found" errors
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Update refs when props change to ensure latest values
  useEffect(() => {
    chapterTitleRef.current = chapterTitle
    videoIdRef.current = videoId
  }, [chapterTitle, videoId])

  // Check PiP support on mount with proper error handling
  useEffect(() => {
    if (typeof document !== "undefined") {
      try {
        setIsPiPSupported("pictureInPictureEnabled" in document && document.pictureInPictureEnabled)
      } catch (error) {
        console.warn("Error checking PiP support:", error)
        setIsPiPSupported(false)
      }
    }
  }, [])

  // Enhanced authentication check with memoization
  const authenticationState = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        hasPlayedFreeVideo: false,
        canPlayVideo: isAuthenticated,
        showAuthPrompt: false,
      }
    }

    const freeVideoPlayed = localStorage.getItem("hasPlayedFreeVideo") === "true"
    return {
      hasPlayedFreeVideo: freeVideoPlayed,
      canPlayVideo: isAuthenticated || !freeVideoPlayed,
      showAuthPrompt: !isAuthenticated && freeVideoPlayed,
    }
  }, [isAuthenticated])

  useEffect(() => {
    setHasPlayedFreeVideo(authenticationState.hasPlayedFreeVideo)
    setCanPlayVideo(authenticationState.canPlayVideo)
    setShowAuthPrompt(authenticationState.showAuthPrompt)
  }, [authenticationState])

  // Initialize video player hook with enhanced options
  const { state, playerRef, containerRef, bufferHealth, youtubeUrl, handleProgress, handlers } = useVideoPlayer({
    videoId,
    onEnded: () => {
      // Mark free video as played if not authenticated
      if (!isAuthenticated && !hasPlayedFreeVideo) {
        localStorage.setItem("hasPlayedFreeVideo", "true")
        setHasPlayedFreeVideo(true)
      }
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

  // Memoized format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`
  }, [])

  // Safe video element getter with proper error handling
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    if (!isMounted || !containerRef.current) return null

    try {
      // First try to get from ReactPlayer internal structure
      const reactPlayerVideo = containerRef.current.querySelector("iframe")?.contentDocument?.querySelector("video")
      if (reactPlayerVideo) {
        videoElementRef.current = reactPlayerVideo
        return reactPlayerVideo
      }

      // Fallback to direct video element
      const directVideo = containerRef.current.querySelector("video")
      if (directVideo) {
        videoElementRef.current = directVideo
        return directVideo
      }

      return null
    } catch (error) {
      console.warn("Error accessing video element:", error)
      return null
    }
  }, [isMounted, containerRef])

  // Enhanced player ready handler with better error handling
  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true)
    setIsLoadingDuration(false)

    if (playerRef.current) {
      try {
        const duration = playerRef.current.getDuration()
        if (duration && duration > 0) {
          setVideoDuration(duration)
          onVideoLoad?.({
            title: courseName || chapterTitleRef.current || "Video",
            duration,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          })
        }

        // Pass the player reference to the parent component
        onPlayerReady?.(playerRef)
      } catch (error) {
        console.warn("Error getting video duration:", error)
      }
    }

    handlers.onReady()
  }, [handlers, onVideoLoad, courseName, videoId, onPlayerReady])

  // Enhanced play handler with better UX
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

  // Enhanced bookmark handlers with better error handling
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

      try {
        handlers.addBookmark(time, title)
        toast({
          title: "Bookmark added",
          description: `Bookmark added at ${formatTime(time)}`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add bookmark. Please try again.",
          variant: "destructive",
        })
      }
    },
    [handlers, isAuthenticated, toast, formatTime],
  )

  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
      try {
        handlers.removeBookmark(bookmarkId)
        toast({
          title: "Bookmark removed",
          description: "The bookmark has been removed.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove bookmark. Please try again.",
          variant: "destructive",
        })
      }
    },
    [handlers, toast],
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

  // Enhanced bookmark panel toggle
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

  // Enhanced Picture-in-Picture handler with proper error handling
  const handlePictureInPicture = useCallback(async () => {
    if (!isPiPSupported) {
      toast({
        title: "Picture-in-Picture not supported",
        description: "Your browser doesn't support Picture-in-Picture mode.",
        variant: "destructive",
      })
      return
    }

    try {
      const videoElement = getVideoElement()

      if (!videoElement) {
        throw new Error("Video element not found")
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiPActive(false)
      } else {
        await videoElement.requestPictureInPicture()
        setIsPiPActive(true)

        // Listen for PiP events with proper cleanup
        const handleEnterPiP = () => setIsPiPActive(true)
        const handleLeavePiP = () => setIsPiPActive(false)

        videoElement.addEventListener("enterpictureinpicture", handleEnterPiP)
        videoElement.addEventListener("leavepictureinpicture", handleLeavePiP)

        // Cleanup listeners when component unmounts or video changes
        return () => {
          videoElement.removeEventListener("enterpictureinpicture", handleEnterPiP)
          videoElement.removeEventListener("leavepictureinpicture", handleLeavePiP)
        }
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error)
      toast({
        title: "Picture-in-Picture Error",
        description: "Could not enter Picture-in-Picture mode. Please try again.",
        variant: "destructive",
      })
    }
  }, [isPiPSupported, toast, getVideoElement])

  // Enhanced certificate download handler with proper state management
  const handleCertificateDownload = useCallback(async () => {
    if (certificateState !== "idle") return

    setCertificateState("downloading")

    try {
      await onCertificateClick?.()
      setCertificateState("success")

      toast({
        title: "Certificate downloaded",
        description: "Your course completion certificate has been downloaded successfully.",
      })

      // Reset state after 3 seconds
      setTimeout(() => {
        setCertificateState("idle")
      }, 3000)
    } catch (error) {
      setCertificateState("error")
      toast({
        title: "Download failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      })

      // Reset state after 3 seconds
      setTimeout(() => {
        setCertificateState("idle")
      }, 3000)
    }
  }, [certificateState, onCertificateClick, toast])

  // Enhanced auto-hide controls with better performance
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControlsState(true)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      if (state.playing && !isHovering && !showChapterStart && !showChapterEnd) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControlsState(false)
        }, 3000)
      }
    }

    const container = containerRef.current
    if (container && isMounted) {
      container.addEventListener("mousemove", handleMouseMove, { passive: true })
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [containerRef, state.playing, isHovering, showChapterStart, showChapterEnd, isMounted])

  // Enhanced chapter start overlay logic with proper cleanup
  useEffect(() => {
    if (state.playing && !chapterStartShown && playerReady && canPlayVideo && !showChapterEnd && isMounted) {
      // Use requestAnimationFrame for smoother animation timing
      const animationFrame = requestAnimationFrame(() => {
        setShowChapterStart(true)
        setChapterStartShown(true)
      })

      return () => cancelAnimationFrame(animationFrame)
    }
  }, [state.playing, chapterStartShown, playerReady, canPlayVideo, showChapterEnd, isMounted])

  // Reset overlay states when video changes with proper cleanup
  useEffect(() => {
    setChapterStartShown(false)
    setShowChapterStart(false)
    setShowChapterEnd(false)
    setPlayerReady(false)
    setVideoDuration(0)
    setIsLoadingDuration(true)
    setCertificateState("idle")

    // Clear any pending timeouts
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
  }, [videoId])

  // Enhanced overlay handlers with better state management
  const handleChapterStartComplete = useCallback(() => {
    const animationFrame = requestAnimationFrame(() => {
      setShowChapterStart(false)
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [])

  const handleVideoEnd = useCallback(() => {
    const animationFrame = requestAnimationFrame(() => {
      setShowChapterEnd(true)
    })
    onEnded?.()

    return () => cancelAnimationFrame(animationFrame)
  }, [onEnded])

  const handleNextChapter = useCallback(() => {
    setShowChapterEnd(false)
    onNextVideo?.()
  }, [onNextVideo])

  const handleReplay = useCallback(() => {
    setShowChapterEnd(false)
    if (playerRef.current) {
      playerRef.current.seekTo(0)
      handlers.onPlay()
    }
  }, [handlers])

  // Keyboard shortcuts with proper accessibility
  useEffect(() => {
    if (!isMounted || !canPlayVideo) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard events when typing in form elements
      const target = event.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }

      // Don't handle when overlays are showing
      if (showChapterStart || showChapterEnd) return

      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault()
          handlePlayClick()
          break
        case "ArrowRight":
          event.preventDefault()
          handlers.onSeek(Math.min(videoDuration, state.lastPlayedTime + 10))
          break
        case "ArrowLeft":
          event.preventDefault()
          handlers.onSeek(Math.max(0, state.lastPlayedTime - 10))
          break
        case "m":
          event.preventDefault()
          handlers.onMute()
          break
        case "f":
          event.preventDefault()
          handlers.onToggleFullscreen()
          break
        case "t":
          event.preventDefault()
          handlers.handleTheaterModeToggle()
          break
        case "p":
          if (isPiPSupported) {
            event.preventDefault()
            handlePictureInPicture()
          }
          break
        case "Escape":
          if (state.isFullscreen || state.theaterMode) {
            event.preventDefault()
            if (state.isFullscreen) handlers.onToggleFullscreen()
            if (state.theaterMode) handlers.handleTheaterModeToggle()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isMounted,
    canPlayVideo,
    showChapterStart,
    showChapterEnd,
    handlePlayClick,
    handlers,
    videoDuration,
    state.lastPlayedTime,
    state.isFullscreen,
    state.theaterMode,
    isPiPSupported,
    handlePictureInPicture,
  ])

  // Memoized authentication prompt
  const authPromptComponent = useMemo(() => {
    if (!showAuthPrompt || canPlayVideo) return null

    return (
      <AuthPrompt
        videoId={videoId}
        onSignIn={() => (window.location.href = "/api/auth/signin")}
        onClose={() => setShowAuthPrompt(false)}
      />
    )
  }, [showAuthPrompt, canPlayVideo, videoId])

  // Early return for authentication prompt
  if (authPromptComponent) {
    return <div className={cn("relative w-full h-full", className)}>{authPromptComponent}</div>
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
      role="application"
      aria-label="Video player"
      tabIndex={0}
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
          onEnded={handleVideoEnd}
          onReady={handlePlayerReady}
          onDuration={(duration) => {
            setVideoDuration(duration)
            setIsLoadingDuration(false)
          }}
          config={{
            youtube: {
              playerVars: {
                autoplay: 0,
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
                widget_referrer: typeof window !== "undefined" ? window.location.origin : "",
              },
            },
          }}
        />
      </div>

      {/* Persistent CourseAI Logo */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 opacity-70 hover:opacity-100 transition-opacity">
        <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 sm:p-1.5 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
          <span className="text-white font-bold text-xs select-none">CourseAI</span>
        </div>
      </div>

      {/* Loading overlay */}
      {(state.isLoading || state.isBuffering || isLoadingDuration) && (
        <VideoLoadingOverlay isVisible={true} message={state.isBuffering ? "Buffering..." : "Loading video..."} />
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
      {!state.playing && playerReady && canPlayVideo && !showChapterStart && !showChapterEnd && (
        <PlayButton onClick={handlePlayClick} />
      )}

      {/* Chapter Start Overlay */}
      <ChapterStartOverlay
        visible={showChapterStart}
        chapterTitle={chapterTitleRef.current}
        courseTitle={courseName}
        onComplete={handleChapterStartComplete}
        duration={10000}
        videoId={videoId}
      />

      {/* Chapter End Overlay */}
      <ChapterEndOverlay
        visible={showChapterEnd}
        chapterTitle={chapterTitleRef.current}
        nextChapterTitle={nextVideoTitle}
        hasNextChapter={!!onNextVideo}
        onNextChapter={handleNextChapter}
        onReplay={handleReplay}
        onClose={() => setShowChapterEnd(false)}
        autoAdvanceDelay={5}
        autoAdvance={state.autoPlayNext}
        onCertificateDownload={handleCertificateDownload}
        certificateState={certificateState}
        isFinalChapter={!onNextVideo}
        courseTitle={courseName}
      />

      {/* Enhanced Custom controls */}
      {canPlayVideo && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-40 transition-opacity duration-300",
            !showControlsState && !isHovering && state.playing && !showChapterStart && !showChapterEnd && "opacity-0",
          )}
          style={{
            pointerEvents:
              showControlsState || isHovering || !state.playing || showChapterStart || showChapterEnd ? "auto" : "none",
          }}
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
            autoPlayNext={state.autoPlayNext}
            onToggleAutoPlayNext={handlers.toggleAutoPlayNext}
            onPictureInPicture={handlePictureInPicture}
            isPiPSupported={isPiPSupported}
            isPiPActive={isPiPActive}
          />
        </div>
      )}

      {/* Bookmark panel */}
      {showBookmarkPanel && isAuthenticated && (
        <div className="absolute top-0 right-0 bottom-16 w-64 sm:w-72 bg-black/80 backdrop-blur-sm z-30 border-l border-white/10">
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

export default React.memo(VideoPlayer)
