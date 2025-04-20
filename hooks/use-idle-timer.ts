"use client"

import { useState, useEffect, useCallback } from "react"

interface IdleTimerOptions {
  idleTime?: number // Time in milliseconds
  events?: string[] // DOM events to listen for
}

export function useIdleTimer({
  idleTime = 5 * 60 * 1000, // Default: 5 minutes
  events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"],
}: IdleTimerOptions = {}) {
  const [isIdle, setIsIdle] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now())
    setIsIdle(false)
  }, [])

  useEffect(() => {
    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Set up interval to check for idle state
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastActivity > idleTime) {
        setIsIdle(true)
      }
    }, 10000) // Check every 10 seconds

    // Clean up
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(interval)
    }
  }, [events, handleActivity, idleTime, lastActivity])

  return { isIdle, lastActivity, resetIdle: handleActivity }
}
