"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook to detect media queries
 *
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return
    }

    const media = window.matchMedia(query)

    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Define listener function
    const listener = () => {
      setMatches(media.matches)
    }

    // Add event listener
    media.addEventListener("change", listener)

    // Clean up
    return () => media.removeEventListener("change", listener)
  }, [matches, query])

  return matches
}

export default useMediaQuery

