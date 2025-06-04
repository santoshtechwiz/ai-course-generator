"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VideoControls } from "./VideoControls"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import {
  setVideoProgress,
  setAutoplayEnabled,
  addBookmark,
  setPlaybackSettings,
  setResumePoint,
  setLastPlayedAt,
} from "@/store/slices/courseSlice"
import { Debug } from "./Debug"
import { cn } from "@/lib/utils"
import ReactPlayer from "react-player" // Declare ReactPlayer variable

interface VideoPlayerProps {
  videoId: string
  onEnded: () => void
  autoPlay?: boolean
  onProgress?: (progress: number) => void
  initialTime?: number
  isLastVideo?: boolean
  onVideoSelect: (videoId: string) => void
  courseName: string
  nextVideoId?: string
  onBookmark?: (time: number) => void
  bookmarks?: number[]
  isAuthenticated?: boolean
  onChapterComplete?: () => void
  playerConfig?: {
    showRelatedVideos?: boolean
    rememberPosition?: boolean
    rememberMute?: boolean
    showCertificateButton?: boolean
  }
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

const VideoPlayerFallback = ({ onReload }: { onReload?: () => void }) => (
  <div className="flex flex-col items-center justify-center w-full h-full bg-background rounded-lg border border-border aspect-video">
    <div className="text-destructive mb-2">Unable to load video player</div>
    <p className="text-muted-foreground mb-6 text-center max-w-sm">
      There was an error loading the video. This may be due to network issues or the video being unavailable.
    </p>
    <div className="flex gap-4">
      <Button variant="outline" onClick={() => window.location.reload()}>
        Reload Page
      </Button>
      {onReload && (
        <Button variant="default" onClick={onReload}>
          Try Again
        </Button>
      )}
    </div>
  </div>
)

const EnhancedVideoPlayer = ({
  videoId,
  onEnded,
  autoPlay = false,
  onProgress,
  initialTime = 0,
  isLastVideo = false,
  onVideoSelect,
  courseName,
  nextVideoId,
  onBookmark,
  bookmarks = [],
  isAuthenticated = false,
  onChapterComplete,
  playerConfig = {
    showRelatedVideos: false,
    rememberPosition: true,
    rememberMute: true,
    showCertificateButton: false,
  },
}: VideoPlayerProps) => {
  const dispatch = useAppDispatch()
  const autoplayEnabled = useAppSelector((state) => state.course.autoplayEnabled)
  const playbackSettings = useAppSelector((state) => state.course.playbackSettings)
  const courseId = useAppSelector((state) => state.course.currentCourseId)

  const [playing, setPlaying] = useState(false) // Start as false and enable in onReady
  const [volume, setVolume] = useState(playbackSettings.volume ?? 0.8)
  const [muted, setMuted] = useState(playbackSettings.muted ?? false)
  const [played, setPlayed] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(playbackSettings.playbackSpeed ?? 1)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false)
  const [showCompletionToast, setShowCompletionToast] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [lastSavedPosition, setLastSavedPosition] = useState(0)
  const [isLoading, setIsLoading] = useState(true) // Add a new state for player loading
  const [isPlayerReady, setIsPlayerReady] = useState(false) // Fix: Add proper loading state handling
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [playerError, setPlayerError] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const playerLoaded = useRef<boolean>(false)
  const videoIdRef = useRef<string>("")
  const didSetInitialVideo = useRef<boolean>(false)

