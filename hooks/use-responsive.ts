"use client"

import { useState, useEffect } from "react"

/**
 * Window size interface
 */
export interface WindowSize {
  width: number | undefined
  height: number | undefined
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

/**
 * Hook for responsive design using window size and media queries
 * @returns Window size and responsive breakpoints
 */
export function useResponsive(): WindowSize {
  // Default to undefined on the server
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === "undefined") return

    // Handler to call on window resize
    function handleResize() {
      const width = window.innerWidth
      const height = window.innerHeight

      // Set window width/height and responsive breakpoints
      setWindowSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      })
    }

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Call handler right away so state gets updated with initial window size
    handleResize()

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, []) // Empty array ensures that effect is only run on mount and unmount

  return windowSize
}

/**
 * Hook for checking if a specific media query matches
 * @param query Media query string
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on the server
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query)

      // Set initial value
      setMatches(media.matches)

      // Define listener function
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches)
      }

      // Add listener
      media.addEventListener("change", listener)

      // Clean up
      return () => {
        media.removeEventListener("change", listener)
      }
    }
  }, [query])

  return matches
}
