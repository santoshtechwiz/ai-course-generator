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
        "absolute inset-0 z-50 transition-all duration-300 flex flex-col justify-end",
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
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-black/40 pointer-events-none" />

      <div
        ref={progressBarRef}
        className="relative h-3 bg-black cursor-pointer mx-4 mb-4 group hover:h-4 transition-all duration-150 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
        <div
          className="absolute left-0 top-0 h-full bg-neutral-600 transition-all duration-300"
          style={{ width: `${loaded * 100}%` }}
        />

        <div
          className="absolute left-0 top-0 h-full bg-yellow-400 transition-all duration-100"
          style={{ width: `${played * 100}%` }}
        />

        {renderBookmarkIndicators}

        {hoverPosition !== null && hoveredTime !== null && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-full mb-4 bg-neo-background text-black px-3 py-2 text-xs font-black uppercase tracking-wider pointer-events-none -translate-x-1/2 border-4 border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)]"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoveredTime)}
          </motion.div>
        )}

        <div
          className={cn(
            "absolute top-1/2 w-6 h-6 bg-white transform -translate-y-1/2 -translate-x-1/2 cursor-grab z-20 transition-all duration-100",
            "border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
            "hover:scale-110 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "focus:scale-110 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-0",
            isDragging && "scale-125 cursor-grabbing shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] bg-yellow-400",
          )}
          style={{ left: `${played * 100}%`, pointerEvents: "auto" }}
          onMouseDown={handleMouseDown}
          tabIndex={0}
          role="button"
          aria-label="Seek position"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-neo-background mx-4 mb-4 border-4 border-neo-border shadow-[8px_8px_0px_0px_var(--neo-border)]">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="h-10 w-10 sm:h-11 sm:w-11 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100 active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
            aria-label={playing ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-5 w-5 border-3 border-black border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-5 w-5 fill-black" />
            ) : (
              <Play className="h-5 w-5 ml-0.5 fill-black" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
            className="h-9 w-9 bg-neo-background hover:bg-neutral-100 text-black border-3 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] hover:shadow-[1px_1px_0px_0px_var(--neo-border)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100"
            aria-label="Rewind 10 seconds"
          >
            <RewindIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
            className="h-9 w-9 bg-neo-background hover:bg-neutral-100 text-black border-3 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] hover:shadow-[1px_1px_0px_0px_var(--neo-border)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100"
            aria-label="Forward 10 seconds"
          >
            <FastForwardIcon className="h-4 w-4" />
          </Button>

          <div ref={volumeSliderRef} className="relative flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="h-9 w-9 bg-neo-background hover:bg-neutral-100 text-black border-3 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] hover:shadow-[1px_1px_0px_0px_var(--neo-border)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {React.createElement(getVolumeIcon, { className: "h-4 w-4" })}
            </Button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.1 }}
                  className="absolute bottom-full mb-3 left-0 bg-neo-background p-4 border-4 border-neo-border shadow-[6px_6px_0px_0px_var(--neo-border)]"
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

          <div className="text-xs sm:text-sm text-black font-black uppercase tracking-wider tabular-nums px-3 py-2 bg-cyan-400 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span>{formatTime(duration * played)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Auto-play video toggle */}
          {onToggleAutoPlayVideo && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-400 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="h-3.5 w-3.5 text-black" />
              <span className="text-xs font-black uppercase text-black">AUTO</span>
              <Switch
                checked={autoPlayVideo}
                onCheckedChange={onToggleAutoPlayVideo}
                aria-label="Toggle auto-play video on page load"
              />
            </div>
          )}

          {/* Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-400 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SkipForward className="h-3.5 w-3.5 text-black" />
              <span className="text-xs font-black uppercase text-black">NEXT</span>
              <Switch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                aria-label="Toggle autoplay next video"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {/* Next video button */}
          {hasNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-neo-background hover:bg-neutral-100 text-black border-3 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] hover:shadow-[1px_1px_0px_0px_var(--neo-border)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={nextVideoTitle}
              aria-label="Next video"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 bg-neo-background hover:bg-neutral-100 text-black border-3 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] hover:shadow-[1px_1px_0px_0px_var(--neo-border)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100"
                aria-label="Playback speed"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-neo-background border-4 border-neo-border shadow-[6px_6px_0px_0px_var(--neo-border)]"
            >
              <div className="px-3 py-2 text-xs font-black uppercase text-black border-b-3 border-black bg-yellow-400">
                Speed
              </div>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => onPlaybackRateChange(speed)}
                  className="text-black hover:bg-yellow-400 flex justify-between items-center font-bold px-3 py-2 cursor-pointer border-b border-neutral-200 last:border-b-0"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && <div className="w-3 h-3 bg-black border-2 border-black" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {onToggleNotesPanel && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleNotesPanel}
              className={cn(
                "h-9 w-9 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100 relative",
                notesPanelOpen ? "bg-green-400 text-black" : "bg-white hover:bg-neutral-100 text-black",
              )}
              aria-label="Notes"
            >
              <StickyNote className="h-4 w-4" />
              {notesCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-[10px] text-white font-black flex items-center justify-center border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {notesCount > 9 ? "9+" : notesCount}
                </motion.div>
              )}
            </Button>
          )}

          {onToggleBookmarkPanel && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleBookmarkPanel}
              className={cn(
                "h-9 w-9 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100 hidden sm:flex",
                bookmarkPanelOpen ? "bg-yellow-400 text-black" : "bg-white hover:bg-neutral-100 text-black",
              )}
              aria-label="Bookmarks"
            >
              <BookmarkIcon className="h-4 w-4" />
            </Button>
          )}

          {onPictureInPicture && isPiPSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPictureInPicture}
              className={cn(
                "h-9 w-9 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100",
                isPiPActive ? "bg-cyan-400 text-black" : "bg-white hover:bg-neutral-100 text-black",
              )}
              aria-label="Picture-in-Picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </Button>
          )}

          {onToggleTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheaterMode}
              className={cn(
                "h-9 w-9 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100 hidden sm:flex",
                isTheaterMode ? "bg-purple-400 text-black" : "bg-white hover:bg-neutral-100 text-black",
              )}
              aria-label="Theater mode"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              "h-9 w-9 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100",
              isFullscreen ? "bg-yellow-400 text-black" : "bg-white hover:bg-neutral-100 text-black",
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
