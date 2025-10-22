"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize2 as Minimize,
  RewindIcon, FastForwardIcon, Settings, PictureInPicture2, BookmarkIcon, 
  StickyNote, SkipForward, RotateCcw, RotateCw, Clock, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { SimpleSwitch } from "@/components/ui/simple-switch"
import { motion, AnimatePresence } from "framer-motion"

// Memoized slider to prevent unnecessary re-renders
const MemoizedSlider = React.memo(Slider);

const PlayerControls = (props) => {
  const {
    playing, muted, volume, playbackRate, played, loaded, duration,
    isFullscreen, isBuffering, bufferHealth, onPlayPause, onMute,
    onVolumeChange, onSeekChange, onPlaybackRateChange, onToggleFullscreen,
    formatTime, bookmarks = [], onSeekToBookmark, isAuthenticated, show = true,
    onCertificateClick, onShowKeyboardShortcuts, onNextVideo, onToggleBookmarkPanel,
    bookmarkPanelOpen, autoPlayNext = true, onToggleAutoPlayNext, autoPlayVideo = false,
    onToggleAutoPlayVideo, hasNextVideo = false, nextVideoTitle = "", canAccessNextVideo = true,
    onIsDragging, onPictureInPicture, isPiPSupported = false, isPiPActive = false,
    isTheaterMode = false, onToggleTheaterMode, notesCount = 0, onToggleNotesPanel,
    notesPanelOpen = false, onCreateNote, notes = []
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
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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
    [duration, onSeekChange, isDragging]
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
    [duration]
  )

  // Fixed drag handler with proper cleanup
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
    [duration, onSeekChange, handleSeek, onIsDragging]
  )

  // Stable volume change handler
  const handleVolumeSliderChange = useCallback((value: number[]) => {
    const newVolume = value[0] / 100
    onVolumeChange(newVolume)
  }, [onVolumeChange])

  // Toggle volume slider with stable reference
  const toggleVolumeSlider = useCallback(() => {
    setShowVolumeSlider(prev => !prev)
  }, [])

  // Bookmark indicators in progress bar
  const renderBookmarkIndicators = useMemo(() => {
    if (!localBookmarks.length || !duration) return null
    
    return localBookmarks.map((bookmarkTime, index) => {
      const position = (bookmarkTime / duration) * 100
      return (
        <div
          key={index}
          className="absolute top-0 w-1 h-full bg-yellow-400 transform -translate-x-1/2 cursor-pointer z-10 hover:w-2 transition-all duration-150"
          style={{ left: `${position}%` }}
          onClick={() => onSeekToBookmark && onSeekToBookmark(bookmarkTime)}
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
        !showControls && "opacity-0"
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
      {/* Improved gradient overlays with better visibility */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Improved progress bar with better visibility */}
      <div
        ref={progressBarRef}
        className="relative h-3 bg-gray-700/80 rounded-full cursor-pointer mx-4 mb-4 group border-0 hover:h-4 transition-all duration-200"
        onClick={handleSeek}
        onMouseMove={handleProgressHover}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => { setHoverPosition(null); setHoveredTime(null) }}
      >
        {/* Buffer health */}
        <div className="absolute left-0 top-0 h-full bg-gray-500/60 rounded-full transition-all" style={{ width: `${loaded * 100}%` }} />
        
        {/* Played progress */}
        <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all" 
          style={{ width: `${played * 100}%` }} />
        
        {/* Bookmark indicators */}
        {renderBookmarkIndicators}
        
        {/* Hover time preview */}
        {hoverPosition !== null && hoveredTime !== null && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium pointer-events-none -translate-x-1/2 border border-gray-600 shadow-lg backdrop-blur-sm"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoveredTime)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
        
        {/* Current time indicator */}
        <div
          className={cn(
            "absolute top-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg cursor-pointer z-20 transition-all",
            isDragging && "w-4 h-4"
          )}
          style={{ left: `${played * 100}%` }}
        />
      </div>

      {/* Improved control bar with better colors and responsiveness */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-gray-900/95 backdrop-blur-sm rounded-lg mx-4 mb-4 border border-gray-700 shadow-2xl">
        
        {/* Left controls group - Core controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          {/* Play / Pause */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onPlayPause}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-white/20 text-white border border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>

          {/* Rewind */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* Forward */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200"
          >
            <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* Volume control */}
          <div ref={volumeSliderRef} className="relative flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200"
            >
              {React.createElement(getVolumeIcon, { className: "h-3 w-3 sm:h-4 sm:w-4" })}
            </Button>
            
            {/* Volume slider */}
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-2 left-0 bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-xl transition-all duration-200"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <MemoizedSlider
                    value={[localVolume]}
                    onValueChange={handleVolumeSliderChange}
                    max={100}
                    step={1}
                    className="w-24 h-2"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time display */}
          <div className="text-xs sm:text-sm text-white font-medium tabular-nums min-w-[80px] sm:min-w-[100px] text-center px-2 sm:px-3 py-1 bg-gray-700/50 rounded-lg border border-gray-600 ml-1 sm:ml-2">
            {formatTime(duration * played)} / {formatTime(duration)}
          </div>
        </div>

        {/* Center controls group - Responsive hidden on small screens */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {/* Auto-play video toggle */}
          {onToggleAutoPlayVideo && (
            <div className="flex items-center px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/50">
              <Zap className="h-3 w-3 mr-2 text-blue-300" />
              <span className="text-xs font-medium text-white mr-2">Auto</span>
              <SimpleSwitch
                checked={autoPlayVideo}
                onCheckedChange={onToggleAutoPlayVideo}
                aria-label="Toggle auto-play video on page load"
              />
            </div>
          )}

          {/* Enhanced Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="flex items-center px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-400/50">
              <SkipForward className="h-3 w-3 mr-2 text-purple-300" />
              <span className="text-xs font-medium text-white mr-2">Next</span>
              <SimpleSwitch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                aria-label="Toggle autoplay next video"
              />
            </div>
          )}
        </div>

        {/* Right controls group */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Next video - Show on small screens only when hasNextVideo */}
          {hasNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200"
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={nextVideoTitle}
            >
              <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/* Playback speed */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-gray-800 border border-gray-600 shadow-xl backdrop-blur-sm">
              <div className="px-2 py-1.5 text-xs font-bold text-white border-b border-gray-600">Speed</div>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <DropdownMenuItem 
                  key={speed} 
                  onClick={() => onPlaybackRateChange(speed)}
                  className="text-white hover:bg-gray-700 flex justify-between font-medium"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && (
                    <Badge variant="default" className="ml-2 bg-blue-500 text-white text-xs">✓</Badge>
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
                "h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200 relative",
                notesPanelOpen && "bg-green-500/30"
              )}
            >
              <StickyNote className="h-3 w-3 sm:h-4 sm:w-4" />
              {notesCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border border-white"
                >
                  {notesCount > 9 ? "9+" : notesCount}
                </motion.div>
              )}
            </Button>
          )}

          {/* Bookmark */}
          {onToggleBookmarkPanel && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleBookmarkPanel}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200",
                bookmarkPanelOpen && "bg-orange-500/30"
              )}
            >
              <BookmarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/* PiP */}
          {onPictureInPicture && isPiPSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPictureInPicture}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200",
                isPiPActive && "bg-blue-500/30"
              )}
            >
              <PictureInPicture2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/* Theater */}
          {onToggleTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheaterMode}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200 hidden sm:flex",
                isTheaterMode && "bg-purple-500/30"
              )}
            >
              <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white border border-gray-600 transition-all duration-200",
              isFullscreen && "bg-red-500/30"
            )}
          >
            {isFullscreen ? (
              <Minimize className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)