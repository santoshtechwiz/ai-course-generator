"use client"

import { useRouter } from 'next/navigation'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'
import { useGlobalLoaderStore } from './global-loaders'


// Custom router with loader integration
export function useRouterWithLoader() {
  const router = useRouter()
  const { startLoading, stopLoading } = useGlobalLoaderStore()
  
  const navigateWithLoader = useCallback((href: string, options?: { replace?: boolean }) => {
    // Dispatch custom event for route change detection
    window.dispatchEvent(new CustomEvent('navigation-start', { 
      detail: { href, options }
    }))
    
    // Perform navigation
    if (options?.replace) {
      router.replace(href)
    } else {
      router.push(href)
    }
  }, [router])

  const back = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigation-start', { 
      detail: { action: 'back' }
    }))
    router.back()
  }, [router])

  const forward = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigation-start', { 
      detail: { action: 'forward' }
    }))
    router.forward()
  }, [router])

  return {
    ...router,
    push: navigateWithLoader,
    replace: (href: string) => navigateWithLoader(href, { replace: true }),
    back,
    forward,
  }
}

// Enhanced route change detection with better UX
export function useAdvancedRouteLoaderBridge() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setRouteChangeState, startLoading, stopLoading } = useGlobalLoaderStore()
  
  const routeChangeId = useRef<string>()
  const isNavigatingRef = useRef(false)
  const routeStartTimeRef = useRef<number>()
  const previousPathnameRef = useRef<string>(pathname)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Detect route changes completion
  useEffect(() => {
    const currentPath = pathname + searchParams.toString()
    const previousPath = previousPathnameRef.current + (searchParams?.toString() || '')
    
    // Only trigger if actually navigating and path changed
    if (isNavigatingRef.current && currentPath !== previousPath) {
      const duration = routeStartTimeRef.current ? Date.now() - routeStartTimeRef.current : 0
      
      // Ensure minimum loading time for better UX (prevent flash)
      const minLoadingTime = 300
      const remainingTime = Math.max(0, minLoadingTime - duration)
      
      setTimeout(() => {
        if (routeChangeId.current) {
          stopLoading(routeChangeId.current, { success: true })
          routeChangeId.current = undefined
        }
        setRouteChangeState(false)
        isNavigatingRef.current = false
        routeStartTimeRef.current = undefined
      }, remainingTime)
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
    
    previousPathnameRef.current = pathname
  }, [pathname, searchParams, setRouteChangeState, stopLoading])

  // Navigation start handler
  const handleNavigationStart = useCallback((event: CustomEvent) => {
    // Clear any existing navigation
    if (routeChangeId.current) {
      stopLoading(routeChangeId.current, { success: false })
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    isNavigatingRef.current = true
    routeStartTimeRef.current = Date.now()
    setRouteChangeState(true)
    
    const { href, action } = event.detail || {}
    
    let message = 'Navigating...'
    let subMessage = 'Loading page'
    
    if (action === 'back') {
      message = 'Going back...'
      subMessage = 'Loading previous page'
    } else if (action === 'forward') {
      message = 'Going forward...'
      subMessage = 'Loading next page'
    } else if (href) {
      // Try to extract meaningful info from href
      try {
        const url = new URL(href, window.location.origin)
        const pathSegments = url.pathname.split('/').filter(Boolean)
        if (pathSegments.length > 0) {
          const lastSegment = pathSegments[pathSegments.length - 1]
          message = `Loading ${lastSegment}...`
          subMessage = `Navigating to ${url.pathname}`
        }
      } catch {
        // Fallback for invalid URLs
        message = 'Navigating...'
        subMessage = `Loading ${href}`
      }
    }
    
    routeChangeId.current = startLoading('route-change', {
      message,
      subMessage,
      isBlocking: false,
      priority: 'high',
      type: 'route',
      minVisibleMs: 300,
      maxDurationMs: 15000,
      showProgress: false,
      estimatedDuration: 2000, // Estimate based on typical page load
    })

    // Safety timeout to prevent stuck states
    timeoutRef.current = setTimeout(() => {
      if (routeChangeId.current && isNavigatingRef.current) {
        console.warn('Route change timeout reached, forcing completion')
        stopLoading(routeChangeId.current, { 
          success: false, 
          error: 'Navigation timeout' 
        })
        routeChangeId.current = undefined
        setRouteChangeState(false)
        isNavigatingRef.current = false
      }
    }, 15000)
  }, [setRouteChangeState, startLoading, stopLoading])

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('navigation-start', handleNavigationStart as EventListener)
    
    // Also listen for browser navigation events
    const handlePopState = () => {
      window.dispatchEvent(new CustomEvent('navigation-start', { 
        detail: { action: 'popstate' }
      }))
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('navigation-start', handleNavigationStart as EventListener)
      window.removeEventListener('popstate', handlePopState)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleNavigationStart])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (routeChangeId.current) {
        stopLoading(routeChangeId.current, { success: false })
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [stopLoading])
}

// Link component with integrated loader
interface LoaderLinkProps {
  href: string
  children: React.ReactNode
  replace?: boolean
  className?: string
  showLoader?: boolean
  loaderMessage?: string
  onClick?: () => void
}

export function LoaderLink({ 
  href, 
  children, 
  replace = false, 
  className = "",
  showLoader = true,
  loaderMessage,
  onClick,
}: LoaderLinkProps) {
  const router = useRouterWithLoader()
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (onClick) {
      onClick()
    }
    
    if (showLoader) {
      // Custom message based on href
      const customMessage = loaderMessage || (() => {
        try {
          const url = new URL(href, window.location.origin)
          const pathSegments = url.pathname.split('/').filter(Boolean)
          if (pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1]
            return `Loading ${lastSegment}...`
          }
        } catch {}
        return `Navigating to ${href}...`
      })()
      
      window.dispatchEvent(new CustomEvent('navigation-start', { 
        detail: { 
          href, 
          replace,
          customMessage 
        }
      }))
    }
    
    if (replace) {
      router.replace(href)
    } else {
      router.push(href)
    }
  }
  
  return (
    <a 
      href={href}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}

// Progress-aware route prefetching
export function usePrefetchWithProgress() {
  const router = useRouter()
  const { startLoading, stopLoading } = useGlobalLoaderStore()
  
  const prefetch = useCallback((href: string, options?: { priority?: boolean }) => {
    const prefetchId = `prefetch-${href}`
    
    startLoading(prefetchId, {
      message: 'Preparing page...',
      subMessage: `Pre-loading ${href}`,
      isBlocking: false,
      priority: 'low',
      type: 'route',
      showProgress: false,
      minVisibleMs: 100,
      maxDurationMs: 5000,
    })
    
    // Use Next.js prefetch
    router.prefetch(href, options)
    
    // Simulate prefetch completion (Next.js doesn't provide callback)
    setTimeout(() => {
      stopLoading(prefetchId, { success: true })
    }, 1000)
    
    return prefetchId
  }, [router, startLoading, stopLoading])
  
  return { prefetch }
}