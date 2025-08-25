"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
const ReactPlayer: any = dynamic(() => import("react-player/youtube"), { ssr: false })
import { useSession } from "next-auth/react"
import { useVideoPlayer } from "../hooks/useVideoPlayer"
import PlayerControls from "./PlayerControls"

import VideoErrorState from "./VideoErrorState"
import BookmarkManager from "./BookmarkManager"
import KeyboardShortcutsModal from "../../KeyboardShortcutsModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Lock, User, Maximize } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import type { VideoPlayerProps } from "../types"
import ChapterStartOverlay from "./ChapterStartOverlay"
import ChapterEndOverlay from "./ChapterEndOverlay"
import AutoPlayNotification from "./AutoPlayNotification"
import EnhancedMiniPlayer from "./EnhancedMiniPlayer"

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

// Theater Mode Toggle Button
const TheaterModeButton = React.memo(({ 
  isTheater, 
  onToggle 
}: { 
  isTheater: boolean
  onToggle: () => void 
}) => (
  <button
    className="absolute top-2 left-2 sm:top-4 sm:left-4 z-30 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white/80 hover:text-white transition-all duration-200"
    onClick={onToggle}
    aria-label={isTheater ? "Exit theater mode" : "Enter theater mode"}
    title={isTheater ? "Exit theater mode" : "Enter theater mode"}
  >
    <Maximize className="h-4 w-4" />
  </button>
))

TheaterModeButton.displayName = "TheaterModeButton"

// Certificate download states
type CertificateState = "idle" | "downloading" | "success" | "error"

