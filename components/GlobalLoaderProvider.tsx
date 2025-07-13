"use client"

import React, { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { GlobalLoader } from "@/components/loaders/GlobalLoader"
import { useGlobalLoader } from "@/store/global-loader"

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { startLoading, stopLoading } = useGlobalLoader()
  const previousPath = useRef<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only act if pathname actually changed
    if (previousPath.current !== null && previousPath.current !== pathname) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      // Small delay to avoid flicker on fast routes
      timeoutRef.current = setTimeout(() => {
        startLoading({ message: "Loading...", isBlocking: true })
      }, 100)

      // Simulate load finish
      const finish = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        stopLoading()
      }

      // Add artificial delay to allow user to see loading (optional)
      setTimeout(finish, 500)
    }

    previousPath.current = pathname
  }, [pathname, startLoading, stopLoading])

  return (
    <>
      {children}
      <GlobalLoader />
    </>
  )
}

export default GlobalLoaderProvider
