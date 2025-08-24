"use client"

import React, { useEffect } from "react"
import { GlobalLoader } from "@/components/loaders/GlobalLoader"
import { useAdvancedRouteLoaderBridge } from "@/components/loaders/RouteLoaderBridge"
import { useGlobalLoaderStore } from "@/store/loaders/global-loader"

interface GlobalLoaderProviderProps {
  children: React.ReactNode
  enableRouteLoading?: boolean
  enableNetworkDetection?: boolean
  enablePerformanceMonitoring?: boolean
  debugMode?: boolean
}

export function GlobalLoaderProvider({ 
  children,
  enableRouteLoading = true,
  enableNetworkDetection = true,
  enablePerformanceMonitoring = false,
  debugMode = false
}: GlobalLoaderProviderProps) {
  
  // Initialize route change detection
  if (enableRouteLoading) {
    useAdvancedRouteLoaderBridge()
  }

  // Network status detection
  useNetworkDetection(enableNetworkDetection)
  
  // Performance monitoring
  usePerformanceMonitoring(enablePerformanceMonitoring)
  
  // Debug mode
  useDebugMode(debugMode)

  return (
    <>
      {children}
      <GlobalLoader />
      {debugMode && <LoaderDebugPanel />}
    </>
  )
}

// Network detection hook
function useNetworkDetection(enabled: boolean) {
  const { startLoading, stopLoading } = useGlobalLoaderStore()

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let reconnectingId: string | undefined

    const handleOnline = () => {
      if (reconnectingId) {
        stopLoading(reconnectingId, { success: true })
        reconnectingId = undefined
      }
    }

    const handleOffline = () => {
      reconnectingId = startLoading('network-offline', {
        message: 'Connection lost',
        subMessage: 'Waiting for network connection...',
        isBlocking: false,
        priority: 'high',
        type: 'custom',
        allowCancel: false,
        maxDurationMs: 0, // Don't timeout
      })
    }

    // Check initial connection state
    if (!navigator.onLine) {
      handleOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (reconnectingId) {
        stopLoading(reconnectingId, { success: false })
      }
    }
  }, [enabled, startLoading, stopLoading])
}

// Performance monitoring hook
function usePerformanceMonitoring(enabled: boolean) {
  const { startLoading, stopLoading, updateProgress } = useGlobalLoaderStore()

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Monitor large resource loading
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          
          // Show loader for slow navigations
          if (navEntry.duration > 2000) {
            const loaderId = startLoading('slow-navigation', {
              message: 'Optimizing page...',
              subMessage: 'Loading additional resources',
              isBlocking: false,
              priority: 'low',
              type: 'route',
              showProgress: true,
            })

            // Simulate progress based on navigation timing
            const totalTime = navEntry.loadEventEnd - navEntry.navigationStart
            let currentTime = navEntry.domContentLoadedEventEnd - navEntry.navigationStart
            
            const progressInterval = setInterval(() => {
              if (currentTime < totalTime) {
                currentTime += 100
                const progress = (currentTime / totalTime) * 100
                updateProgress(loaderId, Math.min(progress, 95))
              } else {
                clearInterval(progressInterval)
                stopLoading(loaderId, { success: true })
              }
            }, 100)
          }
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['navigation', 'resource'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }

    return () => {
      observer.disconnect()
    }
  }, [enabled, startLoading, stopLoading, updateProgress])
}

// Debug mode hook
function useDebugMode(enabled: boolean) {
  const store = useGlobalLoaderStore()

  useEffect(() => {
    if (!enabled) return

    // Add global debug methods
    const globalDebug = {
      startTestLoader: (type: string = 'test') => {
        return store.startLoading(`debug-${type}`, {
          message: `Debug ${type} loader`,
          subMessage: 'This is a test loader',
          isBlocking: false,
          priority: 'medium',
          type: 'custom',
          showProgress: true,
          allowCancel: true,
          onCancel: () => console.log('Debug loader cancelled'),
        })
      },
      
      getAllInstances: () => {
        return Array.from(store.instances.entries())
      },
      
      clearAll: store.clearAll,
      
      simulateSlowOperation: async () => {
        const id = store.startLoading('slow-operation', {
          message: 'Simulating slow operation...',
          subMessage: 'This will take 10 seconds',
          isBlocking: true,
          priority: 'high',
          type: 'action',
          showProgress: true,
          allowCancel: true,
        })

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          store.updateProgress(id, i, `Progress: ${i}%`)
        }

        store.stopLoading(id, { success: true })
      },
    }

    // @ts-ignore - Adding debug methods to window
    window.loaderDebug = globalDebug

    console.log('🔧 Loader Debug Mode Enabled')
    console.log('Available methods:', Object.keys(globalDebug))
    console.log('Usage: window.loaderDebug.startTestLoader()')

    return () => {
      // @ts-ignore
      delete window.loaderDebug
    }
  }, [enabled, store])
}

// Debug panel component
function LoaderDebugPanel() {
  const { allInstances, activeInstanceId, routeChangeInProgress } = useGlobalLoaderStore()

  if (allInstances.length === 0 && !routeChangeInProgress) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/90 text-white p-4 rounded-lg text-xs font-mono max-w-md">
      <div className="mb-2 font-semibold text-yellow-400">
        🔧 Loader Debug Panel
      </div>
      
      <div className="space-y-1">
        <div>Active ID: {activeInstanceId || 'none'}</div>
        <div>Route Change: {routeChangeInProgress ? '✅' : '❌'}</div>
        <div>Total Instances: {allInstances.length}</div>
      </div>

      {allInstances.length > 0 && (
        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
          <div className="font-semibold text-blue-400">Active Loaders:</div>
          {allInstances.map((instance) => (
            <div 
              key={instance.id}
              className={`p-2 rounded border ${
                instance.id === activeInstanceId 
                  ? 'border-green-400 bg-green-900/20' 
                  : 'border-gray-600 bg-gray-800/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{instance.id}</span>
                <span className={`px-1 rounded text-xs ${
                  instance.state === 'loading' ? 'bg-blue-600' :
                  instance.state === 'success' ? 'bg-green-600' :
                  instance.state === 'error' ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                  {instance.state}
                </span>
              </div>
              
              <div className="text-gray-300 mt-1">
                <div>Type: {instance.options.type}</div>
                <div>Priority: {instance.options.priority}</div>
                <div>Blocking: {instance.options.isBlocking ? '✅' : '❌'}</div>
                <div>Progress: {instance.options.progress}%</div>
                <div>Message: {instance.options.message}</div>
                <div>Duration: {Date.now() - instance.startTime}ms</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GlobalLoaderProvider