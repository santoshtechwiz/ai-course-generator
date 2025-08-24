"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause, Volume2, VolumeX, Maximize2, X, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import dynamic from "next/dynamic"

const ReactPlayer = dynamic(() => import("react-player/youtube"), { ssr: false })

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
  currentTime: string
  duration: string
  onPlayPause: () => void
  onVolumeToggle: () => void
  onNext?: () => void
  hasNext?: boolean
  nextTitle?: string
  played: number
  onSeek: (percent: number) => void
  thumbnail?: string
}

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
  thumbnail
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const playerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (playing && !isHovered && !isDragging) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [playing, isHovered, isDragging])

  // Constrain position to viewport
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const maxX = window.innerWidth - 320 - 16
    const maxY = window.innerHeight - 180 - 16
    return {
      x: Math.max(16, Math.min(pos.x, maxX)),
      y: Math.max(16, Math.min(pos.y, maxY))
    }
  }, [])

  // Handle drag
  const handleDrag = useCallback((event: any, info: PanInfo) => {
    const newPos = constrainPosition({
      x: position.x + info.delta.x,
      y: position.y + info.delta.y
    })
    onPositionChange(newPos)
  }, [position, onPositionChange, constrainPosition])

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = clickX / rect.width
    onSeek(Math.max(0, Math.min(1, percent)))
  }, [onSeek])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: position.x, y: position.y }}
          animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          drag
          dragMomentum={false}
          onDrag={handleDrag}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 9999,
          }}
          className="select-none cursor-move"
        >
          <div className="w-80 bg-black rounded-lg shadow-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
            {/* Video Container */}
            <div className="relative aspect-video bg-black">
              {/* YouTube Player */}
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                width="100%"
                height="100%"
                playing={playing}
                volume={volume}
                muted={muted}
                config={{
                  playerVars: {
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                  },
                } as any}
                onProgress={(state: any) => {
                  // Update progress if needed
                }}
              />

              {/* Overlay Controls */}
              <AnimatePresence>
                {(showControls || !playing) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"
                  >
                    {/* Top Controls */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onExpand}
                        className="h-7 w-7 p-0 bg-black/40 hover:bg-black/60 text-white rounded-full"
                        title="Expand to full player"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="h-7 w-7 p-0 bg-black/40 hover:bg-red-600 text-white rounded-full"
                        title="Close mini player"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Center Play/Pause */}
                    {!playing && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="lg"
                          variant="ghost"
                          onClick={onPlayPause}
                          className="h-12 w-12 p-0 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm"
                        >
                          <Play className="h-6 w-6 ml-0.5" />
                        </Button>
                      </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      {/* Progress Bar */}
                      <div 
                        className="w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer"
                        onClick={handleProgressClick}
                      >
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all duration-200"
                          style={{ width: `${played * 100}%` }}
                        />
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={onPlayPause}
                            className="h-7 w-7 p-0 text-white hover:bg-white/10 rounded-full"
                          >
                            {playing ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3 ml-0.5" />
                            )}
                          </Button>

                          {hasNext && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={onNext}
                              className="h-7 w-7 p-0 text-white hover:bg-white/10 rounded-full"
                              title={nextTitle ? `Next: ${nextTitle}` : "Next chapter"}
                            >
                              <SkipForward className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={onVolumeToggle}
                            className="h-7 w-7 p-0 text-white hover:bg-white/10 rounded-full"
                          >
                            {muted ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        <div className="text-xs text-white/80 font-mono">
                          {currentTime} / {duration}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Video Info */}
            <div className="p-3 bg-black/90">
              <div className="text-sm font-medium text-white line-clamp-1 mb-1">
                {chapterTitle || title || "Video"}
              </div>
              <div className="text-xs text-white/60 line-clamp-1">
                CourseAI • {duration}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(EnhancedMiniPlayer)
