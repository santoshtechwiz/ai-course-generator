"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function NavigationDebugger() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    console.log("🛣️ NAVIGATION DEBUG:", {
      pathname,
      href: window.location.href,
      timestamp: new Date().toISOString()
    })

    // Override router.push to track redirects
    const originalPush = router.push
    router.push = function(href, options) {
      console.log("🔀 ROUTER.PUSH DETECTED:", {
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
        console.log("🌐 WINDOW.LOCATION CHANGED:", {
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

  return null
}
