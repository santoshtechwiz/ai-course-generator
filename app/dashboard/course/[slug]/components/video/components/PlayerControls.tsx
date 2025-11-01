"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  PictureInPicture2,
  BookmarkIcon,
  StickyNote,
  SkipForward,
  Zap,
  RewindIcon,
  FastForwardIcon,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

const MemoizedSlider = React.memo(Slider)

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
  bufferHealth?: number
  onPlayPause: () => void
  onMute: () => void
  onVolumeChange: (value: number) => void
  onSeekChange: (time: number) => void
  onPlaybackRateChange: (rate: number) => void
  onToggleFullscreen: () => void
  formatTime: (seconds: number) => string
  bookmarks?: number[]
  onSeekToBookmark?: (time: number) => void
  isAuthenticated: boolean
  show?: boolean
  onCertificateClick?: () => void
  onShowKeyboardShortcuts?: () => void
  onNextVideo?: () => void
  onToggleBookmarkPanel?: () => void
  bookmarkPanelOpen?: boolean
  autoPlayNext?: boolean
  onToggleAutoPlayNext?: (checked?: boolean) => void
  autoPlayVideo?: boolean
  onToggleAutoPlayVideo?: () => void
  hasNextVideo?: boolean
  nextVideoTitle?: string
  canAccessNextVideo?: boolean
  onIsDragging?: (isDragging: boolean) => void
  onPictureInPicture?: () => void
  isPiPSupported?: boolean
  isPiPActive?: boolean
  isTheaterMode?: boolean
  onToggleTheaterMode?: () => void
  notesCount?: number
  onToggleNotesPanel?: () => void
  notesPanelOpen?: boolean
  onCreateNote?: () => void
  notes?: any[]
}

