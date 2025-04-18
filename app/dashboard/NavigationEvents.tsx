"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  // Track navigation state
  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true)
      document.body.classList.add("navigation-in-progress")
    }

    const handleStop = () => {
      setIsNavigating(false)
      document.body.classList.remove("navigation-in-progress")
    }

    // Start navigation indicator
    handleStart()

    // Set a timeout to ensure the navigation indicator is shown
    const timeout = setTimeout(() => {
      handleStop()
    }, 500)

    return () => {
      clearTimeout(timeout)
      handleStop()
    }
  }, [pathname, searchParams])

  // Create and inject the loading indicator
  useEffect(() => {
    // Create the loading indicator container if it doesn't exist
    let loadingContainer = document.getElementById("navigation-loading-indicator")
    if (!loadingContainer) {
      loadingContainer = document.createElement("div")
      loadingContainer.id = "navigation-loading-indicator"
      loadingContainer.className = "fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      document.body.appendChild(loadingContainer)
    }

    // Create the loading bar
    const loadingBar = document.createElement("div")
    loadingBar.className =
      "h-1 w-full bg-gradient-to-r from-primary to-primary/80 transform origin-left transition-transform duration-300 ease-out"
    loadingBar.style.transform = "scaleX(0)"
    loadingContainer.innerHTML = ""
    loadingContainer.appendChild(loadingBar)

    // Create the loading overlay
    let loadingOverlay = document.getElementById("navigation-loading-overlay")
    if (!loadingOverlay) {
      loadingOverlay = document.createElement("div")
      loadingOverlay.id = "navigation-loading-overlay"
      loadingOverlay.className =
        "fixed inset-0 bg-background/50 backdrop-blur-sm z-[9998] pointer-events-none opacity-0 transition-opacity duration-300"
      document.body.appendChild(loadingOverlay)
    }

    // Animation function
    const animateLoading = () => {
      if (isNavigating) {
        // Show the loading bar with animation
        loadingBar.style.transform = "scaleX(0)"
        setTimeout(() => {
          loadingBar.style.transform = "scaleX(0.3)"
          setTimeout(() => {
            loadingBar.style.transform = "scaleX(0.6)"
            setTimeout(() => {
              loadingBar.style.transform = "scaleX(0.8)"
            }, 200)
          }, 200)
        }, 10)

        // Show the overlay
        loadingOverlay.style.opacity = "1"
        loadingOverlay.style.pointerEvents = "auto"
      } else {
        // Complete the loading bar animation
        loadingBar.style.transform = "scaleX(1)"

        // Hide the overlay
        setTimeout(() => {
          loadingOverlay.style.opacity = "0"
          loadingOverlay.style.pointerEvents = "none"

          // Reset the loading bar after it's complete
          setTimeout(() => {
            loadingBar.style.transform = "scaleX(0)"
          }, 300)
        }, 200)
      }
    }

    animateLoading()

    // Cleanup
    return () => {
      // Don't remove the elements, just reset them
      if (loadingBar) {
        loadingBar.style.transform = "scaleX(0)"
      }
      if (loadingOverlay) {
        loadingOverlay.style.opacity = "0"
        loadingOverlay.style.pointerEvents = "none"
      }
    }
  }, [isNavigating])

  return null
}
