import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '@/store'
import { fetchSubscription } from '../slices/subscription-slice'
import { logger } from '@/lib/logger'

export const authSubscriptionSyncMiddleware = createListenerMiddleware()
const startListening = authSubscriptionSyncMiddleware.startListening.withTypes<RootState, AppDispatch>()

startListening({
  predicate: (action) => {
    return action.type.includes('auth') || 
           action.type.includes('login') || 
           action.type.includes('logout') ||
           action.type.includes('session')
  },
  effect: async (action, listenerApi) => {
    logger.debug('Auth-related action detected, syncing subscription')
    listenerApi.dispatch(fetchSubscription({ forceRefresh: true }))
  },
})

let periodicSyncTimer: NodeJS.Timeout | null = null
const setupPeriodicSync = (dispatch: AppDispatch) => {
  if (periodicSyncTimer) {
    clearTimeout(periodicSyncTimer)
  }
  periodicSyncTimer = setTimeout(() => {
    logger.debug('Periodic subscription sync triggered')
    dispatch(fetchSubscription())
    setupPeriodicSync(dispatch)
  }, 5 * 60 * 1000)
}

startListening({
  actionCreator: fetchSubscription.fulfilled,
  effect: async (action, listenerApi) => {
    setupPeriodicSync(listenerApi.dispatch)
  },
})

if (typeof window !== 'undefined') {
  let lastFocusSync = 0
  window.addEventListener('focus', () => {
    const now = Date.now()
    if (now - lastFocusSync > 60000) {
      lastFocusSync = now
      logger.debug('Window focus subscription sync triggered')
      if ((window as any).__store__) {
        (window as any).__store__.dispatch(fetchSubscription())
      }
    }
  })
  window.addEventListener('online', () => {
    logger.debug('Network reconnected, syncing subscription')
    if ((window as any).__store__) {
      (window as any).__store__.dispatch(fetchSubscription({ forceRefresh: true }))
    }
  })
}

export default authSubscriptionSyncMiddleware.middleware
