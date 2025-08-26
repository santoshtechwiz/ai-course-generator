"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { PageTransitionLoaderProps } from "@/app/types/types"
import { usePageLoading } from "./hooks"
import { LoadingOverlay } from "./GlobalLoader"


export function PageTransitionLoader({ enabled = true, delay = 200, timeout = 5000 }: PageTransitionLoaderProps) {
  const { startPageLoading, stopPageLoading, isPageLoading } = usePageLoading()
  const pathname = usePathname()

  useEffect(() => {
    if (!enabled) return

    let delayTimer: NodeJS.Timeout
    let timeoutTimer: NodeJS.Timeout

    const handleStart = () => {
      delayTimer = setTimeout(() => {
        startPageLoading("Loading page...")

        // Auto-stop after timeout to prevent infinite loading
        timeoutTimer = setTimeout(() => {
          stopPageLoading()
        }, timeout)
      }, delay)
    }

    const handleComplete = () => {
      clearTimeout(delayTimer)
      clearTimeout(timeoutTimer)
      stopPageLoading()
    }

    // Listen for navigation events
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState

    window.history.pushState = function (...args) {
      handleStart()
      return originalPush.apply(this, args)
    }

    window.history.replaceState = function (...args) {
      handleStart()
      return originalReplace.apply(this, args)
    }

    // Handle browser back/forward
    window.addEventListener("popstate", handleStart)

    // Stop loading when pathname changes (navigation complete)
    handleComplete()

    return () => {
      clearTimeout(delayTimer)
      clearTimeout(timeoutTimer)
      window.history.pushState = originalPush
      window.history.replaceState = originalReplace
      window.removeEventListener("popstate", handleStart)
      stopPageLoading()
    }
  }, [pathname, enabled, delay, timeout, startPageLoading, stopPageLoading])

  if (!isPageLoading) return null

  return <LoadingOverlay id="page-transition" />
}
