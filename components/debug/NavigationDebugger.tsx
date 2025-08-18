"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { nav } from "@/lib/utils/logger"

export default function NavigationDebugger() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') return

    nav("Navigation change detected", {
      pathname,
      href: window.location.href,
      timestamp: new Date().toISOString()
    })

    // Override router.push to track redirects
    const originalPush = router.push
    router.push = function(href, options) {
      nav("Router push detected", {
        from: window.location.href,
        to: href,
        timestamp: new Date().toISOString()
      })
      return originalPush.call(this, href, options)
    }

    // Track window.location changes
    const originalLocation = window.location.href
    const checkLocation = () => {
      if (window.location.href !== originalLocation) {
        nav("Window location changed", {
          from: originalLocation,
          to: window.location.href,
          timestamp: new Date().toISOString()
        })
      }
    }

    const interval = setInterval(checkLocation, 100)
    
    return () => {
      clearInterval(interval)
      router.push = originalPush
    }
  }, [pathname, router])

  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return null
}
