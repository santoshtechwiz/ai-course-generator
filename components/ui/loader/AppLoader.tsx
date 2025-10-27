"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const AppLoader = React.memo(function AppLoader({
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
    <div
      className={cn("flex flex-col items-center justify-center space-y-4 p-6 bg-[var(--color-card)] border-4 border-black rounded-none shadow-[4px_4px_0_#000]", className)}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative">
        <Loader2 className={cn("animate-spin text-[var(--color-primary)]", sizeClasses[size])} />
        {/* Add a subtle pulse effect behind the spinner */}
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-20",
          sizeClasses[size],
          "bg-[var(--color-primary)]"
        )} />
      </div>
      {message && (
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {message}
          </p>
          {/* Add a subtle loading dots animation */}
          <div className="flex justify-center space-x-1">
            <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  )
})

AppLoader.displayName = "AppLoader"

interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

const SkeletonLoader = React.memo(function SkeletonLoader({ lines = 1, className }: SkeletonLoaderProps) {
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
})

SkeletonLoader.displayName = "SkeletonLoader"
