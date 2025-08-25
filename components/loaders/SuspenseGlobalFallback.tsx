"use client"

import { useEffect, useRef, useCallback } from "react"


interface SuspenseFallbackProps {
  message?: string
  type?: 'route' | 'action' | 'data' | 'upload' | 'custom'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  showProgress?: boolean
  estimatedDuration?: number
  fallbackId?: string
  onTimeout?: () => void
  timeoutMs?: number
}

// Quadratic easing function for smooth progress
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/**
 * Enhanced Suspense fallback with intelligent loading states and better UX.
 * This component triggers a global loader when a Suspense boundary is hit and
 * ensures proper cleanup when content is loaded.
 */
export function SuspenseGlobalFallback({ 
  message = "Loading content...",
  type = 'route',
  priority = 'high',
  showProgress = false,
  estimatedDuration,
  fallbackId,
  onTimeout,
  timeoutMs = 15000
}: SuspenseFallbackProps) {
  const store = useGlobalLoader()
  const { startLoading, stopLoading, updateProgress } = store
  
  // Use refs to maintain state across re-renders
  const loadingIdRef = useRef<string | undefined>(undefined)
  const stoppedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // Generate stable, deterministic ID for this fallback instance
  const instanceId = fallbackId || `suspense-${type}-${Date.now()}`
  
  // Track whether this is the first render
  const isFirstRender = useRef(true)

  // Enhanced cleanup with better state handling
  const cleanup = useCallback(() => {
    // Clear all timers first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = undefined
    }

    // Stop the loading state if it's still active
    if (loadingIdRef.current && !stoppedRef.current) {
      try {
        stopLoading(loadingIdRef.current, { success: true })
        loadingIdRef.current = undefined
        stoppedRef.current = true
      } catch (e) {
        console.warn('Failed to stop loading on cleanup:', e)
      }
    }

    // Reset first render flag
    isFirstRender.current = false
  }, [stopLoading])

  const handleTimeout = useCallback(() => {
    if (!stoppedRef.current) {
      console.warn(`SuspenseGlobalFallback: timeout reached (${timeoutMs}ms), stopping loader`)
      
      if (onTimeout) {
        onTimeout()
      }
      
      if (loadingIdRef.current) {
        try {
          stopLoading(loadingIdRef.current, { 
            success: false, 
            error: 'Loading timeout - please refresh the page' 
          })
        } catch (e) {
          console.warn('Failed to stop loading on timeout:', e)
        }
        stoppedRef.current = true
      }
    }
  }, [onTimeout, timeoutMs, stopLoading])

  useEffect(() => {
    // Skip if already initialized or stopped
    if (!isFirstRender.current || loadingIdRef.current || stoppedRef.current) {
      return
    }

    try {
      // Start the loading state with deterministic behavior
      const id = startLoading({
        message,
        subMessage: type === 'route' ? 'Loading page content...' : 'Loading content...',
        isBlocking: type === 'route' || priority === 'critical',
        priority,
        type,
        showProgress: showProgress || !!estimatedDuration,
        minVisibleMs: type === 'route' ? 500 : 300,
        maxDurationMs: timeoutMs,
        estimatedDuration,
        // Prevent merging with route loaders for Suspense boundaries
        combineWithRoute: false,
        // Use instance ID as metadata for debugging
        metadata: { instanceId }
      })

      loadingIdRef.current = id

      // Setup deterministic progress updates if duration is known
      if (estimatedDuration && showProgress && loadingIdRef.current) {
        let elapsedTime = 0
        const updateInterval = Math.min(estimatedDuration / 100, 1000) // Max 1 update per second
        let progress = 0
        const progressIncrement = 100 / (estimatedDuration / 200) // Update every 200ms
        
        // Use a smoothed progress simulation
        progressIntervalRef.current = setInterval(() => {
          elapsedTime += updateInterval
          
          // Calculate progress with easing
          const progressRatio = Math.min(elapsedTime / estimatedDuration, 0.9) // Cap at 90%
          progress = easeInOutQuad(progressRatio) * 100
          
          if (loadingIdRef.current && !stoppedRef.current) {
            updateProgress(loadingIdRef.current, progress)
          }
          
          // Stop updating if we hit 90%
          if (progress >= 90) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = undefined
            }
          }
        }, updateInterval)
      }

      // Setup timeout handler with proper cleanup
      timeoutRef.current = setTimeout(() => {
        handleTimeout()
        cleanup()
      }, timeoutMs)

    } catch (error) {
      console.warn('Failed to start suspense loading:', error)
      // Ensure we clean up on error
      cleanup()
    }

    // Return cleanup function for useEffect
    return () => {
      cleanup()
    }
  }, [
    instanceId, 
    message, 
    type, 
    priority, 
    showProgress, 
    estimatedDuration, 
    timeoutMs, 
    startLoading, 
    updateProgress, 
    handleTimeout, 
    cleanup
  ])

  // Return accessible loading indicator
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || "Loading content, please wait"}
      className="sr-only"
    >
      <span>{message || "Loading..."}</span>
    </div>
  )
}

