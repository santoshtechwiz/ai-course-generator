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
  const [useFallbackSlider, setUseFallbackSlider] = useState(false)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [localBookmarks, setLocalBookmarks] = useState<number[]>(bookmarks || [])
  const [showControls, setShowControls] = useState(true)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressRafRef = useRef<number | null>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => setIsMounted(true), [])

  // Auto-hide controls
  useEffect(() => {
    if (!show) return
    
    const hideControls = () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
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

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  const getVolumeIcon = useMemo(() => {
    if (muted || volume === 0) return VolumeX
    if (volume < 0.5) return Volume1
    return Volume2
  }, [muted, volume])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !duration) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const seekPosition = Math.max(0, Math.min(1, x / rect.width))
      onSeekChange(duration * seekPosition)
    },
    [duration, onSeekChange]
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true)
      handleSeek(e)
      const handleMouseMove = (e: MouseEvent) => {
        if (!progressBarRef.current || !duration) return
        const rect = progressBarRef.current.getBoundingClientRect()
        const x = Math.max(rect.left, Math.min(e.clientX, rect.right)) - rect.left
        const seekPosition = Math.max(0, Math.min(1, x / rect.width))
        onSeekChange(duration * seekPosition)
      }
      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [duration, onSeekChange, handleSeek]
  )

  // Bookmark indicators in progress bar
  const renderBookmarkIndicators = useMemo(() => {
    if (!localBookmarks.length || !duration) return null
    
    return localBookmarks.map((bookmarkTime, index) => {
      const position = (bookmarkTime / duration) * 100
      return (
        <div
          key={index}
          className="absolute top-0 w-1 h-full bg-yellow-400 transform -translate-x-1/2 cursor-pointer z-10"
          style={{ left: `${position}%` }}
          onClick={() => onSeekToBookmark && onSeekToBookmark(bookmarkTime)}
          title={`Bookmark at ${formatTime(bookmarkTime)}`}
        />
      )
    })
  }, [localBookmarks, duration, formatTime, onSeekToBookmark])

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
      {/* Top gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

      {/* Progress bar with neobrutalism style */}
      <div
        ref={progressBarRef}
        className="relative h-4 bg-black/60 rounded-none cursor-pointer mx-0 mb-4 group border-0"
        onClick={handleSeek}
        onMouseMove={handleProgressHover}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => { setHoverPosition(null); setHoveredTime(null) }}
      >
        {/* Buffer health */}
        <div className="absolute left-0 top-0 h-full bg-gray-600 rounded-none" style={{ width: `${loaded * 100}%` }} />
        
        {/* Played progress */}
        <div className="absolute left-0 top-0 h-full bg-red-500 rounded-none transition-all border-r-2 border-red-700" 
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
            className="absolute bottom-full mb-2 bg-black text-white px-3 py-2 rounded-lg text-sm font-bold pointer-events-none -translate-x-1/2 border-2 border-white shadow-lg"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoveredTime)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
          </motion.div>
        )}
        
        {/* Current time indicator */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-red-500 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg cursor-pointer z-20"
          style={{ left: `${played * 100}%` }}
        />
      </div>

      {/* Unified control bar with neobrutalism design */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-white rounded-none mx-0 mb-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] border-2 border-black">
        {/* Left controls group */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Play / Pause */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onPlayPause}
            className="h-10 w-10 rounded-lg hover:bg-red-100 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {isBuffering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 border-2 border-black border-t-transparent rounded-full"
              />
            ) : playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          {/* Rewind */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
            className="h-8 w-8 rounded-lg hover:bg-yellow-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Forward */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
            className="h-8 w-8 rounded-lg hover:bg-yellow-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Next video */}
          {hasNextVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-blue-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              onClick={onNextVideo}
              disabled={!canAccessNextVideo}
              title={nextVideoTitle}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}

          {/* Volume control */}
          <div className="relative flex items-center group">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMute}
              className="h-8 w-8 rounded-lg hover:bg-green-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              {React.createElement(getVolumeIcon, { className: "h-4 w-4" })}
            </Button>
            
            {/* Volume slider */}
            <div className="hidden group-hover:flex absolute bottom-full mb-2 left-0 bg-white p-3 rounded-lg border-2 border-black shadow-lg">
              <Slider
                value={[muted ? 0 : volume * 100]}
                onValueChange={(value) => onVolumeChange(value[0] / 100)}
                max={100}
                step={1}
                className="w-24 h-2"
              />
            </div>
          </div>

          {/* Time display */}
          <div className="text-sm text-black font-bold tabular-nums min-w-[100px] text-center px-3 py-1 bg-yellow-100 rounded-lg border border-black">
            {formatTime(duration * played)} / {formatTime(duration)}
          </div>
        </div>

        {/* Center controls group */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Auto-play video toggle */}
          {onToggleAutoPlayVideo && (
            <div className="hidden lg:flex items-center px-3 py-1 rounded-lg bg-blue-100 border border-black">
              <Zap className="h-3 w-3 mr-2" />
              <span className="text-xs font-bold text-black mr-2">Auto</span>
              <SimpleSwitch
                checked={autoPlayVideo}
                onCheckedChange={onToggleAutoPlayVideo}
                aria-label="Toggle auto-play video on page load"
              />
            </div>
          )}

          {/* Enhanced Autoplay next toggle */}
          {hasNextVideo && onToggleAutoPlayNext && (
            <div className="hidden lg:flex items-center px-3 py-1 rounded-lg bg-purple-100 border border-black">
              <SkipForward className="h-3 w-3 mr-2" />
              <span className="text-xs font-bold text-black mr-2">Next</span>
              <SimpleSwitch
                checked={autoPlayNext}
                onCheckedChange={onToggleAutoPlayNext}
                aria-label="Toggle autoplay next video"
              />
            </div>
          )}
        </div>

        {/* Right controls group */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick speed presets - visible on larger screens */}
          <div className="hidden xl:flex items-center gap-1">
            {[1, 1.25, 1.5, 2].map((speed) => (
              <Button
                key={speed}
                variant="ghost"
                size="sm"
                onClick={() => onPlaybackRateChange(speed)}
                className={cn(
                  "h-7 px-2 rounded text-xs font-bold border transition-all",
                  playbackRate === speed
                    ? "bg-purple-500 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black border-black hover:bg-purple-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                )}
              >
                {speed === 1 ? "1x" : `${speed}x`}
              </Button>
            ))}
          </div>

          {/* Playback speed dropdown */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg hover:bg-purple-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-2 py-1.5 text-xs font-bold text-black border-b border-black">Speed</div>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <DropdownMenuItem 
                  key={speed} 
                  onClick={() => onPlaybackRateChange(speed)}
                  className="text-black hover:bg-yellow-100 flex justify-between font-medium"
                >
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  {playbackRate === speed && (
                    <Badge variant="default" className="ml-2 bg-red-500 text-white text-xs">✓</Badge>
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
                "h-8 w-8 rounded-lg hover:bg-green-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all relative",
                notesPanelOpen && "bg-green-200"
              )}
            >
              <StickyNote className="h-4 w-4" />
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
                "h-8 w-8 rounded-lg hover:bg-orange-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all",
                bookmarkPanelOpen && "bg-orange-200"
              )}
            >
              <BookmarkIcon className="h-4 w-4" />
            </Button>
          )}

          {/* PiP */}
          {onPictureInPicture && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPictureInPicture}
              className={cn(
                "h-8 w-8 rounded-lg hover:bg-blue-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all",
                isPiPActive && "bg-blue-200"
              )}
            >
              <PictureInPicture2 className="h-4 w-4" />
            </Button>
          )}

          {/* Theater */}
          {onToggleTheaterMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheaterMode}
              className={cn(
                "h-8 w-8 rounded-lg hover:bg-purple-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all",
                isTheaterMode && "bg-purple-200"
              )}
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
              "h-8 w-8 rounded-lg hover:bg-red-100 text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all",
              isFullscreen && "bg-red-200"
            )}
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