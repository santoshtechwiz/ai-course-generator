"use client"

import React from "react"

interface VideoLoadingOverlayProps {
  isVisible: boolean
  message?: string
}

/**
 * Simple VideoLoadingOverlay that only renders when visible
 * All loading state is handled by the global loader system
 */
const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ 
  isVisible, 
  message = "Loading video..." 
}) => {
  // Don't use any loader hooks here to prevent infinite loops
  // The global loader is managed at a higher level
  if (!isVisible) return null

  return null // All loading handled by GlobalLoader at app level
}

export default React.memo(VideoLoadingOverlay)
