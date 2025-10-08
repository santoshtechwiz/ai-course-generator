"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Brain, Loader } from "lucide-react"
import { cn } from "@/lib/utils"

export type LoaderVariant = "spinner" | "dots" | "progress" | "skeleton" | "pulse"
export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
export type LoaderState = "loading" | "success" | "error" | "idle"

interface UnifiedLoaderProps {
  state?: LoaderState
  variant?: LoaderVariant
  size?: LoaderSize
  message?: string
  progress?: number
  className?: string
  inline?: boolean
  showStates?: boolean
  autoHide?: boolean
  autoHideDelay?: number
  successIcon?: React.ReactNode
  errorIcon?: React.ReactNode
  spinnerIcon?: React.ReactNode
  fullWidth?: boolean
  minHeight?: string
}

/**
 * Enhanced UnifiedLoader - Redesigned to prevent layout shifts and improve visibility
 * - Consistent sizing and spacing
 * - Better full-page coverage options
 * - Reduced motion support
 * - Accessibility improvements
 */
export function UnifiedLoader({
  state = "loading",
  variant = "spinner",
  size = "md",
  message,
  progress,
  className,
  inline = false,
  showStates = true,
  autoHide = false,
  autoHideDelay = 1500,
  successIcon,
  errorIcon,
  spinnerIcon,
  fullWidth = false,
  minHeight = "auto",
}: UnifiedLoaderProps) {
  const [visible, setVisible] = useState(true)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  // Detect reduced motion preference safely
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setIsReducedMotion(mediaQuery.matches)
      
      const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [])

  useEffect(() => {
    if (autoHide && (state === "success" || state === "error")) {
      const t = setTimeout(() => setVisible(false), autoHideDelay)
      return () => clearTimeout(t)
    }

    if (state === "loading") setVisible(true)
  }, [autoHide, autoHideDelay, state])

  // Consistent size mapping with predictable dimensions
  const sizeMap: Record<LoaderSize, { container: string; icon: string; text: string }> = {
    xs: { container: "h-4 w-4", icon: "h-3 w-3", text: "text-xs" },
    sm: { container: "h-5 w-5", icon: "h-4 w-4", text: "text-sm" },
    md: { container: "h-7 w-7", icon: "h-5 w-5", text: "text-sm" },
    lg: { container: "h-10 w-10", icon: "h-6 w-6", text: "text-base" },
    xl: { container: "h-14 w-14", icon: "h-8 w-8", text: "text-lg" },
  }

  const containerBase = inline 
    ? "inline-flex items-center gap-3 min-h-[1.5em]" 
    : "flex flex-col items-center justify-center gap-4 p-6"

  // Main loader renderers with consistent dimensions
  const Spinner = () => (
    <motion.div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center",
        sizeMap[size].container
      )}
    >
      {spinnerIcon || (
        <motion.div
          animate={isReducedMotion ? {} : { rotate: 360 }}
          transition={isReducedMotion ? {} : { duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Loader className={cn("h-full w-full text-primary/60", isReducedMotion && "animate-pulse")} />
        </motion.div>
      )}
    </motion.div>
  )

  const Dots = () => (
    <div className={cn("flex items-center justify-center gap-1", sizeMap[size].container)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          role="presentation"
          initial={isReducedMotion ? {} : { scale: 0.8, opacity: 0.6 }}
          animate={isReducedMotion ? {} : { 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            delay: i * 0.2,
            ease: "easeInOut"
          }}
          className={cn(
            "block rounded-full bg-current",
            size === "xs" && "h-1 w-1",
            size === "sm" && "h-1.5 w-1.5",
            size === "md" && "h-2 w-2",
            size === "lg" && "h-2.5 w-2.5",
            size === "xl" && "h-3 w-3"
          )}
        />
      ))}
    </div>
  )

  const Progress = () => (
    <div className={cn("space-y-3", fullWidth ? "w-full" : "w-48")}>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      {progress !== undefined && (
        <div className="flex justify-between items-center">
          <span className={cn("text-muted-foreground", sizeMap[size].text)}>
            {message || "Loading..."}
          </span>
          <span className={cn("text-muted-foreground font-medium", sizeMap[size].text)}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )

  const Skeleton = () => (
    <div className={cn("space-y-3", fullWidth ? "w-full" : "w-64")}>
      <div className="h-4 bg-muted rounded-full animate-pulse" />
      <div className="h-4 bg-muted rounded-full animate-pulse w-3/4" />
      <div className="h-3 bg-muted rounded-full animate-pulse w-1/2" />
    </div>
  )

  const Pulse = () => (
    <motion.div
      animate={isReducedMotion ? {} : { 
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn(
        "rounded-full bg-primary/20 flex items-center justify-center",
        sizeMap[size].container
      )}
    >
      <div className={cn(
        "rounded-full bg-primary/40",
        sizeMap[size].icon
      )} />
    </motion.div>
  )

  const stateIcon = () => {
    if (!showStates || state === "loading" || state === "idle" || !visible) return null

    const iconClass = cn(
      sizeMap[size].container,
      state === "success" ? "text-green-500" : "text-red-500"
    )

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={iconClass}
      >
        {state === "success" 
          ? (successIcon || <CheckCircle className="w-full h-full" />)
          : (errorIcon || <AlertCircle className="w-full h-full" />)
        }
      </motion.div>
    )
  }

  if (!visible && autoHide) return null

  const getLoaderContent = () => {
    if (state === "loading") {
      switch (variant) {
        case "spinner": return <Spinner />
        case "dots": return <Dots />
        case "progress": return <Progress />
        case "skeleton": return <Skeleton />
        case "pulse": return <Pulse />
        default: return <Spinner />
      }
    }
    return stateIcon()
  }

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        aria-busy={state === "loading"}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          containerBase,
          fullWidth && "w-full",
          "transition-all duration-200",
          className
        )}
        style={{ minHeight: inline ? undefined : minHeight }}
      >
        <div className={cn(
          "flex items-center justify-center",
          variant === "progress" && "w-full",
          variant === "skeleton" && "w-full"
        )}>
          {getLoaderContent()}
        </div>

        {message && variant !== "progress" && (
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-muted-foreground text-center leading-relaxed",
              sizeMap[size].text,
              fullWidth && "w-full"
            )}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Enhanced PageLoader with proper full-page coverage
 */
