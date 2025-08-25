import { Middleware, AnyAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

/**
 * Middleware to optimize performance of Redux state updates
 * Debounces rapid state changes and batches updates
 */
export const performanceMiddleware: Middleware<{}, RootState> = (store) => (next) => {
  let pendingUpdates = new Map<string, { 
    timeout: NodeJS.Timeout, 
    value: AnyAction 
  }>()
  
  const DEBOUNCE_MS = 100 // Debounce time for rapid updates
  const MAX_BATCH_SIZE = 10 // Maximum number of updates to batch
  
  return (action: AnyAction) => {
    // Fast-track non-debounceable actions
    if (
      action.type.includes('/pending') ||
      action.type.includes('/fulfilled') ||
      action.type.includes('/rejected') ||
      action.type.includes('loader/')
    ) {
      return next(action)
    }

    // For other actions, debounce and batch
    const actionKey = action.type
    
    if (pendingUpdates.has(actionKey)) {
      clearTimeout(pendingUpdates.get(actionKey)!.timeout)
    }

    // Create new timeout
    const timeout = setTimeout(() => {
      const updates = pendingUpdates.get(actionKey)
      if (updates) {
        next(updates.value)
        pendingUpdates.delete(actionKey)
      }
    }, DEBOUNCE_MS)

    pendingUpdates.set(actionKey, {
      timeout,
      value: action
    })

    // If we have too many pending updates, process the oldest ones
    if (pendingUpdates.size > MAX_BATCH_SIZE) {
      const oldestKey = pendingUpdates.keys().next().value
      const oldest = pendingUpdates.get(oldestKey)
      if (oldest) {
        clearTimeout(oldest.timeout)
        next(oldest.value)
        pendingUpdates.delete(oldestKey)
      }
    }
  }
}

export default performanceMiddleware
