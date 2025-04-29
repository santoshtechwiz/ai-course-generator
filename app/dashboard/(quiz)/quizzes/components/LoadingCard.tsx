"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"

interface LoadingCardProps {
  message?: string
  className?: string
}

export function LoadingCard({ message = "Loading...", className }: LoadingCardProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 h-full", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  )
}
