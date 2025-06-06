"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Settings,
  Bookmark,
  PictureInPictureIcon as Picture,
  Subtitles,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  CheckCircle,
  Monitor,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced TypeScript interfaces
interface SettingsMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SettingsMenuItemProps {
  onClick: () => void
  children: React.ReactNode
  className?: string
}

interface VolumeControlProps {
  volume: number
  onChange: (vol: number) => void
  muted: boolean
  show: boolean
}

interface ProgressBarProps {
  played: number
  loaded: number
  duration: number
  bookmarks: number[]
  onSeekChange: (position: number) => void
  onSeekToBookmark: (time: number) => void
  formatTime: (seconds: number) => string
}

interface VideoControlsProps {
  show: boolean
  playing: boolean
  muted: boolean
  volume: number
  played: number
  loaded: number
  duration: number
  fullscreen: boolean
  playbackSpeed: number
  autoplayNext: boolean
  bookmarks: number[]
  nextVideoId?: string
  theaterMode?: boolean
  showSubtitles?: boolean
  quality?: string
  bufferHealth?: number
  onPlayPause: () => void
  onSkip: (seconds: number) => void
  onMute: () => void
  onVolumeChange: (volume: number) => void
  onFullscreenToggle: () => void
  onNextVideo: () => void
  onSeekChange: (position: number) => void
  onPlaybackSpeedChange: (speed: number) => void
  onAutoplayToggle: () => void
  onSeekToBookmark: (time: number) => void
  onAddBookmark: () => void
  onPictureInPicture?: () => void
  onTheaterMode?: () => void
  onToggleSubtitles?: () => void
  formatTime: (seconds: number) => string
}

interface PlaybackSpeed {
  value: number
  label: string
}

interface QualityOption {
  value: string
  label: string
}

// Enhanced Settings Menu Component
const SettingsMenu = ({ trigger, children, open, onOpenChange }: SettingsMenuProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node
      if (ref.current && !ref.current.contains(target)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, onOpenChange])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 bottom-full mb-3 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl z-50 w-72 overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )
}

const SettingsMenuItem = ({ onClick, children, className = "" }: SettingsMenuItemProps) => (
  <div
    className={cn("px-4 py-3 text-sm cursor-pointer hover:bg-white/10 transition-colors text-white", className)}
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
  >
    {children}
  </div>
)

const SettingsDivider = () => <div className="h-px bg-white/20 my-1" />

// Enhanced Volume Control with YouTube-like design
const VolumeControl = ({ volume, onChange, muted, show }: VolumeControlProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const volumeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    setIsDragging(true)
    updateVolume(e)
  }, [])

  const updateVolume = useCallback(
    (e: React.MouseEvent | MouseEvent): void => {
      if (!volumeRef.current) return

      const rect: DOMRect = volumeRef.current.getBoundingClientRect()
      const offsetY: number = rect.bottom - e.clientY
      const newVolume: number = Math.max(0, Math.min(1, offsetY / rect.height))
      onChange(newVolume)
    },
    [onChange],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (isDragging) updateVolume(e)
    }

    const handleMouseUp = (): void => setIsDragging(false)

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, updateVolume])

  if (!show) return null

  const displayVolume: number = muted ? 0 : volume
  const volumePercentage: number = Math.round(displayVolume * 100)

  return (
    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-white/20">
      <div
        ref={volumeRef}
        className="w-1 h-24 bg-white/30 rounded-full cursor-pointer relative"
        onMouseDown={handleMouseDown}
      >
        <div
          className="w-full bg-red-500 rounded-full absolute bottom-0 transition-all duration-150"
          style={{ height: `${displayVolume * 100}%` }}
        />
        <div
          className="w-3 h-3 bg-white rounded-full absolute left-1/2 transform -translate-x-1/2 cursor-grab shadow-lg"
          style={{ bottom: `calc(${displayVolume * 100}% - 6px)` }}
        />
      </div>
      <div className="text-white text-xs text-center mt-2 font-medium">{volumePercentage}</div>
    </div>
  )
}

