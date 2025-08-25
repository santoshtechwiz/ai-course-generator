"use client"

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useRouter } from 'next/navigation'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'

export type LoaderState = 'idle' | 'loading' | 'success' | 'error'
export type LoaderPriority = 'low' | 'medium' | 'high' | 'critical'
export type LoaderType = 'route' | 'action' | 'data' | 'upload' | 'custom'

export interface GlobalLoaderState {
  instances: Map<string, LoaderInstance>
  activeInstance: LoaderInstance | null
  routeChangeInProgress: boolean
  routeChangeStartTime?: number
  queuedOperations: Array<{ id: string; action: 'start' | 'stop'; options?: LoaderOptions }>
  nextId: number
}

export interface GlobalLoaderActions {
  startLoading: (id?: string, options?: LoaderOptions) => string
  stopLoading: (id: string, result?: { success: boolean; error?: string }) => void
  updateProgress: (id: string, progress: number, message?: string) => void
  cancelLoading: (id: string) => void
  clearAll: () => void
  setRouteChangeState: (inProgress: boolean) => void
}

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
  estimatedDuration?: number
  // Auto progress simulation: if true, progress will advance until stopped
  autoProgress?: boolean
  // When true (default) a non-route loader will merge into the active route loader
  // instead of spawning a second overlay during initial page hydration.
  combineWithRoute?: boolean
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

export type GlobalLoaderStore = {
  instances: Map<string, LoaderInstance>
  activeInstance: LoaderInstance | null
  routeChangeInProgress: boolean
  routeChangeStartTime?: number
  queuedOperations: Array<{ id: string; action: 'start' | 'stop'; options?: LoaderOptions }>
  nextId: number
  // Actions
  startLoading: (id?: string, options?: LoaderOptions) => string
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
  autoProgress: false,
  combineWithRoute: true,
  estimatedDuration: 0,
}

const PRIORITY_ORDER: Record<LoaderPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

// Canonical id used for route change loader instances so they are reused
export const ROUTE_LOADER_ID = 'route-change'

