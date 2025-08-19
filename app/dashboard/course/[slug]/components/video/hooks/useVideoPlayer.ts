"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type ReactPlayer from "react-player"

import screenfull from "screenfull"
import { useAppDispatch } from "@/store/hooks"
import { addBookmark, removeBookmark } from "@/store/slices/course-slice"
import { loadPlayerPreferences, savePlayerPreferences, calculateBufferHealth, formatTime } from "./progressUtils"
// import { useVideoProgress } from "./useVideoProgress"
import { useVideoPreloading } from "./useVideoPreloading"
import type { VideoPlayerState, UseVideoPlayerReturn, ProgressState, BookmarkData, YouTubePlayerConfig } from "../types"
import { useToast } from "@/hooks"

interface VideoPlayerHookOptions {
  youtubeVideoId: string
  onEnded?: () => void
  onProgress?: (state: ProgressState) => void
  onTimeUpdate?: (time: number) => void
  rememberPlaybackPosition?: boolean
  rememberPlaybackSettings?: boolean
  onBookmark?: (time: number, title?: string) => void
  autoPlay?: boolean
  onVideoLoad?: (metadata: any) => void
  onCertificateClick?: () => void
  nextVideoId?: string | null
  courseId?: string | number
  chapterId?: string | number
}

export function useVideoPlayer(options: VideoPlayerHookOptions): UseVideoPlayerReturn {
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  
  // Load saved preferences
  const savedPreferences = useMemo(() => loadPlayerPreferences(), [])

  const [state, setState] = useState<VideoPlayerState>({
    playing: !!options.autoPlay,
    muted: savedPreferences.muted,
    volume: savedPreferences.volume,
    playbackRate: savedPreferences.playbackRate,
    played: 0,
    loaded: 0,
    duration: 0,
    isFullscreen: false,
    isBuffering: false,
    isLoading: true,
    playerError: null,
    isPlayerReady: false,
    hasStarted: false,
    lastPlayedTime: 0,
    showKeyboardShortcuts: false,
    theaterMode: false,
    userInteracted: !!options.autoPlay,
    autoPlayNext: savedPreferences.autoPlayNext ?? true,
    isPictureInPicture: false,
    isPiPSupported: false,
    isNearingCompletion: false, // Add state for preloading detection
    isMiniPlayer: false,
  })

  const [bufferHealth, setBufferHealth] = useState(100)
  const [isPlayerFocused, setIsPlayerFocused] = useState(false)

  // Detect when video is nearing completion for preloading
  useEffect(() => {
    // Consider a video nearing completion when it's at 85% or more
    setState(prev => ({
      ...prev,
      isNearingCompletion: prev.played >= 0.85
    }));
  }, [state.played]);
  
  // Enable preloading when nearing completion
  useVideoPreloading({
    currentVideoId: options.youtubeVideoId,
    nextVideoId: options.nextVideoId || null,
    isNearingCompletion: state.isNearingCompletion
  });
  
  // Progress tracking - use Redux slice instead of legacy hook
  // TODO: Implement progress tracking via Redux actions/selectors
  // Example: dispatch(setLastPosition({ courseId, chapterId, videoId, position }))
  // Remove all references to progressTracking from below

  // Enhanced progress handler
  const handleProgress = useCallback(
    (progressState: ProgressState) => {
      setState((prev) => ({
        ...prev,
        played: progressState.played,
        loaded: progressState.loaded,
        lastPlayedTime: progressState.playedSeconds,
      }));

      // Update buffer health efficiently
      const newBufferHealth = calculateBufferHealth(progressState.loaded, progressState.played);
      setBufferHealth((prev) => (Math.abs(prev - newBufferHealth) > 5 ? newBufferHealth : prev));

      // Check if video is about to end (last 10 seconds) and trigger transition
      if (state.duration && progressState.playedSeconds > 0) {
        const timeRemaining = state.duration - progressState.playedSeconds;
        
        // Set nearing completion state for preloading
        if (timeRemaining <= 10 && timeRemaining > 0) {
          setState(prev => ({ ...prev, isNearingCompletion: true }));
        }
      }

      // Avoid duplicate/noisy tracking while in mini-player if desired
      const shouldTrack = !state.isMiniPlayer || state.played < 0.98

  // if (shouldTrack) {
  //   dispatch(setLastPosition({
  //     courseId: options.courseId,
  //     chapterId: options.chapterId,
  //     videoId: options.youtubeVideoId,
  //     position: progressState.playedSeconds
  //   }))
  // }
      }

      // Pass to parent callback (single call per tick)
      options.onProgress?.(progressState);
    },
    [options.onProgress, progressTracking, state.isMiniPlayer, state.played, state.duration]
  );

  // Memoized YouTube URL
  const youtubeUrl = useMemo(() => `https://www.youtube.com/watch?v=${options.youtubeVideoId}`, [options.youtubeVideoId])

  // Memoized YouTube config
  const youtubeConfig = useMemo(
    (): YouTubePlayerConfig => ({
      youtube: {
        playerVars: {
          autoplay: options.autoPlay ? 1 : 0,
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
          preload: state.userInteracted ? "auto" : "none",
        },
      },
    }),
    [options.autoPlay, state.userInteracted],
  )

  // Event handlers
  const onPlay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playing: true,
      hasStarted: true,
      userInteracted: true,
    }))
  }, [])

  const onPause = useCallback(() => {
    setState((prev) => ({ ...prev, playing: false }))
  }, [])

  const onPlayPause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playing: !prev.playing,
      hasStarted: true,
      userInteracted: true,
    }))
  }, [])

  const onVolumeChange = useCallback((volume: number) => {
    setState((prev) => ({
      ...prev,
      volume,
      muted: volume === 0,
    }))

    savePlayerPreferences({ volume, muted: volume === 0 })
  }, [])

  const onMute = useCallback(() => {
    setState((prev) => {
      const newMuted = !prev.muted
      savePlayerPreferences({ muted: newMuted })
      return { ...prev, muted: newMuted }
    })
  }, [])

  const onSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time)
    }
  }, [])

  const onPlaybackRateChange = useCallback((rate: number) => {
    setState((prev) => ({ ...prev, playbackRate: rate }))
    savePlayerPreferences({ playbackRate: rate })
  }, [])

  // Fixed fullscreen implementation
  const onToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (screenfull.isEnabled) {
      screenfull.toggle(containerRef.current).catch((error) => {
        console.error("Fullscreen error:", error)
        toast({
          title: "Fullscreen Error",
          description: "Could not enter fullscreen mode. Try using theater mode instead.",
          variant: "destructive",
        })
      })
    } else {
      toast({
        title: "Fullscreen Not Supported",
        description: "Your browser doesn't support fullscreen mode.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Update the onReady handler to properly set duration
  const onReady = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlayerReady: true,
      isLoading: false,
    }))
    
    if (playerRef.current) {
      try {
        const duration = playerRef.current.getDuration();
        
        // Only update if we got a valid duration
        if (!isNaN(duration) && duration > 0) {
          setState((prev) => ({
            ...prev,
            duration,
          }));
        }
      } catch (err) {
        console.warn('Could not get video duration:', err);
      }
    }
  }, [])

  // Also update the onDuration handler if it exists
  const onDuration = useCallback((duration: number) => {
    if (!isNaN(duration) && duration > 0) {
      setState((prev) => ({
        ...prev,
        duration,
      }));
    }
  }, [])

  const onBuffer = useCallback(() => {
    setState((prev) => ({ ...prev, isBuffering: true }))
  }, [])

  const onBufferEnd = useCallback(() => {
    setState((prev) => ({ ...prev, isBuffering: false }))
  }, [])

  const onError = useCallback((error: Error) => {
    setState((prev) => ({
      ...prev,
      playerError: error,
      isLoading: false,
    }))
    console.error("Video player error:", error)
  }, [])







  // Enhanced PIP state management with debouncing
  const [pipState, setPipState] = useState({
    isActive: false,
    lastToggle: 0
  })

  // Debounced PIP toggle to prevent rapid state changes
  const debouncedPipToggle = useCallback(() => {
    const now = Date.now()
    if (now - pipState.lastToggle < 300) return // Prevent rapid toggles
    
    setPipState(prev => ({
      isActive: !prev.isActive,
      lastToggle: now
    }))
  }, [pipState.lastToggle])

  // Keyboard shortcuts handlers
  const handleShowKeyboardShortcuts = useCallback(() => {
    setState((prev) => ({ ...prev, showKeyboardShortcuts: true }))
  }, [])

  const handleHideKeyboardShortcuts = useCallback(() => {
    setState((prev) => ({ ...prev, showKeyboardShortcuts: false }))
  }, [])

  const handleShowControls = useCallback(() => {
    // This can be used to show controls programmatically
  }, [])

  // Bookmark handlers
  const handleAddBookmark = useCallback(
    (time: number, title?: string) => {
  if (!options.youtubeVideoId) return

      const bookmarkData: BookmarkData = {
  id: `${options.youtubeVideoId}-${Date.now()}`,
  videoId: options.youtubeVideoId,
        time,
        title: title || `Bookmark at ${formatTime(time)}`,
        description: title ? `${title} at ${formatTime(time)}` : `Bookmark at ${formatTime(time)}`,
        createdAt: new Date().toISOString(),
      }

      dispatch(addBookmark(bookmarkData))
      options.onBookmark?.(time, title)

      toast({
        title: "Bookmark added",
        description: "You can access your bookmarks in the timeline.",
      })
    },
  [options.youtubeVideoId, options.onBookmark, dispatch, toast],
  )

  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
  dispatch(removeBookmark({ bookmarkId, videoId: options.youtubeVideoId }))

      toast({
        title: "Bookmark removed",
        description: "The bookmark has been removed.",
      })
    },
  [options.youtubeVideoId, dispatch, toast],
  )

  // Fullscreen state tracking
  useEffect(() => {
    if (!screenfull.isEnabled) return

    const handleFullscreenChange = () => {
      setState((prev) => ({
        ...prev,
        isFullscreen: !!screenfull.isFullscreen,
      }))
    }

    screenfull.on("change", handleFullscreenChange)
    return () => screenfull.off("change", handleFullscreenChange)
  }, [])

  // Theater mode toggle handler
  const handleTheaterModeToggle = useCallback(() => {
    setState((prev) => {
      const newTheaterMode = !prev.theaterMode;
      
      // Toggle CSS class on body for theater mode styling
      if (typeof document !== "undefined") {
        if (newTheaterMode) {
          document.body.classList.add("theater-mode-active");
        } else {
          document.body.classList.remove("theater-mode-active");
        }
      }
      
      return { ...prev, theaterMode: newTheaterMode };
    });
  }, []);

  // Picture-in-Picture toggle handler
  const handlePictureInPictureToggle = useCallback(() => {
    setState((prev) => {
      const newMiniPlayer = !prev.isMiniPlayer;
      return { 
        ...prev, 
        isMiniPlayer: newMiniPlayer,
        isPictureInPicture: false // Reset native PiP when using mini player
      };
    });
  }, []);



  // Focus management for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when player is focused and user has interacted
      if (!isPlayerFocused || !state.userInteracted) return

      // Don't handle keyboard events when typing in form elements
      const target = event.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }

      switch (event.key) {
        case " ":
          event.preventDefault()
          onPlayPause()
          break
        case "ArrowRight":
          event.preventDefault()
          onSeek(Math.min(state.duration, state.lastPlayedTime + 10))
          break
        case "ArrowLeft":
          event.preventDefault()
          onSeek(Math.max(0, state.lastPlayedTime - 10))
          break
        case "m":
          event.preventDefault()
          onMute()
          break
        case "f":
          event.preventDefault()
          onToggleFullscreen()
          break
        case "t":
          event.preventDefault()
          handleTheaterModeToggle()
          break
        case "Escape":
          if (state.isFullscreen || state.theaterMode) {
            event.preventDefault()
            if (state.isFullscreen) onToggleFullscreen()
            if (state.theaterMode) handleTheaterModeToggle()
          }
          break
        case "b":
          event.preventDefault()
          handleAddBookmark(state.lastPlayedTime)
          break
        case "?":
          event.preventDefault()
          handleShowKeyboardShortcuts()
          break
      }
    }

    // Always attach once when focused; cleanup ensures no duplicates
    if (isPlayerFocused && state.userInteracted) {
      window.removeEventListener("keydown", handleKeyDown)
      window.addEventListener("keydown", handleKeyDown, { passive: false })
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    isPlayerFocused,
    state.userInteracted,
    state.duration,
    state.lastPlayedTime,
    state.isFullscreen,
    state.theaterMode,
    onPlayPause,
    onSeek,
    onMute,
    onToggleFullscreen,
    handleTheaterModeToggle,
    handleShowKeyboardShortcuts,
    handleAddBookmark,
  ])

  // Focus management
  useEffect(() => {
    const playerContainer = containerRef.current
    if (!playerContainer) return

    const handleFocus = () => setIsPlayerFocused(true)
    const handleBlur = () => setIsPlayerFocused(false)

    const handleClickOutside = (e: MouseEvent) => {
      if (!playerContainer.contains(e.target as Node)) {
        setIsPlayerFocused(false)
      }
    }

    playerContainer.addEventListener("click", handleFocus)
    playerContainer.addEventListener("focus", handleFocus)
    document.addEventListener("click", handleClickOutside)

    return () => {
      playerContainer.removeEventListener("click", handleFocus)
      playerContainer.removeEventListener("focus", handleFocus)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // Cleanup theater mode on unmount
  useEffect(() => {
    return () => {
      if (state.theaterMode && typeof document !== "undefined") {
        document.body.classList.remove("theater-mode-active")
      }
    }
  }, [state.theaterMode])

  // Toggle autoPlayNext handler
  const toggleAutoPlayNext = useCallback(() => {
    setState((prev) => {
      const newAutoPlayNext = !prev.autoPlayNext;
      savePlayerPreferences({ autoPlayNext: newAutoPlayNext });
      return { ...prev, autoPlayNext: newAutoPlayNext };
    });
  }, []);

  // Check PiP support on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isPiPSupported = !!(document as any).pictureInPictureEnabled;
      setState(prev => ({ ...prev, isPiPSupported }));
    }
  }, []);

  return {
    state,
    playerRef,
    containerRef,
    bufferHealth,
    youtubeUrl,
    handleProgress,
    handlers: {
      onPlay,
      onPause,
      onPlayPause,
      onVolumeChange,
      onMute,
      onSeek,
      onPlaybackRateChange,
      onToggleFullscreen,
      onReady,
      onBuffer,
      onBufferEnd,
      onError,
      addBookmark: handleAddBookmark,
      removeBookmark: handleRemoveBookmark,
      handleShowKeyboardShortcuts,
      handleHideKeyboardShortcuts,
      handleTheaterModeToggle,
      handlePictureInPictureToggle,
      handleShowControls,
      toggleAutoPlayNext,
    }
  }
}
