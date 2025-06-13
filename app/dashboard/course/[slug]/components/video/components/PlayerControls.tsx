"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  BookmarkIcon,
  SkipForward,
  Rewind as RewindIcon,
  FastForward as FastForwardIcon,
  ArrowRight,
  Keyboard,
  Monitor,
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
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Prevent event bubbling that could interfere with controls
  const handleControlsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Enhanced seeking functionality with proper state notification
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !duration) return;
      
      // Get the bounds and dimensions of the progress bar
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      
      // Calculate the seek position (0 to 1)
      const seekPosition = Math.max(0, Math.min(1, x / width));
      
      // Convert to seconds and call the seek handler
      const seekTime = duration * seekPosition;
      onSeekChange(seekTime);
    },
    [duration, onSeekChange]
  );

  // Mouse down handler for drag seeking
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const newIsDragging = true;
    setIsDragging(newIsDragging);
    
    // Notify parent about drag state if callback is provided
    if (onIsDragging) {
      onIsDragging(newIsDragging);
    }
    
    // Perform the seek operation
    handleSeek(e);
    
    // Add document-level listeners for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleSeek, onIsDragging]);

  // Mouse move handler (for dragging)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current || !duration) return;
    
    // Calculate position relative to progress bar
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(e.clientX, rect.right)) - rect.left;
    const width = rect.width;
    
    // Calculate the seek position (0 to 1)
    const seekPosition = Math.max(0, Math.min(1, x / width));
    
    // Convert to seconds and call the seek handler
    const seekTime = duration * seekPosition;
    onSeekChange(seekTime);
  }, [isDragging, duration, onSeekChange]);

  // Mouse up handler (end dragging)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Notify parent about drag state if callback is provided
    if (onIsDragging) {
      onIsDragging(false);
    }
    
    // Remove document-level listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, onIsDragging]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp])

  // Handle volume slider visibility
  const handleVolumeMouseEnter = useCallback(() => {
    setShowVolumeSlider(true)
  }, [])

  const handleVolumeMouseLeave = useCallback(() => {
    setShowVolumeSlider(false)
  }, [])

  // Handle bookmark addition
  const handleAddBookmark = useCallback(() => {
    if (onAddBookmark) {
      const currentTime = duration * played
      onAddBookmark(currentTime)
    }
  }, [onAddBookmark, duration, played])

  // Handle Picture-in-Picture
  const handlePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        const videoElement = document.querySelector("video")
        if (videoElement && "requestPictureInPicture" in videoElement) {
          await videoElement.requestPictureInPicture()
        }
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error)
    }
  }, [])

  // Get volume icon
  const getVolumeIcon = () => {
    if (muted || volume === 0) return VolumeX
    if (volume < 0.5) return Volume2
    return Volume2
  }

  const VolumeIcon = getVolumeIcon()

  // Handle skip backward
  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(0, duration * played - 10)
    onSeekChange(newTime)
  }, [duration, played, onSeekChange])

  // Handle skip forward
  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(duration, duration * played + 10)
    onSeekChange(newTime)
  }, [duration, played, onSeekChange])

  // Next video button with tooltip
  const nextVideoButton = useMemo(() => {
    if (!hasNextVideo) return null

    const buttonContent = (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          !canAccessNextVideo && "text-muted-foreground opacity-60",
        )}
        onClick={onNextVideo}
        disabled={!canAccessNextVideo}
        title={canAccessNextVideo ? `Next: ${nextVideoTitle}` : "Sign in to access more videos"}
      >
        <SkipForward className="h-5 w-5" />
      </Button>
    )

    // If user can't access next video, wrap in tooltip
    if (!canAccessNextVideo) {
      return (
        <div className="relative group">
          {buttonContent}
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Sign in to access more videos
          </div>
        </div>
      )
    }

    return buttonContent
  }, [hasNextVideo, canAccessNextVideo, nextVideoTitle, onNextVideo])

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-30 px-4 pt-10 pb-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent",
        "transition-opacity duration-200",
        !show && "opacity-0 pointer-events-none"
      )}
      onClick={handleControlsClick}
    >
      {/* Progress bar with bookmarks */}
      <div 
        className="relative flex items-center mb-1 group h-10 cursor-pointer"
        ref={progressBarRef}
        onClick={handleSeek}
        onMouseDown={handleMouseDown}
      >
        {/* Taller click area for easier interaction */}
        <div className="absolute inset-0"></div>
        
        {/* Actual progress bar that shows loaded/played */}
        <div className="absolute left-0 right-0 top-4 h-1 bg-white/20 rounded group-hover:h-1.5 transition-all">
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/40 rounded"
            style={{ width: `${loaded * 100}%` }}
          ></div>
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary rounded"
            style={{ width: `${played * 100}%` }}
          ></div>
        </div>

        {/* Time tooltip when hovering */}
        {hoveredTime !== null && (
          <div 
            className="absolute top-[-25px] px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none"
            style={{ left: `${(hoveredTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {formatTime(hoveredTime)}
          </div>
        )}

        {/* Bookmarks on timeline (if any) */}
        {bookmarks?.length > 0 && bookmarks.map((time, index) => (
          <div
            key={`bookmark-${index}`}
            className="absolute w-1 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{ left: `${(time / duration) * 100}%`, top: "50%" }}
            onClick={(e) => {
              e.stopPropagation();
              onSeekToBookmark?.(time);
            }}
            title={`Bookmark at ${formatTime(time)}`}
          />
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center space-x-2">
          {/* Play/Pause button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white"
            onClick={onPlayPause}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          {/* Skip backward */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
          >
            <RewindIcon className="h-5 w-5" />
          </Button>

          {/* Skip forward */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
          >
            <FastForwardIcon className="h-5 w-5" />
          </Button>

          {/* Next video button */}
          {hasNextVideo && onNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-white",
                !canAccessNextVideo && "opacity-60"
              )}
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={canAccessNextVideo ? `Next: ${nextVideoTitle}` : "Sign in to access more videos"}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          )}

          {/* Volume control */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white"
              onClick={onMute}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            {showVolumeSlider && (
              <div className="absolute left-full ml-2 bg-black/90 p-2 rounded-lg z-10 w-24">
                <Slider
                  value={[muted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([value]) => onVolumeChange(value / 100)}
                />
              </div>
            )}
          </div>

          {/* Time display - Updated for better handling of invalid values */}
          <div className="text-sm text-white hidden md:block">
            {formatTime(isNaN(duration) ? 0 : duration * played)} / {formatTime(isNaN(duration) ? 0 : duration)}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-2">
          {/* Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="hidden md:flex items-center mr-2">
              <span className="text-xs text-white mr-2">Autoplay</span>
              <Switch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                size="sm"
              />
            </div>
          )}

          {/* Bookmark button */}
          {isAuthenticated && onAddBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white"
              onClick={() => onAddBookmark(duration * played)}
            >
              <BookmarkIcon className="h-5 w-5" />
            </Button>
          )}

          {/* Theater mode */}
          {onTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white"
              onClick={onTheaterMode}
            >
              <Monitor className="h-5 w-5" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white"
            onClick={onToggleFullscreen}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PlayerControls