// Enhanced Progress Bar with YouTube-like design
const ProgressBar = ({
  played,
  loaded,
  duration,
  bookmarks,
  onSeekChange,
  onSeekToBookmark,
  formatTime,
}: ProgressBarProps) => {
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [hoverPosition, setHoverPosition] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent): void => {
    if (!progressRef.current) return

    const rect: DOMRect = progressRef.current.getBoundingClientRect()
    const position: number = (e.clientX - rect.left) / rect.width
    setHoverPosition(Math.max(0, Math.min(1, position)))
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent): void => {
      if (!progressRef.current) return

      const rect: DOMRect = progressRef.current.getBoundingClientRect()
      const position: number = (e.clientX - rect.left) / rect.width
      onSeekChange(Math.max(0, Math.min(1, position)))
    },
    [onSeekChange],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      setIsDragging(true)
      handleClick(e)
    },
    [handleClick],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (isDragging && progressRef.current) {
        const rect: DOMRect = progressRef.current.getBoundingClientRect()
        const position: number = (e.clientX - rect.left) / rect.width
        onSeekChange(Math.max(0, Math.min(1, position)))
      }
    }

    const handleMouseUp = (): void => setIsDragging(false)

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, onSeekChange])

  const hoverTime: string = formatTime(duration * hoverPosition)
  const progressHeight: string = isHovering || isDragging ? "h-2" : "h-1"

  return (
    <div className="relative group">
      {/* Hover Preview */}
      {isHovering && duration > 0 && (
        <div
          className="absolute bottom-full mb-2 bg-black/90 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none z-10 transform -translate-x-1/2"
          style={{ left: `${hoverPosition * 100}%` }}
        >
          {hoverTime}
        </div>
      )}

      <div
        ref={progressRef}
        className={cn(
          "relative w-full bg-white/30 rounded-full cursor-pointer transition-all duration-200",
          progressHeight,
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {/* Loaded Progress */}
        <div className="h-full bg-white/40 rounded-full absolute top-0 left-0" style={{ width: `${loaded * 100}%` }} />

        {/* Played Progress */}
        <div
          className="h-full bg-red-500 rounded-full absolute top-0 left-0 transition-all duration-150"
          style={{ width: `${played * 100}%` }}
        />

        {/* Scrubber Handle */}
        {(isHovering || isDragging) && (
          <div
            className="absolute top-1/2 w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg transition-all duration-150"
            style={{ left: `${played * 100}%` }}
          />
        )}

        {/* Bookmarks */}
        {bookmarks.map((time: number, index: number) => {
          const bookmarkPosition: number = duration > 0 ? (time / duration) * 100 : 0
          return (
            <div
              key={index}
              className="absolute top-1/2 w-2 h-3 bg-yellow-400 rounded-sm transform -translate-y-1/2 cursor-pointer hover:bg-yellow-300 transition-colors shadow-sm"
              style={{ left: `${bookmarkPosition}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onSeekToBookmark(time)
              }}
              title={`Bookmark: ${formatTime(time)}`}
            />
          )
        })}

        {/* Hover Position Indicator */}
        {isHovering && (
          <div
            className="absolute top-0 w-px h-full bg-white/60 pointer-events-none"
            style={{ left: `${hoverPosition * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

// Playback speed options
const PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "Normal" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 1.75, label: "1.75x" },
  { value: 2, label: "2x" },
]

const QUALITY_OPTIONS: QualityOption[] = [
  { value: "auto", label: "Auto" },
  { value: "hd1080", label: "1080p" },
  { value: "hd720", label: "720p" },
  { value: "large", label: "480p" },
  { value: "medium", label: "360p" },
  { value: "small", label: "240p" },
]

export const VideoControls = ({
  show,
  playing,
  muted,
  volume,
  played,
  loaded,
  duration,
  fullscreen,
  playbackSpeed,
  autoplayNext,
  bookmarks,
  nextVideoId,
  theaterMode = false,
  showSubtitles = false,
  quality = "auto",
  bufferHealth = 0,
  onPlayPause,
  onSkip,
  onMute,
  onVolumeChange,
  onFullscreenToggle,
  onNextVideo,
  onSeekChange,
  onPlaybackSpeedChange,
  onAutoplayToggle,
  onSeekToBookmark,
  onAddBookmark,
  onPictureInPicture = () => {},
  onTheaterMode = () => {},
  onToggleSubtitles = () => {},
  formatTime,
}: VideoControlsProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)

  const getVolumeIcon = (): React.ReactElement => {
    if (muted || volume === 0) return <VolumeX className="h-5 w-5" />
    if (volume < 0.5) return <Volume1 className="h-5 w-5" />
    return <Volume2 className="h-5 w-5" />
  }

  const getQualityBadge = (): string => {
    if (quality === "auto") return "Auto"
    if (quality === "hd1080") return "1080p"
    if (quality === "hd720") return "720p"
    return quality.toUpperCase()
  }

  const currentTime: string = formatTime(duration * played)
  const totalTime: string = formatTime(duration)

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-sm transition-all duration-300 z-30",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <ProgressBar
          played={played}
          loaded={loaded}
          duration={duration}
          bookmarks={bookmarks}
          onSeekChange={onSeekChange}
          onSeekToBookmark={onSeekToBookmark}
          formatTime={formatTime}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 pb-4">
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="h-10 w-10 text-white hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-105"
            title={playing ? "Pause (k)" : "Play (k)"}
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip(-10)}
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
            title="Rewind 10 seconds (j)"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip(10)}
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
            title="Forward 10 seconds (l)"
          >
            <RotateCw className="h-5 w-5" />
          </Button>

          {nextVideoId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextVideo}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
              title="Next video"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          )}

          {/* Volume Control */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
              title={muted ? "Unmute (m)" : "Mute (m)"}
            >
              {getVolumeIcon()}
            </Button>
            <VolumeControl volume={volume} onChange={onVolumeChange} muted={muted} show={showVolumeSlider} />
          </div>

          {/* Time Display */}
          <div className="text-white text-sm font-medium ml-2 min-w-max">
            <span>{currentTime}</span>
            <span className="text-white/60 mx-1">/</span>
            <span className="text-white/80">{totalTime}</span>
          </div>

          {/* Buffer Health Indicator */}
          {bufferHealth > 0 && bufferHealth < 50 && (
            <div className="flex items-center space-x-1 text-white/60">
              <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />
              <span className="text-xs">Buffering</span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Quality Badge */}
          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded border border-white/20">
            {getQualityBadge()}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onAddBookmark}
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
            title="Add bookmark"
          >
            <Bookmark className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onPictureInPicture}
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
            title="Picture-in-picture"
          >
            <Picture className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onTheaterMode}
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
            title={theaterMode ? "Exit theater mode (t)" : "Theater mode (t)"}
          >
            {theaterMode ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>

          {/* Settings Menu */}
          <SettingsMenu
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            }
            open={showSettings}
            onOpenChange={setShowSettings}
          >
            {/* Playback Speed */}
            <div className="p-3 border-b border-white/20">
              <div className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Playback Speed
              </div>
              <div className="grid grid-cols-2 gap-1">
                {PLAYBACK_SPEEDS.map((speed: PlaybackSpeed) => (
                  <SettingsMenuItem
                    key={speed.value}
                    onClick={() => {
                      onPlaybackSpeedChange(speed.value)
                      setShowSettings(false)
                    }}
                    className={cn(
                      "rounded text-center py-2",
                      playbackSpeed === speed.value && "bg-red-600 text-white font-medium",
                    )}
                  >
                    {speed.label}
                  </SettingsMenuItem>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="p-3 border-b border-white/20">
              <div className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Quality
              </div>
              <div className="space-y-1">
                {QUALITY_OPTIONS.map((qualityOption: QualityOption) => (
                  <SettingsMenuItem
                    key={qualityOption.value}
                    onClick={() => setShowSettings(false)}
                    className={cn(
                      "rounded flex items-center justify-between",
                      quality === qualityOption.value && "bg-red-600",
                    )}
                  >
                    <span>{qualityOption.label}</span>
                    {quality === qualityOption.value && <CheckCircle className="h-4 w-4" />}
                  </SettingsMenuItem>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="p-3">
              <SettingsMenuItem onClick={onAutoplayToggle}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Autoplay
                  </span>
                  <div
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      autoplayNext ? "bg-red-600" : "bg-white/30",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform",
                        autoplayNext ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </div>
                </div>
              </SettingsMenuItem>

              <SettingsMenuItem onClick={onToggleSubtitles}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Subtitles className="h-4 w-4" />
                    Subtitles
                  </span>
                  <div
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      showSubtitles ? "bg-red-600" : "bg-white/30",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform",
                        showSubtitles ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </div>
                </div>
              </SettingsMenuItem>

              {bookmarks.length > 0 && (
                <>
                  <SettingsDivider />
                  <div className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Bookmarks ({bookmarks.length})
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {bookmarks.map((time: number, index: number) => (
                      <SettingsMenuItem
                        key={index}
                        onClick={() => {
                          onSeekToBookmark(time)
                          setShowSettings(false)
                        }}
                        className="text-xs rounded"
                      >
                        <div className="flex items-center justify-between">
                          <span>Bookmark {index + 1}</span>
                          <span className="text-white/60">{formatTime(time)}</span>
                        </div>
                      </SettingsMenuItem>
                    ))}
                  </div>
                </>
              )}
            </div>
          </SettingsMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onFullscreenToggle}
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
            title={fullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
