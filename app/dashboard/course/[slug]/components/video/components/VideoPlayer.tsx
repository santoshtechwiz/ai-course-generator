"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
const ReactPlayer: any = dynamic(() => import("react-player/youtube"), { ssr: false })
import { useSession } from "next-auth/react"
import { useVideoPlayer } from "../hooks/useVideoPlayer"
import PlayerControls from "./PlayerControls"
import { useGlobalLoader } from '@/store/loaders/global-loader'
import VideoErrorState from "./VideoErrorState"
import BookmarkManager from "./BookmarkManager"
import KeyboardShortcutsModal from "../../KeyboardShortcutsModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Lock, User, Pause, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast, useToast } from "@/components/ui/use-toast"
import type { VideoPlayerProps } from "../types"
import ChapterStartOverlay from "./ChapterStartOverlay"
import ChapterEndOverlay from "./ChapterEndOverlay"
import AutoPlayNotification from "./AutoPlayNotification"
import NextChapterNotification from "./NextChapterNotification"
import NextChapterAutoOverlay from "./NextChapterAutoOverlay"
import ChapterTransitionOverlay from "./ChapterTransitionOverlay"
import AnimatedCourseAILogo from "./AnimatedCourseAILogo"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"
import MiniPlayerNode from "./MiniPlayer"

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
      className="rounded-full p-3 sm:p-4 cursor-pointer pointer-events-auto transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-black/50 bg-primary text-primary-foreground shadow-lg"
      onClick={onClick}
      aria-label="Play video"
      type="button"
    >
      <Play className="h-8 w-8 sm:h-12 sm:w-12 ml-1" />
    </button>
  </div>
))

PlayButton.displayName = "PlayButton"

