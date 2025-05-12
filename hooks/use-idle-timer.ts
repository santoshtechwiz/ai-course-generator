"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface IdleTimerOptions {
  idleTime?: number // Time in milliseconds
  events?: string[] // DOM events to listen for
  onIdle?: () => void // Callback when user becomes idle
  onActive?: () => void // Callback when user becomes active
  debounce?: number // Debounce time for activity events
}

/**
 * Hook to detect user inactivity
 * @param options Configuration options
 * @returns Object with idle state and methods
 */
export function useIdleTimer({
  idleTime = 5 * 60 * 1000, // Default: 5 minutes
  events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"],
  onIdle,
  onActive,
  debounce = 200,
}: IdleTimerOptions = {}) {
  const [isIdle, setIsIdle] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Reset the idle timer
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true)
      onIdle?.()
    }, idleTime)
  }, [idleTime, onIdle])

  // Handle user activity
  const handleActivity = useCallback(() => {
    const now = Date.now()
    setLastActivity(now)

    if (isIdle) {
      setIsIdle(false)
      onActive?.()
    }

    // Debounce the reset timer call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      resetTimer()
    }, debounce)
  }, [isIdle, onActive, resetTimer, debounce])

  // Set up event listeners and timer
  useEffect(() => {
    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Initial timer
    resetTimer()

    // Clean up
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [events, handleActivity, resetTimer])

  return {
    isIdle,
    lastActivity,
    resetIdle: handleActivity,
    getIdleTime: () => Date.now() - lastActivity,
  }
}
