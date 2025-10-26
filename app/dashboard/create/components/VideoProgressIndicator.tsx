"use client"
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
        return <AlertCircle className={cn(iconSize, "text-accent animate-pulse")} />
      case "processing":
        return <Loader2 className={cn(iconSize, "text-accent animate-spin")} />
      case "completed":
        return <CheckCircle className={cn(iconSize, "text-accent")} />
      case "error":
        return <XCircle className={cn(iconSize, "text-destructive")} />
      default:
        return null
    }
  }

  // Status color mapped to theme tokens
  const getStatusColor = () => {
    switch (currentStatus) {
      case "queued":
        return "bg-accent/20"
      case "processing":
        return "bg-accent"
      case "completed":
        return "bg-accent"
      case "error":
        return "bg-destructive"
      default:
        return "bg-card"
    }
  }

  const getStatusMessage = () => {
    if (status?.message) {
      return status.message
    }

    switch (currentStatus) {
      case "queued":
        return "Queued for processing... (usually 1-2 minutes)"
      case "processing":
        return "Processing video... (this may take a few minutes)"
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
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        {showLabel && (
          <div className="flex items-center space-x-2 flex-1">
            <StatusIcon />
            <span className={cn("font-medium", textSize)}>{getStatusMessage()}</span>
          </div>
        )}

        {showControls && (
          <div className="flex space-x-2">
            {" "}
            {currentStatus === "processing" && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className={cn(buttonSize, "border-4 border-border")}
                aria-label="Cancel video generation"
              >
                Cancel
              </Button>
            )}
            {currentStatus === "error" && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className={cn(
                  buttonSize,
                  "text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive border-4",
                )}
                aria-label="Retry video generation"
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
                className={cn(buttonSize, "text-accent border-accent hover:bg-accent/10 hover:text-accent border-4")}
                aria-label="Retry stuck video generation"
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry Stuck
              </Button>
            )}
          </div>
        )}
      </div>

      <Progress
        value={progressValue}
        className={cn("w-full transition-all", progressHeight, {
          "animate-pulse": currentStatus === "processing",
        })}
      />
    </div>
  )
}
