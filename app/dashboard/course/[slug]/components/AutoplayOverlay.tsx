"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, X, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface AutoplayOverlayProps {
  countdown: number
  onCancel: () => void
  onNextVideo: () => void
  nextVideoTitle?: string
}

export const AutoplayOverlay = ({ countdown, onCancel, onNextVideo, nextVideoTitle }: AutoplayOverlayProps) => {
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Up Next</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancelClick} className="h-6 w-6 rounded-full">
            <X className="h-3 w-3" />
          </Button>
        </div>

        {nextVideoTitle && <div className="mb-2 text-xs font-medium line-clamp-1">{nextVideoTitle}</div>}

        <p className="text-muted-foreground text-xs mb-3">Playing in {countdown} seconds...</p>

        <Progress value={progress} className="h-1 mb-3" />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 px-3" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs h-8 px-3 gap-1 flex-1" onClick={handleNextVideoClick}>
            <PlayCircle className="h-3 w-3" />
            Play Now
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AutoplayOverlay
