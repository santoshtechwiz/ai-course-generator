"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LoaderVariant = 'spinner' | 'pulse' | 'dots' | 'progress' | 'skeleton'
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LoaderState = 'loading' | 'success' | 'error' | 'idle'

interface UnifiedLoaderProps {
  /** Current loading state */
  state?: LoaderState
  /** Loader variant */
  variant?: LoaderVariant
  /** Size of the loader */
  size?: LoaderSize
  /** Custom message */
  message?: string
  /** Show progress bar (only for progress variant) */
  progress?: number
  /** Custom className */
  className?: string
  /** Whether to show the loader inline */
  inline?: boolean
  /** Whether to show success/error states */
  showStates?: boolean
  /** Auto-hide after success/error */
  autoHide?: boolean
  /** Auto-hide delay in ms */
  autoHideDelay?: number
  /** Custom icon for success state */
  successIcon?: React.ReactNode
  /** Custom icon for error state */
  errorIcon?: React.ReactNode
  /** Custom spinner icon */
  spinnerIcon?: React.ReactNode
}

/**
 * Unified Loader Component
 *
 * A comprehensive loader component that handles multiple loading states,
 * variants, and scenarios with consistent styling and animations.
 */
export function UnifiedLoader({
  state = 'loading',
  variant = 'spinner',
  size = 'md',
  message,
  progress,
  className,
  inline = false,
  showStates = true,
  autoHide = false,
  autoHideDelay = 2000,
  successIcon,
  errorIcon,
  spinnerIcon,
}: UnifiedLoaderProps) {
  const [visible, setVisible] = useState(true)

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && (state === 'success' || state === 'error')) {
      const timer = setTimeout(() => setVisible(false), autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, state])

  // Reset visibility when state changes to loading
  useEffect(() => {
    if (state === 'loading') {
      setVisible(true)
    }
  }, [state])

  if (!visible && autoHide) return null

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  const containerClasses = inline
    ? 'inline-flex items-center gap-2'
    : 'flex flex-col items-center justify-center gap-3 p-6'

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={cn(sizeClasses[size], 'text-primary')}
          >
            {spinnerIcon || <Loader2 className="w-full h-full" />}
          </motion.div>
        )

      case 'pulse':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className={cn(sizeClasses[size], 'bg-primary rounded-full')}
          />
        )

      case 'dots':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
                className={cn(sizeClasses.xs, 'bg-primary rounded-full')}
              />
            ))}
          </div>
        )

      case 'progress':
        return (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress || 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {progress !== undefined && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round(progress)}%
              </p>
            )}
          </div>
        )

      case 'skeleton':
        return (
          <div className="space-y-3 w-full max-w-sm">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        )

      default:
        return null
    }
  }

  const renderStateIcon = () => {
    if (!showStates || state === 'loading' || state === 'idle') return null

    const iconClass = cn(sizeClasses[size])

    if (state === 'success') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(iconClass, 'text-green-600')}
        >
          {successIcon || <CheckCircle className="w-full h-full" />}
        </motion.div>
      )
    }

    if (state === 'error') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(iconClass, 'text-red-600')}
        >
          {errorIcon || <AlertCircle className="w-full h-full" />}
        </motion.div>
      )
    }

    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(containerClasses, className)}
      >
        {state === 'loading' ? renderLoader() : renderStateIcon()}

        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground text-center"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Page Loader Component
 *
 * Full-page loader with backdrop
 */
export function PageLoader({
  message = "Loading...",
  variant = 'spinner',
  size = 'lg',
  className,
  ...props
}: Omit<UnifiedLoaderProps, 'inline'>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <UnifiedLoader
        message={message}
        variant={variant}
        size={size}
        className={className}
        {...props}
      />
    </div>
  )
}

/**
 * Inline Loader Component
 *
 * Compact loader for inline use
 */
export function InlineLoader({
  message,
  variant = 'spinner',
  size = 'sm',
  className,
  ...props
}: Omit<UnifiedLoaderProps, 'inline'>) {
  return (
    <UnifiedLoader
      message={message}
      variant={variant}
      size={size}
      inline={true}
      className={className}
      {...props}
    />
  )
}

/**
 * Button Loader Component
 *
 * Loader specifically for buttons
 */
export function ButtonLoader({
  loading = false,
  children,
  className,
  ...props
}: {
  loading?: boolean
  children: React.ReactNode
  className?: string
} & Omit<UnifiedLoaderProps, 'state' | 'inline'>) {
  return (
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 rounded"
          >
            <UnifiedLoader
              state="loading"
              variant="spinner"
              size="sm"
              inline={true}
              showStates={false}
              {...props}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}

/**
 * Skeleton Loader Component
 *
 * Predefined skeleton loader for common use cases
 */
export function SkeletonLoader({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 && lines > 1 && 'w-3/4',
            i === lines - 2 && lines > 2 && 'w-5/6'
          )}
        />
      ))}
    </div>
  )
}

export default UnifiedLoader
