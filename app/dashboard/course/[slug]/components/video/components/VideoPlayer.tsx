"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
const ReactPlayer: any = dynamic(() => import("react-player/youtube"), { ssr: false })
import { useAuth } from "@/modules/auth"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { setVideoProgress } from "@/store/slices/courseProgress-slice"
import { useVideoPlayer } from "../hooks/useVideoPlayer"
import { useToastThrottle } from "../hooks/useToastThrottle"
import PlayerControls from "./PlayerControls"

import VideoErrorState from "./VideoErrorState"
import BookmarkManager from "./BookmarkManager"
import { NotesPanel } from "./NotesPanel"
import KeyboardShortcutsModal from "@/app/dashboard/course/[slug]/components/KeyboardShortcutsModal"
import { Button } from "@/components/ui/button"
import { getYouTubeThumbnailUrl } from "@/utils/youtube-thumbnails"
import { Play, Maximize } from "lucide-react"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import { toast } from "@/components/ui/use-toast"
import type { VideoPlayerProps } from "../types"
import ChapterStartOverlay from "./ChapterStartOverlay"
import ChapterEndOverlay from "./ChapterEndOverlay"
import AutoPlayNotification from "./AutoPlayNotification"
import EnhancedMiniPlayer from "./YouTubePIP"
import { storageManager } from "@/utils/storage-manager"
import {  videoService } from "@/services/video-playback-service"
import { useNotes } from "@/hooks/use-notes"

// Memoized play button to prevent unnecessary re-renders
const PlayButton = React.memo(({ onClick }: { onClick: () => void }) => (
  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
    <button
      className="rounded-full p-6 sm:p-8 cursor-pointer pointer-events-auto transition-all duration-100 hover:scale-110 focus:outline-none bg-white/90 backdrop-blur-sm text-black hover:bg-white"
      onClick={onClick}
      aria-label="Play video"
      type="button"
    >
      <Play className="h-12 w-12 sm:h-16 sm:w-16 fill-black" />
    </button>
  </div>
))

PlayButton.displayName = "PlayButton"

// Theater Mode Toggle Button
const TheaterModeButton = React.memo(
  ({
    isTheater,
    onToggle,
  }: {
    isTheater: boolean
    onToggle: () => void
  }) => (
    <button
      className="absolute z-30 rounded-none p-2 transition-all duration-100 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white top-4 right-4"
      onClick={onToggle}
      aria-label={isTheater ? "Exit theater mode" : "Enter theater mode"}
      title={isTheater ? "Exit theater mode (ESC or T)" : "Enter theater mode (T)"}
    >
      <Maximize className="h-5 w-5" />
    </button>
  ),
)

TheaterModeButton.displayName = "TheaterModeButton"

// Certificate download states
type CertificateState = "idle" | "downloading" | "success" | "error"

