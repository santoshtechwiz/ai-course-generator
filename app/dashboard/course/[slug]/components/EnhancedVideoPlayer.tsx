"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Loader2, Bookmark, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { VideoControls } from "./VideoControls"

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

// Add this fallback component for when the player fails to load
const VideoPlayerFallback = () => (
  <div className="flex flex-col items-center justify-center w-full h-full bg-background rounded-lg border border-border aspect-video">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground mb-4">Unable to load video player</p>
    <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
      Reload Page
    </Button>
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
  const [playing, setPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [played, setPlayed] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)
  const [autoplayNext, setAutoplayNext] = useState(true)
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false)
  const [showCompletionToast, setShowCompletionToast] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [lastSavedPosition, setLastSavedPosition] = useState(0)
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [playerError, setPlayerError] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load global player settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("global-player-mute")
      const savedVolume = localStorage.getItem("global-player-volume")
      const savedAutoplay = localStorage.getItem("global-player-autoplay")
      const savedPlaybackSpeed = localStorage.getItem("global-player-speed")

      if (savedMute) {
        setMuted(savedMute === "true")
      }
      if (savedVolume) {
        setVolume(Number.parseFloat(savedVolume))
      }
      if (savedAutoplay !== null) {
        setAutoplayNext(savedAutoplay === "true")
      } else {
        // Default to true if not set
        setAutoplayNext(true)
        localStorage.setItem("global-player-autoplay", "true")
      }
      if (savedPlaybackSpeed) {
        setPlaybackSpeed(Number.parseFloat(savedPlaybackSpeed))
      }
    }
  }, [])

  // Reset video state when videoId changes
  useEffect(() => {
    setPlaying(autoPlay)
    setVideoCompleted(false)
    if (playerRef.current) {
      if (initialTime > 0) {
        playerRef.current.seekTo(initialTime)
      } else {
        playerRef.current.seekTo(0)
      }
    }
  }, [autoPlay, initialTime, videoId])

  // Load saved position from localStorage
  useEffect(() => {
    if (playerConfig.rememberPosition && typeof window !== "undefined") {
      const savedPosition = localStorage.getItem(`video-position-${videoId}`)
      if (savedPosition) {
        const position = Number.parseFloat(savedPosition)
        setPlayed(position)
        setLastSavedPosition(position)
        // Only seek if the position is valid and not at the end
        if (position > 0 && position < 0.99) {
          playerRef.current?.seekTo(position)
        }
      }
    }
  }, [videoId, playerConfig.rememberPosition])

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

  // Check if video is near completion
  useEffect(() => {
    // Change from 0.95 to 0.98 to ensure video plays closer to the end
    if (played > 0.99 && !videoCompleted) {
      setVideoCompleted(true)
      setPlaying(false) // Pause the video when it's completed

      if (onChapterComplete) {
        onChapterComplete()
      }
      setShowCompletionToast(true)

      setTimeout(() => {
        setShowCompletionToast(false)
      }, 3000)
    }
  }, [played, videoCompleted, onChapterComplete])

  // Throttled progress update
  const handleProgress = useCallback(
    (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
      if (!playerRef.current?.getInternalPlayer()?.seeking) {
        // Only update state if the change is significant enough
        if (Math.abs(state.played - played) > 0.01) {
          setPlayed(state.played)
        }
        if (Math.abs(state.loaded - loaded) > 0.01) {
          setLoaded(state.loaded)
        }

        if (onProgress && Math.abs(state.played - played) > 0.01) {
          onProgress(state.played)
        }

        // Only save position if it's changed significantly (throttling)
        if (
          Math.abs(state.played - lastSavedPosition) > 0.01 &&
          playerConfig.rememberPosition &&
          typeof window !== "undefined"
        ) {
          localStorage.setItem(`video-position-${videoId}`, state.played.toString())
          setLastSavedPosition(state.played)
        }
      }
    },
    [onProgress, videoId, playerConfig.rememberPosition, lastSavedPosition, played, loaded],
  )

  const handleDuration = (duration: number) => setDuration(duration)

  const handleVideoEnd = () => {
    // Pause the video
    setPlaying(false)

    // Mark video as completed by setting position to end
    if (playerConfig.rememberPosition && typeof window !== "undefined") {
      localStorage.setItem(`video-position-${videoId}`, "1.0")
    }

    // Always call onEnded when the video actually ends
    onEnded()
  }

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

  // Handlers for VideoControls component
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

      if (playerConfig.rememberPosition && typeof window !== "undefined") {
        localStorage.setItem(`video-position-${videoId}`, newPosition.toString())
        setLastSavedPosition(newPosition)
      }
    },
    [duration, playerConfig.rememberPosition, videoId],
  )

  const handleMute = useCallback(() => {
    setMuted((prev) => {
      const newMutedState = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("global-player-mute", newMutedState.toString())
      }
      return newMutedState
    })
  }, [])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    setMuted(newVolume === 0)
    if (typeof window !== "undefined") {
      localStorage.setItem("global-player-mute", (newVolume === 0).toString())
      localStorage.setItem("global-player-volume", newVolume.toString())
    }
  }, [])

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
      if (playerConfig.rememberPosition && typeof window !== "undefined") {
        localStorage.setItem(`video-position-${videoId}`, played.toString())
      }
      onEnded()
    }
  }, [nextVideoId, onEnded, playerConfig.rememberPosition, played, videoId])

  const handleAddBookmark = useCallback(() => {
    if (onBookmark && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime()
      onBookmark(currentTime)
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
  }, [onBookmark, toast])

  const handleSeekChange = useCallback(
    (newPlayed: number) => {
      setPlayed(newPlayed)
      playerRef.current?.seekTo(newPlayed)
      if (playerConfig.rememberPosition && typeof window !== "undefined") {
        localStorage.setItem(`video-position-${videoId}`, newPlayed.toString())
        setLastSavedPosition(newPlayed)
      }
      // Ensure time display updates immediately on mobile
      if (onProgress) {
        onProgress(newPlayed)
      }
    },
    [playerConfig.rememberPosition, videoId, onProgress],
  )

  const handlePlaybackSpeedChange = useCallback((newSpeed: number) => {
    setPlaybackSpeed(newSpeed)
    if (typeof window !== "undefined") {
      localStorage.setItem("global-player-speed", newSpeed.toString())
    }
  }, [])

  const handleAutoplayToggle = useCallback(() => {
    setAutoplayNext((prev) => {
      const newState = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("global-player-autoplay", newState.toString())
      }

      toast({
        title: newState ? "Autoplay enabled" : "Autoplay disabled",
        description: newState ? "Videos will play automatically" : "Videos will not play automatically",
        duration: 2000,
      })

      return newState
    })
  }, [toast])

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

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-background border border-border shadow-sm group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={() => setShowControls(true)}
    >
      {playerError ? (
        <VideoPlayerFallback />
      ) : (
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleVideoEnd}
          onBuffer={handleBuffer}
          onBufferEnd={handleBufferEnd}
          onError={() => setPlayerError(true)} // Handle player-specific errors
          progressInterval={1000}
          playbackRate={playbackSpeed}
          style={{ backgroundColor: "transparent" }}
          config={{
            youtube: {
              playerVars: {
                autoplay: autoPlay ? 1 : 0,
                start: Math.floor(initialTime),
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
              },
            },
          }}
        />
      )}

      {/* Bookmark Tooltip */}
      <AnimatePresence>
        {showBookmarkTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg z-50 flex items-center shadow-lg"
          >
            <Bookmark className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Bookmark added!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Toast */}
      <AnimatePresence>
        {showCompletionToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full z-50 flex items-center shadow-lg"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Chapter completed!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Video Controls - Extracted to a separate component */}
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
        autoplayNext={autoplayNext}
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
    </div>
  )
}

export default EnhancedVideoPlayer