// Smart fallback that adapts based on context
export function AdaptiveSuspenseFallback({ 
  context = 'page',
  ...props 
}: SuspenseFallbackProps & { 
  context?: 'page' | 'component' | 'modal' | 'form' | 'data'
}) {
  const getAdaptiveProps = (): Partial<SuspenseFallbackProps> => {
    switch (context) {
      case 'page':
        return {
          message: 'Loading page...',
          type: 'route',
          priority: 'high',
          showProgress: true,
          estimatedDuration: 2000,
          timeoutMs: 15000,
        }
      case 'modal':
        return {
          message: 'Opening...',
          type: 'action',
          priority: 'medium',
          showProgress: false,
          timeoutMs: 8000,
        }
      case 'form':
        return {
          message: 'Processing...',
          type: 'action',
          priority: 'high',
          showProgress: true,
          estimatedDuration: 3000,
          timeoutMs: 20000,
        }
      case 'data':
        return {
          message: 'Loading data...',
          type: 'data',
          priority: 'medium',
          showProgress: false,
          estimatedDuration: 1500,
          timeoutMs: 10000,
        }
      case 'component':
      default:
        return {
          message: 'Loading...',
          type: 'custom',
          priority: 'medium',
          showProgress: false,
          timeoutMs: 8000,
        }
    }
  }

  const adaptiveProps = getAdaptiveProps()
  const mergedProps = { ...adaptiveProps, ...props }

  return <SuspenseGlobalFallback {...mergedProps} />
}

// Utility functions
function getSubMessage(type: SuspenseFallbackProps['type']): string {
  switch (type) {
    case 'route':
      return 'Preparing your page...'
    case 'data':
      return 'Fetching latest information...'
    case 'action':
      return 'Processing your request...'
    case 'upload':
      return 'Handling file upload...'
    default:
      return 'Please wait while we load content...'
  }
}

function getMinVisibleTime(
  type: SuspenseFallbackProps['type'], 
  priority: SuspenseFallbackProps['priority']
): number {
  // Critical operations show immediately
  if (priority === 'critical') return 0
  
  // Fast operations for better perceived performance
  if (priority === 'high') return 200
  
  switch (type) {
    case 'route':
      return 300 // Route changes benefit from slight delay to prevent flash
    case 'data':
      return 250 // Data loading can be quick
    case 'action':
      return 400 // Actions benefit from visible feedback
    case 'upload':
      return 500 // Uploads are expected to take time
    default:
      return 300
  }
}

// HOC for wrapping components with adaptive suspense
export function withAdaptiveSuspense<T extends {}>(
  Component: React.ComponentType<T>,
  fallbackProps: Partial<SuspenseFallbackProps> = {}
) {
  const WrappedComponent = (props: T) => {
    return (
      <React.Suspense 
        fallback={<AdaptiveSuspenseFallback {...fallbackProps} />}
      >
        <Component {...props} />
      </React.Suspense>
    )
  }
  
  WrappedComponent.displayName = `withAdaptiveSuspense(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// React import for the HOC
import React from 'react'
import { useGlobalLoader } from "./global-loaders"

export default SuspenseGlobalFallback