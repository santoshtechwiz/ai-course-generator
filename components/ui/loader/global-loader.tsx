"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface GlobalLoaderProps {
  /**
   * Whether to show the loader as fullscreen overlay
   * @default false
   */
  fullScreen?: boolean
  
  /**
   * Primary message to display
   * @default "Loading..."
   */
  text?: string
  
  /**
   * Secondary message to provide more context
   */
  subText?: string
  
  /**
   * Whether the loader is currently active
   * @default true
   */
  isLoading?: boolean
  
  /**
   * Controls the size of the spinner
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  
  /**
   * The type of visual loader to display
   * @default "spinner"
   */
  variant?: "spinner" | "dots" | "pulse" | "skeleton"
  
  /**
   * Optional custom CSS class name
   */
  className?: string
  
  /**
   * Optional aria-label for accessibility
   * @default "Loading content"
   */
  ariaLabel?: string
  
  /**
   * Progress value (0-100) if showing determinate progress
   */
  progress?: number
  
  /**
   * Optional color theme for the loader
   * @default "primary"
   */
  theme?: "primary" | "secondary" | "accent" | "neutral"
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
} as const

const themeClasses = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  neutral: "text-muted-foreground",
} as const

/**
 * GlobalLoader - A unified loading component that can be used throughout the application.
 * Supports fullscreen overlays, inline spinners, and skeleton loaders.
 */
export function GlobalLoader({
  fullScreen = false,
  text = "Loading...",
  subText,
  isLoading = true,
  size = "md",
  variant = "spinner",
  className,
  ariaLabel = "Loading content",
  progress,
  theme = "primary",
}: GlobalLoaderProps) {
  // If not loading, render nothing
  if (!isLoading) return null

  // Main spinner component
  const SpinnerElement = (
    <div className="flex items-center justify-center" role="status" aria-label={ariaLabel}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={cn("animate-spin", themeClasses[theme], sizeClasses[size])} />
      </motion.div>
    </div>
  )

  // Dots loader component
  const DotsElement = (
    <div className="flex space-x-1" role="status" aria-label={ariaLabel}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("rounded-full bg-current", themeClasses[theme])}
          style={{ height: sizeClasses[size].split(" ")[0].replace("h-", "") + "px", 
                   width: sizeClasses[size].split(" ")[1].replace("w-", "") + "px" }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )

  // Pulse loader component
  const PulseElement = (
    <div className="relative flex items-center justify-center" role="status" aria-label={ariaLabel}>
      <motion.div
        className={cn(
          "absolute rounded-full border-2",
          themeClasses[theme].replace("text-", "border-"),
        )}
        style={{ 
          width: parseInt(sizeClasses[size].split(" ")[1].replace("w-", "")) * 1.5 + "px", 
          height: parseInt(sizeClasses[size].split(" ")[0].replace("h-", "")) * 1.5 + "px"
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={cn(
          "rounded-full",
          themeClasses[theme].replace("text-", "bg-"),
          sizeClasses[size]
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 0.6, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )

  // Progress bar component
  const ProgressElement = progress !== undefined && (
    <div className="w-full max-w-xs mt-2">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div 
          className={cn("h-full", themeClasses[theme].replace("text-", "bg-"))}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {text && (
        <div className="text-xs text-muted-foreground mt-1 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )

  // Skeleton loader component
  const SkeletonElement = (
    <div 
      className="w-full space-y-2 animate-pulse" 
      role="status"
      aria-label="Loading content"
    >
      {[100, 70, 50].map((width, index) => (
        <div
          key={index}
          className={cn("bg-muted/60 rounded-md h-4")}
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  )

  // Determine which loader to show based on variant
  const LoaderElement = () => {
    switch (variant) {
      case "dots": return DotsElement
      case "pulse": return PulseElement
      case "skeleton": return SkeletonElement
      case "spinner":
      default: return SpinnerElement
    }
  }

  // For fullscreen overlay
  if (fullScreen) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
            "flex flex-col items-center justify-center",
            className
          )}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 p-6"
          >
            <LoaderElement />
            
            {text && (
              <motion.p 
                className="text-lg font-medium text-foreground mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {text}
              </motion.p>
            )}
            
            {subText && (
              <motion.p 
                className="text-sm text-muted-foreground text-center max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {subText}
              </motion.p>
            )}
            
            {ProgressElement}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // For inline loader
  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-2",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <LoaderElement />
      
      {text && variant !== "skeleton" && (
        <p className="text-sm font-medium text-foreground">{text}</p>
      )}
      
      {subText && variant !== "skeleton" && (
        <p className="text-xs text-muted-foreground">{subText}</p>
      )}
      
      {ProgressElement}
    </div>
  )
}

export default GlobalLoader
