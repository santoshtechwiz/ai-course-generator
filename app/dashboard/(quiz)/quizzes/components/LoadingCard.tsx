"use client"

import { cn } from "@/lib/utils"
import { ClipLoader } from "react-spinners"

interface LoadingCardProps {
  message?: string
  subMessage?: string
  className?: string
}

/**
 * Simple LoadingCard component for quiz loading
 * Renders its own loading UI instead of interfering with global loader
 */
export function LoadingCard({
  message = "Loading quiz...",
  subMessage = "Please wait while we prepare your content",
  className,
}: LoadingCardProps) {
  return (
    <div className={cn("animate-fade-in flex flex-col items-center justify-center py-8 space-y-4", className)}>
      <ClipLoader color="#3B82F6" size={40} />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {subMessage && (
          <p className="text-xs text-muted-foreground mt-1">{subMessage}</p>
        )}
      </div>
    </div>
  )
}

export default LoadingCard
