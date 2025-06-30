"use client"

import { cn } from "@/lib/utils"
import { Loader2, Brain, CheckCircle2, Clock, BookOpen, Zap, Target, Trophy, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"
import { memo, useEffect, useState, useCallback } from "react"

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
  | "init"
  | "redirecting"

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
  duration?: number
  delay?: number
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
} as const

const contextConfig = {
  loading: {
    icon: Loader2,
    defaultMessage: "Loading...",
    defaultSubMessage: "Please wait while we prepare your content",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10",
    accentColor: "text-blue-600 dark:text-blue-400",
    ringColor: "ring-blue-500/20",
  },
  quiz: {
    icon: Brain,
    defaultMessage: "Loading Quiz...",
    defaultSubMessage: "Preparing your personalized questions",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10",
    accentColor: "text-purple-600 dark:text-purple-400",
    ringColor: "ring-purple-500/20",
  },
  result: {
    icon: Trophy,
    defaultMessage: "Processing Results...",
    defaultSubMessage: "Calculating your performance metrics",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    ringColor: "ring-emerald-500/20",
  },
  submitting: {
    icon: Clock,
    defaultMessage: "Submitting...",
    defaultSubMessage: "Processing your responses",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50/50 to-red-50/50 dark:from-orange-950/10 dark:to-red-950/10",
    accentColor: "text-orange-600 dark:text-orange-400",
    ringColor: "ring-orange-500/20",
  },
  processing: {
    icon: Zap,
    defaultMessage: "Processing...",
    defaultSubMessage: "Analyzing your data",
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10",
    accentColor: "text-indigo-600 dark:text-indigo-400",
    ringColor: "ring-indigo-500/20",
  },
  saving: {
    icon: CheckCircle2,
    defaultMessage: "Saving...",
    defaultSubMessage: "Securing your progress",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10",
    accentColor: "text-green-600 dark:text-green-400",
    ringColor: "ring-green-500/20",
  },
  course: {
    icon: BookOpen,
    defaultMessage: "Loading Course...",
    defaultSubMessage: "Preparing your learning experience",
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/10 dark:to-blue-950/10",
    accentColor: "text-cyan-600 dark:text-cyan-400",
    ringColor: "ring-cyan-500/20",
  },
  generating: {
    icon: Target,
    defaultMessage: "Generating Content...",
    defaultSubMessage: "AI is creating your personalized content",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-50/50 to-rose-50/50 dark:from-pink-950/10 dark:to-rose-950/10",
    accentColor: "text-pink-600 dark:text-pink-400",
    ringColor: "ring-pink-500/20",
  },
  init: {
    icon: Loader2,
    defaultMessage: "Initializing...",
    defaultSubMessage: "Setting up your experience",
    gradient: "from-gray-500 to-gray-600",
    bgGradient: "from-gray-50/50 to-gray-50/50 dark:from-gray-950/10 dark:to-gray-950/10",
    accentColor: "text-gray-600 dark:text-gray-400",
    ringColor: "ring-gray-500/20",
  },
  redirecting: {
    icon: Loader2,
    defaultMessage: "Redirecting...",
    defaultSubMessage: "Please wait while we redirect you",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10",
    accentColor: "text-blue-600 dark:text-blue-400",
    ringColor: "ring-blue-500/20",
  },
} as const

// Optimized animation variants
const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
}

// Optimized dots loader with reduced re-renders
const DotsLoader = memo(function DotsLoader({
  className,
  accentColor,
}: {
  className?: string
  accentColor: string
}) {
  return (
    <div className={cn("flex space-x-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("w-2 h-2 rounded-full", accentColor.replace("text-", "bg-"))}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
})

// Optimized pulse loader
const PulseLoader = memo(function PulseLoader({
  size = "md",
  className,
  gradient,
  accentColor,
}: {
  size?: LoaderSize
  className?: string
  gradient?: string
  accentColor: string
}) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer pulse ring */}
      <motion.div
        className={cn(
          "absolute rounded-full border-2 opacity-20",
          accentColor.replace("text-", "border-"),
          sizeClasses[size === "xs" ? "sm" : size === "xl" ? "lg" : size],
        )}
        style={{ width: "150%", height: "150%" }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Inner pulse */}
      <motion.div
        className={cn("rounded-full bg-gradient-to-r shadow-lg", gradient, sizeClasses[size])}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 0.6, 0.8],
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

// Optimized sparkle effect with cleanup
const SparkleEffect = memo(function SparkleEffect({
  showSparkles,
}: {
  showSparkles: boolean
}) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([])

  const generateSparkle = useCallback(
    () => ({
      id: Date.now() + Math.random(),
      x: Math.random() * 90 + 5, // Keep sparkles within bounds
      y: Math.random() * 90 + 5,
    }),
    [],
  )

  useEffect(() => {
    if (!showSparkles) {
      setSparkles([])
      return
    }

    const interval = setInterval(() => {
      setSparkles((prev) => {
        const newSparkles = [...prev.slice(-3), generateSparkle()] // Limit to 4 sparkles max
        return newSparkles
      })
    }, 1200)

    return () => {
      clearInterval(interval)
      setSparkles([])
    }
  }, [showSparkles, generateSparkle])

  if (!showSparkles) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-inherit">
      <AnimatePresence mode="popLayout">
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 2.5,
              ease: "easeOut",
              times: [0, 0.2, 1],
            }}
          >
            <Sparkles className="h-3 w-3 text-yellow-400 drop-shadow-sm" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})

