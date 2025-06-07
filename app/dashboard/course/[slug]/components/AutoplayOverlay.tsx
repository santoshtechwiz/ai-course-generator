"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/useAuth"
import { Clock, X, PlayCircle } from "lucide-react"


interface AutoplayOverlayProps {
  countdown: number
  onCancel: () => void
  onNextVideo: () => void
  nextVideoTitle?: string
}

export const AutoplayOverlay = ({ countdown, onCancel, onNextVideo, nextVideoTitle }: AutoplayOverlayProps) => {
  const { isAuthenticated } = useAuth()
  const [progress, setProgress] = useState(((5 - countdown) / 5) * 100)

  useEffect(() => {
    setProgress(((5 - countdown) / 5) * 100)
  }, [countdown])

  const handleNextVideoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      onNextVideo()
    } catch (error) {
      console.error("[AutoplayOverlay] Error playing next video:", error)
    }
  }

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      onCancel()
    } catch (error) {
      console.error("[AutoplayOverlay] Error canceling autoplay:", error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50"
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border shadow-lg rounded-xl p-4 max-w-xs w-full"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-1 flex-1 pr-4">
            <h3 className="text-sm font-medium">Next video starting in {countdown}...</h3>
            {nextVideoTitle && (
              <p className="text-xs text-muted-foreground line-clamp-1">{nextVideoTitle}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={handleCancelClick}
            aria-label="Cancel autoplay"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <Progress 
            value={progress} 
            className="h-1" 
            aria-label={`Autoplay countdown: ${countdown} seconds remaining`} 
          />
          <div className="flex items-center justify-between gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancelClick} 
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleNextVideoClick} 
              className="text-xs h-8"
            >
              Play Now
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AutoplayOverlay
