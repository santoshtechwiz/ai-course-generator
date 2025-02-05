"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useLoaderContext } from "../providers/loadingContext"

export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startNavigation, completeNavigation } = useLoaderContext()

  useEffect(() => {
    let isNavigating = false
    let timeoutId: NodeJS.Timeout

    const handleStartNavigation = () => {
      // Prevent multiple navigation starts
      if (!isNavigating) {
        isNavigating = true
        startNavigation()
      }
    }

    const handleCompleteNavigation = () => {
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Add a small delay to prevent flickering for fast navigations
      timeoutId = setTimeout(() => {
        isNavigating = false
        completeNavigation()
      }, 300) // Increased delay for better UX
    }

    // Start navigation
    handleStartNavigation()

    // Complete navigation after the route change is processed
    handleCompleteNavigation()

    return () => {
      // Clean up timeout on unmount or route change
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [startNavigation, completeNavigation])

  return null
}

