
// Add this to your VideoPlayer.tsx component

import { cn } from "@/lib/utils";
import { Play, Pause, VolumeX, Volume1, Volume2, Minimize2, Maximize2, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import ReactPlayer from "react-player";

// Enhanced Mini Player Component
const MiniPlayerNode: React.FC<{
  visible: boolean
  position: { x: number; y: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  onClose: () => void
  onExpand: () => void
  videoUrl: string
  playing: boolean
  volume: number
  muted: boolean
  playbackRate: number
  title?: string
  currentTime: string
  duration: string
  onPlayPause: () => void
  onVolumeChange: (volume: number) => void
  onSeek: (time: number) => void
  played: number
}> = ({
  visible,
  position,
  onPositionChange,
  onClose,
  onExpand,
  videoUrl,
  playing,
  volume,
  muted,
  playbackRate,
  title,
  currentTime,
  duration,
  onPlayPause,
  onVolumeChange,
  onSeek,
  played
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | undefined>(undefined)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    setShowControls(true)
    
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2000)
    }
  }, [playing])

  // Handle mouse enter/leave for controls
  const handleMouseEnter = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    resetControlsTimeout()
  }, [resetControlsTimeout])

  // Dragging logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isExpanded) return
    
    e.preventDefault()
    setIsDragging(true)
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      
      const newX = e.clientX - dragRef.current.offsetX
      const newY = e.clientY - dragRef.current.offsetY
      
      // Constrain to viewport
      const maxX = window.innerWidth - (isExpanded ? window.innerWidth * 0.9 : 320)
      const maxY = window.innerHeight - (isExpanded ? window.innerHeight * 0.9 : 180)
      
      const constrainedPos = {
        x: Math.max(8, Math.min(maxX, newX)),
        y: Math.max(8, Math.min(maxY, newY))
      }
      
      onPositionChange(constrainedPos)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      dragRef.current = undefined
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [position, onPositionChange, isExpanded])

  // Handle expand/collapse
  const handleToggleExpand = useCallback(() => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    
    if (newExpanded) {
      // Expand to center of screen
      const centerX = (window.innerWidth - window.innerWidth * 0.9) / 2
      const centerY = (window.innerHeight - window.innerHeight * 0.9) / 2
      onPositionChange({ x: centerX, y: centerY })
    } else {
      // Return to mini size in corner
      const cornerX = window.innerWidth - 320 - 16
      const cornerY = window.innerHeight - 180 - 16
      onPositionChange({ x: cornerX, y: cornerY })
    }
    
    onExpand()
  }, [isExpanded, onPositionChange, onExpand])

  // Progress bar click handler
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    onSeek(percent)
  }, [onSeek])

  // Volume slider handler
  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    onVolumeChange(percent)
  }, [onVolumeChange])

  if (!visible) return null

  const containerSize = isExpanded 
    ? { width: '90vw', height: '90vh' }
    : { width: '320px', height: '180px' }

  return (
    <>
      {/* Backdrop overlay for expanded mode */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9999]"
          onClick={handleToggleExpand}
        />
      )}
      
      {/* Mini Player Container */}
      <div
        className={cn(
          "fixed z-[10000] bg-black rounded-lg overflow-hidden shadow-2xl border border-white/20",
          "transition-all duration-300 ease-out",
          isDragging && "cursor-grabbing",
          isExpanded ? "shadow-3xl" : "shadow-lg"
        )}
        style={{
          left: position.x,
          top: position.y,
          width: containerSize.width,
          height: containerSize.height,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Drag Handle */}
        {!isExpanded && (
          <div
            className="absolute top-0 left-0 right-0 h-6 bg-black/60 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center"
            onMouseDown={handleMouseDown}
          >
            <div className="w-8 h-0.5 bg-white/40 rounded-full" />
          </div>
        )}

        {/* Video Container */}
        <div className="relative w-full h-full">
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            playing={playing}
            volume={volume}
            muted={muted}
            playbackRate={playbackRate}
            config={{
              youtube: {
                playerVars: {
                  controls: 0,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  playsinline: 1,
                },
              },
            }}
          />

          {/* Play/Pause Overlay */}
          {!playing && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
              onClick={onPlayPause}
            >
              <div className="bg-black/60 rounded-full p-2 hover:bg-black/80 transition-colors">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-200",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Progress Bar */}
            <div 
              className="w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-150"
                style={{ width: `${played * 100}%` }}
              />
            </div>

            {/* Control Buttons Row */}
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={onPlayPause}
                  className="hover:text-white/80 transition-colors"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                {!isExpanded && (
                  <span className="text-white/80 text-xs">
                    {currentTime} / {duration}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Volume Control */}
                {isExpanded && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onVolumeChange(muted ? 0.5 : 0)}
                      className="hover:text-white/80 transition-colors"
                    >
                      {muted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <div
                      className="w-12 h-1 bg-white/20 rounded-full cursor-pointer"
                      onClick={handleVolumeClick}
                    >
                      <div
                        className="h-full bg-white rounded-full transition-all duration-150"
                        style={{ width: `${muted ? 0 : volume * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <button
                  onClick={handleToggleExpand}
                  className="hover:text-white/80 transition-colors"
                  aria-label={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="hover:text-white/80 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title Bar for Expanded Mode */}
            {isExpanded && title && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <h3 className="text-white text-sm font-medium truncate">{title}</h3>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/60 text-xs">
                    {currentTime} / {duration}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default MiniPlayerNode