"use client"

import { useGlobalLoading } from "@/store/slices/global-loading-slice"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface LoadingCardProps {
  message?: string
  subMessage?: string
  className?: string
}

export function LoadingCard({
  message = "Loading quiz...",
  subMessage = "Please wait while we prepare your content",
  className,
}: LoadingCardProps) {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    const loaderId = showLoading({
      message,
      subMessage,
      variant: 'spinner',
      theme: 'primary',
      isBlocking: false,
      priority: 1
    })

    return () => {
      hideLoading(loaderId)
    }
  }, [message, subMessage, showLoading, hideLoading])

  return (
    <div className={cn("animate-fade-in", className)}>
      {/* Loading handled by GlobalLoader */}
    </div>
  )
}

export default LoadingCard
