"use client"

import React, { useState, useRef, useEffect } from "react"
import { X, Maximize2, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DraggablePiPPlayerProps {
  isActive: boolean
  onClose: () => void
  onMaximize: () => void
  playing: boolean
  onPlayPause: () => void
  currentTime: string
  duration: string
  children?: React.ReactNode
}

interface Position {
  x: number
  y: number
}

const DraggablePiPPlayer: React.FC<DraggablePiPPlayerProps> = ({
  isActive,
  onClose,
  onMaximize,
  playing,
  onPlayPause,
  currentTime,
  duration,
  children
}) => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  // Initialize position on client side
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pip-position")
      if (saved) {
        try {
          setPosition(JSON.parse(saved))
        } catch (e) {
          // Default position: bottom-right with margin
          setPosition({ 
            x: window.innerWidth - 380, 
            y: window.innerHeight - 300 
          })
        }
      } else {
        setPosition({ 
          x: window.innerWidth - 380, 
          y: window.innerHeight - 300 
        })
      }
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) {
      return
    }
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Keep player within viewport with padding
      const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 360))
      const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 280))
      
      setPosition({ x: boundedX, y: boundedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      // Save position to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("pip-position", JSON.stringify(position))
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, position])

  if (!isActive || !isMounted) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      ref={dragRef}
      className={cn(
        "fixed z-50 rounded-none overflow-hidden shadow-2xl",
        "bg-black border-2 border-white/30 backdrop-blur-sm",
        isDragging && "cursor-grabbing shadow-2xl",
        !isDragging && "cursor-grab"
      )}
      style={{
        width: "360px",
        height: "260px",
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: "none"
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Draggable Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-black/80 via-black/60 to-black/40 z-20 flex items-center justify-between px-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Picture in Picture
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-none transition-all"
            onClick={onPlayPause}
            data-no-drag
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          <Button
            size="icon"
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-none transition-all"
            onClick={onMaximize}
            data-no-drag
            title="Maximize"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-7 w-7 text-white/70 hover:text-red-400 hover:bg-red-500/20 rounded-none transition-all"
            onClick={onClose}
            data-no-drag
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Content Area */}
      <div className="w-full h-full bg-black">
        {children}
      </div>

      {/* Time Overlay (bottom-left) */}
      <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-xs text-white/80 font-medium pointer-events-none">
        {currentTime} / {duration}
      </div>

      {/* Drag Handle Indicator (bottom-right) */}
      <div className="absolute bottom-1 right-1 w-5 h-5 opacity-0 hover:opacity-100 transition-opacity">
        <svg
          className="w-full h-full text-white/40"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M13 6a1 1 0 110-2h6v6h-2V7a1 1 0 00-1-1h-3zM2 9a1 1 0 011-1h3v2H3a1 1 0 01-1-1zm13 4a1 1 0 110 2h-3v2h3a1 1 0 110-2h3v-2h-3z" />
        </svg>
      </div>
    </motion.div>
  )
}

export default React.memo(DraggablePiPPlayer)
