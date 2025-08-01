"use client"

import React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  BookmarkIcon,
  SkipForward,
  RewindIcon,
  FastForwardIcon,
  Monitor,
  PictureInPicture2,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface PlayerControlsProps {
  playing: boolean
  muted: boolean
  volume: number
  playbackRate: number
  played: number
  loaded: number
  duration: number
  isFullscreen: boolean
  isBuffering: boolean
  bufferHealth: number
  onPlayPause: () => void
  onMute: () => void
  onVolumeChange: (volume: number) => void
  onSeekChange: (time: number) => void
  onPlaybackRateChange: (rate: number) => void
  onToggleFullscreen: () => void
  onAddBookmark: (time: number) => void
  formatTime: (seconds: number) => string
  bookmarks: number[]
  onSeekToBookmark: (time: number) => void
  isAuthenticated: boolean
  show?: boolean
  onCertificateClick?: () => void
  playerConfig?: Record<string, any>
  onShowKeyboardShortcuts?: () => void
  onTheaterMode?: () => void
  onNextVideo?: () => void
  onToggleBookmarkPanel?: () => void
  autoPlayNext?: boolean
  onToggleAutoPlayNext?: () => void
  hasNextVideo?: boolean
  nextVideoTitle?: string
  canAccessNextVideo?: boolean
  onIsDragging?: (isDragging: boolean) => void
  onPictureInPicture?: () => void
  isPiPSupported?: boolean
  isPiPActive?: boolean
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  playing,
  muted,
  volume,
  playbackRate,
  played,
  loaded,
  duration,
  isFullscreen,
  isBuffering,
  bufferHealth,
  onPlayPause,
  onMute,
  onVolumeChange,
  onSeekChange,
  onPlaybackRateChange,
  onToggleFullscreen,
  onAddBookmark,
  formatTime,
  bookmarks = [],
  onSeekToBookmark,
  isAuthenticated,
  show = true,
  onCertificateClick,
  playerConfig,
  onShowKeyboardShortcuts,
  onTheaterMode,
  onNextVideo,
  onToggleBookmarkPanel,
  autoPlayNext = true,
  onToggleAutoPlayNext,
  hasNextVideo = false,
  nextVideoTitle = "",
  canAccessNextVideo = true,
  onIsDragging,
  onPictureInPicture,
  isPiPSupported = false,
  isPiPActive = false,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Prevent event bubbling that could interfere with controls
  const handleControlsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Enhanced seeking functionality with proper state notification
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !duration) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width

      const seekPosition = Math.max(0, Math.min(1, x / width))
      const seekTime = duration * seekPosition
      onSeekChange(seekTime)
    },
    [duration, onSeekChange],
  )

  // Enhanced mouse down handler for drag seeking
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const newIsDragging = true
      setIsDragging(newIsDragging)

      if (onIsDragging) {
        onIsDragging(newIsDragging)
      }

      handleSeek(e)

      const handleMouseMove = (e: MouseEvent) => {
        if (!progressBarRef.current || !duration) return

        const rect = progressBarRef.current.getBoundingClientRect()
        const x = Math.max(rect.left, Math.min(e.clientX, rect.right)) - rect.left
        const width = rect.width

        const seekPosition = Math.max(0, Math.min(1, x / width))
        const seekTime = duration * seekPosition
        onSeekChange(seekTime)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        if (onIsDragging) {
          onIsDragging(false)
        }
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [handleSeek, onIsDragging, duration, onSeekChange],
  )

  // Enhanced volume slider visibility with auto-hide
  const handleVolumeMouseEnter = useCallback(() => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current)
    }
    setShowVolumeSlider(true)
  }, [])

  const handleVolumeMouseLeave = useCallback(() => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false)
    }, 1000)
  }, [])

  // Cleanup volume timeout
  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current)
      }
    }
  }, [])

  // Enhanced bookmark addition
  const handleAddBookmark = useCallback(() => {
    if (onAddBookmark) {
      const currentTime = duration * played
      onAddBookmark(currentTime)
    }
  }, [onAddBookmark, duration, played])

  // Enhanced skip handlers
  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(0, duration * played - 10)
    onSeekChange(newTime)
  }, [duration, played, onSeekChange])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(duration, duration * played + 10)
    onSeekChange(newTime)
  }, [duration, played, onSeekChange])

  // Memoized volume icon
  const VolumeIcon = useMemo(() => {
    if (muted || volume === 0) return VolumeX
    return Volume2
  }, [muted, volume])

  // Memoized next video button
  const nextVideoButton = useMemo(() => {
    if (!hasNextVideo) return null

    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 touch-manipulation", !canAccessNextVideo && "text-muted-foreground opacity-60")}
        onClick={onNextVideo}
        disabled={!canAccessNextVideo}
        title={canAccessNextVideo ? `Next: ${nextVideoTitle}` : "Sign in to access more videos"}
        aria-label={canAccessNextVideo ? `Next video: ${nextVideoTitle}` : "Sign in to access more videos"}
      >
        <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    )
  }, [hasNextVideo, canAccessNextVideo, nextVideoTitle, onNextVideo])

  // Memoized playback speed options
  const playbackSpeeds = useMemo(() => [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], [])

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-30 px-2 sm:px-4 pt-8 sm:pt-10 pb-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent",
        "transition-opacity duration-200",
        !show && "opacity-0 pointer-events-none",
      )}
      onClick={handleControlsClick}
      role="toolbar"
      aria-label="Video player controls"
    >
      {/* Enhanced Progress bar with bookmarks */}
      <div
        className="relative flex items-center mb-1 group h-8 sm:h-10 cursor-pointer touch-manipulation"
        ref={progressBarRef}
        onClick={handleSeek}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={duration * played}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault()
            handleSkipBackward()
          } else if (e.key === "ArrowRight") {
            e.preventDefault()
            handleSkipForward()
          }
        }}
      >
        <div className="absolute inset-0"></div>

        <div className="absolute left-0 right-0 top-3 sm:top-4 h-1 bg-white/20 rounded group-hover:h-1.5 transition-all">
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/40 rounded"
            style={{ width: `${loaded * 100}%` }}
          ></div>
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary rounded"
            style={{ width: `${played * 100}%` }}
          ></div>
        </div>

        {/* Enhanced bookmarks on timeline */}
        {bookmarks?.length > 0 &&
          bookmarks.map((time, index) => (
            <button
              key={`bookmark-${index}`}
              className="absolute w-2 h-4 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 hover:bg-yellow-300 transition-colors touch-manipulation"
              style={{ left: `${(time / duration) * 100}%`, top: "50%" }}
              onClick={(e) => {
                e.stopPropagation()
                onSeekToBookmark?.(time)
              }}
              title={`Bookmark at ${formatTime(time)}`}
              aria-label={`Seek to bookmark at ${formatTime(time)}`}
            />
          ))}
      </div>

      {/* Enhanced Controls row */}
      <div className="flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Enhanced Play/Pause button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white touch-manipulation hover:bg-white/20"
            onClick={onPlayPause}
            title={playing ? "Pause" : "Play"}
            aria-label={playing ? "Pause video" : "Play video"}
          >
            {playing ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          {/* Enhanced Skip backward */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white touch-manipulation hover:bg-white/20"
            onClick={handleSkipBackward}
            title="Skip backward 10 seconds"
            aria-label="Skip backward 10 seconds"
          >
            <RewindIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Enhanced Skip forward */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white touch-manipulation hover:bg-white/20"
            onClick={handleSkipForward}
            title="Skip forward 10 seconds"
            aria-label="Skip forward 10 seconds"
          >
            <FastForwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Next video button */}
          {nextVideoButton}

          {/* Enhanced Volume control */}
          <div
            className="relative flex items-center"
            onMouseEnter={handleVolumeMouseEnter}
            onMouseLeave={handleVolumeMouseLeave}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white touch-manipulation hover:bg-white/20"
              onClick={onMute}
              title={muted ? "Unmute" : "Mute"}
              aria-label={muted ? "Unmute audio" : "Mute audio"}
            >
              <VolumeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {showVolumeSlider && (
              <div className="absolute left-full ml-2 bg-black/90 p-2 rounded-lg z-10 w-20 sm:w-24">
                <Slider
                  value={[muted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([value]) => onVolumeChange(value / 100)}
                  className="touch-manipulation"
                  aria-label="Volume control"
                />
              </div>
            )}
          </div>

          {/* Enhanced Time display */}
          <div className="text-xs sm:text-sm text-white hidden md:block font-mono">
            {formatTime(isNaN(duration) ? 0 : duration * played)} / {formatTime(isNaN(duration) ? 0 : duration)}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Enhanced Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="hidden lg:flex items-center mr-2">
              <span className="text-xs text-white mr-2">Autoplay</span>
              <Switch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                size="sm"
                aria-label="Toggle autoplay next video"
              />
            </div>
          )}

          {/* Enhanced Bookmark button */}
          {isAuthenticated && onAddBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white touch-manipulation hover:bg-white/20"
              onClick={handleAddBookmark}
              title="Add bookmark"
              aria-label="Add bookmark at current time"
            >
              <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Enhanced Picture-in-Picture */}
          {isPiPSupported && onPictureInPicture && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 text-white touch-manipulation hover:bg-white/20", isPiPActive && "bg-white/20")}
              onClick={onPictureInPicture}
              title={isPiPActive ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}
              aria-label={isPiPActive ? "Exit Picture-in-Picture mode" : "Enter Picture-in-Picture mode"}
            >
              <PictureInPicture2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Enhanced Theater mode */}
          {onTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white touch-manipulation hover:bg-white/20"
              onClick={onTheaterMode}
              title="Toggle theater mode"
              aria-label="Toggle theater mode"
            >
              <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Enhanced Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white touch-manipulation hover:bg-white/20"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
          >
            <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)
