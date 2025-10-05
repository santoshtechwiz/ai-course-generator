"use client"

import Image, { ImageProps } from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Optimized Image component with:
 * - Automatic loading states
 * - Error handling with fallback
 * - Blur placeholder support
 * - Responsive sizes by default
 */

interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string
  fallbackSrc?: string
  showLoadingState?: boolean
  containerClassName?: string
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  showLoadingState = true,
  containerClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading && showLoadingState ? "opacity-0" : "opacity-100",
          className
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWUiLz48L3N2Zz4="
        {...props}
      />
      {isLoading && showLoadingState && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  )
}

/**
 * Responsive image sizes presets for common layouts
 */
export const imageSizes = {
  avatar: "(max-width: 768px) 40px, 48px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  hero: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px",
  thumbnail: "(max-width: 768px) 120px, 160px",
  icon: "32px",
  banner: "100vw",
  full: "100vw",
}
