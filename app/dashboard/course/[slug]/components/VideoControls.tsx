"use client"

import React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Settings,
  Bookmark,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Simple menu component to replace DropdownMenu
const SimpleMenu = ({
  trigger,
  children,
}: {
  trigger: React.ReactNode
  children: React.ReactNode
}) => {
  const [open, setOpen] = React.useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 bg-background border rounded-md shadow-md z-50 w-56">
          {children}
        </div>
      )}
    </div>
  )
}

// Simple menu item component
const SimpleMenuItem = ({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) => {
  return (
    <div
      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {children}
    </div>
  )
}

// Simple divider component
const SimpleDivider = () => <div className="h-px bg-border my-1" />

// Volume control component
const VolumeControl = ({
  volume,
  onChange,
  muted,
}: {
  volume: number
  onChange: (vol: number) => void
  muted: boolean
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const newVolume = Math.max(0, Math.min(1, offsetX / rect.width))
    onChange(newVolume)
  }

  return (
    <div
      className="w-20 h-1 bg-white/30 rounded-full cursor-pointer relative"
      onClick={handleClick}
      title={`Volume: ${Math.round(volume * 100)}%`}
    >
      <div
        className="h-full bg-primary rounded-full absolute top-0 left-0"
        style={{ width: `${muted ? 0 : volume * 100}%` }}
      />
      <div
        className="w-3 h-3 bg-white rounded-full absolute top-50% transform -translate-y-1/3 cursor-grab"
        style={{ left: `calc(${muted ? 0 : volume * 100}% - 6px)` }}
      />
    </div>
  )
}

// Playback speed options
const PLAYBACK_SPEEDS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 1.75, label: "1.75x" },
  { value: 2, label: "2x" },
]

interface VideoControlsProps {
  show: boolean
  playing: boolean
  muted: boolean
  volume: number
  played: number
  loaded: number
  duration: number
  fullscreen: boolean
  playbackSpeed: number
  autoplayNext: boolean
  bookmarks: number[]
  nextVideoId?: string
  onPlayPause: () => void
  onSkip: (seconds: number) => void
  onMute: () => void
  onVolumeChange: (volume: number) => void
  onFullscreenToggle: () => void
  onNextVideo: () => void
  onSeekChange: (position: number) => void
  onPlaybackSpeedChange: (speed: number) => void
  onAutoplayToggle: () => void
  onSeekToBookmark: (time: number) => void
  onAddBookmark: () => void
  formatTime: (seconds: number) => string
}

export const VideoControls = ({
  show,
  playing,
  muted,
  volume,
  played,
  loaded,
  duration,
  fullscreen,
  playbackSpeed,
  autoplayNext,
  bookmarks,
  nextVideoId,
  onPlayPause,
  onSkip,
  onMute,
  onVolumeChange,
  onFullscreenToggle,
  onNextVideo,
  onSeekChange,
  onPlaybackSpeedChange,
  onAutoplayToggle,
  onSeekToBookmark,
  onAddBookmark,
  formatTime,
}: VideoControlsProps) => {
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Calculate progress bar bookmark positions
  const getBookmarkPositions = () => {
    return bookmarks.map((time) => ({
      time,
      position: `${(time / duration) * 100}%`,
    }))
  }

  // Click on progress bar to seek
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const newPosition = offsetX / rect.width
      onSeekChange(newPosition)
    }
  }

  // Get volume icon based on volume level
  const getVolumeIcon = () => {
    if (muted || volume === 0) return <VolumeX className="h-4 w-4" />
    if (volume < 0.5) return <Volume1 className="h-4 w-4" />
    return <Volume2 className="h-4 w-4" />
  }

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent px-4 py-3 transition-all duration-300",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
      )}
    >
      {/* Progress bar with bookmarks */}
      <div
        ref={progressBarRef}
        className="relative w-full h-2 mb-3 bg-white/30 rounded-full cursor-pointer group"
        onClick={handleProgressBarClick}
      >
        <div className="h-full bg-primary rounded-full" style={{ width: `${played * 100}%` }} />
        <div className="h-full bg-primary/40 rounded-full absolute top-0" style={{ width: `${loaded * 100}%` }} />

        {/* Bookmarks on progress bar */}
        {bookmarks.length > 0 &&
          getBookmarkPositions().map((bookmark, index) => (
            <div
              key={index}
              className="absolute top-1/2 w-2 h-4 bg-yellow-400 rounded-sm transform -translate-y-1/2 cursor-pointer hover:bg-yellow-300 transition-colors"
              style={{ left: bookmark.position }}
              onClick={(e) => {
                e.stopPropagation()
                onSeekToBookmark(bookmark.time)
              }}
            />
          ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip(-10)}
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            title="Rewind 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextVideoId ? onNextVideo : () => onSkip(10)}
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            title={nextVideoId ? "Next video" : "Forward 10 seconds"}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <span className="text-white text-xs ml-2 font-medium">
            {formatTime(duration * played)} / {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMute}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
              title={muted ? "Unmute" : "Mute"}
            >
              {getVolumeIcon()}
            </Button>
            <VolumeControl volume={volume} onChange={onVolumeChange} muted={muted} />
          </div>

          <SimpleMenu
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            }
          >
            <div className="p-2">
              <div className="font-medium text-sm mb-2">Playback Speed: {playbackSpeed}x</div>
              <div className="grid grid-cols-2 gap-1">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <SimpleMenuItem key={speed.value} onClick={() => onPlaybackSpeedChange(speed.value)}>
                    {speed.label}
                  </SimpleMenuItem>
                ))}
              </div>
            </div>

            <SimpleDivider />

            <SimpleMenuItem onClick={onAutoplayToggle}>
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  <span>Autoplay Next</span>
                </span>
                <div
                  className={`w-8 h-4 rounded-full transition-colors ${autoplayNext ? "bg-primary" : "bg-muted"} relative`}
                >
                  <div
                    className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-transform ${autoplayNext ? "translate-x-4" : "translate-x-1"}`}
                  />
                </div>
              </div>
            </SimpleMenuItem>

            {bookmarks && bookmarks.length > 0 && (
              <>
                <SimpleDivider />
                <div className="p-2">
                  <div className="font-medium text-sm mb-2">Bookmarks ({bookmarks.length})</div>
                  <div className="max-h-40 overflow-y-auto">
                    {bookmarks.map((time, index) => (
                      <SimpleMenuItem key={index} onClick={() => onSeekToBookmark(time)}>
                        Bookmark {index + 1}: {formatTime(time)}
                      </SimpleMenuItem>
                    ))}
                  </div>
                </div>
              </>
            )}

            <SimpleDivider />
            <SimpleMenuItem onClick={onAddBookmark}>
              <div className="flex items-center">
                <Bookmark className="h-4 w-4 mr-2" />
                <span>Add Bookmark</span>
              </div>
            </SimpleMenuItem>
          </SimpleMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onFullscreenToggle}
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
