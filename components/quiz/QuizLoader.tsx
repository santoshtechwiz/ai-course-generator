"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Brain, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type QuizLoaderVariant = "spinner" | "dots" | "progress" | "skeleton" | "pulse"
type QuizLoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
type QuizLoaderState = "loading" | "success" | "error" | "idle"
type QuizLoaderContext = "initial" | "submission" | "navigation" | "calculation" | "page"

interface QuizLoaderProps {
  state?: QuizLoaderState
  variant?: QuizLoaderVariant
  size?: QuizLoaderSize
  context?: QuizLoaderContext
  message?: string
  progress?: number
  className?: string
  inline?: boolean
  overlay?: boolean
  showStates?: boolean
  autoHide?: boolean
  autoHideDelay?: number
  fullPage?: boolean
  minHeight?: string
}

/* ===========================
   🎯 QuizLoader (Neobrutalism Edition)
   Unified loader for all quiz-related loading states
   =========================== */
export function QuizLoader({
  state = "loading",
  variant = "spinner",
  size = "md",
  context = "initial",
  message,
  progress,
  className,
  inline = false,
  overlay = false,
  showStates = true,
  autoHide = false,
  autoHideDelay = 1500,
  fullPage = false,
  minHeight = "auto",
}: QuizLoaderProps) {
  const [visible, setVisible] = useState(true)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

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

  const sizeMap: Record<QuizLoaderSize, { container: string; icon: string; text: string }> = {
    xs: { container: "h-4 w-4", icon: "h-3 w-3", text: "text-xs" },
    sm: { container: "h-5 w-5", icon: "h-4 w-4", text: "text-sm" },
    md: { container: "h-7 w-7", icon: "h-5 w-5", text: "text-base" },
    lg: { container: "h-10 w-10", icon: "h-6 w-6", text: "text-lg" },
    xl: { container: "h-14 w-14", icon: "h-8 w-8", text: "text-xl" },
  }

  // Context-specific styling
  const getContextStyles = () => {
    switch (context) {
      case "submission":
        return {
          bg: "bg-green-200 dark:bg-green-900/30",
          border: "border-green-600 dark:border-green-400",
          shadow: "shadow-[4px_4px_0_0_rgb(34,197,94)]",
          accent: "text-green-800 dark:text-green-200"
        }
      case "calculation":
        return {
          bg: "bg-purple-200 dark:bg-purple-900/30",
          border: "border-purple-600 dark:border-purple-400", 
          shadow: "shadow-[4px_4px_0_0_rgb(147,51,234)]",
          accent: "text-purple-800 dark:text-purple-200"
        }
      case "navigation":
        return {
          bg: "bg-blue-200 dark:bg-blue-900/30",
          border: "border-blue-600 dark:border-blue-400",
          shadow: "shadow-[4px_4px_0_0_rgb(59,130,246)]",
          accent: "text-blue-800 dark:text-blue-200"
        }
      case "page":
        return {
          bg: "bg-orange-200 dark:bg-orange-900/30",
          border: "border-orange-600 dark:border-orange-400",
          shadow: "shadow-[4px_4px_0_0_rgb(249,115,22)]",
          accent: "text-orange-800 dark:text-orange-200"
        }
      default: // initial
        return {
          bg: "bg-yellow-200 dark:bg-yellow-900/30",
          border: "border-yellow-600 dark:border-yellow-400",
          shadow: "shadow-[4px_4px_0_0_rgb(234,179,8)]",
          accent: "text-yellow-800 dark:text-yellow-200"
        }
    }
  }

  const contextStyles = getContextStyles()

  const containerBase = inline
    ? "inline-flex items-center gap-3 min-h-[1.5em]"
    : "flex flex-col items-center justify-center gap-4 p-6"

  /* 🎨 Neobrutalism Spinner */
  const Spinner = () => (
    <motion.div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center border-4 rounded-lg",
        contextStyles.bg,
        contextStyles.border,
        contextStyles.shadow,
        sizeMap[size].container
      )}
    >
      <motion.div
        animate={isReducedMotion ? {} : { rotate: 360 }}
        transition={isReducedMotion ? {} : { duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {context === "calculation" ? (
          <Brain className={cn("text-purple-800 dark:text-purple-200", sizeMap[size].icon)} />
        ) : context === "submission" ? (
          <Sparkles className={cn("text-green-800 dark:text-green-200", sizeMap[size].icon)} />
        ) : (
          <Loader2 className={cn("text-gray-800 dark:text-gray-200", sizeMap[size].icon)} />
        )}
      </motion.div>
    </motion.div>
  )

  /* 🎨 Neobrutalism Dots */
  const Dots = () => (
    <div className={cn("flex items-center justify-center gap-1", sizeMap[size].container)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={isReducedMotion ? {} : { scale: 0.8, opacity: 0.6 }}
          animate={isReducedMotion ? {} : { scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className={cn(
            "block rounded-full border-2",
            contextStyles.border.replace("border-", "bg-"),
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

  /* 🎨 Neobrutalism Progress */
  const Progress = () => (
    <div className="space-y-3 w-full max-w-xs">
      <div className={cn(
        "h-3 border-2 rounded-md overflow-hidden",
        "bg-white dark:bg-gray-800",
        contextStyles.border,
        contextStyles.shadow
      )}>
        <motion.div
          className={cn(
            "h-full border-r-2",
            contextStyles.bg,
            contextStyles.border
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      {progress !== undefined && (
        <div className="flex justify-between items-center">
          <span className={cn("font-bold", contextStyles.accent, sizeMap[size].text)}>
            {message || "Loading..."}
          </span>
          <span className={cn("font-bold", contextStyles.accent, sizeMap[size].text)}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )

  /* 🎨 Neobrutalism Skeleton */
  const Skeleton = () => (
    <div className="space-y-3 w-full max-w-sm">
      <div className={cn(
        "h-4 border-2 rounded-md animate-pulse",
        contextStyles.bg,
        contextStyles.border,
        contextStyles.shadow
      )} />
      <div className={cn(
        "h-4 border-2 rounded-md animate-pulse w-3/4",
        contextStyles.bg,
        contextStyles.border,
        contextStyles.shadow
      )} />
      <div className={cn(
        "h-3 border-2 rounded-md animate-pulse w-1/2",
        contextStyles.bg,
        contextStyles.border,
        contextStyles.shadow
      )} />
    </div>
  )

  /* 🎨 Neobrutalism Pulse */
  const Pulse = () => (
    <motion.div
      animate={isReducedMotion ? {} : { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "rounded-full border-2 flex items-center justify-center",
        contextStyles.bg,
        contextStyles.border,
        contextStyles.shadow,
        sizeMap[size].container
      )}
    >
      <div className={cn(
        "rounded-full",
        contextStyles.border.replace("border-", "bg-"),
        sizeMap[size].icon
      )} />
    </motion.div>
  )

  const stateIcon = () => {
    if (!showStates || state === "loading" || state === "idle" || !visible) return null
    const isSuccess = state === "success"
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "flex items-center justify-center border-4 rounded-lg",
          isSuccess ? "bg-green-400 border-green-600" : "bg-red-400 border-red-600",
          "shadow-[4px_4px_0_0_rgb(0,0,0)]",
          sizeMap[size].container
        )}
      >
        {isSuccess ? (
          <CheckCircle className="text-black w-full h-full" />
        ) : (
          <AlertCircle className="text-black w-full h-full" />
        )}
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

  const loaderContent = (
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
        "border-4 border-black bg-white dark:bg-gray-900 dark:border-gray-300 text-black dark:text-white rounded-xl shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] transition-all duration-200",
        className
      )}
      style={{ minHeight: inline ? undefined : minHeight }}
    >
      {getLoaderContent()}
      {message && variant !== "progress" && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn("font-bold text-center mt-2", contextStyles.accent, sizeMap[size].text)}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )

  // Full page overlay
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-[2px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-sm mx-4"
        >
          {loaderContent}
        </motion.div>
      </div>
    )
  }

  // Overlay mode
  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    )
  }

  // Regular mode
  return (
    <AnimatePresence>
      {loaderContent}
    </AnimatePresence>
  )
}

/* 🎯 Quiz-specific loader variants */
export function QuizPageLoader({ message = "Loading quiz...", ...props }: Omit<QuizLoaderProps, "fullPage" | "context">) {
  return <QuizLoader fullPage context="page" message={message} {...props} />
}

export function QuizSubmissionLoader({ message = "Submitting quiz...", ...props }: Omit<QuizLoaderProps, "overlay" | "context">) {
  return <QuizLoader overlay context="submission" message={message} {...props} />
}

export function QuizCalculationLoader({ message = "Calculating results...", ...props }: Omit<QuizLoaderProps, "context" | "variant">) {
  return <QuizLoader context="calculation" variant="spinner" message={message} {...props} />
}

export function QuizNavigationLoader({ message = "Loading...", ...props }: Omit<QuizLoaderProps, "context" | "inline">) {
  return <QuizLoader context="navigation" inline message={message} {...props} />
}

export function QuizInlineLoader({ message, ...props }: Omit<QuizLoaderProps, "inline" | "context">) {
  return <QuizLoader inline context="initial" message={message} {...props} />
}