"use client"

import React from "react"
import { GlobalLoader } from "./global-loader"
import type { LoaderProps, LoaderContext, LoaderSize, LoaderVariant } from "./types"

/**
 * Compatibility layer for the old CourseAILoader API
 * This maps the old API to the new GlobalLoader component
 */

export const CourseAILoader: React.FC<LoaderProps> = ({
  size = "md",
  variant = "inline",
  context = "loading",
  className,
  message,
  subMessage,
  isLoading = true,
  progress,
  showProgress = false,
  animated = true,
  showSparkles = false,
  ...rest
}) => {
  if (!isLoading) return null;
  
  // Map loader variant to GlobalLoader variant
  const variantMap: Record<LoaderVariant, "spinner" | "dots" | "pulse" | "skeleton"> = {
    inline: "spinner",
    fullscreen: "spinner",
    card: "spinner",
    overlay: "spinner",
    skeleton: "skeleton",
    minimal: "spinner",
  }
  
  // Determine fullscreen mode based on variant
  const fullScreen = variant === "fullscreen";
  
  return (
    <GlobalLoader
      fullScreen={fullScreen}
      size={size}
      variant={variantMap[variant]}
      text={message}
      subText={subMessage}
      isLoading={isLoading}
      className={className}
      progress={showProgress ? progress : undefined}
      theme="primary" // Default to primary theme
      {...rest}
    />
  )
}

// Specialized versions of the loader for backward compatibility
export function FullPageLoader({
  message = "Loading content...",
  subMessage = "Please wait while we prepare your experience",
  context = "loading",
  progress,
  showProgress = false,
}: {
  message?: string
  subMessage?: string
  context?: LoaderContext
  progress?: number
  showProgress?: boolean
}) {
  return (
    <GlobalLoader
      fullScreen={true}
      size="lg"
      text={message}
      subText={subMessage}
      progress={showProgress ? progress : undefined}
      theme="primary"
    />
  )
}

export function InlineLoader({
  size = "md",
  message,
  className,
  context = "loading",
  variant = "inline",
}: {
  size?: LoaderSize
  message?: string
  className?: string
  context?: LoaderContext
  variant?: "inline" | "dots" | "pulse"
}) {
  const variantMap: Record<string, "spinner" | "dots" | "pulse"> = {
    inline: "spinner",
    dots: "dots",
    pulse: "pulse"
  }
  
  return (
    <GlobalLoader
      size={size}
      variant={variantMap[variant]}
      text={message}
      className={className}
      theme="primary"
    />
  )
}

export function MinimalLoader({
  size = "sm",
  message = "Loading...",
  context = "loading",
  className,
}: {
  size?: LoaderSize
  message?: string
  context?: LoaderContext
  className?: string
}) {
  return (
    <GlobalLoader
      size={size}
      text={message}
      className={className}
      theme="primary"
    />
  )
}

export function CardLoader({
  message = "Loading...",
  subMessage,
  context = "loading",
  className,
  progress,
  showProgress = false,
}: {
  message?: string
  subMessage?: string
  context?: LoaderContext
  className?: string
  progress?: number
  showProgress?: boolean
}) {
  return (
    <GlobalLoader
      size="lg"
      text={message}
      subText={subMessage}
      className={className}
      progress={showProgress ? progress : undefined}
      theme="primary"
    />
  )
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <GlobalLoader
      variant="skeleton"
      className={className}
    />
  )
}

export default CourseAILoader