const PlayerControls: React.FC<PlayerControlsProps> = (props) => {
  const {
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
    formatTime,
    bookmarks = [],
    onSeekToBookmark,
    isAuthenticated,
    show = true,
    onCertificateClick,
    onShowKeyboardShortcuts,
    onNextVideo,
    onToggleBookmarkPanel,
    bookmarkPanelOpen,
    autoPlayNext = true,
    onToggleAutoPlayNext,
    autoPlayVideo = false,
    onToggleAutoPlayVideo,
    hasNextVideo = false,
    nextVideoTitle = "",
    canAccessNextVideo = true,
    onIsDragging,
    onPictureInPicture,
    isPiPSupported = false,
    isPiPActive = false,
    isTheaterMode = false,
    onToggleTheaterMode,
    notesCount = 0,
    onToggleNotesPanel,
    notesPanelOpen = false,
    onCreateNote,
    notes = [],
  } = props

  // State management
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [localBookmarks, setLocalBookmarks] = useState<number[]>(bookmarks || [])
  const [showControls, setShowControls] = useState(true)
  const [localVolume, setLocalVolume] = useState(muted ? 0 : volume * 100)

  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressRafRef = useRef<number | null>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => setIsMounted(true), [])

  // Sync local volume with props
  useEffect(() => {
    setLocalVolume(muted ? 0 : volume * 100)
  }, [muted, volume])

  // Auto-hide controls
  useEffect(() => {
    if (!show) return

    const hideControls = () => {
      if (playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
        }, 3000)
      }
    }

    if (playing) {
      hideControls()
    } else {
      setShowControls(true)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [playing, show])

  // Close volume slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false)
      }
    }

    if (showVolumeSlider) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showVolumeSlider])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [playing])

  const getVolumeIcon = useMemo(() => {
    if (muted || volume === 0) return VolumeX
    if (volume < 0.5) return Volume1
    return Volume2
  }, [muted, volume])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !duration || isDragging) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const seekPosition = Math.max(0, Math.min(1, x / rect.width))
      onSeekChange(duration * seekPosition)
    },
    [duration, onSeekChange, isDragging],
  )

  const handleProgressHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !duration) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const position = Math.max(0, Math.min(1, x / rect.width))

      if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current)
      progressRafRef.current = requestAnimationFrame(() => {
        setHoverPosition(position)
        setHoveredTime(duration * position)
      })
    },
    [duration],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      if (onIsDragging) onIsDragging(true)

      const handleMouseMove = (e: MouseEvent) => {
        if (!progressBarRef.current || !duration) return
        const rect = progressBarRef.current.getBoundingClientRect()
        const x = Math.max(rect.left, Math.min(e.clientX, rect.right)) - rect.left
        const seekPosition = Math.max(0, Math.min(1, x / rect.width))
        onSeekChange(duration * seekPosition)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        if (onIsDragging) onIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      handleSeek(e)
    },
    [duration, onSeekChange, handleSeek, onIsDragging],
  )

  const handleVolumeSliderChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] / 100
      onVolumeChange(newVolume)
    },
    [onVolumeChange],
  )

  const toggleVolumeSlider = useCallback(() => {
    setShowVolumeSlider((prev) => !prev)
  }, [])

  const renderBookmarkIndicators = useMemo(() => {
    if (!localBookmarks.length || !duration) return null

    return localBookmarks.map((bookmarkTime, index) => {
      const position = (bookmarkTime / duration) * 100
      return (
        <div
          key={index}
          className="absolute top-0 w-1 h-full bg-amber-500 dark:bg-amber-400 transform -translate-x-1/2 cursor-pointer z-20 hover:w-2 transition-all duration-150 border-x-2 border-neutral-950 dark:border-neutral-50"
          style={{ left: `${position}%` }}
          onClick={(e) => {
            e.stopPropagation()
            onSeekToBookmark && onSeekToBookmark(bookmarkTime)
          }}
          title={`Bookmark at ${formatTime(bookmarkTime)}`}
        />
      )
    })
  }, [localBookmarks, duration, formatTime, onSeekToBookmark])

  useEffect(() => {
    return () => {
      if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current)
    }
  }, [])

  // Consistent button classes - all buttons same size
  const buttonBase = "h-11 w-11 rounded-none border-3 border-neutral-950 dark:border-neutral-50 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px]"
  const buttonPrimary = `${buttonBase} bg-neutral-950 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]`
  const buttonSecondary = `${buttonBase} bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]`
  const buttonActive = `${buttonBase} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]`

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 transition-opacity duration-300 flex flex-col justify-end",
        !show && "opacity-0 pointer-events-none",
        !showControls && "opacity-0",
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (playing) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false)
          }, 1000)
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-neutral-50/95 dark:from-neutral-950/95 via-neutral-50/80 dark:via-neutral-950/80 to-transparent pointer-events-none" />

      {/* Progress Bar */}
      <div className="relative px-4 sm:px-6 mb-4">
        <div
          ref={progressBarRef}
          className="relative h-4 bg-neutral-200 dark:bg-neutral-800 border-3 border-neutral-950 dark:border-neutral-50 cursor-pointer group hover:h-5 transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
          onClick={handleSeek}
          onMouseMove={handleProgressHover}
          onMouseDown={handleMouseDown}
          onMouseLeave={() => {
            setHoverPosition(null)
            setHoveredTime(null)
          }}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={duration * played}
          tabIndex={0}
        >
          {/* Buffered progress */}
          <div
            className="absolute left-0 top-0 h-full bg-neutral-300 dark:bg-neutral-700 transition-all duration-300"
            style={{ width: `${loaded * 100}%` }}
          />

          {/* Played progress */}
          <div
            className="absolute left-0 top-0 h-full bg-lime-400 dark:bg-lime-500 border-r-3 border-neutral-950 dark:border-neutral-50 transition-all duration-150"
            style={{ width: `${played * 100}%` }}
          />

          {renderBookmarkIndicators}

          {/* Hover tooltip */}
          {hoverPosition !== null && hoveredTime !== null && !isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-3 bg-neutral-50 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 px-3 py-2 text-sm font-black uppercase tracking-wide pointer-events-none -translate-x-1/2 border-3 border-neutral-950 dark:border-neutral-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
              style={{ left: `${hoverPosition * 100}%` }}
            >
              {formatTime(hoveredTime)}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-950 dark:border-t-neutral-50" />
            </motion.div>
          )}

          {/* Seek handle */}
          <div
            className={cn(
              "absolute top-1/2 w-6 h-6 bg-neutral-950 dark:bg-neutral-50 border-3 border-neutral-950 dark:border-neutral-50 transform -translate-y-1/2 -translate-x-1/2 cursor-grab shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] opacity-0 group-hover:opacity-100 transition-all duration-200",
              isDragging && "opacity-100 scale-125 cursor-grabbing shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
            )}
            style={{ left: `${played * 100}%`, pointerEvents: "auto" }}
            onMouseDown={handleMouseDown}
            tabIndex={0}
            role="button"
            aria-label="Seek position"
          />

          {/* Progress indicator on hover */}
          {hoverPosition !== null && (
            <div
              className="absolute top-0 h-full w-1 bg-neutral-950/60 dark:bg-neutral-50/60 pointer-events-none"
              style={{ left: `${hoverPosition * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-neutral-50/95 dark:bg-neutral-950/95 border-t-4 border-neutral-950 dark:border-neutral-50 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className={buttonPrimary}
            aria-label={playing ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-6 w-6 border-3 border-neutral-50 dark:border-neutral-950 border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 ml-0.5 fill-current" />
            )}
          </Button>

          {/* Rewind */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
            className={`${buttonSecondary} hidden sm:flex`}
            aria-label="Rewind 10 seconds"
          >
            <RewindIcon className="h-5 w-5" />
          </Button>

          {/* Fast Forward */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
            className={`${buttonSecondary} hidden sm:flex`}
            aria-label="Forward 10 seconds"
          >
            <FastForwardIcon className="h-5 w-5" />
          </Button>

          {/* Volume */}
          <div ref={volumeSliderRef} className="relative flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className={`${buttonSecondary} hidden sm:flex`}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {React.createElement(getVolumeIcon, { className: "h-5 w-5" })}
            </Button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-3 left-0 bg-neutral-50 dark:bg-neutral-950 border-3 border-neutral-950 dark:border-neutral-50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <MemoizedSlider
                    value={[localVolume]}
                    onValueChange={handleVolumeSliderChange}
                    max={100}
                    step={1}
                    className="w-28 h-3"
                    aria-label="Volume"
                  />
                  <div className="text-center text-neutral-950 dark:text-neutral-50 font-black text-xs mt-2">
                    {Math.round(localVolume)}%
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Display */}
          <div className="text-sm text-neutral-950 dark:text-neutral-50 font-black tabular-nums px-3 py-2 bg-neutral-200 dark:bg-neutral-800 border-2 border-neutral-950 dark:border-neutral-50 hidden sm:block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <span>{formatTime(duration * played)}</span>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="opacity-80">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Center Controls - Auto toggles */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleAutoPlayVideo && (
            <div className={cn(
              "flex items-center gap-2 px-3 h-11 rounded-none border-3 border-neutral-950 dark:border-neutral-50 transition-all duration-200 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
              autoPlayVideo 
                ? "bg-lime-400 dark:bg-lime-500" 
                : "bg-neutral-200 dark:bg-neutral-800"
            )}>
              <Zap className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                autoPlayVideo ? "text-neutral-950 dark:text-neutral-950" : "text-neutral-950/60 dark:text-neutral-50/60"
              )} />
              <span className={cn(
                "text-xs font-black uppercase tracking-wider hidden sm:inline transition-colors",
                autoPlayVideo ? "text-neutral-950 dark:text-neutral-950" : "text-neutral-950/70 dark:text-neutral-50/70"
              )}>Auto</span>
              <Switch
                checked={autoPlayVideo}
                onCheckedChange={(checked) => {
                  onToggleAutoPlayVideo()
                  toast({
                    title: checked ? "Autoplay enabled ⚡" : "Autoplay disabled",
                    description: checked ? "Videos will play automatically on page load" : "Videos will not autoplay on page load",
                    variant: "default",
                  })
                }}
                aria-label="Toggle auto-play video on page load"
                className="scale-90"
              />
            </div>
          )}

          {hasNextVideo && onToggleAutoPlayNext && (
            <div className={cn(
              "flex items-center gap-2 px-3 h-11 rounded-none border-3 border-neutral-950 dark:border-neutral-50 transition-all duration-200 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
              autoPlayNext 
                ? "bg-amber-400 dark:bg-amber-500" 
                : "bg-neutral-200 dark:bg-neutral-800"
            )}>
              <SkipForward className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                autoPlayNext ? "text-neutral-950 dark:text-neutral-950" : "text-neutral-950/60 dark:text-neutral-50/60"
              )} />
              <span className={cn(
                "text-xs font-black uppercase tracking-wider hidden sm:inline transition-colors",
                autoPlayNext ? "text-neutral-950 dark:text-neutral-950" : "text-neutral-950/70 dark:text-neutral-50/70"
              )}>Next</span>
              <Switch
                checked={autoPlayNext}
                onCheckedChange={(checked) => {
                  onToggleAutoPlayNext?.(checked)
                  toast({
                    title: checked ? "Auto-next enabled 🎬" : "Auto-next disabled",
                    description: checked ? "Next video will play automatically" : "You'll choose when to play next video",
                    variant: "default",
                  })
                }}
                aria-label="Toggle autoplay next video"
                className="scale-90"
              />
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          {hasNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(buttonActive, "bg-cyan-400 dark:bg-cyan-500 text-neutral-950 dark:text-neutral-950")}
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={nextVideoTitle}
              aria-label="Next video"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          )}

          {/* Settings */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${buttonSecondary} hidden sm:flex`}
                aria-label="Playback speed"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-neutral-50 dark:bg-neutral-950 border-4 border-neutral-950 dark:border-neutral-50 text-neutral-950 dark:text-neutral-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] p-0"
            >
              <div className="px-4 py-3 text-xs font-black border-b-4 border-neutral-950 dark:border-neutral-50 uppercase tracking-wider">
                Speed
              </div>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => onPlaybackRateChange(speed)}
                  className="hover:bg-lime-400 dark:hover:bg-lime-500 hover:text-neutral-950 dark:hover:text-neutral-950 flex justify-between items-center font-black px-4 py-3 cursor-pointer border-b-2 border-neutral-950/20 dark:border-neutral-50/20 last:border-0 focus:bg-lime-400 dark:focus:bg-lime-500"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && (
                    <div className="w-3 h-3 bg-neutral-950 dark:bg-neutral-50 border-2 border-neutral-950 dark:border-neutral-50" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notes */}
          {onToggleNotesPanel && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleNotesPanel}
              className={cn(
                buttonActive,
                "relative hidden sm:flex",
                notesPanelOpen 
                  ? "bg-emerald-400 dark:bg-emerald-500 text-neutral-950 dark:text-neutral-950" 
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50",
              )}
              aria-label="Notes"
            >
              <StickyNote className="h-5 w-5" />
              {notesCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 dark:bg-rose-600 text-[10px] text-neutral-50 dark:text-neutral-50 font-black flex items-center justify-center border-2 border-neutral-950 dark:border-neutral-50"
                >
                  {notesCount > 9 ? "9+" : notesCount}
                </motion.div>
              )}
            </Button>
          )}

          {/* Bookmarks */}
          {onToggleBookmarkPanel && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleBookmarkPanel}
              className={cn(
                buttonActive,
                "hidden sm:flex",
                bookmarkPanelOpen 
                  ? "bg-amber-400 dark:bg-amber-500 text-neutral-950 dark:text-neutral-950" 
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50",
              )}
              aria-label="Bookmarks"
            >
              <BookmarkIcon className="h-5 w-5" />
            </Button>
          )}

          {/* Picture-in-Picture */}
          {onPictureInPicture && isPiPSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPictureInPicture}
              className={cn(
                buttonActive,
                "hidden sm:flex",
                isPiPActive 
                  ? "bg-violet-400 dark:bg-violet-500 text-neutral-950 dark:text-neutral-950" 
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50",
              )}
              aria-label="Picture-in-Picture"
            >
              <PictureInPicture2 className="h-5 w-5" />
            </Button>
          )}

          {/* Theater Mode */}
          {onToggleTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheaterMode}
              className={cn(
                buttonActive,
                "hidden sm:flex",
                isTheaterMode 
                  ? "bg-cyan-400 dark:bg-cyan-500 text-neutral-950 dark:text-neutral-950" 
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50",
              )}
              aria-label="Theater mode"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              buttonActive,
              isFullscreen 
                ? "bg-neutral-950 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-950" 
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50",
            )}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)