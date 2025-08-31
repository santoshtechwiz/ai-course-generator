"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function Loader({
  message = "Loading...",
  size = 'medium',
  className
}: LoaderProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && (
        <p className="text-sm text-muted-foreground text-center">
          {message}
        </p>
      )}
    </div>
  )
}

interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export function SkeletonLoader({ lines = 1, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
        />
      ))}
    </div>
  )
}
