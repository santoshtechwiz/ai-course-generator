"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { useGlobalLoading } from '@/store/slices/global-loading-slice'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Brain, Sparkles } from 'lucide-react'

// Export the props interface for backwards compatibility
export interface GlobalLoaderProps {
  fullScreen?: boolean
  text?: string
  subText?: string
  isLoading?: boolean
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "spinner" | "dots" | "pulse" | "skeleton"
  className?: string
  ariaLabel?: string
  progress?: number
  theme?: "primary" | "secondary" | "accent" | "neutral"
}

// Size mappings
const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12"
}

// Theme mappings
const themeClasses = {
  primary: {
    spinner: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-600 dark:bg-blue-400",
    pulse: "bg-blue-600/20 dark:bg-blue-400/20",
    gradient: "from-blue-500 to-cyan-500"
  },
  secondary: {
    spinner: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-600 dark:bg-gray-400",
    pulse: "bg-gray-600/20 dark:bg-gray-400/20",
    gradient: "from-gray-500 to-gray-600"
  },
  accent: {
    spinner: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-600 dark:bg-purple-400",
    pulse: "bg-purple-600/20 dark:bg-purple-400/20",
    gradient: "from-purple-500 to-pink-500"
  },
  neutral: {
    spinner: "text-gray-500 dark:text-gray-300",
    dot: "bg-gray-500 dark:bg-gray-300",
    pulse: "bg-gray-500/20 dark:bg-gray-300/20",
    gradient: "from-gray-400 to-gray-500"
  }
}

// Spinner Component
function CourseAISpinner({ size = "md", theme = "primary" }: { size?: string; theme?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <Loader2 className={cn(
        "animate-spin",
        sizeClasses[size as keyof typeof sizeClasses],
        themeClasses[theme as keyof typeof themeClasses].spinner
      )} />
    </motion.div>
  )
}

// Dots Loader Component
function DotsLoader({ size = "md", theme = "primary" }: { size?: string; theme?: string }) {
  const dotSizes = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
    xl: "h-4 w-4"
  }

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "rounded-full",
            dotSizes[size as keyof typeof dotSizes],
            themeClasses[theme as keyof typeof themeClasses].dot
          )}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  )
}

// Pulse Loader Component
function PulseLoader({ size = "md", theme = "primary" }: { size?: string; theme?: string }) {
  return (
    <motion.div
      className={cn(
        "rounded-full",
        sizeClasses[size as keyof typeof sizeClasses],
        themeClasses[theme as keyof typeof themeClasses].pulse
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

// Skeleton Loader Component
function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      {[100, 75, 50].map((width, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          style={{ width: `${width}%` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ progress, theme }: { progress: number; theme: string }) {
  const clampedProgress = Math.max(0, Math.min(100, progress))
  
  return (
    <div className="w-full max-w-xs space-y-2">
      <div className="relative h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            themeClasses[theme as keyof typeof themeClasses].gradient
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        {Math.round(clampedProgress)}% complete
      </p>
    </div>
  )
}

/**
 * Unified Global Loader Component
 * This is the single source of truth for all loading states in the app
 */
export function GlobalLoader() {
  const { currentLoader, isLoading } = useGlobalLoading()

  if (!isLoading || !currentLoader) {
    return null
  }

  const {
    message = "Loading...",
    subMessage,
    progress,
    variant = 'spinner',
    size = 'md',
    theme = 'primary',
    isBlocking = false
  } = currentLoader

  // Render loader variants
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader size={size} theme={theme} />
      case 'pulse':
        return <PulseLoader size={size} theme={theme} />
      case 'skeleton':
        return <SkeletonLoader />
      default:
        return <CourseAISpinner size={size} theme={theme} />
    }
  }

  // Inline loader (non-blocking)
  if (!isBlocking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-2">
          {renderLoader()}
          {message && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {message}
            </p>
          )}
          {subMessage && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subMessage}
            </p>
          )}
          {typeof progress === 'number' && (
            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fullscreen blocking loader
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {renderLoader()}
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {message}
          </h3>
          {subMessage && (
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
              {subMessage}
            </p>
          )}
        </div>

        {typeof progress === 'number' && (
          <div className="w-64 space-y-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GlobalLoader
