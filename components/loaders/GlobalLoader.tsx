"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { UnifiedLoaderProps } from "@/app/types/types"
import { useLoading } from "./LoaderContext"



const spinnerVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
}

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.1, duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
}

export function UnifiedLoader({
  id,
  message,
  variant = "spinner",
  size = "md",
  showMessage = true,
  className,
}: UnifiedLoaderProps) {
  const { isLoading, getLoadingMessage, getLoadingState } = useLoading()

  const loadingId = id || "default"
  const isCurrentlyLoading = isLoading(loadingId)
  const currentMessage = message || getLoadingMessage(loadingId) || "Loading..."
  const currentState = getLoadingState(loadingId)

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  const containerSizeClasses = {
    sm: "gap-2 text-sm",
    md: "gap-3 text-base",
    lg: "gap-4 text-lg",
  }

  if (!isCurrentlyLoading && currentState !== "error") {
    return null
  }

  const renderSpinner = () => (
    <motion.div
      variants={spinnerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("flex items-center justify-center", containerSizeClasses[size], className)}
    >
      {currentState === "error" ? (
        <AlertCircle className={cn(sizeClasses[size], "text-destructive")} />
      ) : currentState === "success" ? (
        <CheckCircle2 className={cn(sizeClasses[size], "text-green-500")} />
      ) : (
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      )}

      {showMessage && (
        <motion.span
          variants={messageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="text-muted-foreground font-medium"
        >
          {currentMessage}
        </motion.span>
      )}
    </motion.div>
  )

  const renderSkeleton = () => (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  )

  const renderProgress = () => (
    <motion.div
      variants={spinnerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("space-y-3", className)}
    >
      <Progress value={undefined} className="w-full" />
      {showMessage && (
        <motion.p variants={messageVariants} className="text-center text-sm text-muted-foreground">
          {currentMessage}
        </motion.p>
      )}
    </motion.div>
  )

  const renderOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        variants={spinnerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-card border rounded-lg shadow-lg p-6 flex items-center gap-4"
      >
        {currentState === "error" ? (
          <AlertCircle className="w-6 h-6 text-destructive" />
        ) : (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        )}
        {showMessage && <span className="text-foreground font-medium">{currentMessage}</span>}
      </motion.div>
    </motion.div>
  )

  return (
    <AnimatePresence mode="wait">
      {variant === "spinner" && renderSpinner()}
      {variant === "skeleton" && renderSkeleton()}
      {variant === "progress" && renderProgress()}
      {variant === "overlay" && renderOverlay()}
    </AnimatePresence>
  )
}

// Convenience components for common use cases
export function LoadingSpinner({ id, message, size = "md", className }: Omit<UnifiedLoaderProps, "variant">) {
  return <UnifiedLoader id={id} message={message} variant="spinner" size={size} className={className} />
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <UnifiedLoader variant="skeleton" className={className} />
}

export function LoadingOverlay({ id, message }: { id?: string; message?: string }) {
  return <UnifiedLoader id={id} message={message} variant="overlay" />
}
