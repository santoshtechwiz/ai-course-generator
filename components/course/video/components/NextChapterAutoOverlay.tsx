"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Play } from "lucide-react"

interface NextChapterAutoOverlayProps {
  chapterTitle: string
  onCancel: () => void
  onContinue: () => void
}

const NextChapterAutoOverlay: React.FC<NextChapterAutoOverlayProps> = ({
  chapterTitle,
  onCancel,
  onContinue,
}) => {
  // Countdown timer
  const [countdown, setCountdown] = useState(5)
  
  // Auto-continue after countdown reaches zero
  useEffect(() => {
    if (countdown <= 0) {
      onContinue()
      return
    }
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [countdown, onContinue])
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 z-40"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="max-w-md w-full bg-card border rounded-xl p-6 shadow-lg"
      >
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{countdown}</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Next Chapter</h3>
          <p className="text-muted-foreground text-sm">{chapterTitle}</p>
        </div>
        
        <div className="space-y-2">
          <Button onClick={onContinue} className="w-full" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Play Now
          </Button>
          <Button onClick={onCancel} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default React.memo(NextChapterAutoOverlay)
