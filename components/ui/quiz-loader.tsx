"use client"

import { Loader2 } from "lucide-react"

interface QuizLoaderProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function QuizLoader({ message = "Saving your results...", size = "md" }: QuizLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  )
}

