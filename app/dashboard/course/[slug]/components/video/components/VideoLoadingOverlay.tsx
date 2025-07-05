"use client"

import React, { useEffect } from "react"
import { useGlobalLoading } from "@/store/slices/global-loading-slice"

interface VideoLoadingOverlayProps {
  isVisible: boolean
  message?: string
}

const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ 
  isVisible, 
  message = "Loading video..." 
}) => {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    let loaderId: string | null = null

    if (isVisible) {
      loaderId = showLoading({
        message,
        variant: 'spinner',
        theme: 'primary',
        isBlocking: true,
        priority: 5
      })
    }

    return () => {
      if (loaderId) {
        hideLoading(loaderId)
      }
    }
  }, [isVisible, message, showLoading, hideLoading])

  return null // Loading handled by GlobalLoader
}

export default React.memo(VideoLoadingOverlay)
