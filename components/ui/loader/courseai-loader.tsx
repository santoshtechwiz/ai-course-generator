"use client"

import { cn } from "@/lib/utils"
import { Loader2, Brain, CheckCircle2, Clock, BookOpen, Zap, Target, Trophy, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"
import { memo, useEffect, useState } from "react"

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
export type LoaderVariant = "inline" | "fullscreen" | "card" | "overlay" | "skeleton" | "minimal" | "pulse" | "dots"
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
  showSparkles?: boolean
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
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  quiz: {
    icon: Brain,
    defaultMessage: "Loading Quiz...",
    defaultSubMessage: "Preparing your personalized questions",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
    accentColor: "text-purple-600 dark:text-purple-400",
  },
  result: {
    icon: Trophy,
    defaultMessage: "Processing Results...",
    defaultSubMessage: "Calculating your performance metrics",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
    accentColor: "text-emerald-600 dark:text-emerald-400",
  },
  submitting: {
    icon: Clock,
    defaultMessage: "Submitting...",
    defaultSubMessage: "Processing your responses",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
    accentColor: "text-orange-600 dark:text-orange-400",
  },
  processing: {
    icon: Zap,
    defaultMessage: "Processing...",
    defaultSubMessage: "Analyzing your data",
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20",
    accentColor: "text-indigo-600 dark:text-indigo-400",
  },
  saving: {
    icon: CheckCircle2,
    defaultMessage: "Saving...",
    defaultSubMessage: "Securing your progress",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    accentColor: "text-green-600 dark:text-green-400",
  },
  course: {
    icon: BookOpen,
    defaultMessage: "Loading Course...",
    defaultSubMessage: "Preparing your learning experience",
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20",
    accentColor: "text-cyan-600 dark:text-cyan-400",
  },
  generating: {
    icon: Target,
    defaultMessage: "Generating Content...",
    defaultSubMessage: "AI is creating your personalized content",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20",
    accentColor: "text-pink-600 dark:text-pink-400",
  },
}

const DotsLoader = memo(function DotsLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-current rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.6,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
})

const PulseLoader = memo(function PulseLoader({
  size = "md",
  className,
  gradient,
}: {
  size?: LoaderSize
  className?: string
  gradient?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn("rounded-full bg-gradient-to-r opacity-20", gradient, sizeClasses[size])}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={cn("absolute inset-0 rounded-full bg-gradient-to-r", gradient, sizeClasses[size])}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 0.4, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  )
})

const SparkleEffect = memo(function SparkleEffect() {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles((prev) => [
        ...prev.slice(-4),
        {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        },
      ])
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <Sparkles className="h-3 w-3 text-yellow-400" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})

