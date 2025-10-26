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
  const currentStatus = status?.status || "processing"
  
  const sizeConfig = {
    sm: {
      iconSize: "h-3 w-3",
      progressHeight: "h-1.5",
      textSize: "text-xs",
      buttonSize: "h-7 px-2 text-xs",
      padding: "p-2",
    },
    md: {
      iconSize: "h-4 w-4",
      progressHeight: "h-2",
      textSize: "text-sm",
      buttonSize: "h-8 px-3 text-xs",
      padding: "p-3",
    },
    lg: {
      iconSize: "h-5 w-5",
      progressHeight: "h-3",
      textSize: "text-base",
      buttonSize: "h-9 px-4 text-sm",
      padding: "p-4",
    },
  }
  
  const { iconSize, progressHeight, textSize, buttonSize, padding } = sizeConfig[size]
  
  const StatusIcon = () => {
    switch (currentStatus) {
      case "queued":
        return <AlertCircle className={cn(iconSize, "text-warning animate-pulse")} />
      case "processing":
        return <Loader2 className={cn(iconSize, "text-primary animate-spin")} />
      case "completed":
        return <CheckCircle className={cn(iconSize, "text-success")} />
      case "error":
        return <XCircle className={cn(iconSize, "text-danger")} />
      default:
        return null
    }
  }
  
  const getStatusColor = () => {
    switch (currentStatus) {
      case "queued":
        return "bg-warning"
      case "processing":
        return "bg-primary"
      case "completed":
        return "bg-success"
      case "error":
        return "bg-danger"
      default:
        return "bg-muted"
    }
  }
  
  const getStatusBorderColor = () => {
    switch (currentStatus) {
      case "queued":
        return "border-warning"
      case "processing":
        return "border-primary"
      case "completed":
        return "border-success"
      case "error":
        return "border-danger"
      default:
        return "border-border"
    }
  }
  
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
    <div className={cn(
      "rounded-none border-3 bg-card",
      getStatusBorderColor(),
      padding,
      className
    )}>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-3">
          {showLabel && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <StatusIcon />
              <span className={cn("font-black truncate", textSize)}>
                {getStatusMessage()}
              </span>
            </div>
          )}
          
          {showControls && (
            <div className="flex gap-2 flex-shrink-0">
              {currentStatus === "processing" && onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className={cn(
                    buttonSize,
                    "font-black border-2 border-danger text-danger hover:bg-danger hover:text-background rounded-none"
                  )}
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
                    "font-black border-2 border-warning text-warning hover:bg-warning hover:text-background rounded-none"
                  )}
                >
                  <RefreshCcw className="h-3 w-3 mr-1" /> Retry
                </Button>
              )}
              
              {currentStatus === "processing" && status?.message?.includes("stuck") && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className={cn(
                    buttonSize,
                    "font-black border-2 border-warning text-warning hover:bg-warning hover:text-background rounded-none"
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
            "w-full transition-all border-2 border-border rounded-none bg-muted",
            progressHeight,
            getStatusColor(),
            {
              "animate-pulse": currentStatus === "processing",
            }
          )}
        />
      </div>
    </div>
  )
}