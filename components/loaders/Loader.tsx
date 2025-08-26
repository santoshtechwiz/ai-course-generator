"use client"

import React, { useEffect } from 'react'
import { useProgress } from './use-progress'

export interface LoaderProps {
  /** Whether the loader is active */
  isLoading: boolean
  /** Whether to auto-increment progress while loading */
  autoIncrement?: boolean
  /** Custom increment interval in ms */
  incrementInterval?: number
  /** Initial progress value (0-1) */
  initialValue?: number
  /** Whether to cleanup on unmount */
  cleanupOnUnmount?: boolean
  /** Children to render */
  children: React.ReactNode
}

/**
 * A loader component that integrates with the progress API
 */
export const Loader: React.FC<LoaderProps> = ({
  isLoading,
  autoIncrement = true,
  incrementInterval = 500,
  initialValue,
  cleanupOnUnmount = true,
  children,
}) => {
  const { start, complete } = useProgress({ 
    autoIncrement, 
    incrementInterval 
  })

  useEffect(() => {
    if (isLoading) {
      start(initialValue)
    } else {
      complete()
    }
  }, [isLoading, start, complete, initialValue])

  useEffect(() => {
    return () => {
      if (cleanupOnUnmount) {
        complete()
      }
    }
  }, [cleanupOnUnmount, complete])

  return <>{children}</>
}
