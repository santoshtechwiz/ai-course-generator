"use client"

import { useCallback, useEffect, useState } from "react"
import { useMediaQuery } from "./use-media-query"

/**
 * Hook for managing responsive behavior
 * @returns Object containing responsive states and current breakpoint
 */
export function useResponsive() {
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")
  const isDesktop = useMediaQuery("(min-width: 1025px)")

  // Get current breakpoint name
  const getBreakpoint = useCallback(() => {
    if (isMobile) return "mobile"
    if (isTablet) return "tablet"
    return "desktop"
  }, [isMobile, isTablet])

  // State to track current breakpoint
  const [breakpoint, setBreakpoint] = useState(getBreakpoint())

  // Update breakpoint when media queries change
  useEffect(() => {
    setBreakpoint(getBreakpoint())
  }, [isMobile, isTablet, isDesktop, getBreakpoint])

  // Also include window dimensions for convenient access
  const [windowSize, setWindowSize] = useState({
    width: undefined as number | undefined,
    height: undefined as number | undefined,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    windowWidth: windowSize.width,
    windowHeight: windowSize.height,
  }
}

// Aliases for backward compatibility
export const useMobile = useResponsive
