"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Play } from "lucide-react"

interface AutoPlayNotificationProps {
  onClose: () => void
  onNextChapter: () => void
}

const AutoPlayNotification: React.FC<AutoPlayNotificationProps> = ({ onClose, onNextChapter }) => {
  // Auto-close after 10 seconds if no interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      onNextChapter()
    }, 10000)
    
    return () => clearTimeout(timer)
  }, [onNextChapter])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm z-40"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-base font-medium">Ready for the next chapter?</h3>
          <p className="text-sm text-muted-foreground">
            Continuing in 10 seconds. Click play to continue now.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={onNextChapter}>
            <Play className="h-4 w-4 mr-1" /> Continue
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default React.memo(AutoPlayNotification)
