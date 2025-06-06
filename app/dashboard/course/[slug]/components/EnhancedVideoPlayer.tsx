"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Bookmark, AlertCircle, RotateCcw, PictureInPicture2, Award } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { VideoControls } from "./VideoControls"
import { CourseAILogo } from "./CourseAILogo"
import KeyboardShortcutsModal from "./KeyboardShortcutsModal"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import {
  setVideoProgress,
  setAutoplayEnabled,
  addBookmark,
  setPlaybackSettings,
  setResumePoint,
  setLastPlayedAt,
  setCourseCompletionStatus,
} from "@/store/slices/courseSlice"
import { TooltipProvider } from "@/components/ui/tooltip"

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
  onCourseComplete?: () => void
  onTheaterModeChange?: (isTheaterMode: boolean) => void
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
  showEndingLogo: boolean
  autoplayCountdown: number
  showAutoplayPrompt: boolean
  canAutoplay: boolean
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

// Enhanced error fallback component with better UX
const VideoPlayerFallback = ({
  onReload,
  error,
}: {
  onReload?: () => void
  error?: string
}) => (
  <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 rounded-xl border border-red-200 dark:border-red-800/50 aspect-video">
    <div className="bg-background/95 backdrop-blur-sm rounded-lg p-8 shadow-xl max-w-md mx-auto text-center border">
      <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Video Unavailable</h3>
      <div className="text-muted-foreground mb-6 text-sm leading-relaxed">
        {error ||
          "There was an error loading the video. This may be due to network issues or the video being temporarily unavailable."}
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reload Page
        </Button>
        {onReload && (
          <Button onClick={onReload} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  </div>
)

// Loading overlay component
const VideoLoadingOverlay = () => (
  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <div className="text-white text-lg font-medium">Loading video player...</div>
      <div className="text-white/70 text-sm mt-2">Please wait while we prepare your content</div>
    </div>
  </div>
)

// CourseAI ending logo overlay
const EndingLogoOverlay = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm"
      >
        <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl p-8 shadow-2xl border backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">CA</span>
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CourseAI
              </div>
              <div className="text-sm text-muted-foreground">Powered by AI Learning</div>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Autoplay prompt component
const AutoplayPrompt = ({
  show,
  countdown,
  nextVideoTitle,
  onProceed,
  onCancel,
}: {
  show: boolean
  countdown: number
  nextVideoTitle?: string
  onProceed: () => void
  onCancel: () => void
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute bottom-20 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-xl z-50 max-w-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Next lesson in {countdown}s</div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>
        {nextVideoTitle && <div className="text-xs text-muted-foreground mb-3 line-clamp-2">{nextVideoTitle}</div>}
        <div className="flex gap-2">
          <Button size="sm" onClick={onProceed} className="flex-1">
            Play Now
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="mt-2 bg-muted rounded-full h-1">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-1000"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Course completion overlay
const CourseCompletionOverlay = ({
  show,
  courseName,
  onViewCertificate,
  onClose,
}: {
  show: boolean
  courseName: string
  onViewCertificate: () => void
  onClose: () => void
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-background rounded-2xl p-8 shadow-2xl border max-w-md mx-4 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <div className="text-muted-foreground mb-6">
            You've successfully completed <span className="font-medium text-foreground">{courseName}</span>
          </div>
          <div className="flex gap-3">
            <Button onClick={onViewCertificate} className="flex-1">
              View Certificate
            </Button>
            <Button variant="outline" onClick={onClose}>
              Continue
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Main video player component with enhanced UX
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
    onCourseComplete,
    onTheaterModeChange,
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
      isLoading: true, // Start with loading true
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
      showEndingLogo: false,
      autoplayCountdown: 0,
      showAutoplayPrompt: false,
      canAutoplay: true,
    })

    // Performance tracking
    const [bufferHealth, setBufferHealth] = useState<number>(0)
    const [networkQuality, setNetworkQuality] = useState<"high" | "medium" | "low">("high")
    const [isInitialized, setIsInitialized] = useState<boolean>(false)
    const [showCourseCompletion, setShowCourseCompletion] = useState<boolean>(false)

    // Refs
    const playerRef = useRef<ReactPlayer>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const progressUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const initialRenderRef = useRef<boolean>(true)
    const keyboardHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)

    // Hooks
    const { toast } = useToast()

    // Load autoplay preference from localStorage
    useEffect(() => {
      try {
        const savedAutoplay = localStorage.getItem("courseAutoplayEnabled")
        if (savedAutoplay !== null) {
          const enabled = JSON.parse(savedAutoplay)
          dispatch(setAutoplayEnabled(enabled))
        }
      } catch (error) {
        console.warn("Failed to load autoplay preference:", error)
      }
    }, [dispatch])

    // Detect autoplay capability
    useEffect(() => {
      const detectAutoplayCapability = async () => {
        try {
          const video = document.createElement("video")
          video.muted = true
          video.src =
            "data:video/mp4;base64,AAAAHGZ0eXBNUDQyAAACAEFhdGFhY2gAAAFuZXRhAAAAKG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTcuODMuMTAw"
          const playPromise = video.play()
          if (playPromise !== undefined) {
            await playPromise
            setState((prev) => ({ ...prev, canAutoplay: true }))
          }
        } catch (error) {
          setState((prev) => ({ ...prev, canAutoplay: false }))
        }
      }

      detectAutoplayCapability()
    }, [])

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
      if (!initialRenderRef.current && state.isPlayerReady && !state.isLoading) {
        if (autoPlay || autoplayEnabled) {
          const timer = setTimeout(() => {
            setState((prev) => ({ ...prev, playing: true, hasStarted: true }))
          }, 100)
          return () => clearTimeout(timer)
        }
      }
    }, [state.isPlayerReady, state.isLoading, autoPlay, autoplayEnabled])

    // Mark initial render complete
    useEffect(() => {
      initialRenderRef.current = false
    }, [])

    // Monitor video progress for ending logo and autoplay
    useEffect(() => {
      if (state.duration > 0 && state.played > 0) {
        const currentTime = state.played * state.duration
        const timeRemaining = state.duration - currentTime

        // Show ending logo in last 5 seconds
        if (timeRemaining <= 5 && timeRemaining > 0 && !state.showEndingLogo) {
          setState((prev) => ({ ...prev, showEndingLogo: true }))
        } else if (timeRemaining > 5 && state.showEndingLogo) {
          setState((prev) => ({ ...prev, showEndingLogo: false }))
        }
      }
    }, [state.played, state.duration, state.showEndingLogo])

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

    // Enhanced keyboard shortcuts with theater mode support
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
        toast({
          title: "Fullscreen Error",
          description: "Unable to toggle fullscreen mode.",
          variant: "destructive",
        })
      }
    }, [toast])

    // Enhanced theater mode toggle with proper layout integration
    const handleTheaterModeToggle = useCallback((): void => {
      setState((prev) => {
        const newTheaterMode = !prev.theaterMode

        // Notify parent component about theater mode change
        if (onTheaterModeChange) {
          onTheaterModeChange(newTheaterMode)
        }

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
    }, [onTheaterModeChange])

    // Enhanced Picture-in-Picture toggle with comprehensive error handling and user feedback
    const handlePictureInPictureToggle = useCallback(async (): Promise<void> => {
      try {
        // Check if PiP is supported by the browser
        if (!document.pictureInPictureEnabled) {
          toast({
            title: "Feature Not Supported",
            description: "Picture-in-picture mode is not supported in your browser.",
            variant: "destructive",
          })
          return
        }

        // If already in PiP mode, exit
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
          setState((prev) => ({ ...prev, isPictureInPicture: false }))
          toast({
            title: "Picture-in-Picture",
            description: "Exited picture-in-picture mode.",
          })
          return
        }

        // Ensure player is ready and has a valid reference
        if (!playerRef.current) {
          toast({
            title: "Player Not Ready",
            description: "Please wait for the video to load before using picture-in-picture.",
            variant: "destructive",
          })
          return
        }

        const internalPlayer = playerRef.current.getInternalPlayer()

        // Handle different player types (YouTube, HTML5, etc.)
        if (internalPlayer) {
          let videoElement: HTMLVideoElement | null = null

          // For YouTube player, try to access the video element through iframe
          if (typeof internalPlayer.getIframe === "function") {
            try {
              const iframe = internalPlayer.getIframe()
              if (iframe?.contentDocument) {
                videoElement = iframe.contentDocument.querySelector("video")
              }
            } catch (error) {
              console.warn("Cannot access iframe content due to CORS restrictions")
            }
          }
          // For HTML5 video players
          else if (internalPlayer instanceof HTMLVideoElement) {
            videoElement = internalPlayer
          }
          // For other player types that might have a video property
          else if (internalPlayer.video instanceof HTMLVideoElement) {
            videoElement = internalPlayer.video
          }

          // Attempt to enter PiP mode
          if (videoElement && typeof videoElement.requestPictureInPicture === "function") {
            await videoElement.requestPictureInPicture()
            setState((prev) => ({ ...prev, isPictureInPicture: true }))
            toast({
              title: "Picture-in-Picture",
              description: "Entered picture-in-picture mode. Press P to exit.",
            })
          } else {
            throw new Error("Video element not accessible for picture-in-picture")
          }
        } else {
          throw new Error("Internal player not available")
        }
      } catch (error) {
        console.error("Picture-in-Picture error:", error)

        // Provide specific error messages based on error type
        let errorMessage = "Unable to enter picture-in-picture mode."

        if (error instanceof Error) {
          if (error.message.includes("not accessible")) {
            errorMessage = "Picture-in-picture is not available for this video type."
          } else if (error.message.includes("not allowed")) {
            errorMessage = "Picture-in-picture requires user interaction. Please try clicking the video first."
          } else if (error.message.includes("not supported")) {
            errorMessage = "This video format doesn't support picture-in-picture."
          }
        }

        toast({
          title: "Picture-in-Picture Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }, [toast])

    // Player ready handler - fix loading state
    const handlePlayerReady = useCallback((): void => {
      setIsInitialized(true)
      setState((prev) => ({
        ...prev,
        isPlayerReady: true,
        isLoading: false, // Clear loading state when player is ready
      }))
    }, [])

    // Handle when video can start playing - additional loading state fix
    const handleCanPlay = useCallback((): void => {
      setState((prev) => ({
        ...prev,
        isLoading: false, // Ensure loading is cleared when video can play
      }))
    }, [])

    // Enhanced progress handler with better buffering detection
    const handleProgress = useCallback(
      (progressState: ProgressState): void => {
        setState((prev) => ({
          ...prev,
          played: progressState.played,
          loaded: progressState.loaded,
        }))

        const newBufferHealth: number = (progressState.loaded - progressState.played) * 100
        setBufferHealth(newBufferHealth)

        // Only show buffering if we're actually playing and buffer is low
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

    // Enhanced autoplay functionality
    const startAutoplaySequence = useCallback(() => {
      if (!autoplayEnabled || !nextVideoId) return

      // Check if we can autoplay
      if (state.canAutoplay) {
        // Direct autoplay
        setState((prev) => ({ ...prev, autoplayCountdown: 5, showAutoplayPrompt: true }))

        autoplayTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, showAutoplayPrompt: false, autoplayCountdown: 0 }))
          onEnded() // Proceed to next video
        }, 5000)

        // Countdown timer
        const countdownInterval = setInterval(() => {
          setState((prev) => {
            if (prev.autoplayCountdown <= 1) {
              clearInterval(countdownInterval)
              return prev
            }
            return { ...prev, autoplayCountdown: prev.autoplayCountdown - 1 }
          })
        }, 1000)
      } else {
        // Show manual prompt for autoplay
        setState((prev) => ({ ...prev, showAutoplayPrompt: true, autoplayCountdown: 10 }))
      }
    }, [autoplayEnabled, nextVideoId, state.canAutoplay, onEnded])

    // Cancel autoplay
    const cancelAutoplay = useCallback(() => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current)
      }
      setState((prev) => ({ ...prev, showAutoplayPrompt: false, autoplayCountdown: 0 }))
    }, [])

    // Proceed with autoplay manually
    const proceedAutoplay = useCallback(() => {
      cancelAutoplay()
      onEnded()
    }, [cancelAutoplay, onEnded])

    // Video end handler with autoplay and course completion logic
    const handleVideoEnd = useCallback((): void => {
      setState((prev) => ({ ...prev, playing: false, videoCompleted: true, showEndingLogo: false }))

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

      // Handle course completion for last video
      if (isLastVideo) {
        if (courseId) {
          dispatch(setCourseCompletionStatus(true))
        }

        if (onCourseComplete) {
          onCourseComplete()
        }

        setShowCourseCompletion(true)

        toast({
          title: "Course Completed!",
          description: "Congratulations on completing the course. Your certificate is ready!",
          duration: 5000,
        })
      } else if (nextVideoId && autoplayEnabled) {
        // Start autoplay sequence for next video
        startAutoplaySequence()
      } else {
        // Just end the video normally
        setTimeout(() => {
          onEnded()
        }, 0)
      }
    }, [
      videoId,
      dispatch,
      state.duration,
      onEnded,
      onChapterComplete,
      onCourseComplete,
      isAuthenticated,
      isLastVideo,
      courseId,
      nextVideoId,
      autoplayEnabled,
      startAutoplaySequence,
      toast,
    ])

    // Error handler
    const handlePlayerError = useCallback(
      (error: any): void => {
        console.error("[EnhancedVideoPlayer] Player error:", error)
        setState((prev) => ({ ...prev, playerError: true, isLoading: false }))

        toast({
          title: "Video Error",
          description: "Unable to load video. Please try again.",
          variant: "destructive",
        })
      },
      [toast],
    )

    // Reset player state
    const resetPlayerState = useCallback((): void => {
      setState((prev) => ({
        ...prev,
        playerError: false,
        isLoading: true, // Reset to loading state
        isPlayerReady: false,
        hasStarted: false,
      }))
      setIsInitialized(false)
    }, [])

    // Handle certificate view
    const handleViewCertificate = useCallback(() => {
      setShowCourseCompletion(false)
      // Navigate to certificate page or trigger certificate generation
      window.open(`/certificate/${courseId}`, "_blank")
    }, [courseId])

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

    // Handle Picture-in-Picture changes with user feedback
    useEffect(() => {
      const handlePiPEnter = (): void => {
        setState((prev) => ({ ...prev, isPictureInPicture: true }))
      }

      const handlePiPLeave = (): void => {
        setState((prev) => ({ ...prev, isPictureInPicture: false }))
      }

      document.addEventListener("enterpictureinpicture", handlePiPEnter)
      document.addEventListener("leavepictureinpicture", handlePiPLeave)

      return () => {
        document.removeEventListener("enterpictureinpicture", handlePiPEnter)
        document.removeEventListener("leavepictureinpicture", handlePiPLeave)
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
        if (autoplayTimeoutRef.current) {
          clearTimeout(autoplayTimeoutRef.current)
        }
      }
    }, [])

    // Enhanced bookmark handler with better UX feedback
    const handleAddBookmark = useCallback(() => {
      if (!playerRef.current) return

      const currentTime: number = playerRef.current.getCurrentTime()

      setTimeout(() => {
        dispatch(addBookmark({ videoId, time: currentTime }))

        if (onBookmark) {
          onBookmark(currentTime)
        }
      }, 0)

      // Show visual feedback
      setState((prev) => ({ ...prev, showBookmarkTooltip: true }))
      setTimeout(() => {
        setState((prev) => ({ ...prev, showBookmarkTooltip: false }))
      }, 2000)

      // Enhanced toast notification
      toast({
        title: "Bookmark Added",
        description: `Bookmark saved at ${formatTime(currentTime)}`,
        duration: 3000,
      })
    }, [videoId, dispatch, onBookmark, toast])

    return (
      <TooltipProvider>
        <div
          ref={containerRef}
          className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl group transition-all duration-300 ease-in-out ${
            state.theaterMode ? "fixed top-0 left-0 w-full h-full z-50 aspect-auto rounded-none" : ""
          }`}
          onMouseEnter={() => setState((prev) => ({ ...prev, showControls: true }))}
          onMouseLeave={() => state.playing && setState((prev) => ({ ...prev, showControls: false }))}
          onClick={() => setState((prev) => ({ ...prev, showControls: true }))}
        >
          {/* Loading Overlay */}
          {state.isLoading && !state.playerError && <VideoLoadingOverlay />}

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
              onLoadedMetadata={handleCanPlay}
              onCanPlay={handleCanPlay}
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
            show={state.isPlayerReady && !state.playerError && !state.isLoading}
            theaterMode={state.theaterMode}
            showControls={state.showControls}
          />

          {/* Ending Logo Overlay */}
          <EndingLogoOverlay show={state.showEndingLogo} />

          {/* Enhanced Video Controls with tooltips */}
          <VideoControls
            show={state.showControls && !state.isLoading}
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
              const newAutoplayState = !autoplayEnabled
              dispatch(setAutoplayEnabled(newAutoplayState))
              // Save to localStorage
              try {
                localStorage.setItem("courseAutoplayEnabled", JSON.stringify(newAutoplayState))
              } catch (error) {
                console.warn("Failed to save autoplay preference:", error)
              }
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
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute top-6 left-6 bg-black/90 text-white px-4 py-2 rounded-lg text-sm z-50 backdrop-blur-sm border border-white/20"
              >
                <span className="font-medium">Theater Mode</span>
                <span className="text-white/70 ml-2">• Press T to exit</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Picture-in-Picture Indicator with enhanced styling */}
          <AnimatePresence>
            {state.isPictureInPicture && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute top-6 right-6 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm z-50 backdrop-blur-sm border border-primary/20 flex items-center gap-2"
              >
                <PictureInPicture2 className="h-4 w-4" />
                <span className="font-medium">Picture-in-Picture</span>
                <span className="text-primary-foreground/70 ml-1">• Press P to exit</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Bookmark Tooltip */}
          <AnimatePresence>
            {state.showBookmarkTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute top-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg text-sm z-50 flex items-center gap-2 shadow-lg border border-green-500/20"
              >
                <Bookmark className="h-4 w-4" />
                <span className="font-medium">Bookmark added!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Autoplay Prompt */}
          <AutoplayPrompt
            show={state.showAutoplayPrompt}
            countdown={state.autoplayCountdown}
            nextVideoTitle={nextVideoId ? "Next Lesson" : undefined}
            onProceed={proceedAutoplay}
            onCancel={cancelAutoplay}
          />

          {/* Course Completion Overlay */}
          <CourseCompletionOverlay
            show={showCourseCompletion}
            courseName={courseName}
            onViewCertificate={handleViewCertificate}
            onClose={() => setShowCourseCompletion(false)}
          />
        </div>

        {/* Keyboard Shortcuts Modal */}
        {state.showKeyboardShortcuts && (
          <KeyboardShortcutsModal onClose={() => setState((prev) => ({ ...prev, showKeyboardShortcuts: false }))} />
        )}
      </TooltipProvider>
    )
  },
)

EnhancedVideoPlayer.displayName = "EnhancedVideoPlayer"

export default EnhancedVideoPlayer
