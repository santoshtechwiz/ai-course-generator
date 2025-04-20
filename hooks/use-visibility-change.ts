"use client"

import { useState, useEffect } from "react"

export function useVisibilityChange() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible")
    }

    // Set initial state
    setIsVisible(document.visibilityState === "visible")

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return isVisible
}
