"use client"

import { useRef, useEffect, useCallback, useState } from 'react'

/**
 * Hook for performant requestAnimationFrame animations
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, isActive = true) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time
    if (isActive) {
      requestRef.current = requestAnimationFrame(animate)
    }
  }, [callback, isActive])

  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(animate)
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [animate, isActive])

  return requestRef.current
}

/**
 * Hook for setInterval-based animations
 */
export function useAnimationInterval(callback: () => void, delay: number | null) {
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

/**
 * Hook for smooth value transitions
 */
export function useSmoothValue(targetValue: number, smoothing = 0.1) {
  const [currentValue, setCurrentValue] = useState(targetValue)
  const targetRef = useRef(targetValue)

  useEffect(() => {
    targetRef.current = targetValue
  }, [targetValue])

  useAnimationFrame(() => {
    setCurrentValue(prev => {
      const diff = targetRef.current - prev
      return prev + diff * smoothing
    })
  })

  return currentValue
}