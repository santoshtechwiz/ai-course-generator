"use client"

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useGlobalLoading } from '@/store/slices/global-loading-slice'

/**
 * Hook that automatically manages loading state during navigation
 * This ensures a consistent loading experience across route changes
 */
export function useNavigationLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { showLoading, hideLoading } = useGlobalLoading()
  const loaderIdRef = useRef<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Hide any existing navigation loader
    if (loaderIdRef.current) {
      hideLoading(loaderIdRef.current)
      loaderIdRef.current = null
    }

    // Small delay to prevent flicker on fast navigations
    timeoutRef.current = setTimeout(() => {
      // Show loader for navigation
      loaderIdRef.current = showLoading({
        message: "Loading page...",
        variant: 'spinner',
        size: 'md',
        theme: 'primary',
        isBlocking: true,
        priority: 10 // High priority for navigation
      })

      // Auto-hide after reasonable time (fallback)
      timeoutRef.current = setTimeout(() => {
        if (loaderIdRef.current) {
          hideLoading(loaderIdRef.current)
          loaderIdRef.current = null
        }
      }, 5000)
    }, 100)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (loaderIdRef.current) {
        hideLoading(loaderIdRef.current)
      }
    }
  }, [pathname, searchParams, showLoading, hideLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loaderIdRef.current) {
        hideLoading(loaderIdRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [hideLoading])
}

export default useNavigationLoader