// Create the store with subscriptions
export const useGlobalLoaderStore = create<GlobalLoaderState & GlobalLoaderActions>()(
  subscribeWithSelector((set, get) => ({
  instances: new Map(),
    activeInstance: null,
    routeChangeInProgress: false,
    routeChangeStartTime: undefined,
    queuedOperations: [],
  nextId: 0,
    startLoading: (id?: string, options: LoaderOptions = {}) => {
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

      // Deduplicate route loaders: reuse existing active one, optionally update message/subMessage
      if (mergedOptions.type === 'route') {
        const existing = Array.from(get().instances.values()).find(inst => inst.state === 'loading' && inst.options.type === 'route')
        if (existing) {
          if (mergedOptions.message && mergedOptions.message !== existing.options.message) {
            // Update message/subMessage of existing loader
            useGlobalLoaderStore.setState(state => {
              const map = new Map(state.instances)
              const inst = map.get(existing.id)
              if (inst) {
                inst.options = {
                  ...inst.options,
                  message: mergedOptions.message || inst.options.message,
                  subMessage: mergedOptions.subMessage || inst.options.subMessage,
                  priority: mergedOptions.priority || inst.options.priority,
                }
                map.set(existing.id, inst)
              }
              return { ...state, instances: map }
            })
          }
          return existing.id
        }
      }

      // Merge a new non-route loader into existing route loader when conditions apply
      if (
        mergedOptions.type !== 'route' &&
        mergedOptions.combineWithRoute &&
        get().routeChangeInProgress
      ) {
        const existingRoute = Array.from(get().instances.values()).find(inst => inst.state === 'loading' && inst.options.type === 'route')
        if (existingRoute) {
          useGlobalLoaderStore.setState(state => {
            const map = new Map(state.instances)
            const inst = map.get(existingRoute.id)
            if (inst) {
              inst.options = {
                ...inst.options,
                // Prefer new message/subMessage if provided and not default
                message: mergedOptions.message && mergedOptions.message !== DEFAULT_OPTIONS.message ? mergedOptions.message : inst.options.message,
                subMessage: mergedOptions.subMessage || inst.options.subMessage,
                // Elevate priority if higher requested
                priority: PRIORITY_ORDER[mergedOptions.priority] > PRIORITY_ORDER[inst.options.priority] ? mergedOptions.priority : inst.options.priority,
                // Show progress if either wants it
                showProgress: inst.options.showProgress || mergedOptions.showProgress,
              }
              // Attach metadata note
              inst.options.metadata = {
                ...inst.options.metadata,
                mergedTypes: Array.from(new Set([...(inst.options.metadata?.mergedTypes || []), mergedOptions.type])),
              }
              map.set(existingRoute.id, inst)
            }
            return { ...state, instances: map }
          })
          return existingRoute.id
        }
      }

      // Determine deterministic / canonical id
      let resolvedId = id
      if (mergedOptions.type === 'route') {
        resolvedId = ROUTE_LOADER_ID
      }

      set(state => {
        let newNextId = state.nextId
        if (!resolvedId) {
          newNextId = state.nextId + 1
          resolvedId = `loader-${newNextId}`
        }

        const instance: LoaderInstance = {
          id: resolvedId!,
          state: 'loading',
          options: mergedOptions,
          startTime: Date.now(),
          estimatedDuration: mergedOptions.type === 'route' ? 1500 : undefined,
        }

        const newInstances = new Map(state.instances)
        newInstances.set(resolvedId!, instance)

        const activeInstance = Array.from(newInstances.values())
          .filter(inst => inst.state === 'loading')
          .sort((a, b) => PRIORITY_ORDER[b.options.priority] - PRIORITY_ORDER[a.options.priority])[0] || null

        return {
          ...state,
          instances: newInstances,
          activeInstance,
          nextId: newNextId,
          routeChangeInProgress: mergedOptions.type === 'route' ? true : state.routeChangeInProgress,
          routeChangeStartTime: mergedOptions.type === 'route' ? (state.routeChangeStartTime || Date.now()) : state.routeChangeStartTime,
        }
      })

      if (mergedOptions.maxDurationMs > 0) {
        const timeoutId = resolvedId!
        setTimeout(() => {
          const current = get().instances.get(timeoutId)
            if (current?.state === 'loading') {
              get().stopLoading(timeoutId, { success: false, error: 'Operation timed out' })
            }
        }, mergedOptions.maxDurationMs)
      }

      return resolvedId!
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
    // Deterministic: delegate ID generation to the store (counter-based) unless a watchId is supplied.
    if (watchId) {
      storeStartLoading(watchId, options)
      return watchId
    }
    return storeStartLoading(undefined, options)
  }, [watchId, storeStartLoading])

  const stopLoading = useCallback((idOrResult?: string | { success: boolean; error?: string }, result?: { success: boolean; error?: string }) => {
    if (typeof idOrResult === 'string') {
      storeStopLoading(idOrResult, result)
    } else if (watchId) {
      storeStopLoading(watchId, idOrResult)
    } else {
      // Backward compatibility - stop the active instance
      const currentActive = store.activeInstance
      if (currentActive) {
        storeStopLoading(currentActive.id, idOrResult as { success: boolean; error?: string })
      }
    }
  }, [watchId, storeStopLoading, store.activeInstance])

  const updateProgress = useCallback((progressOrId: number | string, progress?: number, message?: string) => {
    if (typeof progressOrId === 'number' && watchId) {
      // when first arg is number and watchId is present, treat it as progress value
      storeUpdateProgress(watchId, progressOrId, message)
    } else if (typeof progressOrId === 'string') {
      // when first arg is string, it's an id and progress should be provided
      storeUpdateProgress(progressOrId, typeof progress === 'number' ? progress : 0, message)
    }
  }, [watchId, storeUpdateProgress])

  const cancelLoading = useCallback((id?: string) => {
    storeCancelLoading(id || watchId!)
  }, [watchId, storeCancelLoading])

  // Backward compatibility methods
  const setError = useCallback((error: string, options?: Partial<LoaderOptions>) => {
    const id = watchId || store.activeInstance?.id || `error-${Date.now()}`
    if (store.activeInstance || watchId) {
      storeStopLoading(id, { success: false, error })
    } else {
      // No active loader, create error state
      const errorId = storeStartLoading(id, {
        message: error,
        type: 'custom',
        isBlocking: false,
        priority: 'medium',
        minVisibleMs: 3000,
        ...options
      })
      // Immediately set to error state
      setTimeout(() => {
        storeStopLoading(errorId, { success: false, error })
      }, 100)
    }
  }, [watchId, store.activeInstance, storeStartLoading, storeStopLoading])

  const setSuccess = useCallback((message: string = 'Success!', options?: Partial<LoaderOptions>) => {
    const id = watchId || store.activeInstance?.id || `success-${Date.now()}`
    if (store.activeInstance || watchId) {
      storeStopLoading(id, { success: true })
    } else {
      // No active loader, create success state
      const successId = storeStartLoading(id, {
        message,
        type: 'custom',
        isBlocking: false,
        priority: 'medium',
        minVisibleMs: 2000,
        ...options
      })
      // Immediately set to success state
      setTimeout(() => {
        storeStopLoading(successId, { success: true })
      }, 100)
    }
  }, [watchId, store.activeInstance, storeStartLoading, storeStopLoading])

  // Legacy method aliases for backward compatibility
  const setGlobalError = setError
  const setGlobalSuccess = setSuccess

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
    
    // Backward compatibility methods
    setError,
    setSuccess,
    setGlobalError,
    setGlobalSuccess,
    
    // Instance info
    instanceId: watchedInstance?.id,
    startTime: watchedInstance?.startTime,
    estimatedDuration: watchedInstance?.estimatedDuration,
    
    // All instances (for debugging)
    allInstances: Array.from(instances.values()),
    activeInstanceId: activeInstance?.id,
    // Convenience async wrapper similar to legacy withLoading
    withLoading: async <T>(promise: Promise<T>, opts?: LoaderOptions): Promise<T> => {
      const id = startLoading(opts)
      let progressTimer: any
      if (opts?.autoProgress) {
        // Simple auto progress simulation
        progressTimer = setInterval(() => {
          const storeState = useGlobalLoaderStore.getState()
          const inst = id ? storeState.instances.get(id) : null
          if (inst && inst.state === 'loading') {
            const next = Math.min(95, (inst.options.progress || 0) + Math.random() * 5 + 1)
            storeState.updateProgress(id, next)
          }
        }, 400)
      }
      try {
        const result = await promise
        stopLoading(id, { success: true })
        return result
      } catch (e: any) {
        stopLoading(id, { success: false, error: e?.message })
        throw e
      } finally {
        if (progressTimer) clearInterval(progressTimer)
      }
    },
  }
}

// Route change detection hook
export function useRouteLoaderBridge() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setRouteChangeState, startLoading, stopLoading } = useGlobalLoaderStore()
  const routeChangeId = useRef<string | undefined>(undefined)
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
// types are exported earlier in this module; no-op here to avoid duplicate exports