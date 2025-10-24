"use client"

/**
 * @deprecated Use UnifiedLoader from @/components/loaders instead
 * This file is kept for backward compatibility only
 */

import React from 'react'
import { UnifiedLoader } from '@/components/loaders'

interface LoaderProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const sizeMap = {
  small: 'sm' as const,
  medium: 'md' as const,
  large: 'lg' as const,
}

export const Loader = React.memo(function Loader({
  message = "Loading...",
  size = 'medium',
  className
}: LoaderProps) {
  return (
    <UnifiedLoader
      message={message}
      size={sizeMap[size]}
      variant="spinner"
      className={className}
    />
  )
})

Loader.displayName = "Loader"

interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

const SkeletonLoader = React.memo(function SkeletonLoader({ lines = 1, className }: SkeletonLoaderProps) {
  return (
    <UnifiedLoader
      variant="skeleton"
      className={className}
    />
  )
})

SkeletonLoader.displayName = "SkeletonLoader"

export { SkeletonLoader }
