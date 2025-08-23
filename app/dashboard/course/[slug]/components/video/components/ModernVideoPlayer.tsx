"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
const ReactPlayer: any = dynamic(() => import("react-player/youtube"), { ssr: false })
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  Bookmark,
  PictureInPicture2,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useVideoProgress } from "../hooks/useVideoProgress"
import { useVideoPlayer } from "../hooks/useVideoPlayer"
import { toast } from "@/components/ui/use-toast"
import type { VideoPlayerProps } from "../types"

// Auto-play notification component
const AutoPlayNotification = React.memo(
  ({ 
    countdown, 
    onCancel, 
    onProceed,
    nextVideoTitle 
  }: {
    countdown: number
    onCancel: () => void
    onProceed: () => void
    nextVideoTitle?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50"
    >
      <Card className="bg-background/95 backdrop-blur-md border-primary/20 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeOpacity="0.2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray={`${(countdown / 5) * 100}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{countdown}</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Next Chapter</h4>
              <p className="text-xs text-muted-foreground truncate">
                {nextVideoTitle || "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onProceed}>
              Play Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
)

AutoPlayNotification.displayName = "AutoPlayNotification"

// Modern video player component
const ModernVideoPlayer: React.FC<VideoPlayerProps> = ({
  youtubeVideoId,
  chapterId,
  onEnded,
  onProgress,
  onTimeUpdate,
  rememberPlaybackPosition = true,
  autoPlay = false,
  courseId,
  courseName,
  chapterTitle,
  nextVideoId,
  nextVideoTitle,
  hasNextVideo,
  onNextVideo,
  className,
  isAuthenticated = false,
  ...props
}) => {
  const { data: session } = useSession()
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // State management
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showAutoPlay, setShowAutoPlay] = useState(false)
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(5)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [savedPosition, setSavedPosition] = useState(0)

  // Video progress tracking
  const videoProgress = useVideoProgress({
    courseId: String(courseId || ''),
    chapterId: String(chapterId || ''),
    videoId: youtubeVideoId,
    enabled: isAuthenticated,
  })

  // Load saved position on mount
  useEffect(() => {
    if (rememberPlaybackPosition && videoProgress.loadSavedPosition) {
      videoProgress.loadSavedPosition().then(position => {
        setSavedPosition(position)
      })
    }
  }, [rememberPlaybackPosition, videoProgress.loadSavedPosition])

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])

  // Mouse movement handler
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout()
  }, [resetControlsTimeout])

  // Player event handlers
  const handleReady = useCallback(() => {
    setIsLoading(false)
    if (savedPosition > 0) {
      playerRef.current?.seekTo(savedPosition)
    }
  }, [savedPosition])

  const handleProgress = useCallback((state: { played: number; playedSeconds: number; loaded: number }) => {
    setProgress(state.played)
    setCurrentTime(state.playedSeconds)
    
    // Track progress
    if (duration > 0) {
      videoProgress.handleProgress({
        played: state.played,
        playedSeconds: state.playedSeconds,
        loaded: state.loaded,
      }, duration)
    }

    onProgress?.(state)
  }, [duration, videoProgress.handleProgress, onProgress])

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration)
  }, [])

  const handleEnded = useCallback(() => {
    videoProgress.handleVideoEnd()
    
    if (hasNextVideo) {
      setShowAutoPlay(true)
      setAutoPlayCountdown(5)
      
      const interval = setInterval(() => {
        setAutoPlayCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setShowAutoPlay(false)
            onNextVideo?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    onEnded?.()
  }, [videoProgress.handleVideoEnd, hasNextVideo, onNextVideo, onEnded])

  // Control handlers
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  const handleSeek = useCallback((value: number[]) => {
    const seekTime = (value[0] / 100) * duration
    setCurrentTime(seekTime)
    playerRef.current?.seekTo(seekTime)
    videoProgress.handleSeek(seekTime)
  }, [duration, videoProgress.handleSeek])

  const skipForward = useCallback(() => {
    const newTime = Math.min(currentTime + 10, duration)
    playerRef.current?.seekTo(newTime)
  }, [currentTime, duration])

  const skipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - 10, 0)
    playerRef.current?.seekTo(newTime)
  }, [currentTime])

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    }
  }, [isFullscreen])

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Player configuration
  const playerConfig = useMemo(() => ({
    youtube: {
      playerVars: {
        autoplay: autoPlay ? 1 : 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
      },
    },
  }), [autoPlay])

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group aspect-video",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        playbackRate={playbackRate}
        width="100%"
        height="100%"
        config={playerConfig}
        onReady={handleReady}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Center Button */}
      <AnimatePresence>
        {(!isPlaying && !isLoading) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Button
              size="lg"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary"
            >
              <Play className="w-6 h-6 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-4"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {videoProgress.isChapterCompleted() && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    Completed
                  </Badge>
                )}
                <h3 className="text-white font-medium text-sm md:text-base truncate">
                  {chapterTitle || `Chapter ${chapterId}`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="px-2">
                <Slider
                  value={[progress * 100]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipBackward}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipForward}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <div className="w-20 hidden md:block">
                      <Slider
                        value={[isMuted ? 0 : volume * 100]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-sm ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <PictureInPicture2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-play Notification */}
      <AnimatePresence>
        {showAutoPlay && (
          <AutoPlayNotification
            countdown={autoPlayCountdown}
            nextVideoTitle={nextVideoTitle}
            onCancel={() => {
              setShowAutoPlay(false)
              setAutoPlayCountdown(5)
            }}
            onProceed={() => {
              setShowAutoPlay(false)
              onNextVideo?.()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModernVideoPlayer
