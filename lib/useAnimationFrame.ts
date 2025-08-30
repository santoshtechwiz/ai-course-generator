"use client"

import { useRef, useEffect, useCallback, useState } from 'react'

interface UseAnimationFrameOptions {
  autoStart?: boolean
  fps?: number
}

export function useAnimationFrame(
  callback: (deltaTime: number, timestamp: number) => void,
  options: UseAnimationFrameOptions = {}
) {
  const { autoStart = true, fps } = options
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  const callbackRef = useRef(callback)

  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const animate = useCallback((timestamp: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = timestamp - previousTimeRef.current

      // If fps is specified, throttle the callback
      if (fps) {
        const frameInterval = 1000 / fps
        if (deltaTime >= frameInterval) {
          callbackRef.current(deltaTime, timestamp)
          previousTimeRef.current = timestamp
        }
      } else {
        callbackRef.current(deltaTime, timestamp)
      }
    } else {
      previousTimeRef.current = timestamp
    }

    requestRef.current = requestAnimationFrame(animate)
  }, [fps])

  const start = useCallback(() => {
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  const stop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = undefined
      previousTimeRef.current = undefined
    }
  }, [])

  useEffect(() => {
    if (autoStart) {
      start()
    }

    return () => {
      stop()
    }
  }, [autoStart, start, stop])

  return { start, stop, isRunning: !!requestRef.current }
}

// Hook for simple interval-based animations
export function useAnimationInterval(
  callback: () => void,
  delay: number | null
) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

// Hook for smooth value transitions
export function useSmoothValue(
  targetValue: number,
  duration: number = 300,
  easing: (t: number) => number = (t) => t
) {
  const [currentValue, setCurrentValue] = useState(targetValue)
  const startValue = useRef(targetValue)
  const startTime = useRef<number>()

  useEffect(() => {
    if (targetValue === currentValue) return

    startValue.current = currentValue
    startTime.current = Date.now()

    const animate = () => {
      if (!startTime.current) return

      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easing(progress)

      const newValue = startValue.current + (targetValue - startValue.current) * easedProgress
      setCurrentValue(newValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [targetValue, duration, easing, currentValue])

  return currentValue
}
