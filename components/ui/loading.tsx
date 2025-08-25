"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  variant?: 'spinner' | 'dots' | 'pulse'
}

export function Loading({ 
  size = 'md', 
  text = 'Loading...', 
  className,
  variant = 'spinner'
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const renderSpinner = () => (
    <div className={cn(
  "rounded-full border-2 border-muted border-t-primary",
      sizeClasses[size]
    )} />
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      <div className={cn(
        "w-2 h-2 bg-primary rounded-full animate-bounce",
        size === 'sm' && "w-1.5 h-1.5",
        size === 'lg' && "w-3 h-3",
        size === 'xl' && "w-4 h-4"
      )} style={{ animationDelay: '0ms' }} />
      <div className={cn(
        "w-2 h-2 bg-primary rounded-full animate-bounce",
        size === 'sm' && "w-1.5 h-1.5",
        size === 'lg' && "w-3 h-3",
        size === 'xl' && "w-4 h-4"
      )} style={{ animationDelay: '150ms' }} />
      <div className={cn(
        "w-2 h-2 bg-primary rounded-full animate-bounce",
        size === 'sm' && "w-1.5 h-1.5",
        size === 'lg' && "w-3 h-3",
        size === 'xl' && "w-4 h-4"
      )} style={{ animationDelay: '300ms' }} />
    </div>
  )

  const renderPulse = () => (
    <div className={cn(
      "bg-primary rounded-full animate-pulse",
      sizeClasses[size]
    )} />
  )

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      default:
        return renderSpinner()
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {renderLoader()}
      {text && (
        <p className={cn(
          "text-muted-foreground mt-2 text-center",
          textSizes[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

// Full screen loading component
export function FullScreenLoading({ 
  text = 'Loading...', 
  className,
  variant = 'spinner'
}: Omit<LoadingProps, 'size'>) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <Loading 
        size="lg" 
        text={text} 
        className={className}
        variant={variant}
      />
    </div>
  )
}

// Inline loading component
export function InlineLoading({ 
  text = 'Loading...', 
  className,
  variant = 'spinner'
}: Omit<LoadingProps, 'size'>) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Loading 
        size="sm" 
        text="" 
        variant={variant}
      />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  )
}

// Page loading component
export function PageLoading({ 
  text = 'Loading page...', 
  className,
  variant = 'spinner'
}: Omit<LoadingProps, 'size'>) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading 
        size="lg" 
        text={text} 
        className={className}
        variant={variant}
      />
    </div>
  )
}