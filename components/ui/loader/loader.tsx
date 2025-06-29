"use client"

import { cn } from "@/lib/utils"
import { Loader2, Brain, CheckCircle2, Clock, BookOpen, Zap, Target, Trophy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
export type LoaderVariant = "inline" | "fullscreen" | "card" | "overlay" | "skeleton" | "minimal"
export type LoaderContext =
  | "loading"
  | "quiz"
  | "result"
  | "submitting"
  | "processing"
  | "saving"
  | "course"
  | "generating"

export interface LoaderProps {
  size?: LoaderSize
  variant?: LoaderVariant
  context?: LoaderContext
  className?: string
  message?: string
  subMessage?: string
  showIcon?: boolean
  children?: ReactNode
  isLoading?: boolean
  progress?: number
  showProgress?: boolean
  animated?: boolean
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const contextConfig = {
  loading: {
    icon: Loader2,
    defaultMessage: "Loading...",
    defaultSubMessage: "Please wait while we prepare your content",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  quiz: {
    icon: Brain,
    defaultMessage: "Generating Quiz...",
    defaultSubMessage: "Creating personalized questions for you",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  result: {
    icon: Trophy,
    defaultMessage: "Processing Results...",
    defaultSubMessage: "Calculating your performance metrics",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  submitting: {
    icon: Clock,
    defaultMessage: "Submitting...",
    defaultSubMessage: "Processing your responses",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  processing: {
    icon: Zap,
    defaultMessage: "Processing...",
    defaultSubMessage: "Analyzing your data",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
  saving: {
    icon: CheckCircle2,
    defaultMessage: "Saving...",
    defaultSubMessage: "Securing your progress",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  course: {
    icon: BookOpen,
    defaultMessage: "Loading Course...",
    defaultSubMessage: "Preparing your learning experience",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
  },
  generating: {
    icon: Target,
    defaultMessage: "Generating Content...",
    defaultSubMessage: "AI is creating your personalized content",
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
}

export function Loader({
  size = "md",
  variant = "inline",
  context = "loading",
  className,
  message,
  subMessage,
  showIcon = true,
  children,
  isLoading = true,
  progress,
  showProgress = false,
  animated = true,
}: LoaderProps) {
  if (!isLoading) return null

  const config = contextConfig[context]
  const Icon = config.icon
  const displayMessage = message || config.defaultMessage
  const displaySubMessage = subMessage || config.defaultSubMessage

  const spinnerClasses = cn("animate-spin", config.color, sizeClasses[size])

  const renderSpinner = () => (
    <motion.div
      initial={animated ? { scale: 0, opacity: 0 } : {}}
      animate={animated ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Loader2 className={spinnerClasses} />
    </motion.div>
  )

  const renderIcon = () =>
    showIcon && (
      <motion.div
        initial={animated ? { scale: 0, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-3"
      >
        <Icon className={cn(config.color, sizeClasses[size === "xs" ? "sm" : size])} />
      </motion.div>
    )

  const renderProgress = () =>
    showProgress &&
    progress !== undefined && (
      <motion.div
        initial={animated ? { opacity: 0, y: 10 } : {}}
        animate={animated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="w-full max-w-xs mt-4"
      >
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", config.color.replace("text-", "bg-"))}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center font-medium">{Math.round(progress)}% Complete</p>
      </motion.div>
    )

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-x-2 flex">
          <div className="h-10 w-[100px] bg-muted rounded-lg"></div>
          <div className="h-10 w-[100px] bg-muted rounded-lg"></div>
          <div className="h-10 w-[100px] bg-muted rounded-lg"></div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="h-[74px] w-[120px] bg-muted rounded-lg"></div>
          <div className="h-[74px] w-[120px] bg-muted rounded-lg"></div>
          <div className="h-[74px] w-[120px] bg-muted rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded-lg"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] w-full bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="h-[500px] w-full bg-muted rounded-lg"></div>
      </div>
    </div>
  )

  const renderContent = () => (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      {renderIcon()}
      {renderSpinner()}

      {displayMessage && (
        <motion.div
          initial={animated ? { opacity: 0 } : {}}
          animate={animated ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-2 mt-4"
        >
          <h3 className={cn("font-semibold text-foreground", variant === "fullscreen" ? "text-xl" : "text-base")}>
            {displayMessage}
          </h3>
          {displaySubMessage && (
            <p className={cn("text-muted-foreground", variant === "fullscreen" ? "text-base" : "text-sm")}>
              {displaySubMessage}
            </p>
          )}
        </motion.div>
      )}

      {renderProgress()}
      {children}
    </motion.div>
  )

  switch (variant) {
    case "skeleton":
      return <div className={cn("w-full", className)}>{renderSkeleton()}</div>

    case "fullscreen":
      return (
        <AnimatePresence>
          <motion.div
            initial={animated ? { opacity: 0 } : {}}
            animate={animated ? { opacity: 1 } : {}}
            exit={animated ? { opacity: 0 } : {}}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm",
              "flex flex-col items-center justify-center",
              className,
            )}
          >
            <div
              className={cn(
                "flex flex-col items-center gap-6 p-8 rounded-2xl max-w-md mx-4",
                "bg-card border shadow-2xl",
                config.bgColor,
              )}
            >
              {renderContent()}
            </div>
          </motion.div>
        </AnimatePresence>
      )

    case "overlay":
      return (
        <motion.div
          initial={animated ? { opacity: 0 } : {}}
          animate={animated ? { opacity: 1 } : {}}
          transition={{ duration: 0.3 }}
          className={cn(
            "absolute inset-0 z-10 bg-background/90 backdrop-blur-sm",
            "flex flex-col items-center justify-center",
            className,
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center gap-4 p-6 rounded-xl",
              "bg-card border shadow-lg",
              config.bgColor,
            )}
          >
            {renderContent()}
          </div>
        </motion.div>
      )

    case "card":
      return (
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.95 } : {}}
          animate={animated ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex flex-col items-center justify-center gap-6 p-8",
            "min-h-[200px] rounded-xl border bg-card shadow-sm",
            config.bgColor,
            className,
          )}
        >
          {renderContent()}
        </motion.div>
      )

    case "minimal":
      return (
        <div className={cn("flex items-center gap-3", className)}>
          <Loader2 className={cn("animate-spin", config.color, sizeClasses[size])} />
          {displayMessage && <span className="text-sm font-medium text-foreground">{displayMessage}</span>}
        </div>
      )

    case "inline":
    default:
      return <div className={cn("flex flex-col items-center gap-4 text-center", className)}>{renderContent()}</div>
  }
}

// Convenience components for common use cases
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
    <Loader
      variant="fullscreen"
      size="lg"
      message={message}
      subMessage={subMessage}
      context={context}
      showIcon={true}
      progress={progress}
      showProgress={showProgress}
    />
  )
}

export function InlineLoader({
  size = "md",
  message,
  className,
  context = "loading",
}: {
  size?: LoaderSize
  message?: string
  className?: string
  context?: LoaderContext
}) {
  return <Loader variant="inline" size={size} message={message} className={className} context={context} />
}

export function MinimalLoader({
  size = "sm",
  message = "Loading...",
  context = "loading",
}: {
  size?: LoaderSize
  message?: string
  context?: LoaderContext
}) {
  return <Loader variant="minimal" size={size} message={message} context={context} />
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
    <Loader
      variant="card"
      size="lg"
      message={message}
      subMessage={subMessage}
      context={context}
      className={className}
      progress={progress}
      showProgress={showProgress}
    />
  )
}

export function SkeletonLoader({ className }: { className?: string }) {
  return <Loader variant="skeleton" className={className} />
}

export default Loader
