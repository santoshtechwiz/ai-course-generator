/**
 * app/dashboard/create/components/VideoProgressIndicator.tsx
 * 
 * OPTIMIZED: Instant progress updates with smooth animations
 * - Memoized for performance
 * - Smooth progress transitions
 * - Real-time status reflection
 */

"use client"

import React, { memo, useMemo } from "react"
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCcw, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { VideoStatus } from "../hooks/useVideoProcessing"

interface VideoProgressIndicatorProps {
  status?: VideoStatus
  onRetry?: () => void
  onCancel?: () => void
  showControls?: boolean
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const VideoProgressIndicator = memo<VideoProgressIndicatorProps>(({
  status,
  onRetry,
  onCancel,
  showControls = true,
  size = "md",
  showLabel = true,
  className,
}) => {
  const currentStatus = status?.status || "idle"
  
  // Size configuration - memoized
  const sizeConfig = useMemo(() => ({
    sm: {
      iconSize: "h-3 w-3",
      progressHeight: "h-1.5",
      textSize: "text-xs",
      buttonSize: "h-6 px-2 text-xs",
    },
    md: {
      iconSize: "h-4 w-4",
      progressHeight: "h-2",
      textSize: "text-sm",
      buttonSize: "h-7 px-3 text-sm",
    },
    lg: {
      iconSize: "h-5 w-5",
      progressHeight: "h-3",
      textSize: "text-base",
      buttonSize: "h-8 px-4 text-base",
    },
  }), [])
  
  const { iconSize, progressHeight, textSize, buttonSize } = sizeConfig[size]
  
  // Memoize status icon
  const StatusIcon = useMemo(() => {
    const icons = {
      queued: <Clock className={cn(iconSize, "text-warning animate-pulse")} />,
      processing: <Loader2 className={cn(iconSize, "text-primary animate-spin")} />,
      completed: <CheckCircle className={cn(iconSize, "text-success")} />,
      error: <XCircle className={cn(iconSize, "text-error")} />,
      idle: <AlertCircle className={cn(iconSize, "text-muted-foreground")} />
    }
    return icons[currentStatus] || icons.idle
  }, [currentStatus, iconSize])
  
  // Memoize status color
  const statusColor = useMemo(() => {
    const colors = {
      queued: "bg-warning",
      processing: "bg-primary",
      completed: "bg-success",
      error: "bg-error",
      idle: "bg-muted"
    }
    return colors[currentStatus] || colors.idle
  }, [currentStatus])
  
  // Memoize status message
  const statusMessage = useMemo(() => {
    if (status?.message) return status.message
    
    const messages = {
      queued: status?.queuePosition 
        ? `In queue (position ${status.queuePosition})` 
        : "Queued for processing...",
      processing: "Processing video...",
      completed: "Video ready",
      error: "Video generation failed",
      idle: "Ready to generate"
    }
    return messages[currentStatus] || messages.idle
  }, [currentStatus, status?.message, status?.queuePosition])
  
  // Memoize progress value with smooth transitions
  const progressValue = useMemo(() => {
    if (status?.progress !== undefined) return status.progress
    
    const defaults = {
      completed: 100,
      processing: 50,
      queued: 10,
      error: 0,
      idle: 0
    }
    return defaults[currentStatus] || 0
  }, [status?.progress, currentStatus])

  return (
    <div className={cn("flex flex-col space-y-2 p-3 rounded-none border-2", className)}>
      <div className="flex items-center justify-between">
        {showLabel && (
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {StatusIcon}
            <span className={cn("font-medium truncate", textSize)}>{statusMessage}</span>
          </div>
        )}
        
        {showControls && (
          <div className="flex space-x-2 flex-shrink-0">
            {currentStatus === "processing" && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className={cn(buttonSize, "border-2")}
              >
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            )}
            
            {currentStatus === "error" && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className={cn(
                  buttonSize, 
                  "border-2 border-error/50 text-error hover:bg-error/10"
                )}
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Progress bar with smooth transitions */}
      <div className="relative">
        <Progress
          value={progressValue}
          className={cn(
            "w-full border-2 transition-all duration-300", 
            progressHeight,
            currentStatus === "processing" && "animate-pulse"
          )}
          indicatorClassName={cn(
            statusColor,
            "transition-all duration-500 ease-out"
          )}
        />
        
        {/* Show percentage for processing state */}
        {currentStatus === "processing" && progressValue > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white mix-blend-difference">
            {Math.round(progressValue)}%
          </span>
        )}
      </div>
    </div>
  )
})

VideoProgressIndicator.displayName = "VideoProgressIndicator"

export { VideoProgressIndicator }