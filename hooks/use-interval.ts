"use client"

import { useEffect, useRef, useCallback } from "react"

/**
 * Hook for setting up an interval that can be paused and resumed
 * @param callback Function to call on each interval
 * @param delay Delay in milliseconds, or null to pause
 * @returns Object with pause and resume methods
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const savedDelay = useRef<number | null>(delay)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Remember the latest delay
  useEffect(() => {
    savedDelay.current = delay
  }, [delay])

  // Set up the interval
  const setupInterval = useCallback(() => {
    if (savedDelay.current === null) return

    intervalRef.current = setInterval(() => {
      savedCallback.current()
    }, savedDelay.current)
  }, [])

  // Pause the interval
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Resume the interval
  const resume = useCallback(() => {
    if (intervalRef.current === null && savedDelay.current !== null) {
      setupInterval()
    }
  }, [setupInterval])

  // Set up and clean up the interval
  useEffect(() => {
    setupInterval()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [delay, setupInterval])

  return { pause, resume }
}
