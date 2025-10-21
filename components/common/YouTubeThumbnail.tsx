/**
 * YouTubeThumbnail Component
 * Robust thumbnail display with automatic fallback handling and loading states
 */

'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Video, Loader2 } from 'lucide-react'
import { createThumbnailErrorHandler, getThumbnailWithFallback } from '@/utils/youtube-thumbnails'

interface YouTubeThumbnailProps {
  videoId: string
  alt?: string
  className?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  onLoad?: () => void
  showPlayIcon?: boolean
  showLoadingState?: boolean
}

export const YouTubeThumbnail: React.FC<YouTubeThumbnailProps> = ({
  videoId,
  alt = 'Video thumbnail',
  className,
  priority = false,
  fill = false,
  width = 480,
  height = 360,
  onLoad,
  showPlayIcon = false,
  showLoadingState = true,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  const thumbnailUrl = getThumbnailWithFallback(videoId)
  const errorHandler = createThumbnailErrorHandler(videoId)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    setIsLoading(false)
    errorHandler(e)
  }, [errorHandler])

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {/* Loading skeleton */}
      {isLoading && showLoadingState && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Thumbnail image */}
      <Image
        src={thumbnailUrl}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : "object-contain"
        )}
        unoptimized // YouTube URLs don't work with Next.js image optimization
      />

      {/* Error state fallback */}
      {hasError && !thumbnailUrl.includes('placeholder') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 text-muted-foreground">
          <Video className="h-12 w-12 mb-2 opacity-50" />
          <span className="text-xs">Thumbnail unavailable</span>
        </div>
      )}

      {/* Play icon overlay */}
      {showPlayIcon && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-black/60 backdrop-blur-sm p-4 transition-transform hover:scale-110">
            <svg
              className="h-8 w-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

export default YouTubeThumbnail
