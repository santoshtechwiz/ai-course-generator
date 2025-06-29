"use client"

import { cn } from "@/lib/utils"
import { Loader2, Brain, CheckCircle2, Clock, BookOpen } from "lucide-react"
import type { ReactNode } from "react"

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
export type LoaderVariant = "inline" | "fullscreen" | "button" | "card" | "overlay" | "skeleton"
export type LoaderContext = "loading" | "quiz" | "result" | "submitting" | "processing" | "saving" | "course"

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
  fullscreen?: boolean
  text?: string
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
    defaultSubMessage: "Please wait",
  },
  quiz: {
    icon: Brain,
    defaultMessage: "Loading quiz...",
    defaultSubMessage: "Preparing your questions",
  },
  result: {
    icon: CheckCircle2,
    defaultMessage: "Processing results...",
    defaultSubMessage: "Calculating your score",
  },
  submitting: {
    icon: Clock,
    defaultMessage: "Submitting...",
    defaultSubMessage: "Processing your responses",
  },
  processing: {
    icon: Brain,
    defaultMessage: "Processing...",
    defaultSubMessage: "Analyzing your performance",
  },
  saving: {
    icon: CheckCircle2,
    defaultMessage: "Saving...",
    defaultSubMessage: "Please wait",
  },
  course: {
    icon: BookOpen,
    defaultMessage: "Loading course...",
    defaultSubMessage: "Preparing your learning experience",
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
  fullscreen = false,
  text,
}: LoaderProps) {
  if (!isLoading) return null

  // Handle legacy props
  const finalVariant = fullscreen ? "fullscreen" : variant
  const finalMessage = message || text

  const config = contextConfig[context]
  const Icon = config.icon
  const displayMessage = finalMessage || config.defaultMessage
  const displaySubMessage = subMessage || config.defaultSubMessage

  const spinnerClasses = cn("animate-spin text-primary", sizeClasses[size])

  const renderSpinner = () => <Loader2 className={spinnerClasses} />

  const renderIcon = () => showIcon && <Icon className={cn("text-primary mb-2", sizeClasses[size])} />

  const renderProgress = () =>
    showProgress &&
    progress !== undefined && (
      <div className="w-full max-w-xs mt-3">
        <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">{Math.round(progress)}%</p>
      </div>
    )

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-x-2 flex">
          <div className="h-10 w-[100px] bg-muted rounded-md"></div>
          <div className="h-10 w-[100px] bg-muted rounded-md"></div>
          <div className="h-10 w-[100px] bg-muted rounded-md"></div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="h-[74px] w-[120px] bg-muted rounded-md"></div>
          <div className="h-[74px] w-[120px] bg-muted rounded-md"></div>
          <div className="h-[74px] w-[120px] bg-muted rounded-md"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded-md"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] w-full bg-muted rounded-md"></div>
            ))}
          </div>
        </div>

        <div className="h-[500px] w-full bg-muted rounded-md"></div>
      </div>
    </div>
  )

  const renderContent = () => (
    <>
      {renderIcon()}
      {renderSpinner()}
      {displayMessage && (
        <div className="space-y-1 mt-3">
          <h3 className={cn("font-medium text-foreground", finalVariant === "fullscreen" ? "text-lg" : "text-sm")}>
            {displayMessage}
          </h3>
          {displaySubMessage && (
            <p className={cn("text-muted-foreground", finalVariant === "fullscreen" ? "text-sm" : "text-xs")}>
              {displaySubMessage}
            </p>
          )}
        </div>
      )}
      {renderProgress()}
      {children}
    </>
  )

  switch (finalVariant) {
    case "skeleton":
      return <div className={cn("w-full", className)}>{renderSkeleton()}</div>

    case "fullscreen":
      return (
        <div
          className={cn(
            "fixed inset-0 z-50 bg-background/90 backdrop-blur-sm",
            "flex flex-col items-center justify-center gap-4 text-center",
            className,
          )}
        >
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg max-w-md">{renderContent()}</div>
        </div>
      )

    case "overlay":
      return (
        <div
          className={cn(
            "absolute inset-0 z-10 bg-background/80 backdrop-blur-sm",
            "flex flex-col items-center justify-center gap-4 text-center",
            className,
          )}
        >
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg">{renderContent()}</div>
        </div>
      )

    case "card":
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 text-center",
            "min-h-[200px] rounded-lg border bg-card",
            className,
          )}
        >
          {renderContent()}
        </div>
      )

    case "button":
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Loader2 className={cn("animate-spin", sizeClasses[size])} />
          {displayMessage && <span className="text-sm">{displayMessage}</span>}
        </div>
      )

    case "inline":
    default:
      return <div className={cn("flex flex-col items-center gap-3 text-center", className)}>{renderContent()}</div>
  }
}

// Convenience components for common use cases
export function FullPageLoader({
  message = "Loading content...",
  subMessage = "Please wait while we prepare your dashboard",
  context = "loading",
}: {
  message?: string
  subMessage?: string
  context?: LoaderContext
}) {
  return (
    <Loader
      variant="fullscreen"
      size="lg"
      message={message}
      subMessage={subMessage}
      context={context}
      showIcon={true}
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

export function ButtonLoader({
  size = "sm",
  message = "Loading...",
}: {
  size?: LoaderSize
  message?: string
}) {
  return <Loader variant="button" size={size} message={message} />
}

export function CardLoader({
  message = "Loading...",
  subMessage,
  context = "loading",
  className,
}: {
  message?: string
  subMessage?: string
  context?: LoaderContext
  className?: string
}) {
  return (
    <Loader
      variant="card"
      size="lg"
      message={message}
      subMessage={subMessage}
      context={context}
      className={className}
    />
  )
}

export function SkeletonLoader({ className }: { className?: string }) {
  return <Loader variant="skeleton" className={className} />
}

// Legacy compatibility exports
export const LoadingSpinner = Loader
export const LoadingSkeleton = SkeletonLoader
export const BounceLoader = InlineLoader
export const QuizLoader = ({
  message = "Loading quiz...",
  isLoading = true,
}: { message?: string; isLoading?: boolean }) => (
  <Loader variant="card" size="lg" message={message} context="quiz" isLoading={isLoading} />
)
export const UnifiedLoader = Loader

export default Loader