// Optimized progress bar
const ProgressBar = memo(function ProgressBar({
  progress,
  gradient,
  animated = true,
}: {
  progress: number
  gradient: string
  animated?: boolean
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 10 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full max-w-sm mt-6"
    >
      <div className="relative h-2 w-full bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r shadow-sm", gradient)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            repeatDelay: 0.5,
          }}
        />
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-sm font-medium text-muted-foreground">{Math.round(clampedProgress)}% Complete</p>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="text-xs font-semibold text-foreground"
        >
          {clampedProgress < 100 ? "Processing..." : "Almost done!"}
        </motion.div>
      </div>
    </motion.div>
  )
})

// Main loader component with performance optimizations
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
  duration = 0.5,
  delay = 0,
}: LoaderProps) {
  const config = contextConfig[context]
  const Icon = config.icon
  const displayMessage = message || config.defaultMessage
  const displaySubMessage = subMessage || config.defaultSubMessage

  // Early return for performance
  if (!isLoading) return null

  // Memoized spinner component
  const SpinnerComponent = (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.9 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      exit={animated ? { opacity: 0, scale: 0.9 } : {}}
      transition={{ duration, delay, ease: "easeOut" }}
      className="relative"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        <Loader2 className={cn("animate-spin", config.accentColor, sizeClasses[size])} />
      </motion.div>
    </motion.div>
  )

  // Memoized icon component
  const IconComponent = showIcon ? (
    <motion.div
      initial={animated ? { opacity: 0, y: 20, scale: 0.8 } : {}}
      animate={animated ? { opacity: 1, y: 0, scale: 1 } : {}}
      exit={animated ? { opacity: 0, y: -20, scale: 0.8 } : {}}
      transition={{ duration: duration + 0.1, delay: delay + 0.1, ease: "easeOut" }}
      className="mb-4 relative"
    >
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <div
          className={cn(
            "p-3 rounded-full bg-gradient-to-r shadow-lg ring-4 backdrop-blur-sm",
            config.gradient,
            config.ringColor,
            "text-white",
          )}
        >
          <Icon className={cn(sizeClasses[size === "xs" ? "sm" : size])} />
        </div>
      </motion.div>
    </motion.div>
  ) : null

  // Memoized content component
  const ContentComponent = (
    <motion.div
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: 1 } : {}}
      exit={animated ? { opacity: 0 } : {}}
      transition={{ duration, ease: "easeOut" }}
      className="flex flex-col items-center text-center relative z-10"
    >
      <SparkleEffect showSparkles={showSparkles} />

      {IconComponent}

      {variant === "dots" && <DotsLoader className={config.accentColor} accentColor={config.accentColor} />}
      {variant === "pulse" && <PulseLoader size={size} gradient={config.gradient} accentColor={config.accentColor} />}
      {variant !== "dots" && variant !== "pulse" && SpinnerComponent}

      {displayMessage && (
        <motion.div
          initial={animated ? { opacity: 0, y: 20 } : {}}
          animate={animated ? { opacity: 1, y: 0 } : {}}
          exit={animated ? { opacity: 0, y: -20 } : {}}
          transition={{ duration: 0.4, delay: delay + 0.3 }}
          className="space-y-3 mt-6"
        >
          <motion.h3
            className={cn(
              "font-semibold bg-gradient-to-r bg-clip-text text-transparent leading-tight",
              config.gradient,
              variant === "fullscreen" ? "text-2xl" : "text-lg",
            )}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            {displayMessage}
          </motion.h3>

          {displaySubMessage && (
            <motion.p
              className={cn(
                "text-muted-foreground leading-relaxed",
                variant === "fullscreen" ? "text-base max-w-md" : "text-sm max-w-xs",
              )}
              initial={animated ? { opacity: 0 } : {}}
              animate={animated ? { opacity: 1 } : {}}
              transition={{ delay: delay + 0.5, duration: 0.4 }}
            >
              {displaySubMessage}
            </motion.p>
          )}
        </motion.div>
      )}

      {showProgress && progress !== undefined && (
        <ProgressBar progress={progress} gradient={config.gradient} animated={animated} />
      )}

      {children}
    </motion.div>
  )

  // Memoized skeleton component
  const SkeletonComponent = (
    <div className="space-y-3 animate-pulse">
      {[100, 75, 50].map((width, index) => (
        <motion.div
          key={index}
          className={`h-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg`}
          style={{ width: `${width}%` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1.8,
            repeat: Number.POSITIVE_INFINITY,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )

  // Render based on variant
  switch (variant) {
    case "skeleton":
      return <div className={cn("w-full p-4", className)}>{SkeletonComponent}</div>

    case "fullscreen":
      return (
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={animated ? { opacity: 0 } : {}}
              animate={animated ? { opacity: 1 } : {}}
              exit={animated ? { opacity: 0 } : {}}
              transition={{ duration: 0.3 }}
              className={cn(
                "fixed inset-0 z-[9999] bg-background/90 backdrop-blur-md",
                "flex flex-col items-center justify-center p-4",
                className,
              )}
            >
              <motion.div
                initial={animated ? { opacity: 0, scale: 0.9 } : {}}
                animate={animated ? { opacity: 1, scale: 1 } : {}}
                exit={animated ? { opacity: 0, scale: 0.9 } : {}}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={cn(
                  "flex flex-col items-center gap-8 p-8 sm:p-12 rounded-3xl max-w-lg mx-auto w-full",
                  "bg-card/95 backdrop-blur-sm border shadow-2xl relative overflow-hidden",
                  "bg-gradient-to-br",
                  config.bgGradient,
                )}
              >
                {ContentComponent}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )

    case "overlay":
      return (
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={animated ? { opacity: 0 } : {}}
              animate={animated ? { opacity: 1 } : {}}
              exit={animated ? { opacity: 0 } : {}}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute inset-0 z-10 bg-background/95 backdrop-blur-sm",
                "flex flex-col items-center justify-center p-4",
                className,
              )}
            >
              <motion.div
                initial={animated ? { opacity: 0, scale: 0.9 } : {}}
                animate={animated ? { opacity: 1, scale: 1 } : {}}
                exit={animated ? { opacity: 0, scale: 0.9 } : {}}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex flex-col items-center gap-6 p-6 sm:p-8 rounded-2xl max-w-sm mx-auto w-full",
                  "bg-card/95 backdrop-blur-sm border shadow-xl relative overflow-hidden",
                  "bg-gradient-to-br",
                  config.bgGradient,
                )}
              >
                {ContentComponent}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )

    case "card":
      return (
        <motion.div
          initial={animated ? { opacity: 0, y: 20 } : {}}
          animate={animated ? { opacity: 1, y: 0 } : {}}
          exit={animated ? { opacity: 0, y: -20 } : {}}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex flex-col items-center justify-center gap-8 p-8 sm:p-10",
            "min-h-[280px] rounded-2xl border bg-gradient-to-br shadow-lg relative overflow-hidden",
            config.bgGradient,
            className,
          )}
        >
          {ContentComponent}
        </motion.div>
      )

    case "minimal":
      return (
        <motion.div
          className={cn("flex items-center gap-3", className)}
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          exit={animated ? { opacity: 0, x: 10 } : {}}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Loader2 className={cn("animate-spin", config.accentColor, sizeClasses[size])} />
          </motion.div>
          {displayMessage && <span className="text-sm font-medium text-foreground truncate">{displayMessage}</span>}
        </motion.div>
      )

    case "inline":
    default:
      return <div className={cn("flex flex-col items-center gap-6 text-center", className)}>{ContentComponent}</div>
  }
})

export const CourseAILoader = ModernLoader

// Enhanced convenience components with better defaults
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
      animated={true}
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
  return (
    <CourseAILoader
      variant={variant}
      size={size}
      message={message}
      className={className}
      context={context}
      animated={true}
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
    <CourseAILoader
      variant="minimal"
      size={size}
      message={message}
      context={context}
      className={className}
      animated={true}
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
      animated={true}
    />
  )
}

export function SkeletonLoader({ className }: { className?: string }) {
  return <CourseAILoader variant="skeleton" className={className} animated={true} />
}

export default ModernLoader
