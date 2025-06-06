"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Loader2, Bookmark, RefreshCw } from "lucide-react"
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
import { useAuth } from "@/hooks/useAuth" // Import the useAuth hook for user identification

// Add debugging const for development mode
const DEBUG_VIDEO = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_VIDEO === 'true';

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
  },
  courseCompleted?: boolean // Add this prop to know if course is completed
  isMobile?: boolean // Mobile support
  profileError?: string | null // Add profile error prop
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

const VideoPlayerFallback = ({ onReload, error }: { onReload?: () => void, error?: string }) => (
  <div className="flex flex-col items-center justify-center w-full h-full bg-background rounded-lg border border-border aspect-video">
    <div className="space-y-4 text-center p-6">
      <div className="flex justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </motion.div>
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium">Preparing your video...</p>
        <p className="text-sm text-muted-foreground">{error || "This may take a few moments"}</p>
      </div>
      {onReload && (
        <Button variant="outline" size="sm" onClick={onReload} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
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
  courseCompleted = false, // Default to false if not provided
  isMobile = false,
  profileError, // Add profile error prop
}: VideoPlayerProps) => {
  const dispatch = useAppDispatch()
  const { userId, guestId } = useAuth() // Get userId or generate guestId
  const effectiveUserId = userId || guestId || 'guest'

  // Redux state selectors
  const autoplayEnabled = useAppSelector((state) => state.course.autoplayEnabled)
  const playbackSettings = useAppSelector((state) => {
    // Check for user-specific settings first, then fall back to global settings
    if (userId && state.course.userPlaybackSettings[userId]) {
      return state.course.userPlaybackSettings[userId]
    } else if (!userId && state.course.guestPlaybackSettings) {
      return state.course.guestPlaybackSettings
    }
    return state.course.playbackSettings
  })
  const courseId = useAppSelector((state) => state.course.currentCourseId)
  
  // Use a stable video ID key for progress lookups to avoid changing references
  const videoProgressKey = useMemo(() => {
    return userId ? `${userId}_${videoId}` : `guest_${videoId}`
  }, [userId, videoId]);
  
  // Get video progress from the correct store location based on auth status
  const videoProgress = useAppSelector((state) => 
    state.course.videoProgress[videoProgressKey] || state.course.videoProgress[videoId]
  )
  
  // Get bookmarks from the correct store location
  const videoBookmarks = useAppSelector((state) => state.course.bookmarks[videoId] || [])

  // State management - separated into logical groups
  // Player state
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(playbackSettings.volume ?? 0.8)
  const [muted, setMuted] = useState(playbackSettings.muted ?? false)
  const [played, setPlayed] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(playbackSettings.playbackSpeed ?? 1)
  const [showSubtitles, setShowSubtitles] = useState(false)
  
  // UI state
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false)
  
  // Loading and error states
  const [isBuffering, setIsBuffering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadRetryCount, setLoadRetryCount] = useState(0)
  const [playerError, setPlayerError] = useState<string | null>(null)
  
  // Progress tracking
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [lastSavedPosition, setLastSavedPosition] = useState(0)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [hasShownCertificatePrompt, setHasShownCertificatePrompt] = useState(false)
  
  // Refs
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressUpdateRequestRef = useRef<number | null>(null)
  const playerCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialPlayAttemptedRef = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const youtubePlayerRef = useRef<any>(null) // Add direct access to YouTube player instance
  
  // Hooks
  const { toast } = useToast()
  
  // Key flag to determine if we should resume or start fresh
  // Changed to properly handle course completion status
  const shouldResumeFromProgress = useMemo(() => {
    // If course is completed, don't auto-resume unless explicitly requested
    if (courseCompleted) {
      // Check if user has explicitly enabled "resume even when completed" in their preferences
      const resumeAfterCompletion = localStorage.getItem('resumeAfterCompletion') === 'true'
      return resumeAfterCompletion
    }
    // Otherwise resume if there's saved progress
    return !!videoProgress?.time && videoProgress.time > 0.01
  }, [videoProgress, courseCompleted])

  // Clear loading state after too long to prevent indefinite loading states
  useEffect(() => {
    if (isLoading) {
      // If still loading after 10 seconds, force continue
      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          console.warn("Forcing loading state to complete after timeout")
          setIsLoading(false)
        }
      }, 10000)
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [isLoading])

  // Add player health check to detect stalled loading
  useEffect(() => {
    if (isLoading && isPlayerReady) {
      // If player is ready but loading state is stuck, fix it
      playerCheckTimeoutRef.current = setTimeout(() => {
        if (isLoading && isPlayerReady) {
          console.log("Player ready but loading state stuck, resetting...")
          setIsLoading(false)
        }
      }, 2000)
    }
    
    return () => {
      if (playerCheckTimeoutRef.current) {
        clearTimeout(playerCheckTimeoutRef.current)
        playerCheckTimeoutRef.current = null
      }
    }
  }, [isLoading, isPlayerReady])

  // Reset player error state when videoId changes
  useEffect(() => {
    setPlayerError(null)
    setLoadRetryCount(0)
  }, [videoId])

  // Debug logs for development mode
  useEffect(() => {
    if (DEBUG_VIDEO) {
      console.log(`[VideoPlayer] State: loading=${isLoading}, playerReady=${isPlayerReady}, duration=${duration}`)
      console.log(`[VideoPlayer] Progress: ${played}/${duration}, videoId=${videoId}`)
    }
  }, [isLoading, isPlayerReady, played, duration, videoId])

  // Improve initialization with fallback mechanism
  const handlePlayerReady = useCallback(() => {
    if (DEBUG_VIDEO) console.log(`[VideoPlayer] Player is ready!`)
    
    setIsPlayerReady(true)
    setIsLoading(false)
    
    try {
      // Store YouTube player instance for direct access if needed
      if (playerRef.current) {
        const internalPlayer = playerRef.current.getInternalPlayer()
        if (internalPlayer) {
          youtubePlayerRef.current = internalPlayer
        }
      }
      
      // Resume from saved position if available - with error handling
      if (shouldResumeFromProgress && videoProgress?.time && videoProgress.time > 0.01) {
        try {
          playerRef.current?.seekTo(videoProgress.time)
          setPlayed(videoProgress.time)
        } catch (err) {
          console.warn("Failed to set initial position:", err)
        }
      }
      
      // Autoplay with fallback for browsers that block autoplay
      if (autoPlay || autoplayEnabled) {
        try {
          setPlaying(true)
          
          // Force play as a fallback for some browsers
          if (youtubePlayerRef.current && typeof youtubePlayerRef.current.playVideo === 'function') {
            youtubePlayerRef.current.playVideo()
          }
        } catch (err) {
          console.warn("Autoplay failed:", err)
        }
      }
    } catch (err) {
      console.error("Player ready handler error:", err)
    }
  }, [autoPlay, autoplayEnabled, videoProgress, shouldResumeFromProgress])

  // Handle play event - separate from ready event
  const handlePlay = useCallback(() => {
    setIsPlayerReady(true)
    setIsLoading(false)
  }, [])

  // Handle duration - ensure it updates in a safe way
  const handleDuration = useCallback((duration: number) => {
    if (duration && duration > 0 && !isNaN(duration)) {
      setDuration(duration)
    }
  }, [])

  // Improved error handling with detailed messages
  const handlePlayerError = useCallback((error: any) => {
    console.error("[EnhancedVideoPlayer] Player error:", error)
    
    // Try to extract a user-friendly error message
    let errorMessage = "Failed to load video";
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.data?.errors?.length) {
      errorMessage = error.data.errors[0].message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    // Filter out common errors that we can retry
    const isRetryableError = 
      errorMessage.includes("network") || 
      errorMessage.includes("timeout") ||
      errorMessage.includes("playback") ||
      errorMessage.includes("API");
      
    setPlayerError(errorMessage)
    setIsLoading(false)
    
    // Auto-retry for certain errors, up to 3 times
    if (isRetryableError && loadRetryCount < 2) {
      toast({
        title: "Video loading issue",
        description: "Attempting to reload the video...",
        duration: 3000,
      });
      
      setTimeout(() => {
        setLoadRetryCount(prev => prev + 1)
        resetPlayerState()
      }, 2000)
    }
  }, [loadRetryCount, toast])

  // Reset player for retries
  const resetPlayerState = useCallback(() => {
    setPlayerError(null)
    setIsLoading(true)
    setIsPlayerReady(false)
    initialPlayAttemptedRef.current = false
  }, [])

  // Handle playback speed
  const handlePlaybackSpeedChange = useCallback(
    (newSpeed: number) => {
      setPlaybackSpeed(newSpeed)
      dispatch(
        setPlaybackSettings({
          ...playbackSettings,
          playbackSpeed: newSpeed,
        }),
      )
    },
    [dispatch, playbackSettings],
  )

  // Handle autoplay toggle
  const handleAutoplayToggle = useCallback(() => {
    dispatch(setAutoplayEnabled(!autoplayEnabled))

    toast({
      title: !autoplayEnabled ? "Autoplay enabled" : "Autoplay disabled",
      description: !autoplayEnabled ? "Videos will play automatically" : "Videos will not play automatically",
      duration: 2000,
    })
  }, [autoplayEnabled, dispatch, toast])

  // Bookmarks
  const handleSeekToBookmark = useCallback(
    (time: number) => {
      if (playerRef.current && duration > 0) {
        const seekPosition = Math.min(time / duration, 0.99)
        playerRef.current.seekTo(seekPosition)
        setPlayed(seekPosition)

        toast({
          title: "Jumped to Bookmark",
          description: `Playback resumed at ${formatTime(time)}`,
          duration: 2000,
        })
      }
    },
    [duration, toast],
  )

  // Initialize player with proper starting time - improved reliability
  useEffect(() => {
    let initializationTimeout: NodeJS.Timeout;
    
    if (playerRef.current && isPlayerReady) {
      // Logic for picking initial time - fix for repeat viewing bug
      let startTime = 0
      
      if (shouldResumeFromProgress && videoProgress?.time) {
        // Resume from progress if course is not completed or user wants to resume
        startTime = videoProgress.time
      } else if (initialTime && initialTime > 0) {
        // Use initialTime if provided
        startTime = initialTime
      }
      
      // Seek to proper time - with additional safety check
      initializationTimeout = setTimeout(() => {
        try {
          if (playerRef.current) {
            playerRef.current.seekTo(startTime)
            setPlayed(startTime)
            if (DEBUG_VIDEO) console.log(`[VideoPlayer] Initialized to time: ${startTime}`)
          }
        } catch (error) {
          console.error("[VideoPlayer] Error during initial seek:", error)
        }
      }, 300)
    }
    
    return () => {
      clearTimeout(initializationTimeout)
    }
  }, [isPlayerReady, videoProgress, initialTime, shouldResumeFromProgress])

  // Keyboard shortcuts - unchanged
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when video player is focused or no input is focused
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          setPlaying((prev) => !prev)
          break
        case "ArrowLeft":
          e.preventDefault()
          handleSkip(-10)
          break
        case "ArrowRight":
          e.preventDefault()
          handleSkip(10)
          break
        case "j":
          e.preventDefault()
          handleSkip(-10)
          break
        case "l":
          e.preventDefault()
          handleSkip(10)
          break
        case "m":
          e.preventDefault()
          handleMute()
          break
        case "f":
          e.preventDefault()
          handleFullscreenToggle()
          break
        case "t":
          e.preventDefault()
          setTheaterMode((prev) => !prev)
          break
        case "ArrowUp":
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case "ArrowDown":
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
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
          e.preventDefault()
          const percentage = Number.parseInt(e.key) / 10
          playerRef.current?.seekTo(percentage)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [volume])

  // Skip forward/backward
  const handleSkip = useCallback(
    (seconds: number) => {
      if (!playerRef.current || !duration) return
      
      const currentTime = playerRef.current?.getCurrentTime() || 0
      const newTime = currentTime + seconds
      const newPosition = Math.max(0, Math.min(newTime / duration, 0.999))
      
      // Only seek if there's a meaningful change
      if (Math.abs(newPosition - played) > 0.001) {
        playerRef.current?.seekTo(newPosition)
        setPlayed(newPosition)

        dispatch(
          setVideoProgress({
            videoId,
            time: newPosition,
            playedSeconds: newTime,
            duration: duration,
            userId,
          }),
        )
        setLastSavedPosition(newPosition)
      }
    },
    [duration, videoId, dispatch, userId, played],
  )

  // Handle mute toggle
  const handleMute = useCallback(() => {
    setMuted((prev) => {
      const newMutedState = !prev
      dispatch(
        setPlaybackSettings({
          ...playbackSettings,
          muted: newMutedState,
        }),
      )
      return newMutedState
    })
  }, [dispatch, playbackSettings])

  // Handle volume change
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume)
      setMuted(newVolume === 0)
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

  // Handle fullscreen toggle - unchanged
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

  // Handle PiP - unchanged
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

  // Handle theater mode - unchanged
  const handleTheaterMode = useCallback(() => {
    setTheaterMode((prev) => !prev)
  }, [])

  // Handle subtitles toggle - unchanged
  const handleToggleSubtitles = useCallback(() => {
    setShowSubtitles((prev) => !prev)
    toast({
      title: showSubtitles ? "Subtitles disabled" : "Subtitles enabled",
      description: showSubtitles ? "Subtitles have been turned off" : "Subtitles have been turned on",
    })
  }, [showSubtitles, toast])

  // Handle add bookmark - unchanged
  const handleAddBookmark = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime()

      dispatch(
        addBookmark({
          videoId,
          time: currentTime,
        }),
      )

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

  // Improved seek handler - address loading state issues
  const handleSeek = useCallback((seekedTo: number) => {
    // Clear seek timeout if it exists
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current)
      seekTimeoutRef.current = null
    }
    
    // Small delay to ensure buffering has stabilized
    setTimeout(() => {
      setIsLoading(false)
      setIsBuffering(false)
    }, 200)
    
    if (DEBUG_VIDEO) console.log(`[VideoPlayer] Seek completed to: ${seekedTo}`)
  }, [])

  // Improved seek change handler
  const handleSeekChange = useCallback(
    (newPlayed: number) => {
      // Prevent rapid seek issues by canceling pending timeouts
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
        seekTimeoutRef.current = null
      }

      setPlayed(newPlayed)
      
      // Only show loading if seeking a significant distance
      if (Math.abs(newPlayed - played) > 0.05) {
        setIsLoading(true)
      }

      // Use a ref to track the current seek operation
      try {
        if (playerRef.current) {
          playerRef.current.seekTo(newPlayed)
        }
      } catch (err) {
        console.error("[VideoPlayer] Error during seek:", err)
      }

      // Set a fallback timeout in case onSeek doesn't fire
      seekTimeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        seekTimeoutRef.current = null
      }, 2000)

      // Save progress for all users (not just authenticated)
      const newPlayedSeconds = newPlayed * duration

      // Debounce progress updates to prevent excessive API calls
      if (Math.abs(newPlayed - lastSavedPosition) > 0.01) {
        dispatch(
          setVideoProgress({
            videoId,
            time: newPlayed,
            playedSeconds: newPlayedSeconds,
            duration: duration,
            userId, // Include userId for per-user tracking
          }),
        )
        setLastSavedPosition(newPlayed)

        if (onProgress) {
          onProgress(newPlayed)
        }

        if (courseId) {
          dispatch(setResumePoint({ 
            courseId, 
            resumePoint: newPlayed,
            userId, // Include userId for course-level progress tracking
          }))
          dispatch(setLastPlayedAt({ 
            courseId, 
            lastPlayedAt: new Date().toISOString(),
            userId, // Include userId for course-level progress tracking
          }))
        }
      }
    },
    [videoId, onProgress, dispatch, duration, courseId, lastSavedPosition, userId, played],
  )

  // Handle video end - unchanged
  const handleVideoEnd = useCallback(() => {
    setPlaying(false)
    setVideoCompleted(true)

    // Update video progress to mark as complete
    dispatch(
      setVideoProgress({
        videoId,
        time: 1.0,
        playedSeconds: duration,
        duration: duration,
        userId, // Include userId for per-user tracking
      }),
    )

    // Call completion callback to update chapter status
    if (onChapterComplete) {
      onChapterComplete()
    }

    // For last video in course, record completion and manage certificate prompt
    if (isLastVideo && !hasShownCertificatePrompt) {
      // Store certificate prompt shown status in localStorage to avoid repeated prompts
      const certificatePromptKey = `certificate_${courseId}_${effectiveUserId}`
      const hasShownBefore = localStorage.getItem(certificatePromptKey) === 'true'
      
      if (!hasShownBefore) {
        // Set flag to prevent multiple prompts in the same session
        setHasShownCertificatePrompt(true)
        // Store in localStorage to remember across sessions
        localStorage.setItem(certificatePromptKey, 'true')
        
        // Show completion toast with certificate option
        toast({
          title: "Course Completed!",
          description: "Congratulations! You've completed the course.",
          action: (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                // Navigate to certificate download page or show certificate modal
                document.dispatchEvent(new CustomEvent('showCertificateModal', {
                  detail: { courseId, courseName }
                }))
              }}>
              Get Certificate
            </Button>
          )
        })
      }
    }

    // Handle navigation to next video or course completion
    onEnded()
  }, [videoId, dispatch, duration, onEnded, onChapterComplete, isLastVideo, courseId, effectiveUserId, userId, toast, courseName, hasShownCertificatePrompt])

  // Improved progress handling with request animation frame
  const handleProgress = useCallback(
    (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
      // Don't update progress while seeking
      if (seekTimeoutRef.current) return

      // Don't update if video isn't actually playing
      if (isLoading || isBuffering) return
      
      setPlayed(state.played)
      setLoaded(state.loaded)

      if (onProgress) {
        onProgress(state.played)
      }

      // Debounce updates to improve performance
      if (Math.abs(state.played - lastSavedPosition) > 0.01) {
        // Use requestAnimationFrame for smoother updates
        if (!progressUpdateRequestRef.current) {
          progressUpdateRequestRef.current = requestAnimationFrame(() => {
            // Update Redux with current progress
            dispatch(
              setVideoProgress({
                videoId,
                time: state.played,
                playedSeconds: state.playedSeconds,
                duration: duration,
                userId, // Include userId for per-user tracking
              }),
            )
            setLastSavedPosition(state.played)

            // Update course level progress
            if (courseId) {
              dispatch(setResumePoint({ 
                courseId, 
                resumePoint: state.played,
                userId,
              }))
              dispatch(setLastPlayedAt({ 
                courseId, 
                lastPlayedAt: new Date().toISOString(),
                userId,
              }))
            }
            
            progressUpdateRequestRef.current = null
          })
        }
      }
    },
    [onProgress, videoId, lastSavedPosition, dispatch, duration, courseId, userId, isLoading, isBuffering],
  )

  // Add a restart feature for completed courses
  const handleRestartCourse = useCallback(() => {
    // Seek to beginning of current video
    playerRef.current?.seekTo(0)
    setPlayed(0)
    
    // Update storage to reflect restart
    dispatch(
      setVideoProgress({
        videoId,
        time: 0,
        playedSeconds: 0,
        duration: duration,
        userId,
      }),
    )
    
    // Clear the certificate prompt flag to allow it to show again on completion
    if (courseId) {
      localStorage.removeItem(`certificate_${courseId}_${effectiveUserId}`)
      setHasShownCertificatePrompt(false)
    }
    
    toast({
      title: "Course Restarted",
      description: "You can now watch the course from the beginning."
    })
  }, [videoId, duration, dispatch, courseId, effectiveUserId, userId, toast])

  // Improved cleanup that ensures all refs are cleared
  useEffect(() => {
    return () => {
      // Cancel all pending operations
      if (progressUpdateRequestRef.current) {
        cancelAnimationFrame(progressUpdateRequestRef.current)
        progressUpdateRequestRef.current = null
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = null
      }
      
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
        seekTimeoutRef.current = null
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      
      if (playerCheckTimeoutRef.current) {
        clearTimeout(playerCheckTimeoutRef.current)
        playerCheckTimeoutRef.current = null
      }
    }
  }, [])

  // Add additional YouTube-specific configuration
  const youtubeConfig = useMemo(() => ({
    playerVars: {
      autoplay: autoPlay ? 1 : 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      fs: 1,
      controls: 0,
      disablekb: 0,
      playsinline: 1,
      enablejsapi: 1,
      cc_load_policy: showSubtitles ? 1 : 0,
      origin: typeof window !== "undefined" ? window.location.origin : "",
      // Add these to improve loading reliability
      widget_referrer: typeof window !== "undefined" ? window.location.href : "",
      mute: muted ? 1 : 0,
    },
    embedOptions: {
      host: 'https://www.youtube.com' // Use standard host instead of nocookie for better reliability
    },
    onError: (event: any) => {
      console.error('[YouTube] Player error:', event)
      
      // Only set error if it's not already being handled
      if (!playerError) {
        let errorMsg = "Unknown video error"
        
        // Parse YouTube error codes
        switch (event.data) {
          case 2: errorMsg = "Invalid video ID"; break;
          case 5: errorMsg = "HTML5 player error"; break;
          case 100: errorMsg = "Video not found"; break;
          case 101:
          case 150: errorMsg = "Video embedding not allowed"; break;
        }
        
        setPlayerError(errorMsg)
        setIsLoading(false)
      }
    }
  }), [autoPlay, showSubtitles, muted, playerError])

  // Always force stop loading after a certain time
  useEffect(() => {
    const forceLoadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Forcing loading state to end due to timeout");
        setIsLoading(false);
      }
    }, 6000); // 6 seconds max loading time
    
    return () => clearTimeout(forceLoadingTimeout);
  }, [isLoading]);
  
  // Fix for cases where player isn't properly reset between videos
  useEffect(() => {
    // Reset player when video ID changes
    setIsLoading(true);
    setIsPlayerReady(false);
    setPlayerError(null);
    setLoadRetryCount(0);
    
    // Force player reset after a short delay
    const resetTimeout = setTimeout(() => {
      if (!isPlayerReady) {
        console.log("Force resetting player state");
        resetPlayerState();
      }
    }, 3000);
    
    return () => clearTimeout(resetTimeout);
  }, [videoId, resetPlayerState]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-lg group transition-all duration-300 ${
        theaterMode ? "fixed top-0 left-0 w-full h-full z-50 aspect-auto rounded-none" : ""
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={() => setShowControls(true)}
    >
      {/* Loading overlay */}
      <AnimatePresence mode="wait">
        {isLoading && !playerError && !profileError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <VideoPlayerFallback />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {playerError || profileError ? (
        <VideoPlayerFallback 
          onReload={resetPlayerState} 
          error={`${playerError || profileError}${loadRetryCount > 0 ? ` (Retry ${loadRetryCount}/3)` : ''}`} 
        />
      ) : (
        /* Video player */
        <ReactPlayer
          key={`player-${videoId}-${loadRetryCount}`} // Force remount on videoId change or retry
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          onReady={handlePlayerReady}
          onPlay={handlePlay}
          onStart={() => {
            setIsLoading(false)
            setPlayerError(null)
          }}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleVideoEnd}
          onBuffer={() => setIsBuffering(true)}
          onBufferEnd={() => setIsBuffering(false)}
          onError={handlePlayerError}
          onSeek={handleSeek}
          progressInterval={1000}
          playbackRate={playbackSpeed}
          fallback={<VideoPlayerFallback />}
          style={{ backgroundColor: "black" }}
          config={{
            youtube: {
              playerVars: {
                autoplay: autoPlay ? 1 : 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                fs: 1,
                controls: 0,
                disablekb: 0,
                playsinline: 1,
                enablejsapi: 1,
                cc_load_policy: showSubtitles ? 1 : 0,
                origin: typeof window !== "undefined" ? window.location.origin : "",
              },
              embedOptions: {},
              onError: (event) => {
                console.error('[YouTube] Player error:', event);
                handlePlayerError(event);
              }
            },
          }}
        />
      )}

      {/* Buffering indicator - separate from loading */}
      {isBuffering && !isLoading && !playerError && !profileError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] z-30">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {/* Video Controls */}
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
        bookmarks={videoBookmarks}
        nextVideoId={nextVideoId}
        theaterMode={theaterMode}
        showSubtitles={showSubtitles}
        courseCompleted={courseCompleted} // Pass course completed status to show restart button
        isMobile={isMobile} // Pass mobile flag for responsive controls
        onPlayPause={() => setPlaying((prev) => !prev)}
        onSkip={handleSkip}
        onMute={handleMute}
        onVolumeChange={handleVolumeChange}
        onFullscreenToggle={handleFullscreenToggle}
        onNextVideo={() => nextVideoId && onEnded()}
        onSeekMouseDown={(value) => {
          // Stop progress updates during seek
          if (progressUpdateRequestRef.current) {
            cancelAnimationFrame(progressUpdateRequestRef.current)
            progressUpdateRequestRef.current = null
          }
        }}
        onSeekChange={handleSeekChange}
        onSeekMouseUp={() => {
          // Request one final update when seek completes
          if (!progressUpdateRequestRef.current) {
            progressUpdateRequestRef.current = requestAnimationFrame(() => {
              handleProgress({
                played,
                playedSeconds: played * duration,
                loaded,
                loadedSeconds: loaded * duration
              })
              progressUpdateRequestRef.current = null
            })
          }
        }}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        onAutoplayToggle={handleAutoplayToggle}
        onSeekToBookmark={handleSeekToBookmark}
        onAddBookmark={handleAddBookmark}
        onPictureInPicture={handlePictureInPicture}
        onTheaterMode={handleTheaterMode}
        onToggleSubtitles={handleToggleSubtitles}
        onRestartCourse={handleRestartCourse}
        formatTime={formatTime}
      />

      {/* Theater mode indicator - unchanged */}
      <AnimatePresence>
        {theaterMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded-md text-sm z-50"
          >
            Theater Mode • Press T to exit
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookmark tooltip - unchanged */}
      <AnimatePresence>
        {showBookmarkTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-md text-sm z-50 flex items-center gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Bookmark added!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default React.memo(EnhancedVideoPlayer)