export function PageLoader({
  message = "Loading...",
  variant = "spinner",
  size = "lg",
  className,
  blocking = true,
  showBackdrop = true,
  ...props
}: Omit<UnifiedLoaderProps, "inline"> & { 
  className?: string
  blocking?: boolean
  showBackdrop?: boolean
}) {
  useEffect(() => {
    if (blocking) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }
  }, [blocking])

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      showBackdrop && "bg-background/80 backdrop-blur-sm"
    )}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-sm mx-4"
      >
        <div className={cn(
          "rounded-xl border bg-card/95 backdrop-blur-md p-6 shadow-lg",
          className
        )}>
          <UnifiedLoader 
            message={message} 
            variant={variant} 
            size={size} 
            fullWidth
            minHeight="120px"
            {...props} 
          />
        </div>
      </motion.div>
    </div>
  )
}

/**
 * InlineLoader with predictable dimensions
 */
export function InlineLoader({ 
  message, 
  variant = "spinner", 
  size = "sm", 
  className, 
  ...props 
}: Omit<UnifiedLoaderProps, "inline">) {
  return (
    <UnifiedLoader 
      message={message} 
      variant={variant} 
      size={size} 
      inline 
      className={className} 
      {...props} 
    />
  )
}

/**
 * ButtonLoader with better layout stability
 */
export function ButtonLoader({ 
  loading = false, 
  children, 
  className,
  size = "sm",
  ...props 
}: { 
  loading?: boolean
  children: React.ReactNode
  className?: string
  size?: LoaderSize
} & Omit<UnifiedLoaderProps, "state" | "inline">) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-md"
          >
            <UnifiedLoader 
              state="loading" 
              variant="spinner" 
              size={size}
              inline 
              showStates={false} 
              {...props} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={loading ? "invisible" : "visible"}>
        {children}
      </div>
    </div>
  )
}

/**
 * Enhanced SkeletonLoader with better spacing
 */
export function SkeletonLoader({ 
  lines = 3, 
  className,
  spacing = "md"
}: { 
  lines?: number
  className?: string
  spacing?: "sm" | "md" | "lg"
}) {
  const spacingMap = {
    sm: "space-y-2",
    md: "space-y-3",
    lg: "space-y-4"
  }

  return (
    <div className={cn(spacingMap[spacing], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            "h-4 bg-muted rounded-full animate-pulse",
            i === lines - 1 && lines > 1 && "w-3/4",
            i === lines - 2 && lines > 2 && "w-5/6"
          )} 
        />
      ))}
    </div>
  )
}

export default UnifiedLoader