const ModernLoader = memo(function ModernLoader({
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
  showSparkles = false,
}: LoaderProps) {
  if (!isLoading) return null

  const config = contextConfig[context]
  const Icon = config.icon
  const displayMessage = message || config.defaultMessage
  const displaySubMessage = subMessage || config.defaultSubMessage

  const renderSpinner = () => (
    <motion.div
      initial={animated ? { scale: 0, opacity: 0 } : {}}
      animate={animated ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <Loader2 className={cn("animate-spin", config.accentColor, sizeClasses[size])} />
      </motion.div>
    </motion.div>
  )

  const renderIcon = () =>
    showIcon && (
      <motion.div
        initial={animated ? { scale: 0, opacity: 0, y: 20 } : {}}
        animate={animated ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className="mb-4 relative"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <div className={cn("p-3 rounded-full bg-gradient-to-r shadow-lg", config.gradient, "text-white")}>
            <Icon className={cn(sizeClasses[size === "xs" ? "sm" : size])} />
          </div>
        </motion.div>
      </motion.div>
    )

  const renderProgress = () =>
    showProgress &&
    progress !== undefined && (
      <motion.div
        initial={animated ? { opacity: 0, y: 10 } : {}}
        animate={animated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-sm mt-6"
      >
        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", config.gradient)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <p className="text-sm font-medium text-muted-foreground">{Math.round(progress)}% Complete</p>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="text-xs font-semibold text-foreground"
          >
            {progress < 100 ? "Processing..." : "Almost done!"}
          </motion.div>
        </div>
      </motion.div>
    )

  const renderContent = () => (
    <motion.div
      initial={animated ? { opacity: 0, y: 30 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center text-center relative"
    >
      {showSparkles && <SparkleEffect />}
      {renderIcon()}
      {variant !== "dots" && variant !== "pulse" && renderSpinner()}
      {variant === "dots" && <DotsLoader className={config.accentColor} />}
      {variant === "pulse" && <PulseLoader size={size} gradient={config.gradient} />}

      {displayMessage && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={animated ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-3 mt-6"
        >
          <motion.h3
            className={cn(
              "font-semibold bg-gradient-to-r bg-clip-text text-transparent",
              config.gradient,
              variant === "fullscreen" ? "text-2xl" : "text-lg",
            )}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            {displayMessage}
          </motion.h3>
          {displaySubMessage && (
            <motion.p
              className={cn(
                "text-muted-foreground leading-relaxed",
                variant === "fullscreen" ? "text-base max-w-md" : "text-sm max-w-xs",
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {displaySubMessage}
            </motion.p>
          )}
        </motion.div>
      )}

      {renderProgress()}
      {children}
    </motion.div>
  )

  const renderSkeleton = () => (
    <div className="space-y-3">
      <motion.div
        className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse w-3/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
      />
      <motion.div
        className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse w-1/2"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
      />
    </div>
  )

  switch (variant) {
    case "skeleton":
      return <div className={cn("w-full p-4", className)}>{renderSkeleton()}</div>

    case "fullscreen":
      return (
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={animated ? { opacity: 0 } : {}}
              animate={animated ? { opacity: 1 } : {}}
              exit={animated ? { opacity: 0 } : {}}
              transition={{ duration: 0.4 }}
              className={cn(
                "fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md",
                "flex flex-col items-center justify-center",
                className,
              )}
            >
              <motion.div
                initial={animated ? { scale: 0.9, opacity: 0 } : {}}
                animate={animated ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn(
                  "flex flex-col items-center gap-8 p-12 rounded-3xl max-w-lg mx-4",
                  "bg-card/95 backdrop-blur-sm border shadow-2xl",
                  "bg-gradient-to-br",
                  config.bgGradient,
                )}
              >
                {renderContent()}
              </motion.div>
            </motion.div>
          )}
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
          <motion.div
            initial={animated ? { scale: 0.95, opacity: 0 } : {}}
            animate={animated ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.4 }}
            className={cn(
              "flex flex-col items-center gap-6 p-8 rounded-2xl",
              "bg-card/95 backdrop-blur-sm border shadow-xl",
              "bg-gradient-to-br",
              config.bgGradient,
            )}
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )

    case "card":
      return (
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.95, y: 20 } : {}}
          animate={animated ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className={cn(
            "flex flex-col items-center justify-center gap-8 p-10",
            "min-h-[280px] rounded-2xl border bg-gradient-to-br shadow-lg",
            config.bgGradient,
            className,
          )}
        >
          {renderContent()}
        </motion.div>
      )

    case "minimal":
      return (
        <motion.div
          className={cn("flex items-center gap-3", className)}
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Loader2 className={cn("animate-spin", config.accentColor, sizeClasses[size])} />
          </motion.div>
          {displayMessage && <span className="text-sm font-medium text-foreground">{displayMessage}</span>}
        </motion.div>
      )

    case "inline":
    default:
      return <div className={cn("flex flex-col items-center gap-6 text-center", className)}>{renderContent()}</div>
  }
})

export const CourseAILoader = ModernLoader

// Enhanced convenience components
export function FullPageLoader({
  message = "Loading content...",
  subMessage = "Please wait while we prepare your experience",
  context = "loading",
  progress,
  showProgress = false,
  showSparkles = false,
}: {
  message?: string
  subMessage?: string
  context?: LoaderContext
  progress?: number
  showProgress?: boolean
  showSparkles?: boolean
}) {
  return (
    <CourseAILoader
      variant="fullscreen"
      size="lg"
      message={message}
      subMessage={subMessage}
      context={context}
      showIcon={true}
      progress={progress}
      showProgress={showProgress}
      showSparkles={showSparkles}
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
  return <CourseAILoader variant={variant} size={size} message={message} className={className} context={context} />
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
  return <CourseAILoader variant="minimal" size={size} message={message} context={context} />
}

export function CardLoader({
  message = "Loading...",
  subMessage,
  context = "loading",
  className,
  progress,
  showProgress = false,
  showSparkles = false,
}: {
  message?: string
  subMessage?: string
  context?: LoaderContext
  className?: string
  progress?: number
  showProgress?: boolean
  showSparkles?: boolean
}) {
  return (
    <CourseAILoader
      variant="card"
      size="lg"
      message={message}
      subMessage={subMessage}
      context={context}
      className={className}
      progress={progress}
      showProgress={showProgress}
      showSparkles={showSparkles}
    />
  )
}

export function SkeletonLoader({ className }: { className?: string }) {
  return <CourseAILoader variant="skeleton" className={className} />
}

export default ModernLoader
