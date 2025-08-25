"use client"

import { useRouter } from 'next/navigation'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'
import { useGlobalLoaderStore, ROUTE_LOADER_ID } from './global-loaders'


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
/**
 * Advanced route change bridge.
 * Responsibilities:
 *  - Listen for explicit custom events (navigation-start) fired by custom navigation helpers.
 *  - Intercept native in-app link clicks (client-side navigation) and emit loader start.
 *  - Track completion by observing pathname+search changes and enforce a minimum visible duration.
 *  - Provide deterministic loader instance id ("route-change").
 *  - Allow being disabled without violating React's rules (hook is always called, early exit if disabled).
 */
export function useAdvancedRouteLoaderBridge(enabled: boolean = true) {
  // Early no-op (still a hook call each render to satisfy Rules of Hooks)
  if (!enabled) {
    return
  }
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setRouteChangeState, startLoading, stopLoading } = useGlobalLoaderStore()
  
  const routeChangeId = useRef<string | null>(null)
  const isNavigatingRef = useRef(false)
  const routeStartTimeRef = useRef<number>(undefined)
  const previousPathnameRef = useRef<string>(pathname)
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)

  // Detect route changes completion with improved synchronization
  useEffect(() => {
    const currentPath = pathname + searchParams.toString()
    const previousPath = previousPathnameRef.current + (searchParams?.toString() || '')
    
    // Only trigger if actually navigating and path changed
    if (isNavigatingRef.current && currentPath !== previousPath) {
      const duration = routeStartTimeRef.current ? Date.now() - routeStartTimeRef.current : 0
      
      // Ensure minimum loading time for better UX (prevent flash)
      const minLoadingTime = 500 // Increased for better UX
      const remainingTime = Math.max(0, minLoadingTime - duration)
      
      // Create a promise that resolves after remainingTime
      const delayPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          resolve()
        }, remainingTime)
      })

      // Wait for both delay and any pending Suspense boundaries
      Promise.resolve().then(async () => {
        try {
          await delayPromise
          
          if (routeChangeId.current) {
            stopLoading(routeChangeId.current, { success: true })
            routeChangeId.current = null
          }
          
          setRouteChangeState(false)
          isNavigatingRef.current = false
          routeStartTimeRef.current = undefined
          
        } catch (error) {
          console.error('Error completing route change:', error)
          if (routeChangeId.current) {
            stopLoading(routeChangeId.current, { 
              success: false,
              error: 'Failed to complete navigation'
            })
          }
        }
      })
      
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

    // Reuse existing active route loader if one is in progress
    const state = useGlobalLoaderStore.getState()
    const existingRoute = Array.from(state.instances.values()).find(i => i.state === 'loading' && i.options.type === 'route')
    if (existingRoute) {
      routeChangeId.current = existingRoute.id
      isNavigatingRef.current = true
      setRouteChangeState(true)
      return
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
    
  routeChangeId.current = startLoading(ROUTE_LOADER_ID, {
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
        routeChangeId.current = null
        setRouteChangeState(false)
        isNavigatingRef.current = false
      }
    }, 15000)
  }, [setRouteChangeState, startLoading, stopLoading])

  // Setup event listeners (custom events + popstate + global link interception)
  useEffect(() => {
    const navStartListener = handleNavigationStart as EventListener
    window.addEventListener('navigation-start', navStartListener)

    // Browser history navigation
    const handlePopState = () => {
      window.dispatchEvent(new CustomEvent('navigation-start', { detail: { action: 'popstate' } }))
    }
    window.addEventListener('popstate', handlePopState)

    // Global link click interception (capture phase)
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      // Only left clicks
      if (e.button !== 0) return
      // Traverse up to find anchor
      let el = e.target as HTMLElement | null
      while (el && el.tagName !== 'A') {
        el = el.parentElement
      }
      if (!el) return
      const anchor = el as HTMLAnchorElement
      // Ignore external links or with target _blank
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') && !href.startsWith(window.location.origin)) return
      if (anchor.target === '_blank') return
      // Same-page hash navigation skip
      if (href.startsWith('#')) return
      // Ignore if modifier attribute data-no-loader present
      if (anchor.dataset?.noLoader === 'true') return

      // If path changes, trigger navigation start BEFORE Next.js intercepts
      try {
        const url = new URL(href, window.location.origin)
        const nextPath = url.pathname + url.search
        const currentPath = window.location.pathname + window.location.search
        if (nextPath !== currentPath) {
          window.dispatchEvent(new CustomEvent('navigation-start', { detail: { href } }))
        }
      } catch {
        // Fallback: still dispatch generic
        window.dispatchEvent(new CustomEvent('navigation-start', { detail: { href } }))
      }
    }
    document.addEventListener('click', handleDocumentClick, true) // capture

    return () => {
      window.removeEventListener('navigation-start', navStartListener)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleDocumentClick, true)
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
    router.prefetch(href)
    
    // Simulate prefetch completion (Next.js doesn't provide callback)
    setTimeout(() => {
      stopLoading(prefetchId, { success: true })
    }, 1000)
    
    return prefetchId
  }, [router, startLoading, stopLoading])
  
  return { prefetch }
}