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
import { useToast } from "@/components/ui/use-toast"
import type { VideoPlayerProps } from "../types"
import ChapterStartOverlay from "./ChapterStartOverlay"
import ChapterEndOverlay from "./ChapterEndOverlay"
import AutoPlayNotification from "./AutoPlayNotification"
import NextChapterNotification from "./NextChapterNotification"
import ChapterTransitionOverlay from "./ChapterTransitionOverlay"
import AnimatedCourseAILogo from "./AnimatedCourseAILogo"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"
// Removed in-player growth promo; we will show CTAs outside the player

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
  videoId,
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

  onPictureInPictureToggle, // Add this prop
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
  const { toast } = useToast()
  const { startLoading, stopLoading ,isLoading} = useGlobalLoader()

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
  // Mini player position and dragging
  const [miniPos, setMiniPos] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mini-player-pos')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Ensure the saved position is still valid for current viewport
          if (parsed.x >= 0 && parsed.y >= 0 && 
              parsed.x <= window.innerWidth - 320 && 
              parsed.y <= window.innerHeight - 180) {
            return parsed
          }
        } catch {}
      }
      // Default position: bottom-right corner
      return {
        x: Math.max(8, window.innerWidth - 328),
        y: Math.max(8, window.innerHeight - 188)
      }
    }
    return { x: 100, y: 100 }
  })
  const draggingRef = useRef(false)
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })

  // Refs for cleanup and performance
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chapterTitleRef = useRef(chapterTitle)
  const videoIdRef = useRef(videoId)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const lastFsToggleRef = useRef<number>(0)
  const lastTheaterToggleRef = useRef<number>(0)
  // Save mini player position
  const saveMiniPos = useCallback((pos: { x: number; y: number }) => {
    try {
      localStorage.setItem('mini-player-pos', JSON.stringify(pos))
    } catch {}
  }, [])
  const clamp = useCallback((val: number, min: number, max: number) => Math.max(min, Math.min(max, val)), [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Initialize mini position to bottom-right by default
    const w = window.innerWidth
    const h = window.innerHeight
    const width = 320
    const height = Math.round((9 / 16) * width)
    let initial = { x: w - width - 16, y: h - height - 16 }
    try {
      const saved = localStorage.getItem("mini_player_pos")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          initial = {
            x: clamp(parsed.x, 8, Math.max(8, w - width - 8)),
            y: clamp(parsed.y, 8, Math.max(8, h - height - 8)),
          }
        }
      }
    } catch {}
    setMiniPos(initial)
    const onResize = () => {
      const nw = window.innerWidth
      const nh = window.innerHeight
      setMiniPos((pos) => {
        if (!pos) return pos
        return {
          x: clamp(pos.x, 8, Math.max(8, nw - width - 8)),
          y: clamp(pos.y, 8, Math.max(8, nh - height - 8)),
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clamp])

  // Initialize video player hook BEFORE any usage of containerRef
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

  // Track mounting state to prevent "element not found" errors
  useEffect(() => {
    setIsMounted(true)
    
    // Load auto-play video preference
    try {
      const saved = localStorage.getItem('video-autoplay')
      if (saved) {
        setAutoPlayVideo(JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Could not load auto-play preference:', error)
    }
 
    return () => setIsMounted(false)
  }, [autoPlay])
 
  // First-time volume init at 50% if no saved preference
  const volumeInitRef = useRef(false)
  useEffect(() => {
    if (volumeInitRef.current) return
    try {
      const savedA = localStorage.getItem('VIDEO_PLAYER_VOLUME')
      const savedB = localStorage.getItem('video-player-volume')
      if (!savedA && !savedB) {
        handlers.onVolumeChange(0.5)
      }
    } catch {}
    volumeInitRef.current = true
  }, [])
 
  // Update refs when props change to ensure latest values
  useEffect(() => {
    chapterTitleRef.current = chapterTitle
    videoIdRef.current = videoId
  }, [chapterTitle, videoId])
 
  // Play immediately when instructed and allowed, on video change
  const lastForcedVideoRef = useRef<string | null>(null)
  useEffect(() => {
    if (!videoId || !canPlayVideo) return
    if (forcePlay && lastForcedVideoRef.current !== videoId) {
      try {
        handlers.onPlay()
      } catch {}
      lastForcedVideoRef.current = videoId
    }
  }, [videoId, forcePlay, canPlayVideo])

  // Check PiP support on mount with proper error handling
  useEffect(() => {
    // PiP support is now handled by the useVideoPlayer hook
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

  // Attempt muted autoplay when ready or when the video changes (if preference is enabled)
  useEffect(() => {
    const shouldAuto = (autoPlay || autoPlayVideo) && canPlayVideo
    if (!playerReady || !shouldAuto) return

    // Only attempt if user hasn't interacted yet
    if (!state.userInteracted) {
      try {
        handlers.onPlay()
      } catch {}
    }
  }, [videoId, playerReady, autoPlay, autoPlayVideo, canPlayVideo, handlers, state.userInteracted, state.muted])

  // Safe video element getter with proper error handling (defined early for use in handlers and JSX)
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    if (!isMounted || !containerRef.current) return null

    try {
      // First try to get from ReactPlayer internal structure
      const reactPlayerVideo = containerRef.current.querySelector("iframe")?.contentDocument?.querySelector("video")
      if (reactPlayerVideo) {
        videoElementRef.current = reactPlayerVideo as HTMLVideoElement
        return reactPlayerVideo as HTMLVideoElement
      }

      // Fallback to direct video element
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

  // Enhanced PIP handling with callback to parent
  const handlePictureInPicture = useCallback(async () => {
    try {
      const videoEl = getVideoElement()
      // Prefer native PiP on the actual video element when available
      if (videoEl && (videoEl as any).requestPictureInPicture && (document as any).pictureInPictureEnabled) {
        if ((document as any).pictureInPictureElement) {
          await (document as any).exitPictureInPicture()
          onPictureInPictureToggle?.(false)
        } else {
          // Ensure mini-player is off when entering native PiP
          if (state.isMiniPlayer && handlers.handlePictureInPictureToggle) {
            // Force off mini-player state if any custom toggles are used internally
            handlers.handlePictureInPictureToggle()
          }
          await (videoEl as any).requestPictureInPicture()
          onPictureInPictureToggle?.(true)
        }
        return
      }

      // Fallback to custom mini player when native PiP is not available
      if (handlers.handlePictureInPictureToggle) {
        const next = !state.isMiniPlayer
        // If turning on mini-player, and native PiP is active, exit PiP first
        if (next && (document as any).pictureInPictureElement && (document as any).exitPictureInPicture) {
          try { await (document as any).exitPictureInPicture() } catch {}
          onPictureInPictureToggle?.(false)
        }
        handlers.handlePictureInPictureToggle()
        onPictureInPictureToggle?.(next)
      } else if (onPictureInPictureToggle) {
        onPictureInPictureToggle(true)
      } else {
        toast({
          title: "PiP not available",
          description: "This video provider does not support Picture‑in‑Picture.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.warn('Picture-in-Picture failed:', error)
      toast({
        title: "PiP Error",
        description: "Could not toggle Picture‑in‑Picture.",
        variant: "destructive",
      })
      onPictureInPictureToggle?.(false)
    }
  }, [getVideoElement, handlers.handlePictureInPictureToggle, onPictureInPictureToggle, toast, state.isMiniPlayer])

  // Handle PIP events with better performance
  useEffect(() => {
    const handleEnterPiP = () => {
      setState(prev => ({ ...prev, isPictureInPicture: true, isMiniPlayer: false }))
    }

    const handleLeavePiP = () => {
      setState(prev => ({ ...prev, isPictureInPicture: false }))
    }

    if (typeof document !== "undefined") {
      document.addEventListener('enterpictureinpicture', handleEnterPiP)
      document.addEventListener('leavepictureinpicture', handleLeavePiP)

      return () => {
        document.removeEventListener('enterpictureinpicture', handleEnterPiP)
        document.removeEventListener('leavepictureinpicture', handleLeavePiP)
      }
    }
  }, [])


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

  // Enhanced player ready handler with better error handling
  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true)
    setIsLoadingDuration(false)
    
    // Stop global loading when video is ready
    stopLoading()

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

      // Attempt initial seek if provided by parent
      if (typeof initialSeekSeconds === 'number' && initialSeekSeconds > 0) {
        try {
          const dur = playerRef.current.getDuration() || videoDuration || state.duration || 0
          if (dur > 0 && initialSeekSeconds < dur - 1) {
            playerRef.current.seekTo(Math.max(0, initialSeekSeconds))
          }
        } catch {}
      }

      // Attempt auto-resume from local storage (per-user or guest)
      try {
        const userKey = (typeof window !== 'undefined' && localStorage.getItem('video-guest-id')) || 'guest'
        const storageKey = `video-progress-${userKey}-${videoId}`
        const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
        if (saved) {
          const parsed = JSON.parse(saved)
          const ts = Number(parsed?.playedSeconds || parsed?.time || 0)
          const dur = Number(parsed?.duration || videoDuration || state.duration || 0)
          if (!isNaN(ts) && ts > 0 && dur > 0 && ts < dur - 2) {
            // Seek slightly before saved position for context
            playerRef.current.seekTo(Math.max(0, ts - 1))
          }
        }
      } catch (e) {
        // ignore resume failures
      }

      // Set initial volume to 50%
      try {
        handlers.onVolumeChange(0.5)
      } catch {}
    }
    handlers.onReady()

    // Attempt muted autoplay if the user preference is enabled
    try {
      const shouldAuto = (autoPlay || autoPlayVideo) && canPlayVideo
      if (shouldAuto && !state.userInteracted) {
        handlers.onPlay()
      }
    } catch {}
  }, [handlers, onVideoLoad, courseName, videoId, onPlayerReady, stopLoading, videoDuration, state.duration, initialSeekSeconds, autoPlay, autoPlayVideo, canPlayVideo, state.userInteracted, state.muted])

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
    setShowNextChapterNotification(false)
    setNextChapterCountdown(5)
    setShowChapterTransition(false)
    setChapterTransitionCountdown(5)
    setShowCourseAILogo(false)
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

  // Disable big transition overlay per request
  useEffect(() => {
    return () => {}
  }, [])

  const handleVideoEnd = useCallback(() => {
    console.log('Video ended - Debug info:', {
      onNextVideo: !!onNextVideo,
      autoPlayNext: state.autoPlayNext,
      progressPercentage: progressStats?.progressPercentage,
      isCourseCompleted: progressStats?.progressPercentage === 100
    })
    
    onEnded?.()
    
    // Check if this is the final chapter (course 100% completed)
    const isCourseCompleted = progressStats?.progressPercentage === 100
    
    if (isCourseCompleted) {
      // Show course completion overlay for final chapter
      console.log('Showing course completion overlay')
      const animationFrame = requestAnimationFrame(() => {
        setShowChapterEnd(true)
      })
      return () => cancelAnimationFrame(animationFrame)
    } else if (onNextVideo && state.autoPlayNext) {
      // Show small bottom-right notification with countdown and auto-advance
      setShowNextChapterNotification(true)
      setNextChapterCountdown(5)
      if (nextNotifIntervalRef.current) clearInterval(nextNotifIntervalRef.current)
      nextNotifIntervalRef.current = setInterval(() => {
        setNextChapterCountdown((prev) => {
          if (prev <= 1) {
            if (nextNotifIntervalRef.current) clearInterval(nextNotifIntervalRef.current)
            setShowNextChapterNotification(false)
            onNextVideo()
            return 5
          }
          return prev - 1
        })
      }, 1000)
    } else if (onNextVideo) {
      // Auto-play disabled: do nothing intrusive
      console.log('Auto-play disabled - staying on current chapter')
    } else {
      // For chapters without next video but not course completion, show simple completion message
      console.log('No next video - showing chapter completion')
      const animationFrame = requestAnimationFrame(() => {
        setShowChapterEnd(true)
      })
      return () => cancelAnimationFrame(animationFrame)
    }
  }, [onEnded, onNextVideo, state.autoPlayNext, progressStats?.progressPercentage])

  // Cleanup auto-advance timer on unmount or video change
  useEffect(() => {
    return () => {
      if (nextNotifIntervalRef.current) {
        clearInterval(nextNotifIntervalRef.current)
      }
    }
  }, [videoId])

  const handleNextChapter = useCallback(() => {
    setShowChapterEnd(false)
    onNextVideo?.()
  }, [onNextVideo])

  const handleAutoPlayContinue = useCallback(() => {
    setShowAutoPlayNotification(false)
    onNextVideo?.()
  }, [onNextVideo])

  const handleAutoPlayCancel = useCallback(() => {
    setShowAutoPlayNotification(false)
    setAutoPlayCountdown(5)
  }, [])

  const handleNextChapterNotificationContinue = useCallback(() => {
    setShowNextChapterNotification(false)
    onNextVideo?.()
  }, [onNextVideo])

  const handleNextChapterNotificationCancel = useCallback(() => {
    setShowNextChapterNotification(false)
    setNextChapterCountdown(5)
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
    setAutoPlayVideo(prev => !prev)
    // Save preference to localStorage
    try {
      localStorage.setItem('video-autoplay', JSON.stringify(!autoPlayVideo))
    } catch (error) {
      console.warn('Could not save auto-play preference:', error)
    }
    // Notify parent (Redux) if provided
    try {
      onToggleAutoPlay?.()
    } catch {}
  }, [autoPlayVideo])

  const handleReplay = useCallback(() => {
    setShowChapterEnd(false)
    if (playerRef.current) {
      playerRef.current.seekTo(0)
      handlers.onPlay()
    }
  }, [handlers])

  // Keyboard shortcuts with proper accessibility (throttled for f/t)
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
    state.isPiPSupported,
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
      {/* YouTube Player */}
      <div className="absolute inset-0">
        <ReactPlayer
          ref={playerRef}
          url={youtubeUrl}
          width="100%"
          height="100%"
          playing={state.playing && canPlayVideo && !state.isMiniPlayer}
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
          onDuration={(duration) => {
            setVideoDuration(duration)
            setIsLoadingDuration(false)
          }}
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
               allow:
                 "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
               allowFullScreen: true,
               // Hint browsers that we intend to use PiP where supported
               // Some browsers require explicit attribute on iframe
               // ReactPlayer forwards these attributes to the iframe
             },
           } as any}
        />
      </div>

      {/* Mini player fallback if PiP not supported: small re-mounted player */}
      {state.isMiniPlayer && miniPos && (
        <div
          className="fixed z-50 w-[320px] max-w-[85vw] rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/90 backdrop-blur-sm"
          style={{ left: miniPos.x, top: miniPos.y }}
          role="dialog"
          aria-label="Mini player"
        >
          <div
            className="absolute top-0 left-0 right-0 h-7 cursor-move bg-black/30 text-white/70 text-[11px] flex items-center px-2 select-none"
            onMouseDown={(e) => {
              draggingRef.current = true
              const startX = e.clientX
              const startY = e.clientY
              const orig = miniPos
              dragOffsetRef.current = { dx: startX - orig.x, dy: startY - orig.y }
              const onMove = (ev: MouseEvent) => {
                if (!draggingRef.current) return
                const nx = ev.clientX - dragOffsetRef.current.dx
                const ny = ev.clientY - dragOffsetRef.current.dy
                const w = window.innerWidth
                const h = window.innerHeight
                const width = Math.min(320, Math.max(240, Math.round(w * 0.5)))
                const height = Math.round((9 / 16) * width)
                const clamped = {
                  x: clamp(nx, 8, Math.max(8, w - width - 8)),
                  y: clamp(ny, 8, Math.max(8, h - height - 8)),
                }
                setMiniPos(clamped)
              }
              const onUp = () => {
                draggingRef.current = false
                if (miniPos) saveMiniPos(miniPos)
                document.removeEventListener('mousemove', onMove)
                document.removeEventListener('mouseup', onUp)
              }
              document.addEventListener('mousemove', onMove)
              document.addEventListener('mouseup', onUp)
            }}
          >
            Drag to reposition
          </div>
          <div className="relative w-full aspect-video">
            <ReactPlayer
              url={youtubeUrl}
              width="100%"
              height="100%"
              playing={state.playing && canPlayVideo}
              volume={state.volume}
              muted={state.muted}
              playbackRate={state.playbackRate}
              config={{ youtube: { playerVars: { controls: 1, playsinline: 1 } }, attributes: { allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" } } as any}
            />
            <div className="absolute top-1 right-1 flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7 bg-black/40 text-white hover:bg-black/60" onClick={() => {
                handlers.handlePictureInPictureToggle()
                // Notify parent component about PIP state change
                onPictureInPictureToggle?.(false)
              }} aria-label="Return to main player">
                ×
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent CourseAI Logo */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 opacity-70 hover:opacity-100 transition-opacity">
        <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 sm:p-1.5 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
          <span className="text-white font-bold text-xs select-none">CourseAI</span>
        </div>
      </div>

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

      {/* Overlay when native PiP is active to avoid double-visual confusion */}
      {state.isPictureInPicture && !state.isMiniPlayer && (
        <div className="absolute inset-0 z-20 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="px-3 py-2 rounded-md bg-black/60 text-white text-xs sm:text-sm flex items-center gap-3">
            <span>Playing in Picture‑in‑Picture</span>
            <Button size="sm" variant="secondary" onClick={() => {
              handlePictureInPicture()
              // Notify parent component about PIP state change
              onPictureInPictureToggle?.(false)
            }} aria-label="Return from Picture-in-Picture">
              Return
            </Button>
          </div>
        </div>
      )}

      {/* Play button overlay when paused */}
      {!state.playing && playerReady && canPlayVideo && !showChapterStart && !showChapterEnd && !state.isMiniPlayer && (
        <PlayButton onClick={handlePlayClick} />
      )}

      {/* Chapter Start Overlay */}
      <ChapterStartOverlay
        visible={showChapterStart && !state.isMiniPlayer}
        chapterTitle={chapterTitleRef.current}
        courseTitle={courseName}
        onComplete={handleChapterStartComplete}
        duration={3500}
        videoId={videoId}
      />

      {/* Chapter End Overlay - Only for final course completion; non-final overlays removed per request */}
      {progressStats?.progressPercentage === 100 && (
        <ChapterEndOverlay
          visible={showChapterEnd && !state.isMiniPlayer}
          chapterTitle={chapterTitleRef.current}
          nextChapterTitle={nextVideoTitle}
          hasNextChapter={false}
          onNextChapter={handleNextChapter}
          onReplay={handleReplay}
          onClose={() => setShowChapterEnd(false)}
          autoAdvanceDelay={5}
          autoAdvance={false}
          onCertificateDownload={handleCertificateDownload}
          certificateState={certificateState}
          isFinalChapter
          courseTitle={courseName}
          relatedCourses={relatedCourses}
          progressStats={progressStats}
          quizSuggestions={quizSuggestions}
          personalizedRecommendations={personalizedRecommendations}
          isKeyChapter={isKeyChapter}
        />
      )}

      {/* Auto-play notification for regular chapters */}
      <AutoPlayNotification
        visible={showAutoPlayNotification && !state.isMiniPlayer}
        nextChapterTitle={nextVideoTitle || "Next Chapter"}
        countdown={autoPlayCountdown}
        onContinue={handleAutoPlayContinue}
        onCancel={handleAutoPlayCancel}
      />

      {/* Next Chapter Notification - Small modal in bottom right for auto-play */}
      <NextChapterNotification
        visible={showNextChapterNotification && !state.isMiniPlayer}
        nextChapterTitle={nextVideoTitle || "Next Chapter"}
        countdown={nextChapterCountdown}
        onContinue={handleNextChapterNotificationContinue}
        onCancel={handleNextChapterNotificationCancel}
        autoAdvance={state.autoPlayNext}
      />

      {/* Transition overlay removed per request */}

      {/* CourseAI Logo Overlay */}
      <AnimatedCourseAILogo
        show={showCourseAILogo && !state.isMiniPlayer}
        videoEnding={showChapterTransition}
        onAnimationComplete={() => setShowCourseAILogo(false)}
      />

      {/* Enhanced Custom controls */}
      {canPlayVideo && !state.isMiniPlayer && (
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
            isPiPActive={state.isPictureInPicture}
            onToggleTheaterMode={handlers.handleTheaterModeToggle}
            isTheaterMode={state.theaterMode}

           />
        </div>
      )}

      {/* Floating mini controls when player is not fully in view */}
      {canPlayVideo && !isInView && !state.isMiniPlayer && (
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
