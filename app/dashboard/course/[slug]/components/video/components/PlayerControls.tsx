"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  SkipForward,
  Maximize2,
  Minimize2,
  Settings,
  Bookmark,
  PictureInPicture,
  Monitor,
  Keyboard,
  RotateCcw,
  RotateCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { PlayerControlsProps } from "../types"
import ProgressBar from "./ProgressBar"


const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export const PlayerControls: React.FC<PlayerControlsProps> = ({
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
  onCertificateClick,
  playerConfig,
  show = true,
  onShowKeyboardShortcuts,
  onTheaterMode,
  onNextVideo,
  onToggleBookmarkPanel,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle volume slider visibility
  const handleVolumeMouseEnter = useCallback(() => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current)
    }
    setShowVolumeSlider(true)
  }, [])

  const handleVolumeMouseLeave = useCallback(() => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false)
    }, 300)
  }, [])

  // Handle seeking
  const handleSeek = useCallback(
    (time: number) => {
      onSeekChange(time)
    },
    [onSeekChange],
  )

  // Handle bookmark addition
  const handleAddBookmark = useCallback(() => {
    if (onAddBookmark) {
      const currentTime = duration * played
      onAddBookmark(currentTime)
    }
  }, [onAddBookmark, duration, played])

  // Handle Picture-in-Picture
  const handlePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        const videoElement = document.querySelector("video")
        if (videoElement && "requestPictureInPicture" in videoElement) {
          await videoElement.requestPictureInPicture()
        }
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error)
    }
  }, [])

  // Get volume icon
  const getVolumeIcon = () => {
    if (muted || volume === 0) return VolumeX
    if (volume < 0.5) return Volume1
    return Volume2
  }

  const VolumeIcon = getVolumeIcon()

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-sm z-30"
          >
            {/* Progress bar */}
            <div className="px-4 pb-2">
              <ProgressBar
                played={played}
                loaded={loaded}
                duration={duration}
                onSeek={handleSeek}
                formatTime={formatTime}
                bookmarks={bookmarks}
                onSeekToBookmark={onSeekToBookmark}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 pb-4">
              {/* Left controls */}
              <div className="flex items-center space-x-2">
                {/* Play/Pause */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onPlayPause}
                      className="h-10 w-10 text-white hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-105"
                    >
                      {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{playing ? "Pause (Space)" : "Play (Space)"}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Skip backward */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSeek(Math.max(0, duration * played - 10))}
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rewind 10s (←)</p>
                  </TooltipContent>
                </Tooltip>

                {/* Skip forward */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSeek(Math.min(duration, duration * played + 10))}
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Forward 10s (→)</p>
                  </TooltipContent>
                </Tooltip>

                {/* Next video */}
                {onNextVideo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNextVideo}
                        className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Next video</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Volume control */}
                <div
                  className="relative flex items-center"
                  onMouseEnter={handleVolumeMouseEnter}
                  onMouseLeave={handleVolumeMouseLeave}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMute}
                        className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                      >
                        <VolumeIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{muted ? "Unmute (M)" : "Mute (M)"}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Volume slider */}
                  <AnimatePresence>
                    {showVolumeSlider && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-full ml-2 bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                      >
                        <div className="w-20">
                          <Slider
                            value={[muted ? 0 : volume * 100]}
                            onValueChange={([value]) => onVolumeChange(value / 100)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div className="text-white text-xs text-center mt-1 font-medium">
                          {Math.round((muted ? 0 : volume) * 100)}%
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Time display */}
                <div className="text-white text-sm font-medium ml-2 min-w-max">
                  <span>{formatTime(duration * played)}</span>
                  <span className="text-white/60 mx-1">/</span>
                  <span className="text-white/80">{formatTime(duration)}</span>
                </div>

                {/* Buffer indicator */}
                {isBuffering && (
                  <div className="flex items-center space-x-1 text-white/60">
                    <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-xs">Buffering</span>
                  </div>
                )}
              </div>

              {/* Right controls */}
              <div className="flex items-center space-x-2">
                {/* Playback speed indicator */}
                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded border border-white/20">
                  {playbackRate === 1 ? "1x" : `${playbackRate}x`}
                </div>

                {/* Add bookmark */}
                {isAuthenticated && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddBookmark}
                        className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                      >
                        <Bookmark className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add bookmark (B)</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Picture-in-Picture */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePictureInPicture}
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                    >
                      <PictureInPicture className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Picture-in-Picture (P)</p>
                  </TooltipContent>
                </Tooltip>

                {/* Theater mode */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onTheaterMode}
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                    >
                      <Monitor className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Theater mode (T)</p>
                  </TooltipContent>
                </Tooltip>

                {/* Settings */}
                <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-black/95 border-white/20 text-white">
                    <div className="p-2">
                      <div className="text-sm font-medium mb-2">Playback Speed</div>
                      <div className="grid grid-cols-2 gap-1">
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem
                            key={speed}
                            onClick={() => onPlaybackRateChange(speed)}
                            className={cn(
                              "text-center cursor-pointer",
                              playbackRate === speed && "bg-red-600 text-white",
                            )}
                          >
                            {speed === 1 ? "Normal" : `${speed}x`}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem onClick={onShowKeyboardShortcuts} className="cursor-pointer">
                      <Keyboard className="h-4 w-4 mr-2" />
                      Keyboard shortcuts
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Fullscreen */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggleFullscreen}
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                    >
                      {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}

export default PlayerControls