const VideoPlayer: React.FC<VideoPlayerProps & { 
  onTheaterModeToggle?: (isTheater: boolean) => void
  isTheaterMode?: boolean
}> = ({
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
  onTheaterModeToggle,
  isTheaterMode = false,
}) => {
  const { data: session } = useSession()
  // Derive effective authentication (prop can override but session acts as fallback)
  const effectiveIsAuthenticated = isAuthenticated || !!session?.user
  const youtubeVideoIdRef = useRef(youtubeVideoId)

  // Consolidated state management with performance optimizations
  const [overlayState, setOverlayState] = useState({
    showBookmarkPanel: false,
    showChapterStart: false,
    showChapterEnd: false,
    showNextChapterNotification: false,
    showChapterTransition: false,
    showCourseAILogo: false,
    showAutoPlayNotification: false,
    showNextChapterAutoOverlay: false,
    chapterStartShown: false,
  })

  const [countdowns, setCountdowns] = useState({
    nextChapter: 5,
    chapterTransition: 5,
    autoPlay: 5,
    nextChapterAuto: 5,
  })

  const [playerState, setPlayerState] = useState({
    videoDuration: 0,
    isLoadingDuration: true,
    hasPlayedFreeVideo: false,
    showAuthPrompt: false,
    canPlayVideo: false,
    playerReady: false,
    isHovering: false,
    showControlsState: showControls,
    certificateState: "idle" as CertificateState,
    autoPlayVideo: false,
    isMounted: false,
    isNativePiPActive: false,
    isMiniPlayerActive: false,
  })

  const [miniPlayerState, setMiniPlayerState] = useState({
    position: { x: 100, y: 100 },
    isDragging: false,
    dragOffset: { dx: 0, dy: 0 }
  })

  // Refs for cleanup and performance
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chapterTitleRef = useRef(chapterTitle)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const lastFsToggleRef = useRef<number>(0)
  const intervalRefs = useRef<{
    nextNotif: ReturnType<typeof setInterval> | null
    autoPlay: ReturnType<typeof setInterval> | null
    chapterTransition: ReturnType<typeof setInterval> | null
  }>({ nextNotif: null, autoPlay: null, chapterTransition: null })
  const lastForcedVideoRef = useRef<string | null>(null)

  // Helper functions
  const clamp = useCallback((val: number, min: number, max: number) => 
    Math.max(min, Math.min(max, val)), [])

  // Determine if video should autoplay
  const shouldAutoPlay = useCallback((): boolean => {
    return !!(
      playerState.canPlayVideo && 
      playerState.playerReady && 
      (autoPlay || playerState.autoPlayVideo) &&
      !playerState.isMiniPlayerActive &&
      !playerState.isNativePiPActive
    )
  }, [playerState.canPlayVideo, playerState.playerReady, autoPlay, playerState.autoPlayVideo, playerState.isMiniPlayerActive, playerState.isNativePiPActive])

  // Video end handler with improved logic
  const handleVideoEnd = useCallback(() => {
    onEnded?.()

    // Mark free video as played if not authenticated
    if (!isAuthenticated && !playerState.hasPlayedFreeVideo) {
      try {
        localStorage.setItem("hasPlayedFreeVideo", "true")
        setPlayerState(prev => ({ ...prev, hasPlayedFreeVideo: true }))
      } catch (error) {
        console.warn('Failed to save free video state:', error)
      }
    }
    
    const isCourseCompleted = progressStats?.progressPercentage === 100

  if (isCourseCompleted) {
      setOverlayState(prev => ({ ...prev, showChapterEnd: true }))
    } else if (onNextVideo && playerState.autoPlayVideo) {
      // Start auto-advance countdown
      setOverlayState(prev => ({ ...prev, showAutoPlayNotification: true }))
      setCountdowns(prev => ({ ...prev, autoPlay: 5 }))
      
      if (intervalRefs.current.autoPlay) clearInterval(intervalRefs.current.autoPlay)
      intervalRefs.current.autoPlay = setInterval(() => {
        setCountdowns(prev => {
          const newCount = prev.autoPlay - 1
            if (newCount <= 0) {
            if (intervalRefs.current.autoPlay) clearInterval(intervalRefs.current.autoPlay)
            setOverlayState(prevOverlay => ({ ...prevOverlay, showAutoPlayNotification: false }))
            // Use safe deferred caller to avoid setState during render
            safeOnNextVideo()
            return { ...prev, autoPlay: 5 }
          }
          return { ...prev, autoPlay: newCount }
        })
      }, 1000)
    } else {
      setOverlayState(prev => ({ ...prev, showChapterEnd: true }))
    }
  }, [onEnded, isAuthenticated, playerState.hasPlayedFreeVideo, progressStats?.progressPercentage, onNextVideo, playerState.autoPlayVideo])

  // Safe deferred call to onNextVideo to avoid updating parent while rendering this component
  const safeOnNextVideo = useCallback(() => {
    if (!onNextVideo) return
    setTimeout(() => {
      try {
        onNextVideo()
      } catch (e) {
        console.warn('safeOnNextVideo failed', e)
      }
    }, 0)
  }, [onNextVideo])

  // Initialize video player hook
  const { state, playerRef, containerRef, bufferHealth, youtubeUrl, handleProgress, handlers } =
    useVideoPlayer({
      youtubeVideoId,
      courseId: String(courseId || ''),
      chapterId: String(chapterId || ''),
      onEnded: handleVideoEnd,
      onProgress: (progressState) => {
        // Forward progress to parent - persistence is handled by parent hook
        onProgress?.(progressState)
      },
      onTimeUpdate,
      rememberPlaybackPosition,
      rememberPlaybackSettings,
      onBookmark,
      autoPlay: shouldAutoPlay(),
      onVideoLoad,
      onCertificateClick,
    })

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
    } catch (error) {
      console.warn('Failed to load mini player position:', error)
    }

    setMiniPlayerState(prev => ({ ...prev, position: initial }))

    const onResize = () => {
      const nw = window.innerWidth
      const nh = window.innerHeight
      setMiniPlayerState(prev => ({
        ...prev,
        position: {
          x: clamp(prev.position.x, 8, Math.max(8, nw - width - 8)),
          y: clamp(prev.position.y, 8, Math.max(8, nh - height - 8)),
        }
      }))
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clamp])

  // Initialize component state
  useEffect(() => {
    setPlayerState(prev => ({
      ...prev,
      isMounted: true,
      ...authenticationState
    }))

    // Load autoplay preference
    try {
      const saved = localStorage.getItem('video-autoplay')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed === 'boolean') {
          setPlayerState(prev => ({ ...prev, autoPlayVideo: parsed }))
        }
      }
    } catch (error) {
      console.warn('Failed to load auto-play video preference:', error)
    }

    // Initialize completed chapters
    // TODO: Implement completed chapters loading if needed
    // if (session?.user?.id) {
    //   progressApi.loadCompletedChapters(session.user.id)
    // }

    return () => {
      setPlayerState(prev => ({ ...prev, isMounted: false }))
      // Cleanup intervals
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval)
      })
    }
  }, [authenticationState, session?.user?.id])

  // Enhanced PiP detection and state management
  useEffect(() => {
    const handleEnterPiP = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        isNativePiPActive: true,
        isMiniPlayerActive: false
      }))
      onPictureInPictureToggle?.(true)
    }

    const handleLeavePiP = () => {
      setPlayerState(prev => ({ ...prev, isNativePiPActive: false }))
      onPictureInPictureToggle?.(false)
    }

    // Check initial state
    const pipElement = (document as any).pictureInPictureElement
    setPlayerState(prev => ({ ...prev, isNativePiPActive: !!pipElement }))

    if (typeof document !== "undefined") {
      document.addEventListener('enterpictureinpicture', handleEnterPiP)
      document.addEventListener('leavepictureinpicture', handleLeavePiP)

      return () => {
        document.removeEventListener('enterpictureinpicture', handleEnterPiP)
        document.removeEventListener('leavepictureinpicture', handleLeavePiP)
      }
    }
  }, [onPictureInPictureToggle])

  // Sync mini player state with hook
  useEffect(() => {
    setPlayerState(prev => ({ ...prev, isMiniPlayerActive: state.isMiniPlayer }))
  }, [state.isMiniPlayer])

  // Update refs when props change
  useEffect(() => {
    chapterTitleRef.current = chapterTitle
    youtubeVideoIdRef.current = youtubeVideoId
  }, [chapterTitle, youtubeVideoId])

  // Safe video element getter
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    if (!playerState.isMounted || !containerRef.current) return null

    try {
      // Try to get video from React Player iframe
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
  }, [playerState.isMounted, containerRef])

  // Enhanced PIP handling - FIXED to properly hide main player
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
        if (playerState.isNativePiPActive) {
          await (document as any).exitPictureInPicture()
        } else {
          // Ensure mini-player is off when entering native PiP
          if (playerState.isMiniPlayerActive && handlers.handlePictureInPictureToggle) {
            handlers.handlePictureInPictureToggle()
          }
          await (videoEl as any).requestPictureInPicture()
        }
        return
      }

      // Fallback to custom mini player
      if (handlers.handlePictureInPictureToggle) {
        const nextMiniState = !playerState.isMiniPlayerActive

        // If turning on mini-player and native PiP is active, exit PiP first
        if (nextMiniState && playerState.isNativePiPActive && (document as any).exitPictureInPicture) {
          try {
            await (document as any).exitPictureInPicture()
          } catch (error) {
            console.warn('Failed to exit native PiP:', error)
          }
        }

        handlers.handlePictureInPictureToggle()
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
  }, [getVideoElement, handlers.handlePictureInPictureToggle, onPictureInPictureToggle, toast, playerState.isNativePiPActive, playerState.isMiniPlayerActive])

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

  // Enhanced player ready handler with proper autoplay
  const handlePlayerReady = useCallback(() => {
    setPlayerState(prev => ({ 
      ...prev, 
      playerReady: true, 
      isLoadingDuration: false 
    }))
    stopLoading()

    if (playerRef.current) {
      try {
        const duration = playerRef.current.getDuration()
        if (duration && duration > 0) {
          setPlayerState(prev => ({ ...prev, videoDuration: duration }))
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
          const dur = playerRef.current.getDuration() || playerState.videoDuration || state.duration || 0
          if (dur > 0 && initialSeekSeconds < dur - 1) {
            playerRef.current.seekTo(Math.max(0, initialSeekSeconds))
          }
        } catch (error) {
          console.warn("Failed to seek to initial position:", error)
        }
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

    // FIXED: Improved autoplay logic
    const shouldStart = shouldAutoPlay()
    if (shouldStart) {
      // Small delay to ensure player is fully ready
      setTimeout(() => {
        try {
          // Ensure muted for autoplay compliance
          if (!state.muted) {
            handlers.onMute()
          }
          handlers.onPlay()
        } catch (error) {
          console.warn("Autoplay failed:", error)
        }
      }, 200)
    }
  }, [handlers, onVideoLoad, courseName, youtubeVideoId, onPlayerReady, stopLoading, playerState.videoDuration, state.duration, state.muted, initialSeekSeconds, shouldAutoPlay])

  // Enhanced play handler
  const handlePlayClick = useCallback(() => {
    if (!playerState.canPlayVideo) {
      if (!isAuthenticated && playerState.hasPlayedFreeVideo) {
        toast({
          title: "Sign in required",
          description: "Please sign in to watch more videos. You've used your free preview.",
          variant: "destructive",
        })
        return
      }
    }

    if (!playerState.playerReady) {
      toast({
        title: "Video loading",
        description: "Please wait for the video to finish loading.",
      })
      return
    }

    handlers.onPlayPause()
  }, [playerState.canPlayVideo, isAuthenticated, playerState.hasPlayedFreeVideo, playerState.playerReady, handlers, toast])

  // Theater mode handler
  const handleTheaterModeToggle = useCallback(() => {
    const newTheaterMode = !isTheaterMode
    onTheaterModeToggle?.(newTheaterMode)
    
    try {
      localStorage.setItem('video-theater-mode', JSON.stringify(newTheaterMode))
    } catch (error) {
      console.warn('Failed to save theater mode preference:', error)
    }
  }, [isTheaterMode, onTheaterModeToggle])

  // Auto-hide controls with improved logic
  useEffect(() => {
    const handleMouseMove = () => {
      setPlayerState(prev => ({ ...prev, showControlsState: true }))

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      if (state.playing && 
          !playerState.isHovering && 
          !overlayState.showChapterStart && 
          !overlayState.showChapterEnd &&
          !playerState.isMiniPlayerActive) {
        controlsTimeoutRef.current = setTimeout(() => {
          setPlayerState(prev => ({ ...prev, showControlsState: false }))
        }, 4500)
      }
    }

    const container = containerRef.current
    if (container && playerState.isMounted) {
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
  }, [containerRef, state.playing, playerState.isHovering, overlayState.showChapterStart, overlayState.showChapterEnd, playerState.isMounted, playerState.isMiniPlayerActive])

  // Reset overlay states when video changes
  useEffect(() => {
    setOverlayState({
      showBookmarkPanel: false,
      showChapterStart: false,
      showChapterEnd: false,
      showNextChapterNotification: false,
      showChapterTransition: false,
      showCourseAILogo: false,
      showAutoPlayNotification: false,
      showNextChapterAutoOverlay: false,
      chapterStartShown: false,
    })
    setCountdowns({
      nextChapter: 5,
      chapterTransition: 5,
      autoPlay: 5,
      nextChapterAuto: 5,
    })
    setPlayerState(prev => ({
      ...prev,
      playerReady: false,
      videoDuration: 0,
      isLoadingDuration: true,
      certificateState: "idle" as CertificateState,
    }))

    // Clear all intervals
    Object.values(intervalRefs.current).forEach(interval => {
      if (interval) clearInterval(interval)
    })
    intervalRefs.current = { nextNotif: null, autoPlay: null, chapterTransition: null }
  }, [youtubeVideoId])

  // Load saved progress position and show resume prompt
  useEffect(() => {
    const loadSavedPosition = async () => {
      if (!isAuthenticated || !rememberPlaybackPosition || !courseId || !chapterId) return
      
      try {
        const response = await fetch(`/api/progress/${courseId}`)
        if (response.ok) {
          const result = await response.json()
          const progress = result.progress
          
          if (progress && progress.currentChapterId === Number(chapterId)) {
            const savedSeconds = progress.playedSeconds || 0
            
            // Only resume if there's meaningful progress (more than 30 seconds)
            if (savedSeconds > 30) {
              const shouldResume = window.confirm(
                `Resume from ${Math.floor(savedSeconds / 60)}:${Math.floor(savedSeconds % 60).toString().padStart(2, '0')}?`
              )
              
              if (shouldResume && playerRef.current) {
                playerRef.current.seekTo(savedSeconds)
                toast({
                  title: "Playback resumed",
                  description: `Resumed from ${Math.floor(savedSeconds / 60)}:${Math.floor(savedSeconds % 60).toString().padStart(2, '0')}`,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load saved position:", error)
      }
    }
    
    if (playerState.playerReady) {
      loadSavedPosition()
    }
  }, [isAuthenticated, rememberPlaybackPosition, courseId, chapterId, playerState.playerReady])

  // Keyboard shortcuts
  useEffect(() => {
    if (!playerState.isMounted || !playerState.canPlayVideo) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }

      if (overlayState.showChapterStart || overlayState.showChapterEnd) return

      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault()
          handlePlayClick()
          break
        case "b":
        case "B":
          if (event.shiftKey) {
            event.preventDefault()
            handleToggleBookmarkPanel()
          } else {
            event.preventDefault()
            // Add bookmark at current time
            handleAddBookmark(state.lastPlayedTime)
          }
          break
        case "ArrowRight":
          event.preventDefault()
          handlers.onSeek(Math.min(playerState.videoDuration, state.lastPlayedTime + 10))
          break
        case "ArrowLeft":
          event.preventDefault()
          handlers.onSeek(Math.max(0, state.lastPlayedTime - 10))
          break
        case "m":
          event.preventDefault()
          handlers.onMute()
          break
        case "t":
          event.preventDefault()
          handleTheaterModeToggle()
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
    playerState.isMounted,
    playerState.canPlayVideo,
    overlayState.showChapterStart,
    overlayState.showChapterEnd,
    handlePlayClick,
    handlers,
    playerState.videoDuration,
    state.lastPlayedTime,
    state.isFullscreen,
    handlePictureInPicture,
    handleTheaterModeToggle,
  ])

  // Handler functions for overlays
  const handleAutoPlayContinue = useCallback(() => {
    setOverlayState(prev => ({ ...prev, showAutoPlayNotification: false }))
    if (intervalRefs.current.autoPlay) {
      clearInterval(intervalRefs.current.autoPlay)
      intervalRefs.current.autoPlay = null
    }
  safeOnNextVideo()
  }, [onNextVideo])

  const handleAutoPlayCancel = useCallback(() => {
    setOverlayState(prev => ({ ...prev, showAutoPlayNotification: false }))
    setCountdowns(prev => ({ ...prev, autoPlay: 5 }))
    if (intervalRefs.current.autoPlay) {
      clearInterval(intervalRefs.current.autoPlay)
      intervalRefs.current.autoPlay = null
    }
  }, [])

  const handleNextChapter = useCallback(() => {
    setOverlayState(prev => ({ ...prev, showChapterEnd: false }))
  safeOnNextVideo()
  }, [onNextVideo])

  const handleReplay = useCallback(() => {
    setOverlayState(prev => ({ ...prev, showChapterEnd: false }))
    if (playerRef.current) {
      playerRef.current.seekTo(0)
      handlers.onPlay()
    }
  }, [handlers])

  const handleToggleAutoPlayVideo = useCallback(() => {
    const newValue = !playerState.autoPlayVideo
    setPlayerState(prev => ({ ...prev, autoPlayVideo: newValue }))

    try {
      localStorage.setItem('video-autoplay', JSON.stringify(newValue))
    } catch (error) {
      console.warn('Could not save auto-play preference:', error)
    }

    onToggleAutoPlay?.()
  }, [playerState.autoPlayVideo, onToggleAutoPlay])

  const handleChapterStartComplete = useCallback(() => {
    const animationFrame = requestAnimationFrame(() => {
      setOverlayState(prev => ({ ...prev, showChapterStart: false }))
    })
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  // Bookmark handlers
  const handleAddBookmark = useCallback(
    (time: number, title?: string) => {
  if (!effectiveIsAuthenticated) {
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
  [handlers, effectiveIsAuthenticated, toast, formatTime],
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
      if (!playerState.canPlayVideo) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use video controls.",
          variant: "destructive",
        })
        return
      }
      handlers.onSeek(time)
    },
    [handlers, playerState.canPlayVideo, toast],
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
    setOverlayState(prev => ({ ...prev, showBookmarkPanel: !prev.showBookmarkPanel }))
  }, [isAuthenticated, toast])

  // Certificate download handler
  const handleCertificateDownload = useCallback(async () => {
    if (playerState.certificateState !== "idle") return

    setPlayerState(prev => ({ ...prev, certificateState: "downloading" }))

    try {
      await onCertificateClick?.()
      setPlayerState(prev => ({ ...prev, certificateState: "success" }))

      toast({
        title: "Certificate downloaded",
        description: "Your course completion certificate has been downloaded successfully.",
      })

      setTimeout(() => {
        setPlayerState(prev => ({ ...prev, certificateState: "idle" }))
      }, 3000)
    } catch (error) {
      setPlayerState(prev => ({ ...prev, certificateState: "error" }))
      toast({
        title: "Download failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      })

      setTimeout(() => {
        setPlayerState(prev => ({ ...prev, certificateState: "idle" }))
      }, 3000)
    }
  }, [playerState.certificateState, onCertificateClick, toast])

  // Save mini player position
  const saveMiniPos = useCallback((pos: { x: number; y: number }) => {
    try {
      localStorage.setItem('mini-player-pos', JSON.stringify(pos))
    } catch {
      console.warn('Failed to save mini player position')
    }
  }, [])

  // Memoized authentication prompt
  const authPromptComponent = useMemo(() => {
    if (!playerState.showAuthPrompt || playerState.canPlayVideo) return null

    return (
      <AuthPrompt
        videoId={youtubeVideoId}
        onSignIn={() => (window.location.href = "/api/auth/signin")}
        onClose={() => setPlayerState(prev => ({ ...prev, showAuthPrompt: false }))}
      />
    )
  }, [playerState.showAuthPrompt, playerState.canPlayVideo, youtubeVideoId])

  // Early return for authentication prompt
  if (authPromptComponent) {
    return <div className={cn("relative w-full h-full", className)}>{authPromptComponent}</div>
  }

  // Duration handler
  const onDurationHandler = useCallback((duration: number) => {
    setPlayerState(prev => ({
      ...prev,
      videoDuration: duration,
      isLoadingDuration: false
    }))
  }, [])

  // Determine if mini player should be shown
  const shouldShowMiniPlayer = state.isMiniPlayer && !playerState.isNativePiPActive && playerState.isMounted

  // Determine if main player should be completely hidden
  const shouldHideMainPlayer = shouldShowMiniPlayer || playerState.isNativePiPActive

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative object-contain w-full h-full bg-black overflow-hidden group video-player-container",
        isTheaterMode && "theater-mode",
        className,
      )}
      onMouseEnter={() => setPlayerState(prev => ({ ...prev, isHovering: true }))}
      onMouseLeave={() => setPlayerState(prev => ({ ...prev, isHovering: false }))}
      role="application"
      aria-label="Video player"
      tabIndex={0}
    >
      {/* Main YouTube Player - completely hidden when in PiP modes */}
      {!shouldHideMainPlayer && (
        <div className="absolute inset-0">
          <ReactPlayer
            ref={playerRef}
            url={youtubeUrl}
            width="100%"
            height="100%"
            playing={state.playing && playerState.canPlayVideo}
            volume={state.volume}
            muted={state.muted || (shouldAutoPlay() && !state.userInteracted)}
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
                  autoplay: shouldAutoPlay() ? 1 : 0,
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
      )}

      {/* Theater Mode Toggle Button */}
      {!shouldHideMainPlayer && (
        <TheaterModeButton 
          isTheater={isTheaterMode}
          onToggle={handleTheaterModeToggle}
        />
      )}

      {/* CourseAI Logo */}
      {!shouldHideMainPlayer && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 opacity-70 hover:opacity-100 transition-opacity">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 sm:p-1.5 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
            <span className="text-white font-bold text-xs select-none">CourseAI</span>
          </div>
        </div>
      )}

      {/* Enhanced Mini Player */}
      {shouldShowMiniPlayer && (
        <EnhancedMiniPlayer
          visible={true}
          position={miniPlayerState.position}
          onPositionChange={(pos) => {
            setMiniPlayerState(prev => ({ ...prev, position: pos }))
            saveMiniPos(pos)
          }}
          onClose={() => {
            if (handlers.handlePictureInPictureToggle) {
              handlers.handlePictureInPictureToggle()
            }
            onPictureInPictureToggle?.(false)
          }}
          onExpand={() => {
            if (handlers.handlePictureInPictureToggle) {
              handlers.handlePictureInPictureToggle()
            }
            onPictureInPictureToggle?.(false)
          }}
          videoUrl={youtubeUrl}
          playing={state.playing && playerState.canPlayVideo}
          volume={state.volume}
          muted={state.muted}
          title={courseName}
          chapterTitle={chapterTitle}
          currentTime={formatTime(state.lastPlayedTime)}
          duration={formatTime(playerState.videoDuration || state.duration)}
          onPlayPause={handlePlayClick}
          onVolumeToggle={handlers.onMute}
          onNext={safeOnNextVideo}
          hasNext={!!onNextVideo}
          nextTitle={nextVideoTitle}
          played={state.played}
          onSeek={(percent) => {
            const time = (playerState.videoDuration || state.duration) * percent
            handlers.onSeek(time)
          }}
          thumbnail={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
        />
      )}

      {/* Native PiP Placeholder */}
      {playerState.isNativePiPActive && (
        <div className="absolute inset-0 z-20 bg-black/90 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553-.894l2-1A1 1 0 0018 9V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Playing in Picture-in-Picture</h3>
              <p className="text-sm text-white/70 mb-4">
                The video is currently playing in a separate window
              </p>
            </div>
            <Button
              onClick={handlePictureInPicture}
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              Return to Main Player
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state.playerError && !shouldHideMainPlayer && (
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

      {/* Play Button Overlay */}
      {!state.playing && 
       playerState.playerReady && 
       playerState.canPlayVideo && 
       !overlayState.showChapterStart && 
       !overlayState.showChapterEnd && 
       !shouldHideMainPlayer && (
        <PlayButton onClick={handlePlayClick} />
      )}

      {/* Chapter Start Overlay */}
      {!shouldHideMainPlayer && (
        <ChapterStartOverlay
          visible={overlayState.showChapterStart}
          chapterTitle={chapterTitleRef.current}
          courseTitle={courseName}
          onComplete={handleChapterStartComplete}
          duration={3500}
          videoId={youtubeVideoId}
        />
      )}

      {/* Chapter End Overlay */}
      {overlayState.showChapterEnd && 
       !shouldHideMainPlayer && 
       (!onNextVideo || progressStats?.progressPercentage === 100) && (
        <ChapterEndOverlay
          visible={true}
          chapterTitle={chapterTitleRef.current}
          nextChapterTitle={nextVideoTitle}
          hasNextChapter={!!onNextVideo}
          onNextChapter={handleNextChapter}
          onReplay={handleReplay}
          onClose={() => setOverlayState(prev => ({ ...prev, showChapterEnd: false }))}
          autoAdvanceDelay={5}
          autoAdvance={!!onNextVideo}
          onCertificateDownload={handleCertificateDownload}
          certificateState={playerState.certificateState}
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
      {!shouldHideMainPlayer && (
        <AutoPlayNotification
          visible={overlayState.showAutoPlayNotification}
          nextChapterTitle={nextVideoTitle || "Next Chapter"}
          countdown={countdowns.autoPlay}
          onContinue={handleAutoPlayContinue}
          onCancel={handleAutoPlayCancel}
        />
      )}

      {/* Player Controls - hidden when in PiP modes */}
      {playerState.canPlayVideo && !shouldHideMainPlayer && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-40 transition-opacity duration-300",
            !playerState.showControlsState && 
            !playerState.isHovering && 
            state.playing && 
            !overlayState.showChapterStart && 
            !overlayState.showChapterEnd && "opacity-0",
          )}
          style={{
            pointerEvents:
              playerState.showControlsState || 
              playerState.isHovering || 
              !state.playing || 
              overlayState.showChapterStart || 
              overlayState.showChapterEnd ? "auto" : "none",
          }}
        >
          <PlayerControls
            playing={state.playing}
            muted={state.muted}
            volume={state.volume}
            playbackRate={state.playbackRate}
            played={state.played}
            loaded={state.loaded}
            duration={playerState.videoDuration || state.duration}
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
            isAuthenticated={effectiveIsAuthenticated}
            onCertificateClick={onCertificateClick}
            show={playerState.showControlsState}
            onShowKeyboardShortcuts={handlers.handleShowKeyboardShortcuts}
            onNextVideo={safeOnNextVideo}
            onToggleBookmarkPanel={handleToggleBookmarkPanel}
              bookmarkPanelOpen={overlayState.showBookmarkPanel}
            autoPlayNext={state.autoPlayNext}
            onToggleAutoPlayNext={handlers.toggleAutoPlayNext}
            autoPlayVideo={playerState.autoPlayVideo}
            onToggleAutoPlayVideo={handleToggleAutoPlayVideo}
            onPictureInPicture={handlePictureInPicture}
            isPiPSupported={state.isPiPSupported}
            isPiPActive={shouldHideMainPlayer}
            isTheaterMode={isTheaterMode}
            onToggleTheaterMode={handleTheaterModeToggle}
          />
        </div>
      )}

      {/* Bookmark Panel */}
  {overlayState.showBookmarkPanel && effectiveIsAuthenticated && !shouldHideMainPlayer && (
        <div className="absolute top-0 right-0 bottom-16 w-64 sm:w-72 bg-black/80 backdrop-blur-sm z-30 border-l border-white/10">
          <BookmarkManager
            videoId={youtubeVideoId}
            bookmarks={bookmarks}
            currentTime={state.lastPlayedTime}
            duration={playerState.videoDuration || state.duration}
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