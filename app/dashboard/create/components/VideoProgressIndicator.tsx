"use client"

import React from "react"
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCcw } from "lucide-react"
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

export function VideoProgressIndicator({
  status,
  onRetry,
  onCancel,
  showControls = true,
  size = "md",
  showLabel = true,
  className,
}: VideoProgressIndicatorProps) {
  // Default to processing if no status provided
  const currentStatus = status?.status || "processing"
  
  // Size configuration
  const sizeConfig = {
    sm: {
      iconSize: "h-3 w-3",
      progressHeight: "h-1",
      textSize: "text-xs",
      buttonSize: "h-6 px-2 text-xs",
    },
    md: {
      iconSize: "h-4 w-4",
      progressHeight: "h-2",
      textSize: "text-sm",
      buttonSize: "h-7 px-2 text-xs",
    },
    lg: {
      iconSize: "h-5 w-5",
      progressHeight: "h-3",
      textSize: "text-base",
      buttonSize: "h-8 px-3 text-sm",
    },
  }
  
  const { iconSize, progressHeight, textSize, buttonSize } = sizeConfig[size]
  
  // Status icon
  const StatusIcon = () => {
    switch (currentStatus) {
      case "queued":
        return <AlertCircle className={cn(iconSize, "text-yellow-500 animate-pulse")} />
      case "processing":
        return <Loader2 className={cn(iconSize, "text-blue-500 animate-spin")} />
      case "completed":
        return <CheckCircle className={cn(iconSize, "text-green-500")} />
      case "error":
        return <XCircle className={cn(iconSize, "text-red-500")} />
      default:
        return null
    }
  }
  
  // Status color
  const getStatusColor = () => {
    switch (currentStatus) {
      case "queued":
        return "bg-yellow-500"
      case "processing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }
  
  // Status message
  const getStatusMessage = () => {
    if (status?.message) {
      return status.message
    }
    
    switch (currentStatus) {
      case "queued":
        return "Queued for processing..."
      case "processing":
        return "Processing video..."
      case "completed":
        return "Video ready"
      case "error":
        return "Video generation failed"
      default:
        return "Unknown status"
    }
  }
  
  // Progress value
  const progressValue = (() => {
    if (status?.progress) {
      return status.progress
    }
    
    switch (currentStatus) {
      case "queued":
        return 10
      case "processing":
        return 50
      case "completed":
        return 100
      case "error":
        return 100
      default:
        return 0
    }
  })()
    return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <div className="flex items-center justify-between">
        {showLabel && (
          <div className="flex items-center space-x-2">
            <StatusIcon />
            <span className={cn("font-medium", textSize)}>{getStatusMessage()}</span>
          </div>
        )}
        
        {showControls && (
          <div className="flex space-x-2">            {currentStatus === "processing" && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className={buttonSize}
              >
                Cancel
              </Button>
            )}
            
            {currentStatus === "error" && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className={cn(buttonSize, "text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600")}
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
            
            {/* Allow retrying even for stuck "processing" videos if they've been in that state for too long */}
            {currentStatus === "processing" && status?.message?.includes("stuck") && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className={cn(buttonSize, "text-yellow-500 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600")}
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry Stuck
              </Button>
            )}
          </div>
        )}
      </div>
      
      <Progress
        value={progressValue}
        className={cn(
          "w-full transition-all", 
          progressHeight,
          {
            "animate-pulse": currentStatus === "processing",
          }        )}
        indicatorClassName={cn(getStatusColor())}
      />
    </div>
  )
}
