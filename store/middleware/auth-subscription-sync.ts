import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '@/store'
import { fetchSubscription } from '../slices/subscription-slice'
import { logger } from '@/lib/logger'

// Create a simplified sync middleware for existing auth and subscription systems
export const authSubscriptionSyncMiddleware = createListenerMiddleware()

const startListening = authSubscriptionSyncMiddleware.startListening.withTypes<RootState, AppDispatch>()

// Auto-sync subscription when relevant events occur
startListening({
  predicate: (action) => {
    // Listen for auth-related actions
    return action.type.includes('auth') || 
           action.type.includes('login') || 
           action.type.includes('logout') ||
           action.type.includes('session')
  },
  effect: async (action, listenerApi) => {
    logger.debug('Auth-related action detected, syncing subscription')
    
    // Sync subscription data
    listenerApi.dispatch(fetchSubscription({ forceRefresh: true }))
  },
})

// Periodic sync for long-running sessions
let periodicSyncTimer: NodeJS.Timeout | null = null

const setupPeriodicSync = (dispatch: AppDispatch) => {
  if (periodicSyncTimer) {
    clearTimeout(periodicSyncTimer)
  }
  
  periodicSyncTimer = setTimeout(() => {
    logger.debug('Periodic subscription sync triggered')
    dispatch(fetchSubscription())
    setupPeriodicSync(dispatch) // Re-schedule
  }, 5 * 60 * 1000) // 5 minutes
}

startListening({
  actionCreator: fetchSubscription.fulfilled,
  effect: async (action, listenerApi) => {
    // Set up periodic sync for active sessions
    setupPeriodicSync(listenerApi.dispatch)
  },
})

// Handle window focus events for fresh data
if (typeof window !== 'undefined') {
  let lastFocusSync = 0
  
  window.addEventListener('focus', () => {
    const now = Date.now()
    
    // Throttle focus syncs to once per minute
    if (now - lastFocusSync > 60000) {
      lastFocusSync = now
      logger.debug('Window focus subscription sync triggered')
      
      // We'll need to use a global dispatch reference
      // This will be set up in the store configuration
      if ((window as any).__store__) {
        (window as any).__store__.dispatch(fetchSubscription())
      }
    }
  })
}

// Handle network reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.debug('Network reconnected, syncing subscription')
    
    if ((window as any).__store__) {
      (window as any).__store__.dispatch(fetchSubscription({ forceRefresh: true }))
    }
  })
}

export default authSubscriptionSyncMiddleware.middleware
