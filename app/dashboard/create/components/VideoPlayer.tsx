"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/tailwindUtils"
import { AlertCircle } from "lucide-react"

interface VideoPlayerProps {
  videoId: string | null
  title?: string
  className?: string
  fallbackMessage?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  className,
  fallbackMessage = "No video available",
}) => {
  const [error, setError] = useState(false)

  // Handle video errors
  const handleError = () => {
    setError(true)
  }

  if (!videoId) {
    return (
      <div className={cn("w-full aspect-video bg-muted flex items-center justify-center rounded-md", className)}>
        <p className="text-muted-foreground">{fallbackMessage}</p>
      </div>
    )
  }

  // Check if it's a YouTube video ID (11 characters) or a full URL
  const isYouTubeId = /^[a-zA-Z0-9_-]{11}$/.test(videoId)
  const embedUrl = isYouTubeId ? `https://www.youtube.com/embed/${videoId}` : videoId

  if (error) {
    return (
      <div
        className={cn("w-full aspect-video bg-muted flex flex-col items-center justify-center rounded-md", className)}
      >
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive font-medium">Failed to load video</p>
        <p className="text-sm text-muted-foreground mt-1">Please check the video ID or URL</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <iframe
        className="w-full aspect-video rounded-md"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={handleError}
      />
    </div>
  )
}

export default VideoPlayer
