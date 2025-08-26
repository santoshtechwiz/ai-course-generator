"use client"

import { useEffect, useState, useContext } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"
import "@/styles/nprogress.css"
import { LoaderContext } from "./loader-context"

// Configure NProgress with improved settings
NProgress.configure({
  minimum: 0.3,
  easing: 'ease-in-out',
  speed: 500,
  showSpinner: false,
  trickleSpeed: 200,
  parent: '#nprogress-container',
  template: '<div class="bar" role="bar"></div>'
})

interface GlobalLoaderProviderProps {
  children: React.ReactNode
}

function GlobalLoadingProvider({ children }: GlobalLoaderProviderProps) {
  const [isLoading, setLoading] = useState(false)
  const currentPathname = usePathname()
  const currentSearchParams = useSearchParams()
  
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout | undefined
    let completeTimeout: NodeJS.Timeout | undefined

    // Immediately trigger a brief progress pulse on route/search changes
    if (completeTimeout) clearTimeout(completeTimeout)
    loadingTimeout = setTimeout(() => {
      setLoading(true)
      NProgress.start()
      completeTimeout = setTimeout(() => {
        NProgress.done(true)
        setLoading(false)
      }, 200)
    }, 50)

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout)
      if (completeTimeout) clearTimeout(completeTimeout)
      NProgress.done(true)
    }
  }, [currentPathname, currentSearchParams])

  return (
    <LoaderContext.Provider value={{ isLoading, setLoading }}>
      <div id="nprogress-container" className="relative w-full">
        <div id="nprogress-parent" className="contents">
          {children}
        </div>
      </div>
    </LoaderContext.Provider>
  )
}

export { GlobalLoadingProvider }
export default GlobalLoadingProvider
