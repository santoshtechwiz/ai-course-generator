"use client"

import { useState, useEffect } from "react"

/**
 * Hook for media query matching
 * @param query The media query string
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined") {
      // Set initial value
      const media = window.matchMedia(query)
      if (media.matches !== matches) {
        setMatches(media.matches)
      }

      // Add listener
      const listener = () => setMatches(media.matches)
      window.addEventListener("resize", listener)
      media.addEventListener("change", listener)

      // Cleanup
      return () => {
        window.removeEventListener("resize", listener)
        media.removeEventListener("change", listener)
      }
    }
  }, [query, matches])

  // Return false until mounted to avoid hydration mismatch
  return mounted ? matches : false
}

export default useMediaQuery
