"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { GlobalLoader } from "@/components/loaders/GlobalLoader"
import { useGlobalLoader } from "@/store/global-loader"

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { startLoading, stopLoading } = useGlobalLoader()

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null
    const handleStart = () => {
      // Only show loader if not already loading
      if (!timeout) {
        timeout = setTimeout(() => {
          startLoading({ message: "Loading..." })
        }, 100) // Small delay to avoid flicker
      }
    }
    const handleComplete = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      stopLoading()
    }

    // Listen to navigation events
    router.events?.on?.("routeChangeStart", handleStart)
    router.events?.on?.("routeChangeComplete", handleComplete)
    router.events?.on?.("routeChangeError", handleComplete)

    // Fallback: stop loader on pathname change (for app router)
    handleComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      {children}
      <GlobalLoader />
    </>
  )
}

export default GlobalLoaderProvider