const VideoPlayer = React.memo<VideoPlayerProps>(
  ({
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
    isPiPActive = false,
    isCustomPiPActive = false,
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
    isLoading = false,
  }) => {
    const { isAuthenticated: effectiveIsAuthenticated } = useAuth()
    const dispatch = useAppDispatch()
    
    // Derive effective authentication (prop can override but auth state acts as fallback)
    const youtubeVideoIdRef = useRef(youtubeVideoId)

    // Initialize throttled toast for bookmark notifications (1.5 second throttle)
    const { showThrottledToast, cleanup: cleanupThrottle } = useToastThrottle(1500)

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
      showNotesPanel: false,
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
      dragOffset: { dx: 0, dy: 0 },
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
    const hasRestoredPositionRef = useRef<string | null>(null) // Track which chapter we've restored

    // Helper functions using video service
    const clamp = useCallback((val: number, min: number, max: number) => videoService.clamp(val, min, max), [])

    // Determine if video should autoplay using video service
    const shouldAutoPlay = useCallback((): boolean => {
      return videoService.shouldAutoPlay(
        playerState.canPlayVideo,
        playerState.playerReady,
        autoPlay,
        playerState.autoPlayVideo,
        playerState.isMiniPlayerActive,
        playerState.isNativePiPActive,
      )
    }, [
      playerState.canPlayVideo,
      playerState.playerReady,
      autoPlay,
      playerState.autoPlayVideo,
      playerState.isMiniPlayerActive,
      playerState.isNativePiPActive,
    ])

    // Video end handler with certificate trigger
    const handleVideoEnd = useCallback(() => {
      console.log(`[VideoPlayer] ✅ Video ended for chapter ${chapterId}`)
      
      // ✅ Show certificate if course is complete
      const progressPercentage = progressStats?.progressPercentage ?? 0
      if (progressPercentage >= 100 && onCertificateClick) {
        console.log(`[VideoPlayer] 🎓 Course complete! Showing certificate...`)
        setTimeout(() => {
          onCertificateClick()
        }, 1000) // Small delay for better UX
      }
      
      // Call original video service handler
      videoService.handleVideoEnd(
        onEnded,
        isAuthenticated,
        playerState.hasPlayedFreeVideo,
        progressStats?.progressPercentage,
        onNextVideo,
        playerState.autoPlayVideo,
        setOverlayState,
        setCountdowns,
        intervalRefs,
      )
    }, [
      chapterId,
      onEnded,
      isAuthenticated,
      playerState.hasPlayedFreeVideo,
      playerState.autoPlayVideo,
      progressStats?.progressPercentage,
      onNextVideo,
      onCertificateClick,
    ])

    // Initialize video player hook
    const { state, playerRef, containerRef, bufferHealth, youtubeUrl, handleProgress, handlers } = useVideoPlayer({
      youtubeVideoId,
      courseId: String(courseId || ""),
      chapterId: String(chapterId || ""),
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

    // Safe deferred call to onNextVideo to avoid updating parent while rendering this component
    // CRITICAL: Pause video before transitioning to prevent video playing while loading overlay shows
    const safeOnNextVideo = useCallback(() => {
      if (!onNextVideo) return

      // Pause video immediately when user clicks next
      if (playerRef.current && state.playing) {
        handlers.onPause()
      }

      setTimeout(() => {
        try {
          onNextVideo()
        } catch (e) {
          console.warn("safeOnNextVideo failed", e)
        }
      }, 0)
    }, [onNextVideo, state.playing, handlers, playerRef])

    // Initialize notes hook for chapter-specific notes
    const {
      notes: chapterNotes,
      createNote,
      loading: notesLoading,
    } = useNotes({
      courseId:
        typeof courseId === "string" ? Number.parseInt(courseId) : typeof courseId === "number" ? courseId : undefined,
      chapterId:
        typeof chapterId === "string"
          ? Number.parseInt(chapterId)
          : typeof chapterId === "number"
            ? chapterId
            : undefined,
      limit: 50,
    })

    // Enhanced authentication and video access check using video service
    const authenticationState = useMemo(() => {
      return videoService.getAuthenticationState(youtubeVideoId, effectiveIsAuthenticated, courseId)
    }, [youtubeVideoId, effectiveIsAuthenticated, courseId])

    // Memoize bookmark times array to prevent unnecessary re-renders in PlayerControls
    const bookmarkTimes = useMemo(() => bookmarks.map((b) => b.time), [bookmarks])

    // Initialize mini player position using video service
    useEffect(() => {
      if (typeof window === "undefined") return

      const width = 320
      const height = Math.round((9 / 16) * width)

      try {
        const videoSettings = videoService.getVideoSettings()
        const initial = videoService.calculateMiniPlayerPosition(videoSettings.miniPlayerPos, width, height)
        setMiniPlayerState((prev) => ({ ...prev, position: initial }))
      } catch (error) {
        console.warn("Failed to load mini player position:", error)
      }

      const onResize = () => {
        const nw = window.innerWidth
        const nh = window.innerHeight
        setMiniPlayerState((prev) => ({
          ...prev,
          position: {
            x: videoService.clamp(prev.position.x, 8, Math.max(8, nw - width - 8)),
            y: videoService.clamp(prev.position.y, 8, Math.max(8, nh - height - 8)),
          },
        }))
      }

      window.addEventListener("resize", onResize)
      return () => window.removeEventListener("resize", onResize)
    }, [])

    // Cleanup throttle hook on unmount
    useEffect(() => {
      return () => cleanupThrottle()
    }, [cleanupThrottle])

    // Initialize component state
    useEffect(() => {
      setPlayerState((prev) => ({
        ...prev,
        isMounted: true,
        ...authenticationState,
      }))

      // Load autoplay preference
      try {
        const videoSettings = storageManager.getVideoSettings()
        if (typeof videoSettings.autoplay === "boolean") {
          setPlayerState((prev) => ({ ...prev, autoPlayVideo: videoSettings.autoplay }))
        }
      } catch (error) {
        console.warn("Failed to load auto-play video preference:", error)
      }

      // Initialize completed chapters
      // TODO: Implement completed chapters loading if needed
      // if (session?.user?.id) {
      //   progressApi.loadCompletedChapters(session.user.id)
      // }

      return () => {
        setPlayerState((prev) => ({ ...prev, isMounted: false }))
        // Cleanup intervals
        Object.values(intervalRefs.current).forEach((interval) => {
          if (interval) clearInterval(interval)
        })
      }
    }, [authenticationState])

    // Enhanced PiP detection and state management
    useEffect(() => {
      const handleEnterPiP = () => {
        setPlayerState((prev) => ({
          ...prev,
          isNativePiPActive: true,
          isMiniPlayerActive: false,
        }))
        onPictureInPictureToggle?.(true)
      }

      const handleLeavePiP = () => {
        setPlayerState((prev) => ({ ...prev, isNativePiPActive: false }))
        onPictureInPictureToggle?.(false)
      }

      // Check initial state
      const pipElement = (document as any).pictureInPictureElement
      setPlayerState((prev) => ({ ...prev, isNativePiPActive: !!pipElement }))

      if (typeof document !== "undefined") {
        document.addEventListener("enterpictureinpicture", handleEnterPiP)
        document.addEventListener("leavepictureinpicture", handleLeavePiP)

        return () => {
          document.removeEventListener("enterpictureinpicture", handleEnterPiP)
          document.removeEventListener("leavepictureinpicture", handleLeavePiP)
        }
      }
    }, [onPictureInPictureToggle])

    // Sync mini player state with hook
    useEffect(() => {
      setPlayerState((prev) => ({ ...prev, isMiniPlayerActive: state.isMiniPlayer }))
    }, [state.isMiniPlayer])

    // Update refs when props change
    useEffect(() => {
      chapterTitleRef.current = chapterTitle
      youtubeVideoIdRef.current = youtubeVideoId
    }, [chapterTitle, youtubeVideoId])

    // Safe video element getter using video service
    const getVideoElement = useCallback((): HTMLVideoElement | null => {
      return videoService.getVideoElement(containerRef)
    }, [containerRef])

    // Enhanced PIP handling - toggle custom PiP mode
    const handlePictureInPicture = useCallback(async () => {
      // Toggle custom PiP mode by calling the parent callback with current time
      onPictureInPictureToggle?.(true, state.lastPlayedTime)
    }, [onPictureInPictureToggle, state.lastPlayedTime])

    // Format time helper using video service
    const formatTime = useCallback((seconds: number): string => {
      return videoService.formatTime(seconds)
    }, [])

    // Enhanced player ready handler with proper autoplay
    const handlePlayerReady = useCallback(() => {
      setPlayerState((prev) => ({
        ...prev,
        playerReady: true,
        isLoadingDuration: false,
      }))

      if (playerRef.current) {
        try {
          const duration = playerRef.current.getDuration()
          if (duration && duration > 0) {
            setPlayerState((prev) => ({ ...prev, videoDuration: duration }))
            onVideoLoad?.({
              title: courseName || chapterTitleRef.current || "Video",
              duration,
              thumbnail: `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
            })
          }

          onPlayerReady?.(playerRef)
        } catch (error) {
          console.warn("Error getting video duration:", error)
        }

        // Handle initial seek
        if (typeof initialSeekSeconds === "number" && initialSeekSeconds > 0) {
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
          const videoSettings = storageManager.getVideoSettings()
          if (typeof videoSettings.volume === "number") {
            handlers.onVolumeChange(videoSettings.volume)
          } else {
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
    }, [
      handlers,
      onVideoLoad,
      courseName,
      youtubeVideoId,
      onPlayerReady,
      playerState.videoDuration,
      state.duration,
      state.muted,
      initialSeekSeconds,
      shouldAutoPlay,
    ])

    // Enhanced play handler using video service
    const handlePlayClick = useCallback(() => {
      videoService.handlePlayClick(
        playerState.canPlayVideo,
        isAuthenticated,
        playerState.hasPlayedFreeVideo,
        playerState.playerReady,
        handlers.onPlayPause,
      )
    }, [
      playerState.canPlayVideo,
      isAuthenticated,
      playerState.hasPlayedFreeVideo,
      playerState.playerReady,
      handlers.onPlayPause,
    ])

    // Theater mode handler using video service
    const handleTheaterModeToggle = useCallback(() => {
      videoService.handleTheaterModeToggle(isTheaterMode, onTheaterModeToggle)
    }, [isTheaterMode, onTheaterModeToggle])

    // Auto-hide controls with improved logic
    useEffect(() => {
      const handleMouseMove = () => {
        setPlayerState((prev) => ({ ...prev, showControlsState: true }))

        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }

        if (
          state.playing &&
          !overlayState.showChapterStart &&
          !overlayState.showChapterEnd &&
          !playerState.isMiniPlayerActive
        ) {
          controlsTimeoutRef.current = setTimeout(() => {
            if (!playerState.isHovering) {
              setPlayerState((prev) => ({ ...prev, showControlsState: false }))
            }
          }, 8000) // Increased from 3000 to 8000 milliseconds
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
    }, [
      containerRef,
      state.playing,
      playerState.isHovering,
      overlayState.showChapterStart,
      overlayState.showChapterEnd,
      playerState.isMounted,
      playerState.isMiniPlayerActive,
    ])

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
        showNotesPanel: false,
      })
      setCountdowns({
        nextChapter: 5,
        chapterTransition: 5,
        autoPlay: 5,
        nextChapterAuto: 5,
      })
      setPlayerState((prev) => ({
        ...prev,
        playerReady: false,
        videoDuration: 0,
        isLoadingDuration: true,
        certificateState: "idle" as CertificateState,
      }))

      // Clear all intervals
      Object.values(intervalRefs.current).forEach((interval) => {
        if (interval) clearInterval(interval)
      })
      intervalRefs.current = { nextNotif: null, autoPlay: null, chapterTransition: null }
    }, [youtubeVideoId])

    // ✅ Load saved progress position from Redux and auto-seek (ONCE per chapter)
    const courseProgress = useAppSelector((state) => state.courseProgress)
    const hasSeekCompleted = useRef(false) // Track if seek has been executed
    
    useEffect(() => {
      const loadSavedPosition = () => {
        if (!rememberPlaybackPosition || !chapterId || !courseId) return
        if (!playerRef.current || !playerState.playerReady) return

        const chapterKey = String(chapterId)
        
        // ✅ FIX: Only seek once per chapter - check if already restored
        if (hasRestoredPositionRef.current === chapterKey) {
          return // Already restored for this chapter
        }

        try {
          // Get lastPositions from Redux courseProgress
          const progressData = courseProgress.byCourseId?.[courseId]
          const lastPositions = progressData?.videoProgress?.lastPositions || {}
          
          const savedSeconds = lastPositions[chapterKey] || 0

          // Only resume if there's meaningful progress (>5s and <90% of video duration)
          const isNearEnd = playerState.videoDuration > 0 && savedSeconds >= playerState.videoDuration * 0.9
          
          if (savedSeconds > 5 && !isNearEnd) {
            console.log(`[VideoPlayer] ✅ Restoring position: ${savedSeconds}s for chapter ${chapterKey}`)
            
            // Seek to saved position
            playerRef.current.seekTo(savedSeconds)
            
            // Mark as restored to prevent re-seeking
            hasRestoredPositionRef.current = chapterKey
            
            // Show toast notification
            const minutes = Math.floor(savedSeconds / 60)
            const seconds = Math.floor(savedSeconds % 60)
            toast({
              title: "Resuming playback",
              description: `Continuing from ${minutes}:${seconds.toString().padStart(2, "0")}`,
              duration: 3000,
            })
          } else if (isNearEnd) {
            // Video was nearly complete, start fresh
            console.log(`[VideoPlayer] Video nearly complete, starting from beginning`)
            hasRestoredPositionRef.current = chapterKey // Mark as handled
          } else {
            // No meaningful progress, mark as handled to prevent future checks
            hasRestoredPositionRef.current = chapterKey
          }
        } catch (error) {
          console.error("Failed to load saved position:", error)
          hasRestoredPositionRef.current = chapterKey // Mark as attempted
        }
      }

      // Run when player is ready
      if (playerState.playerReady && !hasSeekCompleted.current) {
        loadSavedPosition()
        hasSeekCompleted.current = true
      }
    }, [chapterId, rememberPlaybackPosition, courseId, playerState.playerReady, playerState.videoDuration])

    // ✅ Reset seek tracking when chapter changes
    useEffect(() => {
      hasSeekCompleted.current = false
      hasRestoredPositionRef.current = null
    }, [chapterId])

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
            event.preventDefault()
            // Silent ignore if not authenticated; no toast per updated requirement
            if (event.shiftKey) {
              if (effectiveIsAuthenticated) handleToggleBookmarkPanel()
            } else if (effectiveIsAuthenticated) {
              handleAddBookmark(state.lastPlayedTime)
            }
            break
          case "n":
          case "N":
            event.preventDefault()
            if (event.shiftKey) {
              if (effectiveIsAuthenticated) handleToggleNotesPanel()
            } else if (effectiveIsAuthenticated) {
              handleCreateNote()
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
          case "[":
            // Previous bookmark
            event.preventDefault()
            if (effectiveIsAuthenticated && bookmarks.length > 0) {
              const currentTime = state.lastPlayedTime
              const prevBookmarks = bookmarks.filter((b) => b.time < currentTime).sort((a, b) => b.time - a.time)
              if (prevBookmarks.length > 0) {
                handlers.onSeek(prevBookmarks[0].time)
                // Removed toast notification to reduce UI noise
              }
            }
            break
          case "]":
            // Next bookmark
            event.preventDefault()
            if (effectiveIsAuthenticated && bookmarks.length > 0) {
              const currentTime = state.lastPlayedTime
              const nextBookmarks = bookmarks.filter((b) => b.time > currentTime).sort((a, b) => a.time - b.time)
              if (nextBookmarks.length > 0) {
                handlers.onSeek(nextBookmarks[0].time)
                // Removed toast notification to reduce UI noise
              }
            }
            break
          case "?":
          case "/":
            if (event.shiftKey && event.key === "/") {
              event.preventDefault()
              handlers.handleShowKeyboardShortcuts()
            } else if (event.key === "?") {
              event.preventDefault()
              handlers.handleShowKeyboardShortcuts()
            }
            break
          case "Escape":
            if (state.isFullscreen) {
              event.preventDefault()
              handlers.onToggleFullscreen()
            } else if (isTheaterMode) {
              event.preventDefault()
              handleTheaterModeToggle()
            } else if (playerState.isNativePiPActive) {
              event.preventDefault()
              handlePictureInPicture() // Exit PIP
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
      setOverlayState((prev) => ({ ...prev, showAutoPlayNotification: false }))
      if (intervalRefs.current.autoPlay) {
        clearInterval(intervalRefs.current.autoPlay)
        intervalRefs.current.autoPlay = null
      }
      safeOnNextVideo()
    }, [onNextVideo])

    const handleAutoPlayCancel = useCallback(() => {
      setOverlayState((prev) => ({ ...prev, showAutoPlayNotification: false }))
      setCountdowns((prev) => ({ ...prev, autoPlay: 5 }))
      if (intervalRefs.current.autoPlay) {
        clearInterval(intervalRefs.current.autoPlay)
        intervalRefs.current.autoPlay = null
      }
    }, [])

    const handleNextChapter = useCallback(() => {
      setOverlayState((prev) => ({ ...prev, showChapterEnd: false }))
      safeOnNextVideo()
    }, [onNextVideo])

    const handleReplay = useCallback(() => {
      setOverlayState((prev) => ({ ...prev, showChapterEnd: false }))
      if (playerRef.current) {
        playerRef.current.seekTo(0)
        handlers.onPlay()
      }
    }, [handlers])

    const handleToggleAutoPlayVideo = useCallback(() => {
      setPlayerState((prev) => {
        const newValue = !prev.autoPlayVideo
        
        try {
          storageManager.saveVideoSettings({ autoplay: newValue })
        } catch (error) {
          console.warn("Could not save auto-play preference:", error)
        }
        
        return { ...prev, autoPlayVideo: newValue }
      })
    }, [])

    const handleChapterStartComplete = useCallback(() => {
      const animationFrame = requestAnimationFrame(() => {
        setOverlayState((prev) => ({ ...prev, showChapterStart: false }))
      })
      return () => cancelAnimationFrame(animationFrame)
    }, [])

    // Bookmark handlers
    const handleAddBookmark = useCallback(
      async (time: number, title?: string) => {
        if (!effectiveIsAuthenticated) {
          toast({
            title: "Sign in required",
            description: "Please sign in to add bookmarks.",
            variant: "destructive",
          })
          return
        }

        // Check bookmark limit (max 5 bookmarks)
        const currentBookmarks = bookmarks || []
        if (currentBookmarks.length >= 5) {
          toast({
            title: "Bookmark limit reached",
            description:
              "You can only have up to 5 bookmarks per video. Please remove some bookmarks before adding new ones.",
            variant: "destructive",
          })
          return
        }

        try {
          // Create automatic bookmark title with chapter information
          const automaticTitle = title || `${chapterTitle} - ${formatTime(time)}`

          // Save bookmark to database via API (don't set note field for automatic bookmarks)
          const response = await fetch("/api/bookmarks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              courseId: Number.parseInt(courseId?.toString() || "0"),
              chapterId: Number.parseInt(chapterId?.toString() || "0"),
              timestamp: time,
              // Don't set note field for automatic bookmarks - they should only be bookmarks
              // note: automaticTitle,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to save bookmark")
          }

          // Optionally, you can use the returned bookmark if needed
          // const bookmark = await response.json()

          // Add to local state using handler
          handlers.addBookmark(time, chapterTitle)

          showThrottledToast({
            title: "✓ Bookmark saved",
            description: `${formatTime(time)}`,
          })
        } catch (error) {
          console.error("Error adding bookmark:", error)
          showThrottledToast({
            title: "⚠ Bookmark failed",
            description: "Try again in a moment.",
            variant: "destructive",
          })
        }
      },
      [handlers, effectiveIsAuthenticated, showThrottledToast, formatTime, chapterTitle, courseId, chapterId],
    )

    const handleRemoveBookmark = useCallback(
      (bookmarkId: string) => {
        try {
          handlers.removeBookmark(bookmarkId)
          // Removed toast notification for delete to reduce UI noise
        } catch (error) {
          showThrottledToast({
            title: "⚠ Failed",
            description: "Could not remove bookmark.",
            variant: "destructive",
          })
        }
      },
      [handlers, showThrottledToast],
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
      if (!effectiveIsAuthenticated) {
        toast({
          title: "Sign in required",
          description: "Please sign in to access bookmarks.",
          variant: "destructive",
        })
        return
      }
      setOverlayState((prev) => ({
        ...prev,
        showBookmarkPanel: !prev.showBookmarkPanel,
        // Close notes panel when opening bookmarks to prevent UI overlap
        showNotesPanel: !prev.showBookmarkPanel ? false : prev.showNotesPanel,
      }))
    }, [effectiveIsAuthenticated, toast])

    const handleToggleNotesPanel = useCallback(() => {
      if (!effectiveIsAuthenticated) {
        toast({
          title: "Sign in required",
          description: "Please sign in to access notes.",
          variant: "destructive",
        })
        return
      }
      setOverlayState((prev) => ({
        ...prev,
        showNotesPanel: !prev.showNotesPanel,
        // Close bookmarks panel when opening notes to prevent UI overlap
        showBookmarkPanel: !prev.showNotesPanel ? false : prev.showBookmarkPanel,
      }))
    }, [effectiveIsAuthenticated, toast])

    const handleCreateNote = useCallback(async () => {
      if (!effectiveIsAuthenticated || !courseId || !chapterId) return

      try {
        await createNote({
          courseId:
            typeof courseId === "string" ? Number.parseInt(courseId) : typeof courseId === "number" ? courseId : 0,
          chapterId:
            typeof chapterId === "string" ? Number.parseInt(chapterId) : typeof chapterId === "number" ? chapterId : 0,
          note: `Note at ${formatTime(state.lastPlayedTime)}`,
        })
        toast({
          title: "Note created",
          description: "Your note has been saved successfully",
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create note",
          variant: "destructive",
        })
      }
    }, [effectiveIsAuthenticated, courseId, chapterId, createNote, state.lastPlayedTime, formatTime, toast])

    // Certificate download handler
    const handleCertificateDownload = useCallback(async () => {
      if (playerState.certificateState !== "idle") return

      setPlayerState((prev) => ({ ...prev, certificateState: "downloading" }))

      try {
        await onCertificateClick?.()
        setPlayerState((prev) => ({ ...prev, certificateState: "success" }))

        toast({
          title: "Certificate downloaded",
          description: "Your course completion certificate has been downloaded successfully.",
        })

        setTimeout(() => {
          setPlayerState((prev) => ({ ...prev, certificateState: "idle" }))
        }, 3000)
      } catch (error) {
        setPlayerState((prev) => ({ ...prev, certificateState: "error" }))
        toast({
          title: "Download failed",
          description: "Failed to download certificate. Please try again.",
          variant: "destructive",
        })

        setTimeout(() => {
          setPlayerState((prev) => ({ ...prev, certificateState: "idle" }))
        }, 3000)
      }
    }, [playerState.certificateState, onCertificateClick, toast])

    // Save mini player position
    const saveMiniPos = useCallback((pos: { x: number; y: number }) => {
      try {
        storageManager.saveVideoSettings({ miniPlayerPos: pos })
      } catch {
        console.warn("Failed to save mini player position")
      }
    }, [])

    // Duration handler (moved above early return to keep hook order stable)
    const onDurationHandler = useCallback((duration: number) => {
      setPlayerState((prev) => ({
        ...prev,
        videoDuration: duration,
        isLoadingDuration: false,
      }))
    }, [])

    // Double-click to bookmark handler
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!effectiveIsAuthenticated) {
          toast({
            title: "Sign in required",
            description: "Please sign in to add bookmarks.",
            variant: "destructive",
          })
          return
        }

        // Add bookmark at current time
        handleAddBookmark(state.lastPlayedTime)

        // Visual feedback
        if (containerRef.current) {
          containerRef.current.style.transform = "scale(1.02)"
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.style.transform = "scale(1)"
            }
          }, 150)
        }
      },
      [effectiveIsAuthenticated, handleAddBookmark, state.lastPlayedTime, toast],
    )

    // Determine if mini player should be shown
    const shouldShowMiniPlayer = state.isMiniPlayer && !playerState.isNativePiPActive && playerState.isMounted

    // Determine if main player should be completely hidden
    const shouldHideMainPlayer = shouldShowMiniPlayer || playerState.isNativePiPActive

    // If this is a custom PiP instance, render only the video content
    if (isCustomPiPActive) {
      return (
        <div className="w-full h-full bg-black">
          <ReactPlayer
            ref={playerRef}
            url={youtubeUrl}
            width="100%"
            height="100%"
            playing={state.playing && playerState.canPlayVideo}
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
            onDuration={onDurationHandler}
            config={
              {
                youtube: {
                  playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    fs: 0,
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
                  allowFullScreen: false,
                },
              } as any
            }
          />
        </div>
      )
    }

    return (
      <div
        ref={containerRef as any}
        className={cn(
          cn(neo.card, "relative object-contain w-full h-full bg-black overflow-hidden group video-player-container"),
          isTheaterMode && "theater-mode",
          playerState.isNativePiPActive && "pip-active",
          className,
        )}
        onMouseEnter={() => setPlayerState((prev) => ({ ...prev, isHovering: true }))}
        onMouseLeave={() => setPlayerState((prev) => ({ ...prev, isHovering: false }))}
        onDoubleClick={handleDoubleClick}
        role="application"
        aria-label="Video player - Double-click to bookmark"
        tabIndex={0}
      >
        {/* Main YouTube Player - completely hidden when in PiP modes */}
        {!shouldHideMainPlayer && (
          <div className="absolute inset-0 video-player">
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
              config={
                {
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
                    allow:
                      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                    allowFullScreen: true,
                  },
                } as any
              }
            />
          </div>
        )}

        {(isLoading || (!playerState.playerReady && youtubeVideoId)) && !shouldHideMainPlayer && (
          <div className="absolute inset-0 bg-yellow-400 flex items-center justify-center z-50 pointer-events-auto border-8 border-black">
            <div className="flex flex-col items-center gap-4 text-black">
              <div className="w-16 h-16 border-8 border-black border-t-transparent rounded-none animate-spin bg-white" />
              <p className="text-xl font-black uppercase tracking-wider">Loading video...</p>
            </div>
          </div>
        )}

        {/* Theater Mode Toggle Button */}
        {!shouldHideMainPlayer && <TheaterModeButton isTheater={isTheaterMode} onToggle={handleTheaterModeToggle} />}

        {!shouldHideMainPlayer && (
          <>
            {/* CourseAI logo now displayed as floating element in MainContent */}
          </>
        )}

        {/* Enhanced Mini Player */}
        {shouldShowMiniPlayer && (
          <EnhancedMiniPlayer
            visible={true}
            position={miniPlayerState.position}
            onPositionChange={(pos) => {
              setMiniPlayerState((prev) => ({ ...prev, position: pos }))
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
            onSeek={(percent: number) => {
              const time = (playerState.videoDuration || state.duration) * percent
              handlers.onSeek(time)
            }}
            thumbnail={getYouTubeThumbnailUrl(youtubeVideoId, "hqdefault")}
          />
        )}

        {playerState.isNativePiPActive && (
          <div className="absolute inset-0 z-20 bg-cyan-400 flex items-center justify-center border-8 border-black">
            <div className={cn(neo.card, "text-center text-black max-w-md mx-auto p-8 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]")}>
              <div className="mb-6">
                <div className={cn(neo.card, "w-24 h-24 mx-auto rounded-none bg-pink-500 flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]")}>
                  <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553-.894l2-1A1 1 0 0018 9V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-3 uppercase tracking-wider">Video Playing in PiP</h3>
                <p className="text-base font-bold mb-6 leading-relaxed">
                  Your video is now playing in a separate window. You can continue browsing while watching.
                </p>
              </div>
              <div className="space-y-4">
                <Button
                  onClick={handlePictureInPicture}
                  variant="default"
                  size="lg"
                  className={cn(neo.card, "w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-none")}
                >
                  Return to Main Player
                </Button>
                <p className="text-sm font-bold">Press 'P' or click the PiP button to toggle</p>
              </div>
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
          !shouldHideMainPlayer && <PlayButton onClick={handlePlayClick} />}

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
              onClose={() => setOverlayState((prev) => ({ ...prev, showChapterEnd: false }))}
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
            className={cn("absolute bottom-0 left-0 right-0 z-40 transition-all duration-200")}
            style={{
              pointerEvents: "auto",
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
              formatTime={formatTime}
              bookmarks={bookmarkTimes}
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
              isPiPActive={isPiPActive}
              isTheaterMode={isTheaterMode}
              onToggleTheaterMode={handleTheaterModeToggle}
              notesCount={chapterNotes.length}
              onToggleNotesPanel={handleToggleNotesPanel}
              notesPanelOpen={overlayState.showNotesPanel}
              onCreateNote={handleCreateNote}
              notes={chapterNotes}
            />
          </div>
        )}

        {overlayState.showBookmarkPanel && effectiveIsAuthenticated && !shouldHideMainPlayer && (
          <div className="fixed lg:absolute top-0 right-0 bottom-16 z-30 w-full lg:w-64 xl:w-72 max-w-sm bg-yellow-400 border-l-8 border-black flex flex-col shadow-[8px_0px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-4 border-b-4 border-black flex-shrink-0 bg-pink-500">
              <div className="text-sm text-black font-bold space-y-2">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black rounded-none text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    B
                  </kbd>
                  <span className="uppercase tracking-wide">Add bookmark</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black rounded-none text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    [
                  </kbd>
                  <span className="uppercase tracking-wide">Previous</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black rounded-none text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ]
                  </kbd>
                  <span className="uppercase tracking-wide">Next</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black rounded-none text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    2x Click
                  </kbd>
                  <span className="uppercase tracking-wide">Quick</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <BookmarkManager
                videoId={youtubeVideoId}
                bookmarks={bookmarks.map((b) => ({
                  id: b.id,
                  videoId: b.videoId,
                  time: b.time,
                  title: b.title || `Bookmark at ${formatTime(b.time)}`,
                  description: b.description || "",
                  createdAt: b.createdAt,
                }))}
                currentTime={state.lastPlayedTime}
                duration={playerState.videoDuration || state.duration}
                onSeekToBookmark={handleSeekToBookmark}
                onAddBookmark={handleAddBookmark}
                onRemoveBookmark={handleRemoveBookmark}
                formatTime={formatTime}
              />
            </div>
          </div>
        )}

        {/* Notes Panel */}
        {overlayState.showNotesPanel && effectiveIsAuthenticated && !shouldHideMainPlayer && (
          <NotesPanel
            courseId={typeof courseId === "string" ? Number.parseInt(courseId) : courseId || 0}
            chapterId={typeof chapterId === "string" ? Number.parseInt(chapterId) : chapterId || 0}
            currentTime={state.lastPlayedTime}
            duration={playerState.videoDuration || state.duration}
            formatTime={formatTime}
            onSeekToTimestamp={handlers.onSeek}
          />
        )}

        {/* Keyboard Shortcuts Modal */}
        {state.showKeyboardShortcuts && (
          <KeyboardShortcutsModal onClose={handlers.handleHideKeyboardShortcuts} show={state.showKeyboardShortcuts} />
        )}
      </div>
    )
  },
)

export default VideoPlayer
