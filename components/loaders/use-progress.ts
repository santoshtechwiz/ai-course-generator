"use client"

import { useCallback, useEffect, useRef } from 'react'
import { progressApi } from './progress-api'

interface UseProgressProps {
  /** Whether to auto-increment progress */
  autoIncrement?: boolean
  /** Increment interval in milliseconds */
  incrementInterval?: number
}

/**
 * Hook for using the progress bar in React components
 */
export function useProgress({ 
  autoIncrement = false, 
  incrementInterval = 500 
}: UseProgressProps = {}) {
  const intervalRef = useRef<NodeJS.Timeout>()

  const startProgress = useCallback((initialValue?: number) => {
    progressApi.start(initialValue)

    if (autoIncrement) {
      intervalRef.current = setInterval(() => {
        if (progressApi.isStarted()) {
          progressApi.increment()
        }
      }, incrementInterval)
    }
  }, [autoIncrement, incrementInterval])

  const setProgress = useCallback((value: number) => {
    progressApi.set(value)
  }, [])

  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    progressApi.done()
  }, [])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    start: startProgress,
    set: setProgress,
    complete: completeProgress,
    increment: progressApi.increment,
    isStarted: progressApi.isStarted
  }
}
