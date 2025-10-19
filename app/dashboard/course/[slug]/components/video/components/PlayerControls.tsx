"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize2 as Minimize,
  RewindIcon, FastForwardIcon, Settings, PictureInPicture2, BookmarkIcon, StickyNote, SkipForward
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

  // --- existing state & effect logic (untouched) ---
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [useFallbackSlider, setUseFallbackSlider] = useState(false)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [localBookmarks, setLocalBookmarks] = useState<number[]>(bookmarks || [])
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressRafRef = useRef<number | null>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => setIsMounted(true), [])

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

  // --- redesigned UI ---
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300",
        !show && "opacity-0 pointer-events-none"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* progress bar (red) */}
      <div
        ref={progressBarRef}
        className="relative h-1 bg-gray-400/60 rounded-full cursor-pointer mx-4 mb-2 group"
        onClick={handleSeek}
        onMouseMove={handleProgressHover}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => { setHoverPosition(null); setHoveredTime(null) }}
      >
        <div className="absolute left-0 top-0 h-full bg-white/30 rounded-full" style={{ width: `${loaded * 100}%` }} />
        <div className="absolute left-0 top-0 h-full bg-red-500 rounded-full transition-all" style={{ width: `${played * 100}%` }} />
        {hoverPosition !== null && hoveredTime !== null && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none -translate-x-1/2"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoveredTime)}
          </motion.div>
        )}
      </div>

      {/* unified control bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-3 bg-black/80 rounded-full shadow-lg backdrop-blur-md mx-auto w-fit border-2 border-white/20">
        {/* Play / Pause */}
        <Button variant="ghost" size="icon"
          onClick={onPlayPause}
          className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white"
        >
          {isBuffering ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 border-2 border-black border-t-transparent rounded-full"
            />
          ) : playing ? (
            <Pause className="h-5 w-5 text-black" />
          ) : (
            <Play className="h-5 w-5 text-black" />
          )}
        </Button>

        {/* Rewind */}
        <Button variant="ghost" size="icon"
          onClick={() => onSeekChange(Math.max(0, duration * played - 10))}
          className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white"
        >
          <RewindIcon className="h-5 w-5" />
        </Button>

        {/* Forward */}
        <Button variant="ghost" size="icon"
          onClick={() => onSeekChange(Math.min(duration, duration * played + 10))}
          className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white"
        >
          <FastForwardIcon className="h-5 w-5" />
        </Button>

        {/* Next video */}
        {hasNextVideo && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white"
            onClick={onNextVideo}
            disabled={!canAccessNextVideo}
            title={nextVideoTitle}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        )}

        {/* Volume */}
        <Button variant="ghost" size="icon"
          onClick={onMute}
          className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white"
        >
          {React.createElement(getVolumeIcon, { className: "h-5 w-5" })}
        </Button>

        {/* Time */}
        <div className="text-xs sm:text-sm text-white font-medium tabular-nums min-w-[70px] text-center">
          {formatTime(duration * played)} / {formatTime(duration)}
        </div>

        {/* Settings */}
        <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/10">
            <div className="px-2 py-1.5 text-xs font-medium text-white/60">Playback Speed</div>
            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
              <DropdownMenuItem key={speed} onClick={() => onPlaybackRateChange(speed)}
                className="text-white hover:bg-white/10 flex justify-between">
                <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                {playbackRate === speed && (
                  <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">Active</Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/10" />
            {onShowKeyboardShortcuts && (
              <DropdownMenuItem onClick={onShowKeyboardShortcuts}
                className="text-white hover:bg-white/10">Keyboard Shortcuts</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notes */}
        {onToggleNotesPanel && isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleNotesPanel}
            className={cn("h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white relative",
              notesPanelOpen && "bg-[hsl(var(--success))]/30")}
          >
            <StickyNote className="h-5 w-5" />
            {notesCount > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[10px] text-white flex items-center justify-center">
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
            className={cn("h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white",
              bookmarkPanelOpen && "bg-[hsl(var(--warning))]/30")}
          >
            <BookmarkIcon className="h-5 w-5" />
          </Button>
        )}

        {/* PiP */}
        {onPictureInPicture && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPictureInPicture}
            className={cn("h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white",
              isPiPActive && "bg-[hsl(var(--primary))]/30")}
          >
            <PictureInPicture2 className="h-5 w-5" />
          </Button>
        )}

        {/* Theater */}
        {onToggleTheaterMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheaterMode}
            className={cn("h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white",
              isTheaterMode && "bg-[hsl(var(--accent))]/30")}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        )}

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          className={cn("h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white",
            isFullscreen && "bg-[hsl(var(--success))]/30")}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default React.memo(PlayerControls)
