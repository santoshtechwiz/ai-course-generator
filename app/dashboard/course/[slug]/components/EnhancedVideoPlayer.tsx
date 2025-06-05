"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
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
        <p className="text-sm text-muted-foreground">This may take a few moments</p>
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
}: VideoPlayerProps) => {
  const dispatch = useAppDispatch()

  // Redux state selectors
  const autoplayEnabled = useAppSelector((state) => state.course.autoplayEnabled)
  const playbackSettings = useAppSelector((state) => state.course.playbackSettings)
  const courseId = useAppSelector((state) => state.course.currentCourseId)
  const videoProgress = useAppSelector((state) => state.course.videoProgress[videoId])
  const videoBookmarks = useAppSelector((state) => state.course.bookmarks[videoId] || [])

  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(playbackSettings.volume ?? 0.8)
  const [muted, setMuted] = useState(playbackSettings.muted ?? false)
  const [played, setPlayed] = useState(videoProgress?.time || initialTime)
  const [loaded, setLoaded] = useState(0)
  const [duration, setDuration] = useState(videoProgress?.duration || 0)
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(playbackSettings.playbackSpeed ?? 1)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [lastSavedPosition, setLastSavedPosition] = useState(videoProgress?.time || 0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [playerError, setPlayerError] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressUpdateRequestRef = useRef<number | null>(null)

  // Keyboard shortcuts
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

  const handleSkip = useCallback(
    (seconds: number) => {
      const currentTime = playerRef.current?.getCurrentTime() || 0
      const newTime = currentTime + seconds
      const newPosition = Math.max(0, Math.min(newTime / duration, 0.999))
      playerRef.current?.seekTo(newPosition)
      setPlayed(newPosition)

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

  const handleTheaterMode = useCallback(() => {
    setTheaterMode((prev) => !prev)
  }, [])

  const handleToggleSubtitles = useCallback(() => {
    setShowSubtitles((prev) => !prev)
    toast({
      title: showSubtitles ? "Subtitles disabled" : "Subtitles enabled",
      description: showSubtitles ? "Subtitles have been turned off" : "Subtitles have been turned on",
    })
  }, [showSubtitles, toast])

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

  // Add a handler for when seeking is finished
  const handleSeek = useCallback((seekedTo: number) => {
    setIsLoading(false)
    setIsBuffering(false)
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current)
      seekTimeoutRef.current = null
    }
  }, [])

  const handleSeekChange = useCallback(
    (newPlayed: number) => {
      // Cancel any pending seek timeout
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
        seekTimeoutRef.current = null
      }

      setPlayed(newPlayed)
      setIsLoading(true)

      // Use a ref to track the current seek operation
      playerRef.current?.seekTo(newPlayed)

      // Set a fallback timeout in case onSeek doesn't fire
      seekTimeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        seekTimeoutRef.current = null
      }, 3000)

      // Only update progress for authenticated users
      if (isAuthenticated) {
        const newPlayedSeconds = newPlayed * duration

        // Debounce progress updates to prevent excessive API calls
        if (Math.abs(newPlayed - lastSavedPosition) > 0.01) {
          dispatch(
            setVideoProgress({
              videoId,
              time: newPlayed,
              playedSeconds: newPlayedSeconds,
              duration: duration,
            }),
          )
          setLastSavedPosition(newPlayed)

          if (onProgress) {
            onProgress(newPlayed)
          }

          if (courseId) {
            dispatch(setResumePoint({ courseId, resumePoint: newPlayed }))
            dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }))
          }
        }
      }
    },
    [videoId, onProgress, dispatch, duration, courseId, isAuthenticated, lastSavedPosition],
  )

  // Clean up seek timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
        seekTimeoutRef.current = null
      }

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = null
      }
    }
  }, [])

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

  const handleAutoplayToggle = useCallback(() => {
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

  const handleVideoReady = useCallback(() => {
    setLoadingProgress(100)
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  const handlePlayerReady = useCallback(() => {
    setIsPlayerReady(true)
    setIsLoading(false)

    // Resume from saved position if available
    if (videoProgress?.time && videoProgress.time > 0.01) {
      playerRef.current?.seekTo(videoProgress.time)
      setPlayed(videoProgress.time)
    }

    if (autoPlay || autoplayEnabled) {
      setPlaying(true)
    }
  }, [autoPlay, autoplayEnabled, videoProgress])

  const handlePlay = useCallback(() => {
    setIsPlayerReady(true)
    setIsLoading(false)
  }, [])

  const handleVideoEnd = useCallback(() => {
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

    onEnded()
  }, [videoId, dispatch, duration, onEnded, onChapterComplete])

  const handleProgress = useCallback(
    (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
      // Don't update progress while seeking to prevent jumps
      if (seekTimeoutRef.current) return

      setPlayed(state.played)
      setLoaded(state.loaded)

      if (onProgress) {
        onProgress(state.played)
      }

      // Only update progress for authenticated users and when change is significant
      if (isAuthenticated && Math.abs(state.played - lastSavedPosition) > 0.01) {
        // Use a debounced update to prevent excessive state changes
        const updateProgressData = () => {
          dispatch(
            setVideoProgress({
              videoId,
              time: state.played,
              playedSeconds: state.playedSeconds,
              duration: duration,
            }),
          )
          setLastSavedPosition(state.played)

          // Only update course progress for authenticated users
          if (courseId) {
            dispatch(setResumePoint({ courseId, resumePoint: state.played }))
            dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }))
          }
        }

        // Use requestAnimationFrame for smoother updates
        if (!progressUpdateRequestRef.current) {
          progressUpdateRequestRef.current = requestAnimationFrame(() => {
            updateProgressData()
            progressUpdateRequestRef.current = null
          })
        }
      }
    },
    [onProgress, videoId, lastSavedPosition, dispatch, duration, courseId, isAuthenticated],
  )

  const handleDuration = (duration: number) => setDuration(duration)

  const handlePlayerError = useCallback((error: any) => {
    console.error("[EnhancedVideoPlayer] Player error:", error)
    setPlayerError(true)
  }, [])

  const resetPlayerState = useCallback(() => {
    setPlayerError(false)
    setIsLoading(true)
    setIsPlayerReady(false)
  }, [])

  // Auto-hide controls
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

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }

    if (typeof document !== "undefined") {
      document.addEventListener("fullscreenchange", handleFullscreenChange)
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Video completion detection
  useEffect(() => {
    if (!videoCompleted && duration > 0 && played > 0.97) {
      setVideoCompleted(true)
      handleVideoEnd()
    }
  }, [played, duration, videoCompleted, handleVideoEnd])

  useEffect(() => {
    return () => {
      if (progressUpdateRequestRef.current) {
        cancelAnimationFrame(progressUpdateRequestRef.current)
        progressUpdateRequestRef.current = null
      }
    }
  }, [])

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
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <VideoPlayerFallback />
          </motion.div>
        )}
      </AnimatePresence>

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
          onSeek={handleSeek}
          progressInterval={1000}
          playbackRate={playbackSpeed}
          style={{ backgroundColor: "transparent" }}
          config={{
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
              },
            },
          }}
        />
      )}

      {/* Single Loading indicator (only one loader at a time) */}
      {(!isPlayerReady || isBuffering || isLoading) && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
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
        onPlayPause={() => setPlaying((prev) => !prev)}
        onSkip={handleSkip}
        onMute={handleMute}
        onVolumeChange={handleVolumeChange}
        onFullscreenToggle={handleFullscreenToggle}
        onNextVideo={() => nextVideoId && onEnded()}
        onSeekChange={handleSeekChange}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        onAutoplayToggle={handleAutoplayToggle}
        onSeekToBookmark={handleSeekToBookmark}
        onAddBookmark={handleAddBookmark}
        onPictureInPicture={handlePictureInPicture}
        onTheaterMode={handleTheaterMode}
        onToggleSubtitles={handleToggleSubtitles}
        formatTime={formatTime}
      />

      {/* Theater mode indicator */}
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

      {/* Bookmark tooltip */}
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
