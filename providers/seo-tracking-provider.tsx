"use client"

import React, { createContext, useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation'

// SEO Context
const SEOContext = createContext<{
  trackPageView: (url: string) => void
}>({
  trackPageView: () => {},
})

export const useSEO = () => useContext(SEOContext)

export function SEOTrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Track page views
  const trackPageView = (url: string) => {
    // Implement analytics tracking here
    // Example: Google Analytics, Plausible, etc.
    if (process.env.NODE_ENV === 'production') {
      console.log(`Page view tracked: ${url}`)
      // Add your analytics tracking code here
    }
  }

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname])

  return (
    <SEOContext.Provider value={{ trackPageView }}>
      {children}
    </SEOContext.Provider>
  )
}
