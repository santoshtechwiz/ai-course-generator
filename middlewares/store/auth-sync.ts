import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '@/store'
import { fetchSubscription } from '@/store/slices/subscription-slice'
import { logger } from '@/lib/logger'

/**
 * Enhanced auth and subscription sync middleware with better performance
 */

export const authSubscriptionSyncMiddleware = createListenerMiddleware()
const startListening = authSubscriptionSyncMiddleware.startListening.withTypes<RootState, AppDispatch>()

// Track sync state to prevent unnecessary requests
let isCurrentlySyncing = false
let lastSyncTime = 0
const MIN_SYNC_INTERVAL = 30000 // 30 seconds minimum between syncs

/**
 * Throttled sync function to prevent excessive API calls
 */
const throttledSync = (dispatch: AppDispatch, forceRefresh = false) => {
  const now = Date.now()
  
  if (isCurrentlySyncing || (!forceRefresh && now - lastSyncTime < MIN_SYNC_INTERVAL)) {
    logger.debug('Subscription sync throttled', { 
      isCurrentlySyncing, 
      timeSinceLastSync: now - lastSyncTime 
    })
    return
  }
  
  isCurrentlySyncing = true
  lastSyncTime = now
  
  // Use background fetch to avoid blocking UI
  dispatch(fetchSubscription({ forceRefresh, isBackground: true }))
    .finally(() => {
      isCurrentlySyncing = false
    })
}

// Auto-sync subscription when auth-related events occur
startListening({
  predicate: (action) => {
    // More specific action type matching for better performance
    const authActionTypes = ['auth/', 'login/', 'logout/', 'session/']
    return authActionTypes.some(type => action.type.includes(type))
  },
  effect: async (action, listenerApi) => {
    logger.debug('Auth-related action detected, syncing subscription', { 
      actionType: action.type 
    })
    
    throttledSync(listenerApi.dispatch, true)
  },
})

// Periodic sync for long-running sessions
let periodicSyncTimer: NodeJS.Timeout | null = null

const setupPeriodicSync = (dispatch: AppDispatch) => {
  // Clear existing timer
  if (periodicSyncTimer) {
    clearTimeout(periodicSyncTimer)
  }
  
  // Only set up periodic sync if user is authenticated
  periodicSyncTimer = setTimeout(() => {
    logger.debug('Periodic subscription sync triggered')
    throttledSync(dispatch)
    setupPeriodicSync(dispatch) // Re-schedule
  }, 5 * 60 * 1000) // 5 minutes
}

// Set up periodic sync when subscription fetch is successful
startListening({
  actionCreator: fetchSubscription.fulfilled,
  effect: async (action, listenerApi) => {
    setupPeriodicSync(listenerApi.dispatch)
  },
})

// Clean up timer when subscription fetch fails or user logs out
startListening({
  predicate: (action) => {
    return action.type.includes('logout') || 
           action.type.includes('fetchSubscription/rejected')
  },
  effect: async () => {
    if (periodicSyncTimer) {
      clearTimeout(periodicSyncTimer)
      periodicSyncTimer = null
    }
    logger.debug('Periodic sync timer cleared')
  },
})

// Browser event listeners for sync triggers
if (typeof window !== 'undefined') {
  let lastFocusSync = 0
  let lastOnlineSync = 0
  
  // Window focus sync with throttling
  window.addEventListener('focus', () => {
    const now = Date.now()
    if (now - lastFocusSync > 60000) { // 1 minute throttle
      lastFocusSync = now
      logger.debug('Window focus subscription sync triggered')
      
      if ((window as any).__store__) {
        throttledSync((window as any).__store__.dispatch)
      }
    }
  })
  
  // Network reconnection sync with throttling
  window.addEventListener('online', () => {
    const now = Date.now()
    if (now - lastOnlineSync > 30000) { // 30 second throttle
      lastOnlineSync = now
      logger.debug('Network reconnected, syncing subscription')
      
      if ((window as any).__store__) {
        throttledSync((window as any).__store__.dispatch, true)
      }
    }
  })
  
  // Page visibility change sync
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && (window as any).__store__) {
      const now = Date.now()
      if (now - lastFocusSync > 60000) {
        lastFocusSync = now
        logger.debug('Page became visible, syncing subscription')
        throttledSync((window as any).__store__.dispatch)
      }
    }
  })
}

// Clean up on module unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (periodicSyncTimer) {
      clearTimeout(periodicSyncTimer)
    }
  })
}

export default authSubscriptionSyncMiddleware.middleware
