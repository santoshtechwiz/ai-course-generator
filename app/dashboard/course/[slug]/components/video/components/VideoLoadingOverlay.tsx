"use client"

import React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface VideoLoadingOverlayProps {
  isVisible: boolean
  message?: string
}

const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ isVisible, message = "Loading video..." }) => {
  if (!isVisible) return null

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex flex-col items-center space-y-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </motion.div>

        <p className="text-white text-sm sm:text-base font-medium">{message}</p>
      </motion.div>
    </motion.div>
  )
}

export default React.memo(VideoLoadingOverlay)
