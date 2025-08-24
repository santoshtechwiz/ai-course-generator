"use client"

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useRouter } from 'next/navigation'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'

export type LoaderState = 'idle' | 'loading' | 'success' | 'error'
export type LoaderPriority = 'low' | 'medium' | 'high' | 'critical'
export type LoaderType = 'route' | 'action' | 'data' | 'upload' | 'custom'

export interface LoaderOptions {
  message?: string
  subMessage?: string
  progress?: number
  isBlocking?: boolean
  minVisibleMs?: number
  maxDurationMs?: number
  priority?: LoaderPriority
  type?: LoaderType
  showProgress?: boolean
  allowCancel?: boolean
  onCancel?: () => void
  metadata?: Record<string, any>
}

interface LoaderInstance {
  id: string
  state: LoaderState
  options: Required<Omit<LoaderOptions, 'onCancel' | 'metadata'>> & { 
    onCancel?: () => void
    metadata?: Record<string, any>
  }
  startTime: number
  error?: string
  estimatedDuration?: number
}

interface GlobalLoaderState {
  instances: Map<string, LoaderInstance>
  activeInstance: LoaderInstance | null
  routeChangeInProgress: boolean
  routeChangeStartTime?: number
  queuedOperations: Array<{ id: string; action: 'start' | 'stop'; options?: LoaderOptions }>
}

interface GlobalLoaderActions {
  startLoading: (id: string, options?: LoaderOptions) => void
  stopLoading: (id: string, result?: { success: boolean; error?: string }) => void
  updateProgress: (id: string, progress: number, message?: string) => void
  cancelLoading: (id: string) => void
  clearAll: () => void
  setRouteChangeState: (inProgress: boolean) => void
}

const DEFAULT_OPTIONS: Required<Omit<LoaderOptions, 'onCancel' | 'metadata'>> = {
  message: 'Loading...',
  subMessage: '',
  progress: 0,
  isBlocking: false,
  minVisibleMs: 300,
  maxDurationMs: 30000,
  priority: 'medium',
  type: 'custom',
  showProgress: false,
  allowCancel: false,
}

const PRIORITY_ORDER: Record<LoaderPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

// Create the store with subscriptions
export const useGlobalLoaderStore = create<GlobalLoaderState & GlobalLoaderActions>()(
  subscribeWithSelector((set, get) => ({
    instances: new Map(),
    activeInstance: null,
    routeChangeInProgress: false,
    routeChangeStartTime: undefined,
    queuedOperations: [],

    startLoading: (id: string, options: LoaderOptions = {}) => {
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
      const instance: LoaderInstance = {
        id,
        state: 'loading',
        options: mergedOptions,
        startTime: Date.now(),
        estimatedDuration: options.type === 'route' ? 1500 : undefined,
      }

      set(state => {
        const newInstances = new Map(state.instances)
        newInstances.set(id, instance)
        
        // Determine the highest priority active instance
        const activeInstance = Array.from(newInstances.values())
          .filter(inst => inst.state === 'loading')
          .sort((a, b) => PRIORITY_ORDER[b.options.priority] - PRIORITY_ORDER[a.options.priority])[0] || null

        return {
          ...state,
          instances: newInstances,
          activeInstance,
        }
      })

      // Auto-timeout handling
      if (mergedOptions.maxDurationMs > 0) {
        setTimeout(() => {
          const currentState = get()
          const currentInstance = currentState.instances.get(id)
          if (currentInstance?.state === 'loading') {
            get().stopLoading(id, { success: false, error: 'Operation timed out' })
          }
        }, mergedOptions.maxDurationMs)
      }
    },

    stopLoading: (id: string, result: { success: boolean; error?: string } = { success: true }) => {
      set(state => {
        const instance = state.instances.get(id)
        if (!instance) return state

        const duration = Date.now() - instance.startTime
        const minDuration = instance.options.minVisibleMs
        
        const updateInstance = (newState: LoaderState) => {
          const newInstances = new Map(state.instances)
          newInstances.set(id, {
            ...instance,
            state: newState,
            error: result.error,
          })

          // Update active instance
          const activeInstance = Array.from(newInstances.values())
            .filter(inst => inst.state === 'loading')
            .sort((a, b) => PRIORITY_ORDER[b.options.priority] - PRIORITY_ORDER[a.options.priority])[0] || null

          return {
            ...state,
            instances: newInstances,
            activeInstance,
          }
        }

        // If minimum duration hasn't passed, delay the state change
        if (duration < minDuration) {
          const remainingTime = minDuration - duration
          setTimeout(() => {
            set(currentState => {
              const currentInstance = currentState.instances.get(id)
              if (currentInstance && currentInstance.state === 'loading') {
                return updateInstance(result.success ? 'success' : 'error')
              }
              return currentState
            })
          }, remainingTime)
          
          return state // Don't update immediately
        }

        return updateInstance(result.success ? 'success' : 'error')
      })

      // Auto-clear success/error states after delay
      setTimeout(() => {
        set(state => {
          const instance = state.instances.get(id)
          if (instance && (instance.state === 'success' || instance.state === 'error')) {
            const newInstances = new Map(state.instances)
            newInstances.delete(id)
            
            const activeInstance = Array.from(newInstances.values())
              .filter(inst => inst.state === 'loading')
              .sort((a, b) => PRIORITY_ORDER[b.options.priority] - PRIORITY_ORDER[a.options.priority])[0] || null

            return {
              ...state,
              instances: newInstances,
              activeInstance,
            }
          }
          return state
        })
      }, result.success ? 1500 : 3000)
    },

    updateProgress: (id: string, progress: number, message?: string) => {
      set(state => {
        const instance = state.instances.get(id)
        if (!instance || instance.state !== 'loading') return state

        const newInstances = new Map(state.instances)
        newInstances.set(id, {
          ...instance,
          options: {
            ...instance.options,
            progress: Math.max(0, Math.min(100, progress)),
            message: message || instance.options.message,
          }
        })

        return {
          ...state,
          instances: newInstances,
          activeInstance: state.activeInstance?.id === id 
            ? newInstances.get(id) || null 
            : state.activeInstance
        }
      })
    },

    cancelLoading: (id: string) => {
      const state = get()
      const instance = state.instances.get(id)
      
      if (instance?.options.onCancel) {
        instance.options.onCancel()
      }
      
      get().stopLoading(id, { success: false, error: 'Operation cancelled' })
    },

    clearAll: () => {
      set({
        instances: new Map(),
        activeInstance: null,
        routeChangeInProgress: false,
        routeChangeStartTime: undefined,
        queuedOperations: [],
      })
    },

    setRouteChangeState: (inProgress: boolean) => {
      set(state => ({
        ...state,
        routeChangeInProgress: inProgress,
        routeChangeStartTime: inProgress ? Date.now() : undefined,
      }))
    },
  }))
)

