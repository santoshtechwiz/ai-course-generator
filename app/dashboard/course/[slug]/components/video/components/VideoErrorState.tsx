"use client"

import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react"

interface VideoErrorStateProps {
  onReload: () => void
  onRetry: () => void
  error?: Error
}

const VideoErrorState: React.FC<VideoErrorStateProps> = ({ onReload, onRetry, error }) => {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex flex-col items-center space-y-6 max-w-md text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Video Error</h3>
          <p className="text-gray-300 text-sm sm:text-base">
            {error?.message || "There was a problem loading the video. Please try again."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2" variant="default">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>

          <Button onClick={onReload} className="flex-1 flex items-center justify-center gap-2" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default React.memo(VideoErrorState)
