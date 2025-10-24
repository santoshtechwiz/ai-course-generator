"use client"

import React from 'react'
import { Loader2, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NeoLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse'
  className?: string
  fullWidth?: boolean
  inline?: boolean
}

export const NeoLoader = React.memo(function NeoLoader({
  message = "Loading...",
  size = 'md',
  variant = 'spinner',
  className,
  fullWidth = false,
  inline = false
}: NeoLoaderProps) {
  const sizeClasses = {
    sm: { container: 'h-5 w-5', icon: 'h-4 w-4', text: 'text-sm', padding: 'p-4' },
    md: { container: 'h-6 w-6', icon: 'h-5 w-5', text: 'text-base', padding: 'p-6' },
    lg: { container: 'h-8 w-8', icon: 'h-6 w-6', text: 'text-lg', padding: 'p-8' },
    xl: { container: 'h-12 w-12', icon: 'h-8 w-8', text: 'text-xl', padding: 'p-10' }
  }

  const containerClass = inline 
    ? "inline-flex items-center gap-3" 
    : cn("flex flex-col items-center justify-center space-y-4", sizeClasses[size].padding)

  const SpinnerLoader = () => (
    <div className="relative">
      <Loader2 className={cn("animate-spin text-[var(--color-primary)]", sizeClasses[size].icon)} />
      <div className={cn(
        "absolute inset-0 rounded-full animate-ping opacity-20",
        sizeClasses[size].icon,
        "bg-[var(--color-primary)]"
      )} />
    </div>
  )

  const DotsLoader = () => (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )

  const SkeletonLoader = () => (
    <div className={cn("space-y-2", fullWidth ? "w-full" : "w-48")}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-md animate-pulse shadow-[2px_2px_0_0_var(--color-border)]",
            i === 2 && "w-3/4"
          )}
        />
      ))}
    </div>
  )

  const PulseLoader = () => (
    <div className={cn(
      "rounded-full bg-[var(--color-primary)] border-4 border-[var(--color-border)] animate-pulse shadow-[4px_4px_0_0_var(--color-border)]",
      sizeClasses[size].container
    )} />
  )

  const getLoaderContent = () => {
    switch (variant) {
      case 'dots': return <DotsLoader />
      case 'skeleton': return <SkeletonLoader />
      case 'pulse': return <PulseLoader />
      default: return <SpinnerLoader />
    }
  }

  return (
    <div className={cn(
      containerClass,
      !inline && "bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-2xl shadow-[4px_4px_0_0_var(--color-border)]",
      fullWidth && "w-full",
      className
    )}>
      {getLoaderContent()}
      {message && !inline && (
        <div className="text-center space-y-2">
          <p className={cn("font-black text-[var(--color-text)]", sizeClasses[size].text)}>
            {message}
          </p>
          {variant === 'spinner' && (
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {message && inline && (
        <span className={cn("font-black text-[var(--color-text)]", sizeClasses[size].text)}>
          {message}
        </span>
      )}
    </div>
  )
})

NeoLoader.displayName = "NeoLoader"

// Legacy component for backward compatibility
export const Loader = NeoLoader

// Skeleton loader as separate component
interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export const SkeletonLoader = React.memo(function SkeletonLoader({ 
  lines = 3, 
  className 
}: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-lg animate-pulse shadow-[2px_2px_0_0_var(--color-border)]",
            i === lines - 1 && lines > 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  )
})

SkeletonLoader.displayName = "SkeletonLoader"
