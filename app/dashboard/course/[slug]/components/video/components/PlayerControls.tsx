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
  PictureInPicture2,
  Settings,
  Minimize,
  Volume1,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

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

  onShowKeyboardShortcuts?: () => void
  onNextVideo?: () => void
  onToggleBookmarkPanel?: () => void
  bookmarkPanelOpen?: boolean
  autoPlayNext?: boolean
  onToggleAutoPlayNext?: () => void
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
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [useFallbackSlider, setUseFallbackSlider] = useState(false)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressRafRef = useRef<number | null>(null)
  const [lastAnnouncement, setLastAnnouncement] = useState("")
  const [isCompact, setIsCompact] = useState(false)
  // Local optimistic bookmark list so new bookmark shows immediately
  const [localBookmarks, setLocalBookmarks] = useState<number[]>(bookmarks || [])

  // Prevent event bubbling that could interfere with controls
  const handleControlsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Sync external bookmark updates into local state (while preserving optimistic additions)
  useEffect(() => {
    if (Array.isArray(bookmarks)) {
      setLocalBookmarks((prev) => {
        // Merge & de-dupe (precision to 2 decimals to avoid near-duplicate floats)
        const merged = [...prev]
        for (const b of bookmarks) {
          if (!merged.some((m) => Math.abs(m - b) < 0.01)) merged.push(b)
        }
        return merged.sort((a, b) => a - b)
      })
    }
  }, [bookmarks])

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

  const handleProgressHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !duration) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width || 1
      const position = Math.max(0, Math.min(1, x / width))
      if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current)
      progressRafRef.current = requestAnimationFrame(() => {
        setHoverPosition(position)
        setHoveredTime(duration * position)
      })
    },
    [duration],
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
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      setShowVolumeSlider(true)
    }, 50)
  }, [])

  const handleVolumeMouseLeave = useCallback(() => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false)
    }, 1000)
  }, [])

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    // Compact mode for narrow viewports
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(max-width: 460px)")
      const apply = () => setIsCompact(mq.matches)
      apply()
      mq.addEventListener("change", apply)
      return () => mq.removeEventListener("change", apply)
    }
  }, [])

  // Handle slider errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message && event.error.message.includes("getBoundingClientRect")) {
        console.warn("Slider error detected, switching to fallback")
        setUseFallbackSlider(true)
      }
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  // Cleanup volume timeout
  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current)
      }
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current)
      }
    }
  }, [])

  // Enhanced bookmark addition
  const handleAddBookmark = useCallback(() => {
    if (onAddBookmark) {
      const currentTime = duration * played
      onAddBookmark(currentTime)
      // Optimistically add if not duplicate
      setLocalBookmarks((prev) => {
        if (prev.some((t) => Math.abs(t - currentTime) < 0.01)) return prev
        return [...prev, currentTime].sort((a, b) => a - b)
      })
      setLastAnnouncement(`Bookmark added at ${formatTime(currentTime)}`)
    }
  }, [onAddBookmark, duration, played, formatTime])

  // Enhanced skip handlers
  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(0, duration * played - 10)
    onSeekChange(newTime)
  }, [duration, played, onSeekChange])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(duration, duration * played + 10)
    onSeekChange(newTime)
  }, [duration, played, onSeekChange])

  const VolumeIcon = useMemo(() => {
    if (muted || volume === 0) return VolumeX
    if (volume < 0.5) return Volume1
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

  const getBufferHealthColor = useCallback((health: number) => {
    if (health >= 0.8) return "text-green-400"
    if (health >= 0.5) return "text-yellow-400"
    return "text-red-400"
  }, [])

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
      <div aria-live="polite" className="sr-only">
        {lastAnnouncement}
      </div>
      <div
        className="relative flex items-center mb-1 group h-8 sm:h-10 cursor-pointer touch-manipulation"
        ref={progressBarRef}
        onClick={handleSeek}
        onMouseDown={handleMouseDown}
        onMouseMove={handleProgressHover}
        onMouseEnter={() => setHoverPosition(0)}
        onMouseLeave={() => {
          setHoverPosition(null)
          setHoveredTime(null)
        }}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={duration * played}
        aria-valuetext={`${formatTime(duration * played)} of ${formatTime(duration)}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault()
            handleSkipBackward()
          } else if (e.key === "ArrowRight") {
            e.preventDefault()
            handleSkipForward()
          } else if (e.key === "Home") {
            e.preventDefault()
            onSeekChange(0)
          } else if (e.key === "End") {
            e.preventDefault()
            onSeekChange(duration)
          } else if (e.key === "PageUp") {
            e.preventDefault()
            onSeekChange(Math.min(duration, duration * played + 30))
          } else if (e.key === "PageDown") {
            e.preventDefault()
            onSeekChange(Math.max(0, duration * played - 30))
          }
        }}
      >
        <div className="absolute inset-0"></div>
        <span className="sr-only">
          Use Arrow keys to seek 10 seconds, PageUp/PageDown 30 seconds, Home/End to jump.
        </span>

        <AnimatePresence>
          {hoverPosition !== null && hoveredTime !== null && !isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 bg-black/90 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none z-20 transform -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${hoverPosition * 100}%` }}
            >
              {formatTime(hoveredTime)}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/90" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute left-0 right-0 top-3 sm:top-4 h-1 bg-white/20 rounded group-hover:h-1.5 transition-all">
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 rounded transition-all",
              bufferHealth >= 0.8 ? "bg-white/40" : bufferHealth >= 0.5 ? "bg-yellow-400/40" : "bg-red-400/40",
            )}
            style={{ width: `${loaded * 100}%` }}
          ></div>
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary rounded transition-all"
            style={{ width: `${played * 100}%` }}
          ></div>

          {hoverPosition !== null && !isDragging && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/60 pointer-events-none"
              style={{ left: `${hoverPosition * 100}%` }}
            />
          )}
        </div>

        {/* Enhanced bookmarks on timeline */}
        {localBookmarks?.length > 0 &&
          localBookmarks.map((time, index) => (
            <motion.button
              key={`bookmark-${index}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="absolute w-2 h-4 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 hover:bg-yellow-300 transition-colors touch-manipulation shadow-sm"
              style={{ left: `${duration > 0 ? (time / duration) * 100 : 0}%`, top: "50%" }}
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
      <div className={cn("flex items-center justify-between", isCompact && "gap-1")}>
        {/* Left controls */}
        <div className={cn("flex items-center space-x-1 sm:space-x-2", isCompact && "space-x-0.5")}>
          {/* Enhanced Play/Pause button with loading state */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 text-white touch-manipulation hover:bg-white/20 relative", isCompact && "h-7 w-7")}
            onClick={onPlayPause}
            title={playing ? "Pause (Space)" : "Play (Space)"}
            aria-label={playing ? "Pause video" : "Play video"}
            disabled={isBuffering}
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>

          {/* Enhanced Skip backward */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 text-white touch-manipulation hover:bg-white/20", isCompact && "h-7 w-7")}
            onClick={handleSkipBackward}
            title="Skip backward 10 seconds (←)"
            aria-label="Skip backward 10 seconds"
          >
            <RewindIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Enhanced Skip forward */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 text-white touch-manipulation hover:bg-white/20", isCompact && "h-7 w-7")}
            onClick={handleSkipForward}
            title="Skip forward 10 seconds (→)"
            aria-label="Skip forward 10 seconds"
          >
            <FastForwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Next video button */}
          {nextVideoButton}

          {/* Enhanced Volume control with better UX */}
          <div
            className="relative flex items-center h-8 sm:h-8 shrink-0"
            onMouseEnter={handleVolumeMouseEnter}
            onMouseLeave={handleVolumeMouseLeave}
            role="group"
            aria-label="Volume controls"
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 text-white touch-manipulation hover:bg-white/20", isCompact && "h-7 w-7")}
              onClick={onMute}
              title={muted ? "Unmute (M)" : "Mute (M)"}
              aria-label={muted ? "Unmute audio" : "Mute audio"}
            >
              <VolumeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <AnimatePresence>
              {showVolumeSlider && isMounted && typeof window !== "undefined" && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-black/90 p-3 rounded-lg z-10 w-24 sm:w-28 backdrop-blur-sm border border-white/10 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <VolumeIcon className="h-3 w-3 text-white/60" />
                    <span className="text-xs text-white/80 font-medium">{Math.round((muted ? 0 : volume) * 100)}%</span>
                  </div>
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {useFallbackSlider ? (
                      <div
                        className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative"
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const width = rect.width
                          const newVolume = Math.max(0, Math.min(1, x / width))
                          onVolumeChange(newVolume)
                        }}
                      >
                        <div
                          className="h-full bg-white rounded-full transition-all duration-150"
                          style={{ width: `${muted ? 0 : volume * 100}%` }}
                        />
                      </div>
                    ) : (
                      <Slider
                        value={[muted ? 0 : volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={([value]) => {
                          try {
                            onVolumeChange(value / 100)
                          } catch (error) {
                            console.warn("Volume change error:", error)
                            setUseFallbackSlider(true)
                          }
                        }}
                        className="touch-manipulation"
                        aria-label="Volume control"
                        onPointerDown={(e) => {
                          e.stopPropagation()
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Time display with buffer health */}
          <div className="text-xs sm:text-sm text-white hidden md:flex items-center gap-2 font-mono">
            <span>
              {formatTime(isNaN(duration) ? 0 : duration * played)} / {formatTime(isNaN(duration) ? 0 : duration)}
            </span>
            <div
              className={cn("w-1 h-1 rounded-full", getBufferHealthColor(bufferHealth))}
              title={`Buffer health: ${Math.round(bufferHealth * 100)}%`}
            />
          </div>
        </div>

        {/* Right controls */}
        <div className={cn("flex items-center space-x-1 sm:space-x-2", isCompact && "space-x-0.5")}>
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 text-white touch-manipulation hover:bg-white/20", isCompact && "h-7 w-7")}
                title="Settings"
                aria-label="Video settings"
                aria-haspopup="true"
                aria-expanded={isSettingsOpen}
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/10 backdrop-blur-sm">
              <div className="px-2 py-1.5 text-xs font-medium text-white/60">Playback Speed</div>
              {playbackSpeeds.map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => onPlaybackRateChange(speed)}
                  className="text-white hover:bg-white/10 cursor-pointer flex items-center justify-between"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && (
                    <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
              {onShowKeyboardShortcuts && (
                <DropdownMenuItem
                  onClick={onShowKeyboardShortcuts}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  Keyboard Shortcuts
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auto-play video toggle */}
          {onToggleAutoPlayVideo && (
            <div
              className="hidden lg:flex items-center mr-3 px-2 py-1 rounded-md bg-white/10"
              role="group"
              aria-label="Auto play on load"
            >
              <span className="text-xs text-white mr-2">Auto-play</span>
              <Switch
                checked={autoPlayVideo}
                onCheckedChange={onToggleAutoPlayVideo}
                aria-label="Toggle auto-play video on page load"
              />
            </div>
          )}

          {/* Enhanced Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div
              className="hidden lg:flex items-center mr-3 px-2 py-1 rounded-md bg-white/10"
              role="group"
              aria-label="Auto next video"
            >
              <span className="text-xs text-white mr-2">Auto-next</span>
              <Switch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                aria-label="Toggle autoplay next video"
              />
            </div>
          )}

          {/* Separator for content vs view controls */}
          {(onToggleAutoPlayVideo || (hasNextVideo && onToggleAutoPlayNext)) &&
            (isAuthenticated || onPictureInPicture) && <div className="hidden lg:block w-px h-6 bg-white/20 mx-1" />}

          {/* Bookmark buttons: add + panel toggle */}
          {typeof onAddBookmark === "function" && (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-white touch-manipulation transition-colors",
                  isAuthenticated ? "hover:bg-white/20 hover:text-blue-400" : "opacity-60 cursor-not-allowed",
                )}
                onClick={() => {
                  if (!isAuthenticated) return
                  handleAddBookmark()
                }}
                disabled={!isAuthenticated}
                title={isAuthenticated ? "Add bookmark (B)" : "Sign in to add bookmarks"}
                aria-label={isAuthenticated ? "Add bookmark at current time" : "Sign in to add bookmarks"}
              >
                <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              {onToggleBookmarkPanel && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-white touch-manipulation transition-colors",
                    bookmarkPanelOpen && "bg-white/20 text-blue-400",
                  )}
                  onClick={() => {
                    onToggleBookmarkPanel()
                  }}
                  title={bookmarkPanelOpen ? "Hide bookmarks (Shift+B)" : "Show bookmarks (Shift+B)"}
                  aria-label={bookmarkPanelOpen ? "Hide bookmark panel" : "Show bookmark panel"}
                >
                  {/* Reuse icon; optionally could use different icon for panel */}
                  <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
          )}

          {onPictureInPicture && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-white touch-manipulation transition-all duration-300 relative overflow-hidden",
                  isPiPActive
                    ? "bg-gradient-to-br from-blue-500/30 to-purple-600/30 text-blue-300 shadow-lg shadow-blue-500/20"
                    : "hover:bg-white/20 hover:shadow-lg",
                )}
                onClick={onPictureInPicture}
                title={
                  isPiPSupported
                    ? isPiPActive
                      ? "Exit Picture-in-Picture (P)"
                      : "Enter Picture-in-Picture (P)"
                    : isPiPActive
                      ? "Close Mini Player (P)"
                      : "Open Mini Player (P)"
                }
                aria-label={
                  isPiPSupported
                    ? isPiPActive
                      ? "Exit Picture-in-Picture mode"
                      : "Enter Picture-in-Picture mode"
                    : isPiPActive
                      ? "Close Mini Player"
                      : "Open Mini Player"
                }
              >
                <motion.div
                  animate={{
                    rotate: isPiPActive ? 360 : 0,
                    scale: isPiPActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <PictureInPicture2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
                {isPiPActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"
                  />
                )}
              </Button>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-white touch-manipulation transition-all duration-300 relative overflow-hidden",
                isFullscreen
                  ? "bg-gradient-to-br from-green-500/30 to-emerald-600/30 text-green-300 shadow-lg shadow-green-500/20"
                  : "hover:bg-white/20 hover:shadow-lg",
              )}
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
              aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
            >
              <motion.div
                animate={{
                  rotate: isFullscreen ? 180 : 0,
                  scale: isFullscreen ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </motion.div>
              {isFullscreen && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
                />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)
