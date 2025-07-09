"use client"

import React, { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { GlobalLoader } from './GlobalLoader'
import { useGlobalLoader } from '@/store/global-loader'

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startLoading, stopLoading } = useGlobalLoader()
  // Handle navigation loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let loaderShown = false

    // Show loader with a slight delay to prevent flicker on fast navigations
    timeoutId = setTimeout(() => {
      startLoading({ 
        message: 'Loading page...', 
        isBlocking: false 
      })
      loaderShown = true
    }, 100)

    // Hide loader when navigation completes
    const hideLoader = () => {
      clearTimeout(timeoutId)
      if (loaderShown) {
        stopLoading()
      }
    }

    // Call hideLoader immediately to ensure it runs on initial render and route changes
    hideLoader()

    // Clean up on route change
    return hideLoader
  }, [pathname, searchParams, startLoading, stopLoading])

  // Clean up any stray loaders on mount
  useEffect(() => {
    stopLoading()
  }, [stopLoading])

  return (
    <>
      {children}
      <GlobalLoader />
    </>
  )
}

export default GlobalLoaderProvider
