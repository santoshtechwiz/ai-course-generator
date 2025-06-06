"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Bookmark, AlertCircle, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import { CourseAILogo } from "./CourseAILogo"
import KeyboardShortcutsModal from "./KeyboardShortcutsModal"

// Enhanced TypeScript interfaces
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

interface VideoPlayerState {
  playing: boolean
  volume: number
  muted: boolean
  played: number
  loaded: number
  duration: number
  playbackSpeed: number
  isBuffering: boolean
  isLoading: boolean
  isPlayerReady: boolean
  videoCompleted: boolean
  lastSavedPosition: number
  showControls: boolean
  fullscreen: boolean
  theaterMode: boolean
  showSubtitles: boolean
  showBookmarkTooltip: boolean
  playerError: boolean
  quality: string
  hasStarted: boolean
  isPictureInPicture: boolean
  showKeyboardShortcuts: boolean
}

interface ProgressState {
  played: number
  playedSeconds: number
  loaded: number
  loadedSeconds: number
}

interface YouTubeConfig {
  youtube: {
    playerVars: {
      autoplay: 0 | 1
      start?: number
      modestbranding: 1
      rel: 0
      showinfo: 0
      iv_load_policy: 3
      fs: 1
      controls: 0
      disablekb: 0
      playsinline: 1
      enablejsapi: 1
      origin: string
      cc_load_policy: 0
      widget_referrer: string
      vq?: string
      end?: number
    }
  }
}

// Utility functions
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === undefined || seconds === null) return "0:00"

  const hours: number = Math.floor(seconds / 3600)
  const minutes: number = Math.floor((seconds % 3600) / 60)
  const secs: number = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

