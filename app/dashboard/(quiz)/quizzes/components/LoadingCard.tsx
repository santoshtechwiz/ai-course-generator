"use client"

import { GlobalLoader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"

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
  return (
    <GlobalLoader text={message} subText={subMessage} className={cn("animate-fade-in", className)} theme="primary" />
  )
}

export default LoadingCard
