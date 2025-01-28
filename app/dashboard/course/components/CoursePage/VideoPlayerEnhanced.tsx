'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2, Minimize2, Settings } from 'lucide-react'
import { formatTime, getVideoQualityOptions, PLAYBACK_SPEEDS } from '@/lib/utils'

interface VideoPlayerProps {
  videoId: string
  onEnded: () => void
  autoPlay?: boolean
  onProgress?: (progress: number) => void
  initialTime?: number
  brandLogo?: string
}

const EnhancedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onEnded,
  autoPlay = false,
  onProgress,
  initialTime = 0,
  brandLogo = '/placeholder.svg?height=100&width=100'
}) => {
  const [playing, setPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [played, setPlayed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [quality, setQuality] = useState('auto')
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [showNextVideoOverlay, setShowNextVideoOverlay] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPlaying(autoPlay)
    setPlayed(0)
    if (playerRef.current) {
      playerRef.current.seekTo(0)
    }
  }, [autoPlay]); // Removed videoId from dependencies

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') handlePlayPause()
      if (e.key === 'ArrowLeft') handleSkip(-10)
      if (e.key === 'ArrowRight') handleSkip(10)
      if (e.key === 'm') handleMute()
      if (e.key === 'f') handleFullscreen()
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handlePlayPause = () => setPlaying(!playing)
  const handleMute = () => setMuted(!muted)
  const handleVolumeChange = (newVolume: number[]) => setVolume(newVolume[0])
  const handleSeekChange = (newPlayed: number[]) => {
    setPlayed(newPlayed[0])
    playerRef.current?.seekTo(newPlayed[0])
  }
  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!playerRef.current?.getInternalPlayer()?.seeking) {
      setPlayed(state.played)
      onProgress?.(state.played)

      // Show "Moving to next video" overlay 5 seconds before the end
      if (duration - state.playedSeconds <= 15 && !showNextVideoOverlay) {
        setShowNextVideoOverlay(true)
      }
    }
  }
  const handleDuration = (duration: number) => setDuration(duration)
  const handleSkip = (seconds: number) => {
    const newTime = (playerRef.current?.getCurrentTime() || 0) + seconds
    playerRef.current?.seekTo(newTime / duration)
  }
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }
  const handleQualityChange = (newQuality: string) => setQuality(newQuality)
  const handlePlaybackSpeedChange = (newSpeed: number) => setPlaybackSpeed(newSpeed)

  const handleReady = () => {
    const player = playerRef.current?.getInternalPlayer()
    if (player && player.getAvailableQualityLevels) {
      setAvailableQualities(player.getAvailableQualityLevels())
    }
  }

  const handleVideoEnd = () => {
    setShowNextVideoOverlay(false)
    onEnded()
  }

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-xl group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleVideoEnd}
          onReady={handleReady}
          progressInterval={1000}
          playbackRate={playbackSpeed}
          config={{
            youtube: {
              playerVars: { start: Math.floor(initialTime), modestbranding: 1 },
            },
          }}
        />

        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <img src={brandLogo || "/placeholder.svg"} alt="Brand Logo" className="w-24 h-24 object-contain" />
          </div>
        )}

        {showNextVideoOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-white text-2xl font-bold">Moving to next video...</div>
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Slider
            value={[played]}
            onValueChange={handleSeekChange}
            max={1}
            step={0.001}
            className="w-full mb-2 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-cyan-400"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{playing ? 'Pause' : 'Play'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSkip(-10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rewind 10 seconds</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSkip(10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forward 10 seconds</p>
                </TooltipContent>
              </Tooltip>

              <span className="text-white text-sm ml-2">
                {formatTime(duration * played)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{muted ? 'Unmute' : 'Mute'}</p>
                  </TooltipContent>
                </Tooltip>
                <Slider
                  value={[muted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-20 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-cyan-400"
                />
              </div>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Quality: {quality}</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getVideoQualityOptions(availableQualities).map((option) => (
                          <DropdownMenuItem key={option.value} onSelect={() => handleQualityChange(option.value)}>
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Speed: {playbackSpeed}x</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem key={speed.value} onSelect={() => handlePlaybackSpeedChange(speed.value)}>
                            {speed.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default EnhancedVideoPlayer
