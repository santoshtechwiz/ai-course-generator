/**
 * Session-Subscription Sync Hook
 * 
 * This hook provides unified session and subscription state management.
 * It automatically syncs subscription data when the session changes,
 * eliminating the need for manual sync calls or dual auth systems.
 * 
 * Features:
 * - Automatic sync on session change
 * - Efficient caching and deduplication
 * - Real-time subscription updates
 * - Proper error handling and fallbacks
 * - SSR/hydration safe
 * - Prevents infinite update loops with careful dependency management
 * 
 * Fixed Issues:
 * - Removed circular dependency that caused "Maximum update depth exceeded" errors
 * - Uses refs to track subscription state without triggering re-renders
 * - Optimized useCallback dependencies to prevent unnecessary re-creations
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useAppDispatch, useAppSelector } from '@/store'
import { 
  fetchSubscription, 
  forceSyncSubscription,
  setSubscriptionData,
  selectSubscription 
} from '@/store/slices/subscription-slice'
import { logger } from '@/lib/logger'

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
    // Track last sync to prevent excessive calls
  const lastSyncRef = useRef<number>(0)
  const sessionIdRef = useRef<string | null>(null)
  
  // Optimized sync function with deduplication
  const syncSubscription = useCallback(async (
    force = false, 
    reason = 'manual'
  ) => {
    const now = Date.now()
    const timeSinceLastSync = now - lastSyncRef.current
    
    // Skip if recent sync and not forced
    if (!force && timeSinceLastSync < config.minSyncInterval) {
      logger.debug(`Subscription sync skipped: too recent (${timeSinceLastSync}ms ago)`)
      return
    }
    
    // Skip if no session
    if (status !== 'authenticated' || !session?.user?.id) {
      logger.debug('Subscription sync skipped: no authenticated session')
      return
    }
    
    try {
      lastSyncRef.current = now
      
      logger.debug(`Syncing subscription data (reason: ${reason}, force: ${force})`)
      
      if (force) {
        // Use force sync for critical updates (login, plan change, etc.)
        await dispatch(forceSyncSubscription()).unwrap()
      } else {
        // Use regular fetch for routine updates
        await dispatch(fetchSubscription({ forceRefresh: false })).unwrap()
      }
      
      logger.debug('Subscription sync completed successfully')
    } catch (error) {
      logger.error('Subscription sync failed:', error)
    }
  }, [dispatch, session?.user?.id, status, config.minSyncInterval])
    // Track subscription state to avoid circular dependencies
  const hasSubscriptionDataRef = useRef(false)
  
  // Primary sync: React to session changes
  useEffect(() => {
    if (!config.enableAutoSync) return
    
    // Handle session state changes
    if (status === 'loading') {
      // Session is loading, don't sync yet
      return
    }
    
    if (status === 'unauthenticated') {
      // User logged out - clear subscription data immediately
      logger.debug('Session ended, clearing subscription data')
      dispatch(setSubscriptionData({
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
        status: "INACTIVE",
        cancelAtPeriodEnd: false,
        subscriptionId: "",
      }))
      sessionIdRef.current = null
      hasSubscriptionDataRef.current = false
      return
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      const currentSessionId = session.user.id
      const sessionChanged = sessionIdRef.current !== currentSessionId
      
      if (sessionChanged) {
        // New session detected - force sync
        logger.debug('Session changed, forcing subscription sync', {
          previousSession: sessionIdRef.current,
          newSession: currentSessionId
        })
        sessionIdRef.current = currentSessionId
        hasSubscriptionDataRef.current = false // Reset subscription data flag
        syncSubscription(true, 'session_change')
      } else if (!hasSubscriptionDataRef.current) {
        // Same session but no subscription data loaded yet - regular sync
        logger.debug('No subscription data for current session, syncing')
        syncSubscription(false, 'initial_load')
      }
    }
  }, [session, status, dispatch, syncSubscription, config.enableAutoSync])
  
  // Separate effect to track subscription data changes
  useEffect(() => {
    if (subscription.data && subscription.data.subscriptionPlan !== 'FREE') {
      hasSubscriptionDataRef.current = true
    } else if (!subscription.data || subscription.data.subscriptionPlan === 'FREE') {
      hasSubscriptionDataRef.current = false
    }
  }, [subscription.data])
  
  // Secondary sync: Window focus (to catch external changes)
  useEffect(() => {
    if (!config.syncOnFocus) return
    
    const handleFocus = () => {
      if (status === 'authenticated' && session?.user?.id) {
        syncSubscription(false, 'window_focus')
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [syncSubscription, session, status, config.syncOnFocus])
  
  // Tertiary sync: Visibility change (mobile/tab switching)
  useEffect(() => {
    if (!config.syncOnVisibilityChange) return
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated' && session?.user?.id) {
        syncSubscription(false, 'visibility_change')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
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
    subscription: subscription.data,
    subscriptionError: subscription.error,
    
    // Actions
    syncSubscription: manualSync,
    forceSync: () => manualSync(true),
  }
}