// Certificate download states
type CertificateState = "idle" | "downloading" | "success" | "error"

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  youtubeVideoId,
  chapterId,
  onEnded,
  onProgress,
  onTimeUpdate,
  rememberPlaybackPosition = true,
  rememberPlaybackSettings = true,
  onBookmark,
  autoPlay = false,
  onToggleAutoPlay,
  forcePlay,
  onVideoLoad,
  onCertificateClick,
  onPlayerReady,
  onNextVideo,
  nextVideoId,
  nextVideoTitle,
  onPrevVideo,
  prevVideoTitle,
  hasNextVideo,
  isFullscreen = false,
  onPictureInPictureToggle,
  className,
  bookmarks = [],
  isAuthenticated = false,
  showControls = true,
  courseId,
  courseName,
  chapterTitle,
  initialSeekSeconds,
  relatedCourses = [],
  progressStats,
  quizSuggestions = [],
  personalizedRecommendations = [],
  isKeyChapter = false,
}) => {
  const { data: session } = useSession()
  const youtubeVideoIdRef = useRef(youtubeVideoId)
  const { startLoading, stopLoading, isLoading } = useGlobalLoader()

  // State management with proper initialization
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false)
  const [showChapterStart, setShowChapterStart] = useState(false)
  const [showChapterEnd, setShowChapterEnd] = useState(false)
  const [showNextChapterNotification, setShowNextChapterNotification] = useState(false)
  const [nextChapterCountdown, setNextChapterCountdown] = useState(5)
  const [showChapterTransition, setShowChapterTransition] = useState(false)
  const [chapterTransitionCountdown, setChapterTransitionCountdown] = useState(5)
  const [showCourseAILogo, setShowCourseAILogo] = useState(false)
  const [showAutoPlayNotification, setShowAutoPlayNotification] = useState(false)
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(5)
  const [chapterStartShown, setChapterStartShown] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [isLoadingDuration, setIsLoadingDuration] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [canPlayVideo, setCanPlayVideo] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showControlsState, setShowControlsState] = useState(showControls)
  const [certificateState, setCertificateState] = useState<CertificateState>("idle")
  const [autoPlayVideo, setAutoPlayVideo] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Picture-in-Picture state tracking
  const [isNativePiPActive, setIsNativePiPActive] = useState(false)
  const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false)

  // Overlay state for auto-advance
  const [showNextChapterAutoOverlay, setShowNextChapterAutoOverlay] = useState(false)
  const [nextChapterAutoCountdown, setNextChapterAutoCountdown] = useState(5)

  // Mini player position and dragging
  const [miniPos, setMiniPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 })
  const draggingRef = useRef(false)
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })

  // Refs for cleanup and performance
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chapterTitleRef = useRef(chapterTitle)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const lastFsToggleRef = useRef<number>(0)
  const lastTheaterToggleRef = useRef<number>(0)
  const nextNotifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize video player hook BEFORE any usage of containerRef
  const { state, playerRef, containerRef, bufferHealth, youtubeUrl, handleProgress, handlers } =
    useVideoPlayer({
      youtubeVideoId,
      courseId: String(courseId || ''),
      chapterId: String(chapterId || ''),
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

  // Utility functions
  const clamp = useCallback((val: number, min: number, max: number) => Math.max(min, Math.min(max, val)), [])

  // Save mini player position
  const saveMiniPos = useCallback((pos: { x: number; y: number }) => {
    try {
      localStorage.setItem('mini-player-pos', JSON.stringify(pos))
    } catch {
      console.warn('Failed to save mini player position')
    }
  }, [])

  // Initialize mini player position
  useEffect(() => {
    if (typeof window === 'undefined') return

    const w = window.innerWidth
    const h = window.innerHeight
    const width = 320
    const height = Math.round((9 / 16) * width)
    let initial = { x: w - width - 16, y: h - height - 16 }

    try {
      const saved = localStorage.getItem("mini-player-pos")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          initial = {
            x: clamp(parsed.x, 8, Math.max(8, w - width - 8)),
            y: clamp(parsed.y, 8, Math.max(8, h - height - 8)),
          }
        }
      }
    } catch {
      console.warn('Failed to load mini player position')
    }

    setMiniPos(initial)

    const onResize = () => {
      const nw = window.innerWidth
      const nh = window.innerHeight
      setMiniPos((pos) => ({
        x: clamp(pos.x, 8, Math.max(8, nw - width - 8)),
        y: clamp(pos.y, 8, Math.max(8, nh - height - 8)),
      }))
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clamp])

  // Observe visibility of the container to toggle mini controls
  const [isInView, setIsInView] = useState(true)
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsInView(entry.isIntersecting)
      },
      { root: null, threshold: 0.3 },
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [containerRef])

  // Track mounting state and initialize autoplay preference
  useEffect(() => {
    setIsMounted(true)

    try {
      const saved = localStorage.getItem('video-autoplay')
      if (saved) {
        setAutoPlayVideo(JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Could not load auto-play preference:', error)
    }

    return () => setIsMounted(false)
  }, [])

  // Enhanced PiP detection and state management
  useEffect(() => {
    const checkPiPState = () => {
      const pipElement = (document as any).pictureInPictureElement
      setIsNativePiPActive(!!pipElement)
    }

    const handleEnterPiP = () => {
      setIsNativePiPActive(true)
      setIsMiniPlayerActive(false) // Disable mini player when native PiP is active
      onPictureInPictureToggle?.(true)
    }

    const handleLeavePiP = () => {
      setIsNativePiPActive(false)
      onPictureInPictureToggle?.(false)
    }

    // Check initial state
    checkPiPState()

    if (typeof document !== "undefined") {
      document.addEventListener('enterpictureinpicture', handleEnterPiP)
      document.addEventListener('leavepictureinpicture', handleLeavePiP)

      return () => {
        document.removeEventListener('enterpictureinpicture', handleEnterPiP)
        document.removeEventListener('leavepictureinpicture', handleLeavePiP)
      }
    }
  }, [onPictureInPictureToggle])

  // Sync mini player state with the hook's state
  useEffect(() => {
    setIsMiniPlayerActive(state.isMiniPlayer)
  }, [state.isMiniPlayer])

  // Update refs when props change
  useEffect(() => {
    chapterTitleRef.current = chapterTitle
    youtubeVideoIdRef.current = youtubeVideoId
  }, [chapterTitle, youtubeVideoId])

  // Enhanced authentication check
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

  // Safe video element getter
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    if (!isMounted || !containerRef.current) return null

    try {
      const reactPlayerVideo = containerRef.current.querySelector("iframe")?.contentDocument?.querySelector("video")
      if (reactPlayerVideo) {
        videoElementRef.current = reactPlayerVideo as HTMLVideoElement
        return reactPlayerVideo as HTMLVideoElement
      }

      const directVideo = containerRef.current.querySelector("video")
      if (directVideo) {
        videoElementRef.current = directVideo as HTMLVideoElement
        return directVideo as HTMLVideoElement
      }

      return null
    } catch (error) {
      console.warn("Error accessing video element:", error)
      return null
    }
  }, [isMounted, containerRef])

  // Enhanced PIP handling with proper state management
  const handlePictureInPicture = useCallback(async () => {
    try {
      const videoEl = getVideoElement()

      // Check if native PiP is supported
      const isNativePiPSupported = !!(
        videoEl &&
        (videoEl as any).requestPictureInPicture &&
        (document as any).pictureInPictureEnabled
      )

      if (isNativePiPSupported) {
        if (isNativePiPActive) {
          // Exit native PiP
          await (document as any).exitPictureInPicture()
        } else {
          // Ensure mini-player is off when entering native PiP
          if (isMiniPlayerActive && handlers.handlePictureInPictureToggle) {
            handlers.handlePictureInPictureToggle()
            setIsMiniPlayerActive(false)
          }
          await (videoEl as any).requestPictureInPicture()
        }
        return
      }

      // Fallback to custom mini player
      if (handlers.handlePictureInPictureToggle) {
        const nextMiniState = !isMiniPlayerActive

        // If turning on mini-player and native PiP is active, exit PiP first
        if (nextMiniState && isNativePiPActive && (document as any).exitPictureInPicture) {
          try {
            await (document as any).exitPictureInPicture()
          } catch (error) {
            console.warn('Failed to exit native PiP:', error)
          }
        }

        handlers.handlePictureInPictureToggle()
        setIsMiniPlayerActive(nextMiniState)
        onPictureInPictureToggle?.(nextMiniState)
      } else {
        toast({
          title: "PiP not available",
          description: "This video provider does not support Picture-in-Picture.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.warn('Picture-in-Picture failed:', error)
      toast({
        title: "PiP Error",
        description: "Could not toggle Picture-in-Picture.",
        variant: "destructive",
      })
      onPictureInPictureToggle?.(false)
    }
  }, [getVideoElement, handlers.handlePictureInPictureToggle, onPictureInPictureToggle, toast, isNativePiPActive, isMiniPlayerActive])

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`
  }, [])

  // Enhanced player ready handler
  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true)
    setIsLoadingDuration(false)
    stopLoading()

    if (playerRef.current) {
      try {
        const duration = playerRef.current.getDuration()
        if (duration && duration > 0) {
          setVideoDuration(duration)
          onVideoLoad?.({
            title: courseName || chapterTitleRef.current || "Video",
            duration,
            thumbnail: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
          })
        }

        onPlayerReady?.(playerRef)
      } catch (error) {
        console.warn("Error getting video duration:", error)
      }

      // Handle initial seek
      if (typeof initialSeekSeconds === 'number' && initialSeekSeconds > 0) {
        try {
          const dur = playerRef.current.getDuration() || videoDuration || state.duration || 0
          if (dur > 0 && initialSeekSeconds < dur - 1) {
            playerRef.current.seekTo(Math.max(0, initialSeekSeconds))
          }
        } catch (error) {
          console.warn("Failed to seek to initial position:", error)
        }
      }

      // Attempt auto-resume from local storage
      try {
        const userKey = (typeof window !== 'undefined' && localStorage.getItem('video-guest-id')) || 'guest'
        const storageKey = `video-progress-${userKey}-${youtubeVideoId}`
        const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
        if (saved) {
          const parsed = JSON.parse(saved)
          const ts = Number(parsed?.playedSeconds || parsed?.time || 0)
          const dur = Number(parsed?.duration || videoDuration || state.duration || 0)
          if (!isNaN(ts) && ts > 0 && dur > 0 && ts < dur - 2) {
            playerRef.current.seekTo(Math.max(0, ts - 1))
          }
        }
      } catch (e) {
        console.warn("Failed to resume playback:", e)
      }

      // Initialize volume
      try {
        const savedVolume = localStorage.getItem('VIDEO_PLAYER_VOLUME') || localStorage.getItem('video-player-volume')
        if (!savedVolume) {
          handlers.onVolumeChange(0.5)
        }
      } catch (error) {
        console.warn("Failed to set initial volume:", error)
      }
    }

    handlers.onReady()

    // Handle autoplay after player is ready
    const shouldAutoPlay = (autoPlay || autoPlayVideo) && canPlayVideo && !state.userInteracted
    if (shouldAutoPlay) {
      try {
        // Ensure muted for autoplay compliance
        if (!state.muted) {
          handlers.onMute()
        }
        setTimeout(() => {
          handlers.onPlay()
        }, 100) // Small delay to ensure player is fully ready
      } catch (error) {
        console.warn("Autoplay failed:", error)
      }
    }
  }, [handlers, onVideoLoad, courseName, youtubeVideoId, onPlayerReady, stopLoading, videoDuration, state.duration, state.userInteracted, state.muted, initialSeekSeconds, autoPlay, autoPlayVideo, canPlayVideo])

  // Enhanced play handler
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

  // Enhanced bookmark handlers
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

  // Certificate download handler
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

      setTimeout(() => {
        setCertificateState("idle")
      }, 3000)
    }
  }, [certificateState, onCertificateClick, toast])

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControlsState(true)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      if (state.playing && !isHovering && !showChapterStart && !showChapterEnd) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControlsState(false)
        }, 4500)
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

  // Chapter start overlay logic
  useEffect(() => {
    if (state.playing && !chapterStartShown && playerReady && canPlayVideo && !showChapterEnd && isMounted) {
      const animationFrame = requestAnimationFrame(() => {
        setShowChapterStart(true)
        setChapterStartShown(true)
      })

      return () => cancelAnimationFrame(animationFrame)
    }
  }, [state.playing, chapterStartShown, playerReady, canPlayVideo, showChapterEnd, isMounted])

  // Reset overlay states when video changes
  useEffect(() => {
    setChapterStartShown(false)
    setShowChapterStart(false)
    setShowChapterEnd(false)
    setShowNextChapterNotification(false)
    setNextChapterCountdown(5)
    setShowChapterTransition(false)
    setChapterTransitionCountdown(5)
    setShowCourseAILogo(false)
    setShowNextChapterAutoOverlay(false)
    setNextChapterAutoCountdown(5)
    setPlayerReady(false)
    setVideoDuration(0)
    setIsLoadingDuration(true)
    setCertificateState("idle")

    // Clear timeouts and intervals
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (nextNotifIntervalRef.current) {
      clearInterval(nextNotifIntervalRef.current)
    }
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current)
    }
  }, [youtubeVideoId])

  // Chapter overlay handlers
  const handleChapterStartComplete = useCallback(() => {
    const animationFrame = requestAnimationFrame(() => {
      setShowChapterStart(false)
    })
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  // Auto-advance notification logic
  useEffect(() => {
    if (!state.playing || !state.duration || !onNextVideo) return

    const checkTimeRemaining = () => {
      const timeRemaining = state.duration - state.lastPlayedTime
      if (timeRemaining <= 5 && timeRemaining > 0 && !showNextChapterAutoOverlay) {
        setShowNextChapterNotification(true)
        setNextChapterCountdown(Math.ceil(timeRemaining))
      }
    }

    const intervalId = setInterval(checkTimeRemaining, 500)
    return () => clearInterval(intervalId)
  }, [state.playing, state.duration, state.lastPlayedTime, onNextVideo, showNextChapterAutoOverlay])

  // Video end handler
  const handleVideoEnd = useCallback(() => {
    onEnded?.()

    const isCourseCompleted = progressStats?.progressPercentage === 100

    if (isCourseCompleted) {
      setShowChapterEnd(true)
    } else if (onNextVideo && state.autoPlayNext) {
      setShowNextChapterAutoOverlay(true)
      setNextChapterAutoCountdown(5)

      if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current)

      autoPlayIntervalRef.current = setInterval(() => {
        setNextChapterAutoCountdown((prev) => {
          if (prev <= 1) {
            if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current)
            setShowNextChapterAutoOverlay(false)
            onNextVideo()
            return 5
          }
          return prev - 1
        })
      }, 1000)
    } else if (onNextVideo) {
      // Auto-play disabled, show manual continue option
      setShowChapterEnd(true)
    } else {
      setShowChapterEnd(true)
    }
  }, [onEnded, onNextVideo, state.autoPlayNext, progressStats?.progressPercentage])

  // Handler functions for overlays
  const handleAutoPlayContinue = useCallback(() => {
    setShowAutoPlayNotification(false)
    onNextVideo?.()
  }, [onNextVideo])

  const handleAutoPlayCancel = useCallback(() => {
    setShowAutoPlayNotification(false)
    setAutoPlayCountdown(5)
  }, [])

  const handleNextChapter = useCallback(() => {
    setShowChapterEnd(false)
    onNextVideo?.()
  }, [onNextVideo])

  const handleNextChapterAutoContinue = useCallback(() => {
    setShowNextChapterAutoOverlay(false)
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current)
      autoPlayIntervalRef.current = null
    }
    onNextVideo?.()
  }, [onNextVideo])

  const handleNextChapterAutoCancel = useCallback(() => {
    setShowNextChapterAutoOverlay(false)
    setNextChapterAutoCountdown(5)
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current)
      autoPlayIntervalRef.current = null
    }
  }, [])

  const handleNextChapterNotificationContinue = useCallback(() => {
    setShowNextChapterNotification(false)
    if (nextNotifIntervalRef.current) {
      clearInterval(nextNotifIntervalRef.current)
      nextNotifIntervalRef.current = null
    }
    onNextVideo?.()
  }, [onNextVideo])

  const handleNextChapterNotificationCancel = useCallback(() => {
    setShowNextChapterNotification(false)
    setNextChapterCountdown(5)
    if (nextNotifIntervalRef.current) {
      clearInterval(nextNotifIntervalRef.current)
      nextNotifIntervalRef.current = null
    }
  }, [])

  const handleChapterTransitionContinue = useCallback(() => {
    setShowChapterTransition(false)
    setShowCourseAILogo(false)
    onNextVideo?.()
  }, [onNextVideo])

  const handleChapterTransitionCancel = useCallback(() => {
    setShowChapterTransition(false)
    setShowCourseAILogo(false)
    setChapterTransitionCountdown(5)
  }, [])

  const handleToggleAutoPlayVideo = useCallback(() => {
    const newValue = !autoPlayVideo
    setAutoPlayVideo(newValue)

    try {
      localStorage.setItem('video-autoplay', JSON.stringify(newValue))
    } catch (error) {
      console.warn('Could not save auto-play preference:', error)
    }

    onToggleAutoPlay?.()
  }, [autoPlayVideo, onToggleAutoPlay])

  const handleReplay = useCallback(() => {
    setShowChapterEnd(false)
    if (playerRef.current) {
      playerRef.current.seekTo(0)
      handlers.onPlay()
    }
  }, [handlers])

  // Force play when instructed
  const lastForcedVideoRef = useRef<string | null>(null)
  useEffect(() => {
    if (!youtubeVideoId || !canPlayVideo || !forcePlay) return

    if (lastForcedVideoRef.current !== youtubeVideoId) {
      try {
        handlers.onPlay()
        lastForcedVideoRef.current = youtubeVideoId
      } catch (error) {
        console.warn("Failed to force play:", error)
      }
    }
  }, [youtubeVideoId, forcePlay, canPlayVideo, handlers])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isMounted || !canPlayVideo) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }

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
          if (event.repeat) return
          event.preventDefault()
          {
            const now = Date.now()
            if (now - lastFsToggleRef.current >= 500) {
              lastFsToggleRef.current = now
              handlers.onToggleFullscreen()
            }
          }
          break
        case "p":
          event.preventDefault()
          handlePictureInPicture()
          break
        case "Escape":
          if (state.isFullscreen) {
            event.preventDefault()
            handlers.onToggleFullscreen()
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
    handlePictureInPicture,
  ])

  // Memoized authentication prompt
  const authPromptComponent = useMemo(() => {
    if (!showAuthPrompt || canPlayVideo) return null

    return (
      <AuthPrompt
        videoId={youtubeVideoId}
        onSignIn={() => (window.location.href = "/api/auth/signin")}
        onClose={() => setShowAuthPrompt(false)}
      />
    )
  }, [showAuthPrompt, canPlayVideo, youtubeVideoId])

  // Early return for authentication prompt
  if (authPromptComponent) {
    return <div className={cn("relative w-full h-full", className)}>{authPromptComponent}</div>
  }

  // Duration handler
  const onDurationHandler = (duration: number) => {
    setVideoDuration(duration)
    setIsLoadingDuration(false)
  }

  // Determine if mini player should be shown
  const shouldShowMiniPlayer = state.isMiniPlayer && !isNativePiPActive && isMounted

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative object-contain w-full h-full bg-black overflow-hidden group video-player-container",
        className,
        state.theaterMode && "theater-mode-active",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role="application"
      aria-label="Video player"
      tabIndex={0}
    >
      {/* Main YouTube Player */}
      <div className={cn(
        "absolute inset-0",
        (isNativePiPActive || shouldShowMiniPlayer) && "opacity-0 pointer-events-none"
      )}>
        <ReactPlayer
          ref={playerRef}
          url={youtubeUrl}
          width="100%"
          height="100%"
          playing={state.playing && canPlayVideo && !shouldShowMiniPlayer && !isNativePiPActive}
          volume={state.volume}
          muted={state.muted || ((autoPlay || autoPlayVideo) && canPlayVideo && !state.userInteracted)}
          playbackRate={state.playbackRate}
          onProgress={handleProgress}
          onPlay={handlers.onPlay}
          onPause={handlers.onPause}
          onBuffer={handlers.onBuffer}
          onBufferEnd={handlers.onBufferEnd}
          onError={handlers.onError}
          onEnded={handleVideoEnd}
          onReady={handlePlayerReady}
          onDuration={onDurationHandler}
          config={{
            youtube: {
              playerVars: {
                autoplay: ((autoPlay || autoPlayVideo) && canPlayVideo) ? 1 : 0,
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
            attributes: {
              allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
              allowFullScreen: true,
            },
          } as any}
        />
      </div>

      {/* Mini Player */}
      {shouldShowMiniPlayer && (
        <MiniPlayerNode
          visible={true}
          position={miniPos}
          onPositionChange={(pos) => {
            setMiniPos(pos)
            saveMiniPos(pos)
          }}
          onClose={() => {
            if (handlers.handlePictureInPictureToggle) {
              handlers.handlePictureInPictureToggle()
            }
            setIsMiniPlayerActive(false)
            onPictureInPictureToggle?.(false)
          }}
          onExpand={() => {
            // Handle expand logic if needed
          }}
          videoUrl={youtubeUrl}
          playing={state.playing && canPlayVideo}
          volume={state.volume}
          muted={state.muted}
          playbackRate={state.playbackRate}
          title={chapterTitle || courseName}
          currentTime={formatTime(state.lastPlayedTime)}
          duration={formatTime(videoDuration || state.duration)}
          onPlayPause={handlePlayClick}
          onVolumeChange={handlers.onVolumeChange}
          onSeek={(percent) => {
            const time = (videoDuration || state.duration) * percent
            handlers.onSeek(time)
          }}
          played={state.played}
        />
      )}

      {/* CourseAI Logo */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 opacity-70 hover:opacity-100 transition-opacity">
        <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 sm:p-1.5 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
          <span className="text-white font-bold text-xs select-none">CourseAI</span>
        </div>
      </div>

      {/* Error State */}
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

      {/* Native PiP Overlay */}
      {isNativePiPActive && !shouldShowMiniPlayer && (
        <div className="absolute inset-0 z-20 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="px-3 py-2 rounded-md bg-black/60 text-white text-xs sm:text-sm flex items-center gap-3">
            <span>Playing in Picture-in-Picture</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handlePictureInPicture}
              aria-label="Return from Picture-in-Picture"
            >
              Return
            </Button>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!state.playing && playerReady && canPlayVideo && !showChapterStart && !showChapterEnd && !shouldShowMiniPlayer && (
        <PlayButton onClick={handlePlayClick} />
      )}

      {/* Chapter Start Overlay */}
      <ChapterStartOverlay
        visible={showChapterStart && !shouldShowMiniPlayer}
        chapterTitle={chapterTitleRef.current}
        courseTitle={courseName}
        onComplete={handleChapterStartComplete}
        duration={3500}
        videoId={youtubeVideoId}
      />

      {/* Chapter End Overlay */}
      {(showChapterEnd && !shouldShowMiniPlayer && (!onNextVideo || progressStats?.progressPercentage === 100)) && (
        <ChapterEndOverlay
          visible={true}
          chapterTitle={chapterTitleRef.current}
          nextChapterTitle={nextVideoTitle}
          hasNextChapter={!!onNextVideo}
          onNextChapter={handleNextChapter}
          onReplay={handleReplay}
          onClose={() => setShowChapterEnd(false)}
          autoAdvanceDelay={5}
          autoAdvance={!!onNextVideo}
          onCertificateDownload={handleCertificateDownload}
          certificateState={certificateState}
          isFinalChapter={progressStats?.progressPercentage === 100}
          courseTitle={courseName}
          relatedCourses={relatedCourses}
          progressStats={progressStats}
          quizSuggestions={quizSuggestions}
          personalizedRecommendations={personalizedRecommendations}
          isKeyChapter={isKeyChapter}
        />
      )}

      {/* Auto-play Notification */}
      <AutoPlayNotification
        visible={showAutoPlayNotification && !shouldShowMiniPlayer}
        nextChapterTitle={nextVideoTitle || "Next Chapter"}
        countdown={autoPlayCountdown}
        onContinue={handleAutoPlayContinue}
        onCancel={handleAutoPlayCancel}
      />

      {/* Next Chapter Auto Overlay */}
      <NextChapterAutoOverlay
        visible={showNextChapterAutoOverlay && !shouldShowMiniPlayer}
        nextChapterTitle={nextVideoTitle || "Next Chapter"}
        countdown={nextChapterAutoCountdown}
        onContinue={handleNextChapterAutoContinue}
        onCancel={handleNextChapterAutoCancel}
      />

      {/* Next Chapter Notification */}
      <NextChapterNotification
        visible={showNextChapterNotification && !shouldShowMiniPlayer}
        nextChapterTitle={nextVideoTitle || "Next Chapter"}
        countdown={nextChapterCountdown}
        onContinue={handleNextChapterNotificationContinue}
        onCancel={handleNextChapterNotificationCancel}
        autoAdvance={state.autoPlayNext}
      />

      {/* CourseAI Logo Overlay */}
      <AnimatedCourseAILogo
        show={showCourseAILogo && !shouldShowMiniPlayer}
        videoEnding={showChapterTransition}
        onAnimationComplete={() => setShowCourseAILogo(false)}
      />

      {/* Player Controls */}
      {canPlayVideo && !shouldShowMiniPlayer && (
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
            show={showControlsState}
            onShowKeyboardShortcuts={handlers.handleShowKeyboardShortcuts}
            onNextVideo={onNextVideo}
            onToggleBookmarkPanel={handleToggleBookmarkPanel}
            autoPlayNext={state.autoPlayNext}
            onToggleAutoPlayNext={handlers.toggleAutoPlayNext}
            autoPlayVideo={autoPlayVideo}
            onToggleAutoPlayVideo={handleToggleAutoPlayVideo}
            onPictureInPicture={handlePictureInPicture}
            isPiPSupported={state.isPiPSupported}
            isPiPActive={isNativePiPActive || shouldShowMiniPlayer}
            onToggleTheaterMode={handlers.handleTheaterModeToggle}
            isTheaterMode={state.theaterMode}
          />
        </div>
      )}

      {/* Floating Mini Controls */}
      {canPlayVideo && !isInView && !shouldShowMiniPlayer && (
        <div className="fixed bottom-4 right-4 z-40 bg-black/80 text-white rounded-full shadow-lg border border-white/10 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
          <button
            className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-white/10"
            onClick={handlePlayClick}
            aria-label={state.playing ? "Pause" : "Play"}
          >
            {state.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          {onNextVideo && (
            <button
              className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-white/10"
              onClick={handleNextChapter}
              aria-label="Next video"
              title={nextVideoTitle ? `Next: ${nextVideoTitle}` : "Next video"}
            >
              <SkipForward className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Bookmark Panel */}
      {showBookmarkPanel && isAuthenticated && (
        <div className="absolute top-0 right-0 bottom-16 w-64 sm:w-72 bg-black/80 backdrop-blur-sm z-30 border-l border-white/10">
          <BookmarkManager
            videoId={youtubeVideoId}
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

      {/* Keyboard Shortcuts Modal */}
      {state.showKeyboardShortcuts && (
        <KeyboardShortcutsModal
          onClose={handlers.handleHideKeyboardShortcuts}
          show={state.showKeyboardShortcuts}
        />
      )}
    </div>
  )
}

export default React.memo(VideoPlayer)