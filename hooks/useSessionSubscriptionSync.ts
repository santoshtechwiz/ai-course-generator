/**
 * Enhanced Session-Subscription Sync Hook
 * 
 * This hook provides unified session and subscription state management with
 * improved performance and reliability.
 * 
 * Features:
 * - Request deduplication and race condition prevention
 * - Automatic cleanup of pending requests
 * - Smart caching with configurable intervals
 * - Comprehensive error logging
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDispatch, useSelector } from 'react-redux'
import store from '@/store'
import { 
  fetchSubscription, 
  forceSyncSubscription,
  selectSubscription, 
  setSubscriptionData
} from '@/store/slices/subscription-slice'

// Define typed hooks
type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch
const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector = useSelector as <T>(selector: (state: RootState) => T) => T
import { logger } from '@/lib/logger'
import type { SubscriptionData } from '@/types/subscription'

interface SessionSyncOptions {
  enableAutoSync?: boolean
  syncOnFocus?: boolean
  syncOnVisibilityChange?: boolean
  minSyncInterval?: number
}

const DEFAULT_OPTIONS: Required<SessionSyncOptions> = {
  enableAutoSync: true,
  syncOnFocus: true,
  syncOnVisibilityChange: true,
  minSyncInterval: 30000, // 30 seconds
}

export function useSessionSubscriptionSync(options: SessionSyncOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const subscription = useAppSelector(selectSubscription)
  
  // Use refs to prevent unnecessary re-renders
  const lastSyncRef = useRef<number>(0)
  const syncInProgressRef = useRef<boolean>(false)
  const sessionIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Cleanup function to abort pending requests
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Enhanced sync function with better race condition handling
  const syncSubscription = useCallback(async (
    force = false,
    reason = 'manual'
  ) => {
    // Skip if sync already in progress
    if (syncInProgressRef.current) {
      logger.debug('Subscription sync already in progress', { reason })
      return
    }
    
    const now = Date.now()
    const timeSinceLastSync = now - lastSyncRef.current
    
    // Skip if recent sync and not forced
    if (!force && timeSinceLastSync < config.minSyncInterval) {
      logger.debug('Skipping sync - too soon', { timeSinceLastSync })
      return
    }
    
    // Skip if no session
    if (status !== 'authenticated' || !session?.user?.id) {
      logger.debug('Skipping sync - no active session')
      return
    }
    
    try {
      syncInProgressRef.current = true
      lastSyncRef.current = now
      
      // Create new AbortController for this sync
      cleanup()
      abortControllerRef.current = new AbortController()
      
      if (force) {
        await dispatch(forceSyncSubscription()).unwrap()
      } else {
        await dispatch(fetchSubscription({ forceRefresh: false })).unwrap()
      }
      // Success - keep the lastSyncRef as it was set above
    } catch (error) {
      // On failure, reset lastSyncRef to allow retrying sooner
      lastSyncRef.current = lastSyncRef.current - (config.minSyncInterval / 2)
      logger.warn('Subscription sync failed', error)
    } finally {
      // Always reset sync in progress flag
      syncInProgressRef.current = false
    }
  }, [dispatch, session?.user?.id, status, config.minSyncInterval])
  // Track subscription state to avoid circular dependencies
  const hasSubscriptionDataRef = useRef(false)
  
  // Primary sync: React to session changes
  useEffect(() => {
    if (!config.enableAutoSync) return
    
    // Handle session state changes
    if (status === 'loading') {
      return
    }
    
    if (status === 'unauthenticated') {
      // User logged out - clear subscription data immediately
      dispatch(setSubscriptionData({
        id: 'free',
        userId: '',
        subscriptionId: '',
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
        status: "INACTIVE",
        cancelAtPeriodEnd: false,
        expirationDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          source: "logout",
          timestamp: new Date().toISOString()
        }
      }))
      sessionIdRef.current = null
      hasSubscriptionDataRef.current = false
      return
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      const currentSessionId = session.user.id
      const sessionChanged = sessionIdRef.current !== currentSessionId
      
      if (sessionChanged) {
        // Session changed: lightweight status fetch (no /sync force)
        sessionIdRef.current = currentSessionId
        hasSubscriptionDataRef.current = false
  dispatch(fetchSubscription({ forceRefresh: true }))
      } else if (!hasSubscriptionDataRef.current) {
        // Initial load: soft fetch respecting cache
  dispatch(fetchSubscription({ forceRefresh: false }))
      }
    }
  }, [session, status, dispatch, syncSubscription, config.enableAutoSync])
  
  // Separate effect to track subscription data changes
  useEffect(() => {
    if (subscription.currentSubscription && subscription.currentSubscription.subscriptionPlan !== 'FREE') {
      hasSubscriptionDataRef.current = true
    } else if (!subscription.currentSubscription || subscription.currentSubscription.subscriptionPlan === 'FREE') {
      hasSubscriptionDataRef.current = false
    }
  }, [subscription.currentSubscription])
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanup()
      syncInProgressRef.current = false
    }
  }, [cleanup])
  
  // Secondary sync: Window focus with debounce
  useEffect(() => {
    if (!config.syncOnFocus) return
    
    let focusTimeout: NodeJS.Timeout
    
    const handleFocus = () => {
      clearTimeout(focusTimeout)
      focusTimeout = setTimeout(() => {
        if (status === 'authenticated' && session?.user?.id) {
          syncSubscription(false, 'window_focus')
        }
      }, 100) // Small debounce to prevent multiple syncs
    }
    
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearTimeout(focusTimeout)
    }
  }, [syncSubscription, session, status, config.syncOnFocus])
  
  // Tertiary sync: Visibility change with error retry
  useEffect(() => {
    if (!config.syncOnVisibilityChange) return
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && status === 'authenticated' && session?.user?.id) {
        try {
          await syncSubscription(false, 'visibility_change')
        } catch (error) {
          logger.error('Visibility change sync failed:', error)
          // Retry once after a short delay
          setTimeout(() => {
            syncSubscription(true, 'visibility_change_retry')
          }, 2000)
        }
      }
    }
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncSubscription, session, status, config.syncOnVisibilityChange])
  
  // Expose manual sync function for components that need it
  const manualSync = useCallback((force = false) => {
    return syncSubscription(force, 'manual_trigger')
  }, [syncSubscription])
  
  return {
    // State
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || subscription.isLoading,
    user: session?.user || null,
    subscription: subscription.currentSubscription,
    subscriptionError: subscription.error,
    
    // Actions
    syncSubscription: manualSync,
    forceSync: () => manualSync(true),
  }
}
