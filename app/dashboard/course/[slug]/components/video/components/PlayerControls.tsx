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
import neo from "@/components/neo/tokens"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"

// Memoized slider to prevent unnecessary re-renders
const MemoizedSlider = React.memo(Slider)

const PlayerControls = (props: any) => {
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

  // Fixed auto-hide controls with proper cleanup
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

  // Fixed seek handler with proper cleanup
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

  // Fixed drag handler with proper cleanup
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

  // Stable volume change handler
  const handleVolumeSliderChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] / 100
      onVolumeChange(newVolume)
    },
    [onVolumeChange],
  )

  // Toggle volume slider with stable reference
  const toggleVolumeSlider = useCallback(() => {
    setShowVolumeSlider((prev) => !prev)
  }, [])

  // Bookmark indicators in progress bar
  const renderBookmarkIndicators = useMemo(() => {
    if (!localBookmarks.length || !duration) return null

    return localBookmarks.map((bookmarkTime, index) => {
      const position = (bookmarkTime / duration) * 100
      return (
        <div
          key={index}
          className="absolute top-0 w-2 h-full bg-pink-500 transform -translate-x-1/2 cursor-pointer z-10 hover:w-3 transition-all duration-150 border-l-2 border-r-2 border-black"
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current)
    }
  }, [])

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 transition-opacity duration-200 flex flex-col justify-end",
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
      {/* Gradient overlay for better text visibility */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Progress bar - minimal clean design */}
      <div
        ref={progressBarRef}
        className="relative h-1 bg-white/20 cursor-pointer mx-2 sm:mx-4 mb-2 group hover:h-1.5 transition-all duration-100"
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
          className="absolute left-0 top-0 h-full bg-white/30 transition-all"
          style={{ width: `${loaded * 100}%` }}
        />

        {/* Played progress */}
        <div
          className="absolute left-0 top-0 h-full bg-red-600 transition-all"
          style={{ width: `${played * 100}%` }}
        />

        {renderBookmarkIndicators}

        {/* Hover time tooltip */}
        {hoverPosition !== null && hoveredTime !== null && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-full mb-2 bg-black/90 backdrop-blur-sm text-white px-2 py-1 text-xs font-semibold rounded pointer-events-none -translate-x-1/2"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoveredTime)}
          </motion.div>
        )}

        {/* Seek handle */}
        <div
          className={cn(
            "absolute top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity",
            isDragging && "opacity-100 scale-125 cursor-grabbing",
          )}
          style={{ left: `${played * 100}%`, pointerEvents: "auto" }}
          onMouseDown={handleMouseDown}
          tabIndex={0}
          role="button"
          aria-label="Seek position"
        />
      </div>

      {/* Control bar - clean minimal design */}
      <div className="flex items-center justify-between gap-2 px-2 sm:px-4 py-2 bg-black/60 backdrop-blur-sm mx-0 mb-0">
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent hover:bg-white/20 text-white transition-colors rounded"
            aria-label={playing ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-5 w-5 fill-white" />
            ) : (
              <Play className="h-5 w-5 ml-0.5 fill-white" />
            )}
          </Button>

          {/* Rewind */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
            className="h-8 w-8 bg-transparent hover:bg-white/20 text-white transition-colors rounded hidden sm:flex"
            aria-label="Rewind 10 seconds"
          >
            <RewindIcon className="h-4 w-4" />
          </Button>

          {/* Fast Forward */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
            className="h-8 w-8 bg-transparent hover:bg-white/20 text-white transition-colors rounded hidden sm:flex"
            aria-label="Forward 10 seconds"
          >
            <FastForwardIcon className="h-4 w-4" />
          </Button>

          {/* Volume */}
          <div ref={volumeSliderRef} className="relative flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="h-8 w-8 bg-transparent hover:bg-white/20 text-white transition-colors rounded hidden sm:flex"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {React.createElement(getVolumeIcon, { className: "h-4 w-4" })}
            </Button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute bottom-full mb-2 left-0 bg-black/90 backdrop-blur-sm p-3 rounded"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <MemoizedSlider
                    value={[localVolume]}
                    onValueChange={handleVolumeSliderChange}
                    max={100}
                    step={1}
                    className="w-24 h-2"
                    aria-label="Volume"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time display */}
          <div className="text-xs sm:text-sm text-white font-medium tabular-nums px-2 hidden sm:block">
            <span>{formatTime(duration * played)}</span>
            <span className="mx-1 text-white/60">/</span>
            <span className="text-white/80">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Center controls - Auto toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Auto-play video toggle */}
          {onToggleAutoPlayVideo && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-600/80 backdrop-blur-sm rounded text-white">
              <Zap className="h-3 w-3" />
              <span className="text-xs font-semibold hidden sm:inline">AUTO</span>
              <Switch
                checked={autoPlayVideo}
                onCheckedChange={onToggleAutoPlayVideo}
                aria-label="Toggle auto-play video on page load"
                className="scale-75"
              />
            </div>
          )}

          {/* Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-600/80 backdrop-blur-sm rounded text-white">
              <SkipForward className="h-3 w-3" />
              <span className="text-xs font-semibold hidden sm:inline">NEXT</span>
              <Switch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                aria-label="Toggle autoplay next video"
                className="scale-75"
              />
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Next video button */}
          {hasNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-transparent hover:bg-white/20 text-white transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={nextVideoTitle}
              aria-label="Next video"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}

          {/* Settings */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-transparent hover:bg-white/20 text-white transition-colors rounded hidden sm:flex"
                aria-label="Playback speed"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 bg-black/95 backdrop-blur-sm border border-white/20 text-white"
            >
              <div className="px-3 py-2 text-xs font-semibold border-b border-white/20">
                Speed
              </div>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => onPlaybackRateChange(speed)}
                  className="text-white hover:bg-white/20 flex justify-between items-center font-medium px-3 py-2 cursor-pointer"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && <div className="w-2 h-2 bg-white rounded-full" />}
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
                "h-8 w-8 transition-colors rounded relative hidden sm:flex",
                notesPanelOpen ? "bg-green-600 text-white" : "bg-transparent hover:bg-white/20 text-white",
              )}
              aria-label="Notes"
            >
              <StickyNote className="h-4 w-4" />
              {notesCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-[10px] text-white font-bold flex items-center justify-center rounded-full"
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
                "h-8 w-8 transition-colors rounded hidden sm:flex",
                bookmarkPanelOpen ? "bg-yellow-600 text-white" : "bg-transparent hover:bg-white/20 text-white",
              )}
              aria-label="Bookmarks"
            >
              <BookmarkIcon className="h-4 w-4" />
            </Button>
          )}

          {/* Picture-in-Picture */}
          {onPictureInPicture && isPiPSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPictureInPicture}
              className={cn(
                "h-8 w-8 transition-colors rounded hidden sm:flex",
                isPiPActive ? "bg-blue-600 text-white" : "bg-transparent hover:bg-white/20 text-white",
              )}
              aria-label="Picture-in-Picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </Button>
          )}

          {/* Theater mode */}
          {onToggleTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheaterMode}
              className={cn(
                "h-8 w-8 transition-colors rounded hidden sm:flex",
                isTheaterMode ? "bg-purple-600 text-white" : "bg-transparent hover:bg-white/20 text-white",
              )}
              aria-label="Theater mode"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              "h-8 w-8 transition-colors rounded",
              isFullscreen ? "bg-white/20 text-white" : "bg-transparent hover:bg-white/20 text-white",
            )}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)
