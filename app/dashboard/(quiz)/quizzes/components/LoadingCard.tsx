"use client"

import { CardLoader } from "@/components/ui/loader"
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
    <CardLoader message={message} subMessage={subMessage} context="quiz" className={cn("animate-fade-in", className)} />
  )
}

export default LoadingCard
