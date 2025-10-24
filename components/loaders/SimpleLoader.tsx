"use client"

import React from "react"
import { Loader2, Brain, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleLoaderProps {
  message?: string
  variant?: "spinner" | "skeleton" | "dots"
  size?: "sm" | "md" | "lg"
  context?: "page" | "quiz" | "component"
  className?: string
  fullScreen?: boolean
}

export function SimpleLoader({
  message = "Loading...",
  variant = "spinner",
  size = "md",
  context = "component",
  className,
  fullScreen = false
}: SimpleLoaderProps) {
  
  // Size configurations
  const sizeConfig = {
    sm: { container: "h-8 w-8", icon: "h-6 w-6", text: "text-sm", padding: "p-4" },
    md: { container: "h-12 w-12", icon: "h-8 w-8", text: "text-base", padding: "p-6" },
    lg: { container: "h-16 w-16", icon: "h-12 w-12", text: "text-lg", padding: "p-8" },
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
  const config = sizeConfig[size]
  const IconComponent = styles.icon

  /* Spinner Component */
  const Spinner = () => (
    <div
      className={cn(
        "relative flex items-center justify-center border-4 rounded-lg animate-spin",
        styles.bg,
        styles.border,
        styles.shadow,
        config.container
      )}
    >
      <IconComponent className={cn(styles.accent, config.icon)} />
    </div>
  )

  /* Dots Component */
  const Dots = () => (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full border-2 animate-bounce",
            styles.bg,
            styles.border,
            size === "sm" && "h-2 w-2",
            size === "md" && "h-3 w-3",
            size === "lg" && "h-4 w-4"
          )}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )

  /* Skeleton Component */
  const Skeleton = () => (
    <div className="space-y-4 w-full max-w-md">
      {[1, 0.8, 0.6].map((width, i) => (
        <div
          key={i}
          className={cn(
            "h-4 border-4 rounded-lg animate-pulse",
            styles.bg,
            styles.border,
            styles.shadow
          )}
          style={{ width: `${width * 100}%` }}
        />
      ))}
    </div>
  )

  const getLoaderContent = () => {
    switch (variant) {
      case "spinner": return <Spinner />
      case "dots": return <Dots />
      case "skeleton": return <Skeleton />
      default: return <Spinner />
    }
  }

  const loaderContent = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        config.padding,
        "border-4 border-black dark:border-white bg-white dark:bg-gray-900 rounded-xl shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {getLoaderContent()}
      {message && (
        <p className={cn("font-bold text-center text-black dark:text-white", config.text)}>
          {message}
        </p>
      )}
    </div>
  )

  // Full screen mode
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <div className="w-full max-w-sm mx-4">
          {loaderContent}
        </div>
      </div>
    )
  }

  return loaderContent
}

/* Convenience Components */
export function PageLoader({ message = "Loading page..." }: { message?: string }) {
  return (
    <SimpleLoader
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
    <SimpleLoader
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
  variant = "spinner" as const,
  size = "md" as const,
  className 
}: { 
  message?: string
  variant?: "spinner" | "skeleton" | "dots"
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  return (
    <SimpleLoader
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
  size = "sm" as const 
}: { 
  message?: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="animate-spin">
        <Loader2 className={cn(
          "text-current",
          size === "sm" && "h-4 w-4",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-6 w-6"
        )} />
      </div>
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