  // Keyboard shortcuts for better UX
  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev)
  }, [])

  const handleSkip = useCallback(
    (seconds: number) => {
      const currentTime = playerRef.current?.getCurrentTime() || 0
      const newTime = currentTime + seconds
      const newPosition = Math.max(0, Math.min(newTime / duration, 0.999))
      playerRef.current?.seekTo(newPosition)
      setPlayed(newPosition)

      // Update progress in Redux
      dispatch(
        setVideoProgress({
          videoId,
          time: newPosition,
          playedSeconds: newTime,
          duration: duration,
        }),
      )
      setLastSavedPosition(newPosition)
    },
    [duration, videoId, dispatch],
  )

  const handleMute = useCallback(() => {
    setMuted((prev) => {
      const newMutedState = !prev
      // Update Redux state
      dispatch(
        setPlaybackSettings({
          ...playbackSettings,
          muted: newMutedState,
        }),
      )
      return newMutedState
    })
  }, [dispatch, playbackSettings])

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume)
      setMuted(newVolume === 0)
      // Update Redux state
      dispatch(
        setPlaybackSettings({
          ...playbackSettings,
          volume: newVolume,
          muted: newVolume === 0,
        }),
      )
    },
    [dispatch, playbackSettings],
  )

  const handleFullscreenToggle = useCallback(() => {
    if (typeof document !== "undefined") {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      } else {
        document.exitFullscreen().catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`)
        })
      }
    }
  }, [])

  const handleNextVideo = useCallback(() => {
    if (nextVideoId) {
      // Save current position in Redux
      dispatch(
        setVideoProgress({
          videoId,
          time: played,
          playedSeconds: played * duration,
          duration: duration,
        }),
      )
      onEnded()
    }
  }, [nextVideoId, onEnded, played, videoId, dispatch, duration])

  const handleAddBookmark = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime()

      // Add bookmark to Redux
      dispatch(
        addBookmark({
          videoId,
          time: currentTime,
        }),
      )

      // Call the prop callback if available
      if (onBookmark) {
        onBookmark(currentTime)
      }

      setShowBookmarkTooltip(true)

      toast({
        title: "Bookmark Added",
        description: `Bookmark added at ${formatTime(currentTime)}`,
        duration: 3000,
      })

      setTimeout(() => {
        setShowBookmarkTooltip(false)
      }, 2000)
    }
  }, [onBookmark, toast, videoId, dispatch])

  const handleSeekChange = useCallback(
    (newPlayed: number) => {
      setPlayed(newPlayed)
      playerRef.current?.seekTo(newPlayed)

      // Update progress in Redux
      const newPlayedSeconds = newPlayed * duration
      dispatch(
        setVideoProgress({
          videoId,
          time: newPlayed,
          playedSeconds: newPlayedSeconds,
          duration: duration,
        }),
      )
      setLastSavedPosition(newPlayed)

      // Ensure time display updates immediately on mobile
      if (onProgress) {
        onProgress(newPlayed)
      }

      if (courseId) {
        dispatch(setResumePoint({ courseId, resumePoint: newPlayed }))
        dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }))
      }
    },
    [videoId, onProgress, dispatch, duration, courseId],
  )

  const handlePlaybackSpeedChange = useCallback(
    (newSpeed: number) => {
      setPlaybackSpeed(newSpeed)
      // Update Redux state
      dispatch(
        setPlaybackSettings({
          ...playbackSettings,
          playbackSpeed: newSpeed,
        }),
      )
    },
    [dispatch, playbackSettings],
  )

  const handleAutoplayToggle = useCallback(() => {
    // Update autoplay in Redux instead of local state
    dispatch(setAutoplayEnabled(!autoplayEnabled))

    toast({
      title: !autoplayEnabled ? "Autoplay enabled" : "Autoplay disabled",
      description: !autoplayEnabled ? "Videos will play automatically" : "Videos will not play automatically",
      duration: 2000,
    })
  }, [autoplayEnabled, dispatch, toast])

  const handleSeekToBookmark = useCallback(
    (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time / duration)
        setPlayed(time / duration)

        toast({
          title: "Jumped to Bookmark",
          description: `Playback resumed at ${formatTime(time)}`,
          duration: 2000,
        })
      }
    },
    [duration, toast],
  )

  // Fix: Implement proper onReady handler to ensure video plays
  const handlePlayerReady = useCallback(() => {
    // Mark player as loaded
    playerLoaded.current = true
    setIsPlayerReady(true)
    setIsLoading(false)

    console.debug("[EnhancedVideoPlayer] onReady fired - autoPlay:", autoPlay, "autoplayEnabled:", autoplayEnabled)

    // Start playing if autoPlay or autoplayEnabled is true
    if (autoPlay || autoplayEnabled) {
      console.debug("[EnhancedVideoPlayer] Setting playing to true")
      setPlaying(true)
    }
  }, [autoPlay, autoplayEnabled])

  // Add play event handler for additional safety
  const handlePlay = useCallback(() => {
    // Also mark video as ready when it starts playing (double safety)
    setIsPlayerReady(true)
    setIsLoading(false)
  }, [])

  // Handle player errors with better error handling and recovery
  const handlePlayerError = useCallback(
    (error: any) => {
      try {
        // Log error details for debugging
        console.debug("[EnhancedVideoPlayer] Player error:", error)

        // Set error state to show fallback UI if needed
        setPlayerError(true)

        // Update debug info - ensure we're not mutating existing state
        setDebugInfo((prev) => ({
          ...prev,
          playerState: "error",
          lastEvent: "error",
          errors: [
            ...prev.errors,
            typeof error === "string" ? error : error?.message || JSON.stringify(error) || "Unknown player error",
          ],
        }))

        // Try to recover from some known error types
        if (playerRef.current) {
          const internalPlayer = playerRef.current.getInternalPlayer()
          if (internalPlayer) {
            try {
              // For YouTube player, try to reload the video
              if (internalPlayer.loadVideoById) {
                // Add a small delay before attempting to reload
                setTimeout(() => {
                  try {
                    internalPlayer.loadVideoById(videoId, initialTime || 0)
                    setPlayerError(false)
                  } catch (reloadError) {
                    console.debug("[EnhancedVideoPlayer] Failed to reload video:", reloadError)
                  }
                }, 1000)
              }
            } catch (e) {
              console.debug("[EnhancedVideoPlayer] Recovery attempt failed:", e)
            }
          }
        }
      } catch (handlerError) {
        // Catch any errors in the error handler itself to prevent recursive errors
        console.error("[EnhancedVideoPlayer] Error in error handler:", handlerError)
      }
    },
    [videoId, initialTime],
  )

  // Fix for React object errors - ensure we're not passing/returning invalid objects
  const resetPlayerState = useCallback(() => {
    setPlayerError(false)
    setIsLoading(true)
    setIsPlayerReady(false)
    setDebugInfo({
      playerState: "reloading",
      lastEvent: "reset",
      errors: [],
    })
  }, [])

  // Add this function to handle picture-in-picture mode
  const handlePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (playerRef.current) {
        const videoElement = playerRef.current.getInternalPlayer()
        if (videoElement && typeof videoElement.requestPictureInPicture === "function") {
          await videoElement.requestPictureInPicture()
        }
      }
    } catch (error) {
      console.error("Picture-in-picture error:", error)
      toast({
        title: "Feature not supported",
        description: "Picture-in-picture mode is not supported in your browser.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Add this state for theater mode
  const [theaterMode, setTheaterMode] = useState(false)

  // Add this function to toggle theater mode
  const handleTheaterMode = useCallback(() => {
    setTheaterMode((prev) => !prev)
  }, [])

  // Add this state for subtitle display
  const [showSubtitles, setShowSubtitles] = useState(false)

  // Add this function to toggle subtitles
  const handleToggleSubtitles = useCallback(() => {
    setShowSubtitles((prev) => !prev)
    toast({
      title: showSubtitles ? "Subtitles disabled" : "Subtitles enabled",
      description: showSubtitles ? "Subtitles have been turned off" : "Subtitles have been turned on",
    })
  }, [showSubtitles, toast])

  // Debug: log autoplay state
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug("[EnhancedVideoPlayer] autoplayEnabled:", autoplayEnabled, "autoPlay:", autoPlay)
  }, [autoplayEnabled, autoPlay])

  // Update videoIdRef when videoId changes - for comparisons in effects
  useEffect(() => {
    videoIdRef.current = videoId
  }, [videoId])

  // Load global player settings from Redux on mount
  useEffect(() => {
    // Apply playback settings from Redux
    setVolume(playbackSettings.volume)
    setMuted(playbackSettings.muted)
    setPlaybackSpeed(playbackSettings.playbackSpeed)
  }, [playbackSettings])

  // On videoId change, update resume point in Redux
  useEffect(() => {
    // Reset the player loaded flag when video ID changes
    playerLoaded.current = false

    // Debug log
    console.debug("[EnhancedVideoPlayer] videoId changed:", videoId)

    // Don't auto-start playing here, wait for onReady
    setPlaying(false)
    setVideoCompleted(false)

    // Reset player state for new video
    setPlayed(0)
    setLoaded(0)

    if (courseId) {
      dispatch(setResumePoint({ courseId, resumePoint: 0 }))
      dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }))
    }
  }, [videoId, courseId, dispatch])

  // Seek to initial time if provided
  useEffect(() => {
    if (!didSetInitialVideo.current && initialTime > 0 && playerRef.current) {
      console.debug("[EnhancedVideoPlayer] Seeking to initialTime:", initialTime)
      playerRef.current.seekTo(initialTime)
      didSetInitialVideo.current = true
    }
  }, [initialTime])

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }

    if (typeof document !== "undefined") {
      document.addEventListener("fullscreenchange", handleFullscreenChange)
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      if (playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
        }, 3000)
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("mousemove", handleMouseMove)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }
      }
    }
  }, [playing])

  // 1. Define handleVideoEnd first, before any hooks that use it
  const handleVideoEnd = useCallback(() => {
    console.debug("[EnhancedVideoPlayer] Video ended")
    setPlaying(false)
    setVideoCompleted(true)

    dispatch(
      setVideoProgress({
        videoId,
        time: 1.0,
        playedSeconds: duration,
        duration: duration,
      }),
    )

    if (onChapterComplete) {
      onChapterComplete()
    }

    setShowCompletionToast(true)
    setTimeout(() => setShowCompletionToast(false), 3000)

    onEnded()
  }, [videoId, dispatch, duration, onEnded, onChapterComplete])

  // 2. Now the useEffect can safely use handleVideoEnd
  useEffect(() => {
    if (!videoCompleted && duration > 0 && played > 0.97) {
      setVideoCompleted(true)
      handleVideoEnd()
    }
  }, [played, duration, videoCompleted, handleVideoEnd])

  // 3. Update handleProgress to use handleVideoEnd
  const handleProgress = useCallback(
    (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
      try {
        setPlayed(state.played)
        setLoaded(state.loaded)
        setDebugInfo((prev) => ({
          ...prev,
          playerState: `progress: ${Math.round(state.played * 100)}%`,
          lastEvent: "progress update",
        }))

        if (onProgress) {
          onProgress(state.played)
        }

        if (Math.abs(state.played - lastSavedPosition) > 0.01) {
          dispatch(
            setVideoProgress({
              videoId,
              time: state.played,
              playedSeconds: state.playedSeconds,
              duration: duration,
            }),
          )
          setLastSavedPosition(state.played)
        }

        if (courseId) {
          dispatch(setResumePoint({ courseId, resumePoint: state.played }))
          dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }))
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error in progress handler"
        console.error("[EnhancedVideoPlayer] Progress error:", errorMessage)
        setDebugInfo((prev) => ({
          ...prev,
          errors: [...prev.errors, errorMessage],
        }))
      }
    },
    [onProgress, videoId, lastSavedPosition, dispatch, duration, courseId],
  )

  // 2. Fixed: Initialize debug state properly
  const [debugInfo, setDebugInfo] = useState<{
    playerState: string
    lastEvent: string
    errors: string[]
  }>({
    playerState: "initial",
    lastEvent: "",
    errors: [],
  })

  // 3. Other handler functions follow
  const handleDuration = (duration: number) => setDuration(duration)

  // Buffering handlers
  const handleBuffer = () => setIsBuffering(true)
  const handleBufferEnd = () => setIsBuffering(false)

  // Add this useEffect to handle player initialization errors
  useEffect(() => {
    const handlePlayerError = () => {
      console.error("Error initializing video player.")
      setPlayerError(true) // Set error state to show fallback UI
    }

    if (typeof window !== "undefined") {
      window.addEventListener("error", handlePlayerError)
      return () => window.removeEventListener("error", handlePlayerError)
    }
  }, [])

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  useEffect(() => {
    if (!inView && playing) {
      // Only pause if we're currently playing and scroll out of view
      setPlaying(false)
    }
  }, [inView, playing])

  const getYouTubeConfig = useCallback(() => {
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Check if we're on a slow connection
    const isSlowConnection =
      navigator.connection &&
      (navigator.connection.effectiveType === "2g" ||
        navigator.connection.effectiveType === "slow-2g" ||
        navigator.connection.saveData)

    return {
      youtube: {
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          start: Math.floor((initialTime || 0) * (duration || 0)),
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
          // Optimize for mobile or slow connections
          ...(isMobile || isSlowConnection
            ? {
                vq: "medium", // Lower quality for mobile/slow connections
                hl: "en", // Set language to English
                cc_load_policy: 0, // Don't load captions by default
              }
            : {
                vq: "hd720", // Higher quality for desktop
              }),
        },
        onStateChange: (event) => {
          // Safe update of debug info with proper state management
          setDebugInfo((prev) => ({
            ...prev,
            playerState: `YouTube state: ${event.data}`,
            lastEvent: "stateChange",
          }))

          // YouTube state 1 means "playing" - ensure loader is hidden
          if (event.data === 1) {
            setIsLoading(false)
            setIsPlayerReady(true)
          }
          // YouTube state 3 means "buffering" - show loading indicator
          if (event.data === 3) {
            setIsBuffering(true)
          }
        },
        // Add YouTube-specific error handling with proper parameter typing
        onError: (event: { data: number }) => {
          handlePlayerError(`YouTube Error Code: ${event.data}`)
        },
      },
    }
  }, [autoPlay, initialTime, duration, handlePlayerError])

  return (
    <div
      ref={(el) => {
        containerRef.current = el
        ref(el)
      }}
      className={cn(
        "relative w-full aspect-video rounded-lg overflow-hidden bg-background border border-border shadow-sm group",
        theaterMode && "fixed top-0 left-0 w-full h-full z-50 aspect-auto rounded-none",
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={() => setShowControls(true)}
    >
      {playerError ? (
        <VideoPlayerFallback onReload={resetPlayerState} />
      ) : (
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          onReady={handlePlayerReady}
          onPlay={handlePlay}
          onStart={() => setIsLoading(false)}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleVideoEnd}
          onBuffer={() => setIsBuffering(true)}
          onBufferEnd={() => setIsBuffering(false)}
          onError={handlePlayerError}
          progressInterval={1000}
          playbackRate={playbackSpeed}
          style={{ backgroundColor: "transparent" }}
          config={getYouTubeConfig()}
        />
      )}

      {/* Fix loading indicator to only show when actually loading or buffering */}
      {(!isPlayerReady || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Video Controls - Ensure we pass stable non-mutating functions */}
      <VideoControls
        show={showControls}
        playing={playing}
        muted={muted}
        volume={volume}
        played={played}
        loaded={loaded}
        duration={duration}
        fullscreen={fullscreen}
        playbackSpeed={playbackSpeed}
        autoplayNext={autoplayEnabled}
        bookmarks={bookmarks}
        nextVideoId={nextVideoId}
        onPlayPause={handlePlayPause}
        onSkip={handleSkip}
        onMute={handleMute}
        onVolumeChange={handleVolumeChange}
        onFullscreenToggle={handleFullscreenToggle}
        onNextVideo={handleNextVideo}
        onSeekChange={handleSeekChange}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        onAutoplayToggle={handleAutoplayToggle}
        onSeekToBookmark={handleSeekToBookmark}
        onAddBookmark={handleAddBookmark}
        formatTime={formatTime}
      />

      {/* Debug component - ensure we pass properly formatted info object */}
      <Debug
        info={{
          videoId: videoId || "",
          playing: !!playing,
          duration: duration || 0,
          played: Math.round((played || 0) * 100),
          loaded: Math.round((loaded || 0) * 100),
          playerState: debugInfo.playerState || "unknown",
          lastEvent: debugInfo.lastEvent || "none",
          errors: Array.isArray(debugInfo.errors) ? debugInfo.errors : [],
        }}
        onReset={resetPlayerState}
      />
    </div>
  )
}

// Export with proper memo and displayName for better debugging
const MemoizedEnhancedVideoPlayer = React.memo(EnhancedVideoPlayer)
MemoizedEnhancedVideoPlayer.displayName = "EnhancedVideoPlayer"
export default MemoizedEnhancedVideoPlayer