// Hook for consuming the loader state
export function useGlobalLoader(watchId?: string) {
  const store = useGlobalLoaderStore()
  const { 
    instances, 
    activeInstance, 
    routeChangeInProgress,
    startLoading: storeStartLoading,
    stopLoading: storeStopLoading,
    updateProgress: storeUpdateProgress,
    cancelLoading: storeCancelLoading,
    clearAll,
  } = store

  // If watching a specific instance
  const watchedInstance = watchId ? instances.get(watchId) : activeInstance

  const startLoading = useCallback((options?: LoaderOptions) => {
    const id = watchId || `loader-${Date.now()}-${Math.random().toString(36).slice(2)}`
    storeStartLoading(id, options)
    return id
  }, [watchId, storeStartLoading])

  const stopLoading = useCallback((idOrResult?: string | { success: boolean; error?: string }, result?: { success: boolean; error?: string }) => {
    if (typeof idOrResult === 'string') {
      storeStopLoading(idOrResult, result)
    } else if (watchId) {
      storeStopLoading(watchId, idOrResult)
    }
  }, [watchId, storeStopLoading])

  const updateProgress = useCallback((progressOrId: number | string, progress?: number, message?: string) => {
    if (typeof progressOrId === 'number' && watchId) {
      storeUpdateProgress(watchId, progressOrId, progress as string)
    } else if (typeof progressOrId === 'string') {
      storeUpdateProgress(progressOrId, progress!, message)
    }
  }, [watchId, storeUpdateProgress])

  const cancelLoading = useCallback((id?: string) => {
    storeCancelLoading(id || watchId!)
  }, [watchId, storeCancelLoading])

  return {
    // State
    state: watchedInstance?.state || 'idle',
    isLoading: watchedInstance?.state === 'loading',
    message: watchedInstance?.options.message || '',
    subMessage: watchedInstance?.options.subMessage || '',
    progress: watchedInstance?.options.progress || 0,
    isBlocking: watchedInstance?.options.isBlocking || false,
    error: watchedInstance?.error,
    allowCancel: watchedInstance?.options.allowCancel || false,
    showProgress: watchedInstance?.options.showProgress || false,
    type: watchedInstance?.options.type || 'custom',
    priority: watchedInstance?.options.priority || 'medium',
    routeChangeInProgress,
    
    // Actions
    startLoading,
    stopLoading,
    updateProgress,
    cancelLoading,
    clearAll,
    
    // Instance info
    instanceId: watchedInstance?.id,
    startTime: watchedInstance?.startTime,
    estimatedDuration: watchedInstance?.estimatedDuration,
    
    // All instances (for debugging)
    allInstances: Array.from(instances.values()),
    activeInstanceId: activeInstance?.id,
  }
}

// Route change detection hook
export function useRouteLoaderBridge() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setRouteChangeState, startLoading, stopLoading } = useGlobalLoaderStore()
  const routeChangeId = useRef<string>()
  const isNavigatingRef = useRef(false)
  
  // Detect route changes
  useEffect(() => {
    if (isNavigatingRef.current) {
      // Route change completed
      if (routeChangeId.current) {
        stopLoading(routeChangeId.current, { success: true })
        routeChangeId.current = undefined
      }
      setRouteChangeState(false)
      isNavigatingRef.current = false
    }
  }, [pathname, searchParams, setRouteChangeState, stopLoading])

  // Listen for navigation start (this requires custom implementation in your app)
  useEffect(() => {
    const handleRouteChangeStart = () => {
      isNavigatingRef.current = true
      setRouteChangeState(true)
      
      routeChangeId.current = startLoading('route-change', {
        message: 'Navigating...',
        subMessage: 'Loading new page',
        isBlocking: false,
        priority: 'high',
        type: 'route',
        minVisibleMs: 200,
        maxDurationMs: 10000,
      })
    }

    // Custom event listener (you'll need to dispatch this in your navigation logic)
    window.addEventListener('navigation-start', handleRouteChangeStart)
    
    return () => {
      window.removeEventListener('navigation-start', handleRouteChangeStart)
    }
  }, [setRouteChangeState, startLoading])
}

// Backward compatibility exports - maintain existing API
export type { LoaderState, LoaderOptions }