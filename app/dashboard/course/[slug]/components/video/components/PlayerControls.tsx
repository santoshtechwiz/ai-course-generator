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

const PlayerControls = (props: any) => {
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
      {/* Enhanced gradient overlays for Nero theme */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0e0e10]/80 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0e0e10]/95 via-[#0e0e10]/60 to-transparent pointer-events-none" />

      {/* ✨ ENHANCED PROGRESS/SEEK BAR - Nero Theme with Clear Draggable Thumb */}
      <div
        ref={progressBarRef}
        className="relative h-2 bg-neutral-800/90 cursor-pointer mx-4 mb-3 group hover:h-[10px] transition-all duration-200 rounded-sm"
        onClick={handleSeek}
        onMouseMove={handleProgressHover}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => { setHoverPosition(null); setHoveredTime(null) }}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={duration * played}
        tabIndex={0}
      >
        {/* Buffer health - subtle background */}
        <div 
          className="absolute left-0 top-0 h-full bg-neutral-700/50 transition-all duration-300 rounded-sm" 
          style={{ width: `${loaded * 100}%` }} 
        />
        
        {/* ✨ Played progress - Nero accent color with glow */}
        <div 
          className="absolute left-0 top-0 h-full bg-[#00e0ff] transition-all duration-100 rounded-sm shadow-[0_0_8px_rgba(0,224,255,0.6)]" 
          style={{ width: `${played * 100}%` }} 
        />
        
        {/* Bookmark indicators - yellow with better visibility */}
        {renderBookmarkIndicators}
        
        {/* ✨ Hover time preview - Nero styled */}
        {hoverPosition !== null && hoveredTime !== null && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full mb-3 bg-[#0e0e10] text-[#00e0ff] px-3 py-1.5 rounded text-xs font-bold pointer-events-none -translate-x-1/2 border border-[#00e0ff]/30 shadow-lg shadow-[#00e0ff]/20"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoveredTime)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[5px] border-transparent border-t-[#0e0e10]" />
          </motion.div>
        )}
        
        {/* ✨ ENHANCED DRAGGABLE THUMB - Clear, visible, with Nero glow */}
        <div
          className={cn(
            "absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-pointer z-20 transition-all duration-150",
            "border-2 border-[#00e0ff] shadow-[0_0_12px_rgba(0,224,255,0.8)]",
            "hover:scale-125 hover:shadow-[0_0_16px_rgba(0,224,255,1)]",
            "focus:scale-125 focus:outline-none focus:ring-2 focus:ring-[#00e0ff] focus:ring-offset-2 focus:ring-offset-[#0e0e10]",
            isDragging && "scale-150 shadow-[0_0_20px_rgba(0,224,255,1)]"
          )}
          style={{ left: `${played * 100}%` }}
          tabIndex={0}
          role="button"
          aria-label="Seek position"
        />
      </div>

      {/* ✨ ENHANCED CONTROL BAR - Nero Theme, Single-Row Flex Layout */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[#0e0e10]/98 backdrop-blur-md mx-4 mb-4 border border-neutral-800 shadow-2xl rounded-lg">
        
        {/* Left controls group - Core playback controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* ✨ Play/Pause - Enhanced with Nero accent */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onPlayPause}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg hover:bg-[#00e0ff]/20 text-white hover:text-[#00e0ff] border border-neutral-700 hover:border-[#00e0ff]/50 transition-all duration-200 focus:ring-2 focus:ring-[#00e0ff] focus:ring-offset-2 focus:ring-offset-[#0e0e10]"
            aria-label={playing ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 border-2 border-[#00e0ff] border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* ✨ Rewind 10s */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
            className="h-8 w-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-all duration-200"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* ✨ Forward 10s */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
            className="h-8 w-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-all duration-200"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* ✨ Volume control - Nero themed */}
          <div ref={volumeSliderRef} className="relative flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="h-8 w-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-all duration-200"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {React.createElement(getVolumeIcon, { className: "h-4 w-4" })}
            </Button>
            
            {/* Volume slider popup */}
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-0 bg-[#0e0e10] p-3 rounded-lg border border-neutral-700 shadow-xl"
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

          {/* ✨ Time display - Nero styled */}
          <div className="text-xs sm:text-sm text-neutral-300 font-mono font-medium tabular-nums min-w-[90px] sm:min-w-[110px] text-center px-2 sm:px-3 py-1 bg-neutral-900/50 rounded border border-neutral-800">
            <span className="text-[#00e0ff]">{formatTime(duration * played)}</span>
            <span className="text-neutral-600 mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Center controls - Auto-play toggles (hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* Auto-play video toggle */}
          {onToggleAutoPlayVideo && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00e0ff]/10 border border-[#00e0ff]/30 hover:bg-[#00e0ff]/20 transition-colors">
              <Zap className="h-3.5 w-3.5 text-[#00e0ff]" />
              <span className="text-xs font-medium text-neutral-300">Auto</span>
              <SimpleSwitch
                checked={autoPlayVideo}
                onCheckedChange={onToggleAutoPlayVideo}
                aria-label="Toggle auto-play video on page load"
              />
            </div>
          )}

          {/* Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors">
              <SkipForward className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-neutral-300">Next</span>
              <SimpleSwitch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                aria-label="Toggle autoplay next video"
              />
            </div>
          )}
        </div>

        {/* Right controls group - Secondary actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Next video button */}
          {hasNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-all duration-200"
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={nextVideoTitle}
              aria-label="Next video"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}

          {/* ✨ Playback speed - Nero themed dropdown */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-all duration-200 focus:ring-2 focus:ring-[#00e0ff]"
                aria-label="Playback speed"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-[#0e0e10] border border-neutral-700 shadow-2xl">
              <div className="px-3 py-2 text-xs font-bold text-[#00e0ff] border-b border-neutral-800">Playback Speed</div>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <DropdownMenuItem 
                  key={speed} 
                  onClick={() => onPlaybackRateChange(speed)}
                  className="text-neutral-300 hover:bg-neutral-800 hover:text-white flex justify-between items-center font-medium px-3 py-2 cursor-pointer"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && (
                    <div className="w-2 h-2 rounded-full bg-[#00e0ff] shadow-[0_0_6px_rgba(0,224,255,0.8)]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notes button */}
          {onToggleNotesPanel && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleNotesPanel}
              className={cn(
                "h-8 w-8 rounded-lg hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all duration-200 relative",
                notesPanelOpen ? "bg-green-500/20 text-green-400 border-green-500/50" : "text-neutral-400 hover:text-white"
              )}
              aria-label="Notes"
            >
              <StickyNote className="h-4 w-4" />
              {notesCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-[#00e0ff] rounded-full text-[10px] text-[#0e0e10] font-bold flex items-center justify-center border border-[#0e0e10] shadow-[0_0_8px_rgba(0,224,255,0.6)]"
                >
                  {notesCount > 9 ? "9+" : notesCount}
                </motion.div>
              )}
            </Button>
          )}

          {/* Bookmark button */}
          {onToggleBookmarkPanel && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleBookmarkPanel}
              className={cn(
                "h-8 w-8 rounded-lg hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all duration-200",
                bookmarkPanelOpen ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : "text-neutral-400 hover:text-white"
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
                "h-8 w-8 rounded-lg hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all duration-200",
                isPiPActive ? "bg-[#00e0ff]/20 text-[#00e0ff] border-[#00e0ff]/50" : "text-neutral-400 hover:text-white"
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
                "h-8 w-8 rounded-lg hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all duration-200 hidden sm:flex",
                isTheaterMode ? "bg-purple-500/20 text-purple-400 border-purple-500/50" : "text-neutral-400 hover:text-white"
              )}
              aria-label="Theater mode"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          )}

          {/* ✨ Fullscreen - Enhanced Nero styling */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              "h-8 w-8 rounded-lg hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all duration-200 focus:ring-2 focus:ring-[#00e0ff]",
              isFullscreen ? "bg-[#00e0ff]/20 text-[#00e0ff] border-[#00e0ff]/50" : "text-neutral-400 hover:text-white"
            )}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)