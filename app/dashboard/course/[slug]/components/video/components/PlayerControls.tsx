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
          className="absolute top-0 w-1 h-full bg-yellow-400 dark:bg-yellow-500 transform -translate-x-1/2 cursor-pointer z-20 hover:w-2 transition-all duration-150 border-x-2 border-black"
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
      {/* Enhanced gradient overlay - better dark/light mode support */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent dark:from-black dark:via-black/85 dark:to-transparent pointer-events-none" />

      {/* Enhanced Progress Bar - BRUTAL DESIGN with high contrast */}
      <div className="relative px-3 sm:px-6 mb-3 sm:mb-4">
        <div
          ref={progressBarRef}
          className="relative h-3 sm:h-4 bg-gray-900 dark:bg-gray-950 border-3 border-white dark:border-white cursor-pointer group hover:h-4 sm:hover:h-5 transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
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
            className="absolute left-0 top-0 h-full bg-gray-700 dark:bg-gray-800 transition-all duration-300"
            style={{ width: `${loaded * 100}%` }}
          />

          {/* Played progress - Magenta/Pink */}
          <div
            className="absolute left-0 top-0 h-full bg-pink-500 dark:bg-pink-600 border-r-3 border-white transition-all duration-150"
            style={{ width: `${played * 100}%` }}
          />

          {renderBookmarkIndicators}

          {/* Enhanced hover time tooltip - high contrast */}
          {hoverPosition !== null && hoveredTime !== null && !isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-3 bg-white dark:bg-gray-100 text-black px-3 py-2 text-xs sm:text-sm font-black uppercase tracking-wide pointer-events-none -translate-x-1/2 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              style={{ left: `${hoverPosition * 100}%` }}
            >
              {formatTime(hoveredTime)}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black" />
            </motion.div>
          )}

          {/* Enhanced seek handle */}
          <div
            className={cn(
              "absolute top-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-white dark:bg-gray-100 border-3 border-black transform -translate-y-1/2 -translate-x-1/2 cursor-grab shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-all duration-200",
              isDragging && "opacity-100 scale-150 cursor-grabbing shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
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
              className="absolute top-0 h-full w-1 bg-white/60 dark:bg-white/70 pointer-events-none"
              style={{ left: `${hoverPosition * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Enhanced Control Bar - Brutal design with dark mode */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 bg-black/95 dark:bg-black border-t-4 border-white mx-0 mb-0 backdrop-blur-sm">
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="h-10 w-10 sm:h-12 sm:w-12 bg-white dark:bg-white hover:bg-gray-100 dark:hover:bg-gray-50 text-black transition-all border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-none"
            aria-label={playing ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-5 w-5 sm:h-6 sm:w-6 border-3 border-black border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-black" />
            ) : (
              <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5 fill-black" />
            )}
          </Button>

          {/* Rewind */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
            className="h-9 w-9 sm:h-10 sm:w-10 bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white transition-all border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none hidden sm:flex"
            aria-label="Rewind 10 seconds"
          >
            <RewindIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Fast Forward */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
            className="h-9 w-9 sm:h-10 sm:w-10 bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white transition-all border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none hidden sm:flex"
            aria-label="Forward 10 seconds"
          >
            <FastForwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Volume */}
          <div ref={volumeSliderRef} className="relative flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="h-9 w-9 sm:h-10 sm:w-10 bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white transition-all border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none hidden sm:flex"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {React.createElement(getVolumeIcon, { className: "h-4 w-4 sm:h-5 sm:w-5" })}
            </Button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-3 left-0 bg-black dark:bg-gray-900 border-3 border-white p-4 shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
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
                  <div className="text-center text-white font-black text-xs mt-2">
                    {Math.round(localVolume)}%
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Display */}
          <div className="text-xs sm:text-sm text-white font-black tabular-nums px-2 sm:px-3 py-1 bg-gray-900 dark:bg-gray-950 border-2 border-white hidden sm:block shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
            <span>{formatTime(duration * played)}</span>
            <span className="mx-1.5 text-gray-400">/</span>
            <span className="text-gray-300">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Center Controls - Auto toggles */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleAutoPlayVideo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500 dark:bg-cyan-600 border-2 border-white text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] transition-all">
              <Zap className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Auto</span>
              <Switch
                checked={autoPlayVideo}
                onCheckedChange={onToggleAutoPlayVideo}
                aria-label="Toggle auto-play video on page load"
                className="scale-90"
              />
            </div>
          )}

          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500 dark:bg-amber-600 border-2 border-white text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] transition-all">
              <SkipForward className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Next</span>
              <Switch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                aria-label="Toggle autoplay next video"
                className="scale-90"
              />
            </div>
          )}
        </div>

        {/* Right Controls - Enhanced buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {hasNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-black dark:text-white transition-all border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed rounded-none font-black"
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={nextVideoTitle}
              aria-label="Next video"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Settings */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white transition-all border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none hidden sm:flex"
                aria-label="Playback speed"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-black dark:bg-gray-900 border-4 border-white text-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-0"
            >
              <div className="px-4 py-3 text-xs font-black border-b-4 border-white uppercase tracking-wider">
                Speed
              </div>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => onPlaybackRateChange(speed)}
                  className="text-white hover:bg-white hover:text-black flex justify-between items-center font-black px-4 py-3 cursor-pointer border-b-2 border-white/20 last:border-0"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && (
                    <div className="w-3 h-3 bg-white border-2 border-black" />
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
                "h-9 w-9 sm:h-10 sm:w-10 transition-all border-2 border-white relative hidden sm:flex shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none",
                notesPanelOpen ? "bg-lime-500 dark:bg-lime-600 text-black dark:text-white" : "bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white",
              )}
              aria-label="Notes"
            >
              <StickyNote className="h-4 w-4 sm:h-5 sm:w-5" />
              {notesCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 dark:bg-red-700 text-[10px] text-white font-black flex items-center justify-center border-2 border-black"
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
                "h-9 w-9 sm:h-10 sm:w-10 transition-all border-2 border-white hidden sm:flex shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none",
                bookmarkPanelOpen ? "bg-yellow-400 dark:bg-yellow-500 text-black" : "bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white",
              )}
              aria-label="Bookmarks"
            >
              <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Picture-in-Picture */}
          {onPictureInPicture && isPiPSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPictureInPicture}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 transition-all border-2 border-white hidden sm:flex shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none",
                isPiPActive ? "bg-fuchsia-500 dark:bg-fuchsia-600 text-black dark:text-white" : "bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white",
              )}
              aria-label="Picture-in-Picture"
            >
              <PictureInPicture2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Theater Mode */}
          {onToggleTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheaterMode}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 transition-all border-2 border-white hidden sm:flex shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none",
                isTheaterMode ? "bg-purple-600 dark:bg-purple-700 text-white" : "bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white",
              )}
              aria-label="Theater mode"
            >
              <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 transition-all border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none",
              isFullscreen ? "bg-white dark:bg-gray-100 text-black" : "bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white",
            )}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)