// Error fallback component
const VideoPlayerFallback = ({
  onReload,
  error,
}: {
  onReload?: () => void
  error?: string
}) => (
  <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-xl border border-red-200 dark:border-red-800 aspect-video">
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg max-w-md mx-auto text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Video Unavailable</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
        {error ||
          "There was an error loading the video. This may be due to network issues or the video being unavailable."}
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reload Page
        </Button>
        {onReload && (
          <Button onClick={onReload} className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  </div>
)

// Main video player component
const EnhancedVideoPlayer = React.memo(
  ({
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
    // Redux state - safely access with defaults
    const dispatch = useAppDispatch()
    const autoplayEnabled = useAppSelector((state) => state.course?.autoplayEnabled ?? true)
    const playbackSettings = useAppSelector(
      (state) =>
        state.course?.playbackSettings ?? {
          volume: 0.8,
          muted: false,
          playbackSpeed: 1,
        },
    )
    const courseId = useAppSelector((state) => state.course?.currentCourseId ?? null)

    // Component state with proper initialization
    const [state, setState] = useState<VideoPlayerState>({
      playing: false,
      volume: playbackSettings?.volume ?? 0.8,
      muted: playbackSettings?.muted ?? false,
      played: 0,
      loaded: 0,
      duration: 0,
      playbackSpeed: playbackSettings?.playbackSpeed ?? 1,
      isBuffering: false,
      isLoading: false,
      isPlayerReady: false,
      videoCompleted: false,
      lastSavedPosition: 0,
      showControls: true,
      fullscreen: false,
      theaterMode: false,
      showSubtitles: false,
      showBookmarkTooltip: false,
      playerError: false,
      quality: "auto",
      hasStarted: false,
      isPictureInPicture: false,
      showKeyboardShortcuts: false,
    })

    // Performance tracking
    const [bufferHealth, setBufferHealth] = useState<number>(0)
    const [networkQuality, setNetworkQuality] = useState<"high" | "medium" | "low">("high")
    const [isInitialized, setIsInitialized] = useState<boolean>(false)

    // Refs
    const playerRef = useRef<ReactPlayer>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const progressUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const initialRenderRef = useRef<boolean>(true)
    const keyboardHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)

    // Hooks
    const { toast } = useToast()

    // Optimized YouTube configuration for smooth playback with disabled related videos
    const optimizedPlayerConfig = useMemo<YouTubeConfig>(() => {
      // Calculate start time safely
      let startTime: number | undefined = undefined
      if (initialTime && state.duration && state.duration > 0) {
        startTime = Math.floor(initialTime * state.duration)
      }

      const baseConfig: YouTubeConfig = {
        youtube: {
          playerVars: {
            autoplay: 0,
            start: startTime,
            modestbranding: 1,
            rel: 0, // Disable related videos
            showinfo: 0,
            iv_load_policy: 3,
            fs: 1,
            controls: 0,
            disablekb: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
            cc_load_policy: 0,
            widget_referrer: typeof window !== "undefined" ? window.location.href : "",
          },
        },
      }

      // Network-aware quality optimization
      if (networkQuality === "low") {
        baseConfig.youtube.playerVars.vq = "small"
      } else if (networkQuality === "medium") {
        baseConfig.youtube.playerVars.vq = "medium"
      }

      return baseConfig
    }, [initialTime, state.duration, networkQuality])

    // Handle autoplay separately in useEffect to avoid render-time state updates
    useEffect(() => {
      if (!initialRenderRef.current && state.isPlayerReady) {
        if (autoPlay || autoplayEnabled) {
          const timer = setTimeout(() => {
            setState((prev) => ({ ...prev, playing: true, hasStarted: true }))
          }, 100)
          return () => clearTimeout(timer)
        }
      }
    }, [state.isPlayerReady, autoPlay, autoplayEnabled])

    // Mark initial render complete
    useEffect(() => {
      initialRenderRef.current = false
    }, [])

    // Throttled progress update to prevent excessive API calls
    const throttledProgressUpdate = useCallback(
      (progressData: ProgressState): void => {
        if (progressUpdateTimeoutRef.current) {
          clearTimeout(progressUpdateTimeoutRef.current)
        }

        progressUpdateTimeoutRef.current = setTimeout(() => {
          if (isAuthenticated && Math.abs(progressData.played - state.lastSavedPosition) > 0.01 && state.duration > 0) {
            dispatch(
              setVideoProgress({
                videoId,
                time: progressData.played,
                playedSeconds: progressData.playedSeconds,
                duration: state.duration,
              }),
            )

            setState((prev) => ({ ...prev, lastSavedPosition: progressData.played }))

            if (onProgress) {
              onProgress(progressData.played)
            }

            if (courseId) {
              dispatch(setResumePoint({ courseId, resumePoint: progressData.played }))
              dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }))
            }
          }
        }, 500)
      },
      [videoId, state.lastSavedPosition, state.duration, courseId, isAuthenticated, dispatch, onProgress],
    )

    // Enhanced keyboard shortcuts with performance optimization
    const createKeyboardHandler = useCallback(() => {
      return (e: KeyboardEvent): void => {
        const target = e.target as HTMLElement
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
          return
        }

        // Prevent default for all our handled keys
        const handledKeys = [
          " ",
          "k",
          "ArrowLeft",
          "j",
          "ArrowRight",
          "l",
          "m",
          "f",
          "t",
          "ArrowUp",
          "ArrowDown",
          "p",
          "?",
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ]

        if (handledKeys.includes(e.key)) {
          e.preventDefault()
        }

        switch (e.key) {
          case " ":
          case "k":
            handlePlayPause()
            break
          case "ArrowLeft":
          case "j":
            handleSkip(-10)
            break
          case "ArrowRight":
          case "l":
            handleSkip(10)
            break
          case "m":
            handleMute()
            break
          case "f":
            handleFullscreenToggle()
            break
          case "t":
            handleTheaterModeToggle()
            break
          case "p":
            handlePictureInPictureToggle()
            break
          case "ArrowUp":
            if (e.shiftKey) {
              handleSkip(60) // Skip 1 minute with Shift+Up
            } else {
              handleVolumeChange(Math.min(1, state.volume + 0.1))
            }
            break
          case "ArrowDown":
            if (e.shiftKey) {
              handleSkip(-60) // Skip back 1 minute with Shift+Down
            } else {
              handleVolumeChange(Math.max(0, state.volume - 0.1))
            }
            break
          case "?":
            setState((prev) => ({ ...prev, showKeyboardShortcuts: !prev.showKeyboardShortcuts }))
            break
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            const percentage: number = Number.parseInt(e.key) / 10
            if (playerRef.current) {
              playerRef.current.seekTo(percentage)
            }
            break
        }
      }
    }, [state.volume])

    // Setup keyboard event listeners with cleanup
    useEffect(() => {
      // Remove previous handler if it exists
      if (keyboardHandlerRef.current) {
        window.removeEventListener("keydown", keyboardHandlerRef.current)
      }

      // Create and store new handler
      keyboardHandlerRef.current = createKeyboardHandler()
      window.addEventListener("keydown", keyboardHandlerRef.current, { passive: false })

      return () => {
        if (keyboardHandlerRef.current) {
          window.removeEventListener("keydown", keyboardHandlerRef.current)
        }
      }
    }, [createKeyboardHandler])

    // Play/Pause handler
    const handlePlayPause = useCallback((): void => {
      setState((prev) => ({ ...prev, playing: !prev.playing }))
    }, [])

    // Skip function with proper error handling
    const handleSkip = useCallback(
      (seconds: number): void => {
        if (!playerRef.current || !state.duration || state.duration <= 0) return

        const currentTime: number = playerRef.current.getCurrentTime() || 0
        const newTime: number = currentTime + seconds
        const newPosition: number = Math.max(0, Math.min(newTime / state.duration, 0.999))

        playerRef.current.seekTo(newPosition)
        setState((prev) => ({ ...prev, played: newPosition }))

        if (isAuthenticated) {
          setTimeout(() => {
            dispatch(
              setVideoProgress({
                videoId,
                time: newPosition,
                playedSeconds: newTime,
                duration: state.duration,
              }),
            )
          }, 0)
        }
      },
      [state.duration, videoId, dispatch, isAuthenticated],
    )

    // Mute handler
    const handleMute = useCallback((): void => {
      setState((prev) => {
        const newMutedState: boolean = !prev.muted

        setTimeout(() => {
          dispatch(
            setPlaybackSettings({
              ...playbackSettings,
              muted: newMutedState,
            }),
          )
        }, 0)

        return { ...prev, muted: newMutedState }
      })
    }, [dispatch, playbackSettings])

    // Volume change handler
    const handleVolumeChange = useCallback(
      (newVolume: number): void => {
        const clampedVolume: number = Math.max(0, Math.min(1, newVolume))
        setState((prev) => ({
          ...prev,
          volume: clampedVolume,
          muted: clampedVolume === 0,
        }))

        setTimeout(() => {
          dispatch(
            setPlaybackSettings({
              ...playbackSettings,
              volume: clampedVolume,
              muted: clampedVolume === 0,
            }),
          )
        }, 0)
      },
      [dispatch, playbackSettings],
    )

    // Enhanced fullscreen toggle with better error handling
    const handleFullscreenToggle = useCallback((): void => {
      if (typeof document === "undefined") return

      try {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      } catch (err) {
        console.error("Fullscreen error:", err)
        if (toast) {
          toast({
            title: "Fullscreen Error",
            description: "Unable to toggle fullscreen mode.",
            variant: "destructive",
          })
        }
      }
    }, [toast])

    // Enhanced theater mode toggle with smooth transitions
    const handleTheaterModeToggle = useCallback((): void => {
      setState((prev) => {
        const newTheaterMode = !prev.theaterMode

        // Add/remove theater mode class to body for better styling control
        if (typeof document !== "undefined") {
          if (newTheaterMode) {
            document.body.classList.add("theater-mode")
            document.body.style.overflow = "hidden"
          } else {
            document.body.classList.remove("theater-mode")
            document.body.style.overflow = ""
          }
        }

        return { ...prev, theaterMode: newTheaterMode }
      })
    }, [])

    // Enhanced Picture-in-Picture toggle with better browser support
    const handlePictureInPictureToggle = useCallback(async (): Promise<void> => {
      try {
        if (!playerRef.current) return

        // Check if PiP is supported
        if (!document.pictureInPictureEnabled) {
          if (toast) {
            toast({
              title: "Feature not supported",
              description: "Picture-in-picture mode is not supported in your browser.",
              variant: "destructive",
            })
          }
          return
        }

        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
          setState((prev) => ({ ...prev, isPictureInPicture: false }))
        } else {
          const internalPlayer = playerRef.current.getInternalPlayer()

          // For YouTube player, we need to get the actual video element
          if (internalPlayer && typeof internalPlayer.getIframe === "function") {
            const iframe = internalPlayer.getIframe()
            const videoElement = iframe?.contentDocument?.querySelector("video")

            if (videoElement && typeof videoElement.requestPictureInPicture === "function") {
              await videoElement.requestPictureInPicture()
              setState((prev) => ({ ...prev, isPictureInPicture: true }))
            } else {
              throw new Error("Video element not accessible for PiP")
            }
          } else if (internalPlayer && typeof internalPlayer.requestPictureInPicture === "function") {
            await internalPlayer.requestPictureInPicture()
            setState((prev) => ({ ...prev, isPictureInPicture: true }))
          } else {
            throw new Error("PiP not available for this video type")
          }
        }
      } catch (error) {
        console.error("Picture-in-Picture error:", error)
        if (toast) {
          toast({
            title: "Picture-in-Picture Error",
            description: "Unable to toggle picture-in-picture mode.",
            variant: "destructive",
          })
        }
      }
    }, [toast])

    // Player ready handler
    const handlePlayerReady = useCallback((): void => {
      setIsInitialized(true)
      setState((prev) => ({
        ...prev,
        isPlayerReady: true,
        isLoading: false,
      }))
    }, [])

    // Enhanced progress handler
    const handleProgress = useCallback(
      (progressState: ProgressState): void => {
        setState((prev) => ({
          ...prev,
          played: progressState.played,
          loaded: progressState.loaded,
        }))

        const newBufferHealth: number = (progressState.loaded - progressState.played) * 100
        setBufferHealth(newBufferHealth)

        if (newBufferHealth < 5 && state.playing && state.hasStarted) {
          setState((prev) => ({ ...prev, isBuffering: true }))
        } else if (newBufferHealth > 15) {
          setState((prev) => ({ ...prev, isBuffering: false }))
        }

        throttledProgressUpdate(progressState)
      },
      [state.playing, state.hasStarted, throttledProgressUpdate],
    )

    // Seek change handler
    const handleSeekChange = useCallback(
      (newPlayed: number): void => {
        const clampedPosition: number = Math.max(0, Math.min(1, newPlayed))
        setState((prev) => ({ ...prev, played: clampedPosition }))

        if (playerRef.current) {
          playerRef.current.seekTo(clampedPosition)
        }

        if (seekTimeoutRef.current) {
          clearTimeout(seekTimeoutRef.current)
        }

        if (isAuthenticated && state.duration > 0) {
          const newPlayedSeconds: number = clampedPosition * state.duration
          setTimeout(() => {
            dispatch(
              setVideoProgress({
                videoId,
                time: clampedPosition,
                playedSeconds: newPlayedSeconds,
                duration: state.duration,
              }),
            )
          }, 0)
        }
      },
      [videoId, dispatch, state.duration, isAuthenticated],
    )

    // Video end handler
    const handleVideoEnd = useCallback((): void => {
      setState((prev) => ({ ...prev, playing: false, videoCompleted: true }))

      if (isAuthenticated && state.duration > 0) {
        setTimeout(() => {
          dispatch(
            setVideoProgress({
              videoId,
              time: 1.0,
              playedSeconds: state.duration,
              duration: state.duration,
            }),
          )
        }, 0)
      }

      if (onChapterComplete) {
        setTimeout(() => {
          onChapterComplete()
        }, 0)
      }

      setTimeout(() => {
        onEnded()
      }, 0)
    }, [videoId, dispatch, state.duration, onEnded, onChapterComplete, isAuthenticated])

    // Error handler
    const handlePlayerError = useCallback(
      (error: any): void => {
        console.error("[EnhancedVideoPlayer] Player error:", error)
        setState((prev) => ({ ...prev, playerError: true, isLoading: false }))

        if (toast) {
          toast({
            title: "Video Error",
            description: "Unable to load video. Please try again.",
            variant: "destructive",
          })
        }
      },
      [toast],
    )

    // Reset player state
    const resetPlayerState = useCallback((): void => {
      setState((prev) => ({
        ...prev,
        playerError: false,
        isLoading: false,
        isPlayerReady: false,
        hasStarted: false,
      }))
      setIsInitialized(false)
    }, [])

    // Auto-hide controls with smooth animation
    useEffect(() => {
      const handleMouseActivity = (): void => {
        setState((prev) => ({ ...prev, showControls: true }))

        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }

        if (state.playing) {
          controlsTimeoutRef.current = setTimeout(() => {
            setState((prev) => ({ ...prev, showControls: false }))
          }, 3000)
        }
      }

      const handleKeyboardActivity = (e: KeyboardEvent): void => {
        const target = e.target as HTMLElement
        if (!["INPUT", "TEXTAREA"].includes(target?.tagName || "")) {
          handleMouseActivity()
        }
      }

      document.addEventListener("mousemove", handleMouseActivity, { passive: true })
      document.addEventListener("click", handleMouseActivity, { passive: true })
      document.addEventListener("keydown", handleKeyboardActivity, { passive: true })

      return () => {
        document.removeEventListener("mousemove", handleMouseActivity)
        document.removeEventListener("click", handleMouseActivity)
        document.removeEventListener("keydown", handleKeyboardActivity)
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }
      }
    }, [state.playing])

    // Handle fullscreen changes
    useEffect(() => {
      const handleFullscreenChange = (): void => {
        setState((prev) => ({ ...prev, fullscreen: !!document.fullscreenElement }))
      }

      document.addEventListener("fullscreenchange", handleFullscreenChange)
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    // Handle Picture-in-Picture changes
    useEffect(() => {
      const handlePiPChange = (): void => {
        setState((prev) => ({ ...prev, isPictureInPicture: !!document.pictureInPictureElement }))
      }

      document.addEventListener("enterpictureinpicture", handlePiPChange)
      document.addEventListener("leavepictureinpicture", handlePiPChange)

      return () => {
        document.removeEventListener("enterpictureinpicture", handlePiPChange)
        document.removeEventListener("leavepictureinpicture", handlePiPChange)
      }
    }, [])

    // Network quality detection
    useEffect(() => {
      if (typeof navigator !== "undefined" && navigator.connection) {
        const connection = navigator.connection
        const updateNetworkInfo = (): void => {
          const effectiveType: string = connection.effectiveType || "4g"
          if (effectiveType === "2g" || effectiveType === "slow-2g") {
            setNetworkQuality("low")
          } else if (effectiveType === "3g") {
            setNetworkQuality("medium")
          } else {
            setNetworkQuality("high")
          }
        }

        connection.addEventListener("change", updateNetworkInfo)
        updateNetworkInfo()

        return () => {
          connection.removeEventListener("change", updateNetworkInfo)
        }
      }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        // Clean up theater mode on unmount
        if (typeof document !== "undefined") {
          document.body.classList.remove("theater-mode")
          document.body.style.overflow = ""
        }

        // Clear timeouts
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }
        if (seekTimeoutRef.current) {
          clearTimeout(seekTimeoutRef.current)
        }
        if (progressUpdateTimeoutRef.current) {
          clearTimeout(progressUpdateTimeoutRef.current)
        }
      }
    }, [])

    // Handle bookmark addition
    const handleAddBookmark = useCallback(() => {
      if (!playerRef.current) return

      const currentTime: number = playerRef.current.getCurrentTime()

      setTimeout(() => {
        dispatch(addBookmark({ videoId, time: currentTime }))

        if (onBookmark) {
          onBookmark(currentTime)
        }
      }, 0)

      setState((prev) => ({ ...prev, showBookmarkTooltip: true }))
      setTimeout(() => {
        setState((prev) => ({ ...prev, showBookmarkTooltip: false }))
      }, 2000)

      if (toast) {
        toast({
          title: "Bookmark Added",
          description: `Bookmark added at ${formatTime(currentTime)}`,
          duration: 3000,
        })
      }
    }, [videoId, dispatch, onBookmark, toast])

    return (
      <>
        <div
          ref={containerRef}
          className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl group transition-all duration-500 ${
            state.theaterMode ? "fixed top-0 left-0 w-full h-full z-50 aspect-auto rounded-none" : ""
          }`}
          onMouseEnter={() => setState((prev) => ({ ...prev, showControls: true }))}
          onMouseLeave={() => state.playing && setState((prev) => ({ ...prev, showControls: false }))}
          onClick={() => setState((prev) => ({ ...prev, showControls: true }))}
        >
          {/* Video Player */}
          {!state.playerError && (
            <ReactPlayer
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${videoId}`}
              width="100%"
              height="100%"
              playing={state.playing}
              volume={state.volume}
              muted={state.muted}
              onReady={handlePlayerReady}
              onPlay={() => setState((prev) => ({ ...prev, isPlayerReady: true, hasStarted: true }))}
              onStart={() => setState((prev) => ({ ...prev, hasStarted: true }))}
              onProgress={handleProgress}
              onDuration={(duration: number) => setState((prev) => ({ ...prev, duration }))}
              onEnded={handleVideoEnd}
              onBuffer={() => {}}
              onBufferEnd={() => setState((prev) => ({ ...prev, isBuffering: false }))}
              onError={handlePlayerError}
              onSeek={() => {}}
              progressInterval={1000}
              playbackRate={state.playbackSpeed}
              style={{ backgroundColor: "transparent" }}
              config={optimizedPlayerConfig}
            />
          )}

          {/* Error State */}
          {state.playerError && (
            <VideoPlayerFallback onReload={resetPlayerState} error="This video is currently unavailable" />
          )}

          {/* CourseAI Logo Overlay */}
          <CourseAILogo
            show={state.isPlayerReady && !state.playerError}
            theaterMode={state.theaterMode}
            showControls={state.showControls}
          />

          {/* Enhanced Video Controls */}
          <VideoControls
            show={state.showControls}
            playing={state.playing}
            muted={state.muted}
            volume={state.volume}
            played={state.played}
            loaded={state.loaded}
            duration={state.duration || 0}
            fullscreen={state.fullscreen}
            playbackSpeed={state.playbackSpeed}
            autoplayNext={autoplayEnabled}
            bookmarks={bookmarks || []}
            nextVideoId={nextVideoId}
            theaterMode={state.theaterMode}
            showSubtitles={state.showSubtitles}
            quality={state.quality}
            bufferHealth={bufferHealth}
            isPictureInPicture={state.isPictureInPicture}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
            onMute={handleMute}
            onVolumeChange={handleVolumeChange}
            onFullscreenToggle={handleFullscreenToggle}
            onNextVideo={() => {
              if (nextVideoId) {
                setTimeout(() => {
                  onEnded()
                }, 0)
              }
            }}
            onSeekChange={handleSeekChange}
            onPlaybackSpeedChange={(speed: number) => setState((prev) => ({ ...prev, playbackSpeed: speed }))}
            onAutoplayToggle={() => {
              setTimeout(() => {
                dispatch(setAutoplayEnabled(!autoplayEnabled))
              }, 0)
            }}
            onSeekToBookmark={(time: number) => {
              if (playerRef.current && state.duration && state.duration > 0) {
                const position: number = time / state.duration
                playerRef.current.seekTo(position)
                setState((prev) => ({ ...prev, played: position }))
              }
            }}
            onAddBookmark={handleAddBookmark}
            onPictureInPicture={handlePictureInPictureToggle}
            onTheaterMode={handleTheaterModeToggle}
            onToggleSubtitles={() => setState((prev) => ({ ...prev, showSubtitles: !prev.showSubtitles }))}
            onShowKeyboardShortcuts={() => setState((prev) => ({ ...prev, showKeyboardShortcuts: true }))}
            formatTime={formatTime}
          />

          {/* Theater Mode Indicator */}
          <AnimatePresence>
            {state.theaterMode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-6 bg-black/90 text-white px-4 py-2 rounded-lg text-sm z-50 backdrop-blur-sm border border-white/20"
              >
                <span className="font-medium">Theater Mode</span>
                <span className="text-white/70 ml-2">• Press T to exit</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Picture-in-Picture Indicator */}
          <AnimatePresence>
            {state.isPictureInPicture && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 right-6 bg-black/90 text-white px-4 py-2 rounded-lg text-sm z-50 backdrop-blur-sm border border-white/20"
              >
                <span className="font-medium">Picture-in-Picture</span>
                <span className="text-white/70 ml-2">• Press P to exit</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bookmark Tooltip */}
          <AnimatePresence>
            {state.showBookmarkTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute top-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg text-sm z-50 flex items-center gap-2 shadow-lg"
              >
                <Bookmark className="h-4 w-4" />
                <span className="font-medium">Bookmark added!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard Shortcuts Modal */}
        {state.showKeyboardShortcuts && (
          <KeyboardShortcutsModal onClose={() => setState((prev) => ({ ...prev, showKeyboardShortcuts: false }))} />
        )}
      </>
    )
  },
)

EnhancedVideoPlayer.displayName = "EnhancedVideoPlayer"

export default EnhancedVideoPlayer
