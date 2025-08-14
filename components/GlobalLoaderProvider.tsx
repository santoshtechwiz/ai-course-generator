"use client"

import React, { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { GlobalLoader } from "@/components/loaders/GlobalLoader"
import { useGlobalLoader } from "@/store/loaders/global-loader"

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { startLoading, stopLoading } = useGlobalLoader()
  const previousPath = useRef<string | null>(null)
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only act if pathname actually changed and it's not the initial render
    if (previousPath.current !== null && previousPath.current !== pathname) {
      // Clear any existing timeouts
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
        delayTimeoutRef.current = null
      }
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current)
        finishTimeoutRef.current = null
      }

      // Small delay to avoid flicker on fast routes
      delayTimeoutRef.current = setTimeout(() => {
        startLoading({ 
          message: "Loading...", 
          isBlocking: true,
          minVisibleMs: 250,
          autoProgress: true,
        })
        
        // Clear the delay timeout as it's no longer needed
        delayTimeoutRef.current = null
        
        // Set finish timeout
        finishTimeoutRef.current = setTimeout(() => {
          stopLoading()
          finishTimeoutRef.current = null
        }, 150)
      }, 100)
    }

    previousPath.current = pathname

    // Cleanup function
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
        delayTimeoutRef.current = null
      }
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current)
        finishTimeoutRef.current = null
      }
    }
  }, [pathname, startLoading, stopLoading])

  return (
    <>
      {children}
      <GlobalLoader />
    </>
  )
}

export default GlobalLoaderProvider
