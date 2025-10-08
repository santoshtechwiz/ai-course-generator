"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
const ReactPlayer: any = dynamic(() => import('react-player/youtube'), { ssr: false })
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

// Enhanced Mini Player Props Interface
interface EnhancedMiniPlayerProps {
  visible: boolean
  position: { x: number; y: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  onClose: () => void
  onExpand: () => void
  videoUrl: string
  playing: boolean
  volume: number
  muted: boolean
  title?: string
  chapterTitle?: string
  currentTime?: string
  duration?: string
  onPlayPause: () => void
  onVolumeToggle: () => void
  onNext?: () => void
  hasNext?: boolean
  nextTitle?: string
  played: number
  onSeek: (percent: number) => void
  thumbnail?: string
}

/**
 * EnhancedMiniPlayer - Draggable floating mini video player
 * 
 * Features:
 * - Draggable positioning with constraints
 * - Synchronized playback with main player
 * - Compact controls (play/pause, volume, progress)
 * - Close and expand buttons
 * - Glassmorphic design
 * - Smooth animations
 */
const EnhancedMiniPlayer: React.FC<EnhancedMiniPlayerProps> = ({
  visible,
  position,
  onPositionChange,
  onClose,
  onExpand,
  videoUrl,
  playing,
  volume,
  muted,
  title,
  chapterTitle,
  currentTime,
  duration,
  onPlayPause,
  onVolumeToggle,
  onNext,
  hasNext,
  nextTitle,
  played,
  onSeek,
  thumbnail,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  // Dimensions
  const width = 420
  const height = Math.round((9 / 16) * width) + 60 // Add space for controls

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mini-player-controls')) return
    
    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }, [])

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Constrain to viewport
      const maxX = window.innerWidth - width - 16
      const maxY = window.innerHeight - height - 16

      onPositionChange({
        x: Math.max(8, Math.min(newX, maxX)),
        y: Math.max(8, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onPositionChange, width, height])

  // Handle progress bar seek
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    onSeek(Math.max(0, Math.min(1, percent)))
  }, [onSeek])

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed z-[9999] rounded-xl overflow-hidden shadow-2xl",
          "bg-black border border-white/20",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          left: position.x,
          top: position.y,
          width: `${width}px`,
          height: `${height}px`,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseDown={handleDragStart}
      >
        {/* Video Player */}
        <div className="relative w-full" style={{ height: `${Math.round((9 / 16) * width)}px` }}>
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={playing}
            volume={volume}
            muted={muted}
            width="100%"
            height="100%"
            playsinline
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  controls: 0,
                },
              },
            }}
          />

          {/* Overlay Controls - Always visible in mini player */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-2 flex items-start justify-between pointer-events-auto z-10">
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-white text-xs font-semibold truncate">
                {chapterTitle || title || 'Video'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onExpand()
                }}
                title="Return to main player"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-black/50 hover:bg-red-600 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                title="Close mini player"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="mini-player-controls bg-black/95 border-t border-white/10 p-2 space-y-1.5">
          {/* Progress Bar */}
          <div
            className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
              style={{ width: `${played * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              style={{ left: `${played * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Play/Pause */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onPlayPause()
                }}
              >
                {playing ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                )}
              </Button>

              {/* Volume */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onVolumeToggle()
                }}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              {/* Time Display */}
              <div className="text-white text-xs font-mono px-1">
                {currentTime} / {duration}
              </div>
            </div>

            {/* Right: Next Video (if available) */}
            {hasNext && onNext && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-white hover:bg-white/20 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
                title={nextTitle ? `Next: ${nextTitle}` : 'Next video'}
              >
                <SkipForward className="h-3.5 w-3.5 mr-1" />
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Dragging Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default EnhancedMiniPlayer