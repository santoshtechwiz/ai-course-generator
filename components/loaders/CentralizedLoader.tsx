"use client"

import React from "react"
import { motion } from "framer-motion"
import { Brain, Loader2, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type LoaderVariant = "spinner" | "dots" | "skeleton" | "pulse"
type LoaderSize = "sm" | "md" | "lg" | "xl"
type LoaderContext = "page" | "quiz" | "component"

interface CentralizedLoaderProps {
  context?: LoaderContext
  variant?: LoaderVariant
  size?: LoaderSize
  message?: string
  className?: string
  fullScreen?: boolean
}

/* ===========================
   🎯 Centralized Loader (Neobrutalism Style)
   Single loader to rule them all!
   =========================== */
export function CentralizedLoader({
  context = "component",
  variant = "spinner",
  size = "lg",
  message,
  className,
  fullScreen = false,
}: CentralizedLoaderProps) {
  const sizeMap = {
    sm: { container: "h-6 w-6", icon: "h-4 w-4", text: "text-sm", padding: "p-4" },
    md: { container: "h-8 w-8", icon: "h-6 w-6", text: "text-base", padding: "p-6" },
    lg: { container: "h-12 w-12", icon: "h-8 w-8", text: "text-lg", padding: "p-8" },
    xl: { container: "h-16 w-16", icon: "h-12 w-12", text: "text-xl", padding: "p-10" },
  }

  // Context-based styling (Neobrutalism colors)
  const getContextStyles = () => {
    switch (context) {
      case "page":
        return {
          bg: "bg-yellow-200 dark:bg-yellow-900/30",
          border: "border-yellow-600 dark:border-yellow-400",
          shadow: "shadow-[6px_6px_0_0_rgb(202,138,4)] dark:shadow-[6px_6px_0_0_rgb(250,204,21)]",
          accent: "text-yellow-800 dark:text-yellow-200",
          icon: Zap
        }
      case "quiz":
        return {
          bg: "bg-blue-200 dark:bg-blue-900/30",
          border: "border-blue-600 dark:border-blue-400",
          shadow: "shadow-[6px_6px_0_0_rgb(37,99,235)] dark:shadow-[6px_6px_0_0_rgb(59,130,246)]",
          accent: "text-blue-800 dark:text-blue-200",
          icon: Brain
        }
      default: // component
        return {
          bg: "bg-green-200 dark:bg-green-900/30",
          border: "border-green-600 dark:border-green-400",
          shadow: "shadow-[6px_6px_0_0_rgb(34,197,94)] dark:shadow-[6px_6px_0_0_rgb(74,222,128)]",
          accent: "text-green-800 dark:text-green-200",
          icon: Sparkles
        }
    }
  }

  const styles = getContextStyles()
  const sizeConfig = sizeMap[size]
  const IconComponent = styles.icon

  /* 🎨 Neobrutalism Spinner */
  const Spinner = () => (
    <motion.div
      className={cn(
        "relative flex items-center justify-center border-4 rounded-lg",
        styles.bg,
        styles.border,
        styles.shadow,
        sizeConfig.container
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="flex items-center justify-center"
      >
        <IconComponent className={cn(styles.accent, sizeConfig.icon)} />
      </motion.div>
    </motion.div>
  )

  /* 🎨 Neobrutalism Dots */
  const Dots = () => (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className={cn(
            "rounded-full border-2",
            styles.bg,
            styles.border,
            size === "sm" && "h-2 w-2",
            size === "md" && "h-3 w-3",
            size === "lg" && "h-4 w-4",
            size === "xl" && "h-5 w-5"
          )}
        />
      ))}
    </div>
  )

  /* 🎨 Neobrutalism Skeleton */
  const Skeleton = () => (
    <div className="space-y-4 w-full max-w-md">
      {[1, 0.8, 0.6].map((width, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className={cn(
            "h-4 border-4 rounded-lg",
            styles.bg,
            styles.border,
            styles.shadow
          )}
          style={{ width: `${width * 100}%` }}
        />
      ))}
    </div>
  )

  /* 🎨 Neobrutalism Pulse */
  const Pulse = () => (
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "rounded-full border-4 flex items-center justify-center",
        styles.bg,
        styles.border,
        styles.shadow,
        sizeConfig.container
      )}
    >
      <div className={cn("rounded-full", styles.border.replace("border-", "bg-"), sizeConfig.icon)} />
    </motion.div>
  )

  const getLoaderContent = () => {
    switch (variant) {
      case "spinner": return <Spinner />
      case "dots": return <Dots />
      case "skeleton": return <Skeleton />
      case "pulse": return <Pulse />
      default: return <Spinner />
    }
  }

  const loaderContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        sizeConfig.padding,
        "border-4 border-black dark:border-white bg-white dark:bg-gray-900 rounded-xl shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {getLoaderContent()}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("font-bold text-center text-black dark:text-white", sizeConfig.text)}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )

  // Full screen mode
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-sm mx-4"
        >
          {loaderContent}
        </motion.div>
      </div>
    )
  }

  return loaderContent
}

/* ===========================
   🎯 Convenience Components
   =========================== */
export function PageLoader({ message = "Loading page..." }: { message?: string }) {
  return (
    <CentralizedLoader
      context="page"
      variant="skeleton"
      size="lg"
      message={message}
      fullScreen
    />
  )
}

export function QuizLoader({ message = "Loading quiz..." }: { message?: string }) {
  return (
    <CentralizedLoader
      context="quiz"
      variant="spinner"
      size="lg"
      message={message}
      fullScreen
    />
  )
}

export function ComponentLoader({ 
  message = "Loading...", 
  variant = "spinner" as LoaderVariant,
  size = "md" as LoaderSize,
  className 
}: { 
  message?: string
  variant?: LoaderVariant
  size?: LoaderSize
  className?: string
}) {
  return (
    <CentralizedLoader
      context="component"
      variant={variant}
      size={size}
      message={message}
      className={className}
    />
  )
}

export function InlineLoader({ 
  message, 
  size = "sm" as LoaderSize 
}: { 
  message?: string
  size?: LoaderSize
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={cn(
          "text-current",
          size === "sm" && "h-4 w-4",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-6 w-6"
        )} />
      </motion.div>
      {message && (
        <span className={cn(
          "font-medium text-current",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-lg"
        )}>
          {message}
        </span>
      )}
    </div>
  )
}