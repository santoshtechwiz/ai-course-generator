/**
 * app/dashboard/create/components/VideoProgressIndicator.tsx
 * 
 * REFACTORED: Clean progress indicator with Nerobrutal theme
 * - Consistent styling with border-4 and shadow-neo
 * - Clear visual states
 * - Proper button styling
 */

"use client"

import React from "react"
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCcw, X } from "lucide-react"
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
  const currentStatus = status?.status || "idle"
  
  // Size configuration
  const sizeConfig = {
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
  }
  
  const { iconSize, progressHeight, textSize, buttonSize } = sizeConfig[size]
  
  // Status icon and color
  const StatusIcon = () => {
    switch (currentStatus) {
      case "queued":
        return <AlertCircle className={cn(iconSize, "text-yellow-500")} />
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
  
  const getStatusMessage = () => {
    if (status?.message) return status.message
    
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
        return "Ready to generate"
    }
  }
  
  const progressValue = status?.progress || (currentStatus === "completed" ? 100 : 
                                              currentStatus === "processing" ? 50 : 
                                              currentStatus === "queued" ? 10 : 0)

  return (
    <div className={cn("flex flex-col space-y-2 p-3 rounded-none border-2", className)}>
      <div className="flex items-center justify-between">
        {showLabel && (
          <div className="flex items-center space-x-2">
            <StatusIcon />
            <span className={cn("font-medium", textSize)}>{getStatusMessage()}</span>
          </div>
        )}
        
        {showControls && (
          <div className="flex space-x-2">
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
                  "border-2 border-red-200 text-red-600 hover:bg-red-50"
                )}
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
          </div>
        )}
      </div>
      
      <Progress
        value={progressValue}
        className={cn(
          "w-full border-2", 
          progressHeight,
          currentStatus === "processing" && "animate-pulse"
        )}
        indicatorClassName={cn(getStatusColor())}
      />
    </div>
  )
}