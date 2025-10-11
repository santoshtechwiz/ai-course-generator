/**
 * React Hook Utilities
 * 
 * Custom React hooks for common functionality.
 * Consolidates all hook-related utilities into a single location.
 */

"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// ============================================================================
// DEBOUNCE HOOKS
// ============================================================================

/**
 * Hook to debounce a value with enhanced performance
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousValueRef = useRef<T>(value)

  useEffect(() => {
    // Only update if the value has changed
    if (value !== previousValueRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)
        previousValueRef.current = value
      }, delay)
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  // Update previous value ref when component mounts
  useEffect(() => {
    previousValueRef.current = value
  }, [])

  return debouncedValue
}

/**
 * Hook to debounce a callback function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fnRef = useRef<T>(fn)

  // Update function ref when fn changes
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      fnRef.current(...args)
    }, delay)
  }, [delay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedFn
}

// ============================================================================
// TIMING HOOKS
// ============================================================================

/**
 * Hook for interval execution
 * @param callback The callback to execute
 * @param delay The delay in milliseconds (null to pause)
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

// ============================================================================
// MEDIA QUERY HOOKS
// ============================================================================

/**
 * Hook for media query matching with SSR support
 * @param query The media query string
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  // Return false on server to prevent hydration mismatch
  if (!mounted) return false

  return matches
}

/**
 * Hook for responsive behavior with common breakpoints
 * @returns Object containing responsive states and current breakpoint
 */
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const isLargeDesktop = useMediaQuery('(min-width: 1441px)')

  const currentBreakpoint = isMobile 
    ? 'mobile' 
    : isTablet 
    ? 'tablet' 
    : isLargeDesktop 
    ? 'large-desktop' 
    : 'desktop'

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    currentBreakpoint,
    // Legacy aliases
    mobile: isMobile,
    tablet: isTablet,
    desktop: isDesktop
  }
}

// Backward compatibility alias
export const useMobile = useResponsive

// ============================================================================
// STORAGE HOOKS
// ============================================================================

// Re-export from unified storage system
export { usePersistentState } from '@/lib/storage'
