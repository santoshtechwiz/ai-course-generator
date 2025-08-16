"use client"

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { 
  fetchSubscription, 
  markSubscriptionStale,
  selectSubscriptionData,
  selectShouldRefreshSubscription,
  selectSubscriptionCacheStatus,
  selectHasActiveSubscription,
  selectHasCredits,
  selectCanCreateQuizOrCourse,
} from '@/store/slices/subscription-slice'
import { useAuth } from '@/modules/auth/providers/AuthProvider'

interface SubscriptionContextValue {
  // Core subscription data
  subscription: any
  hasActiveSubscription: boolean
  hasCredits: boolean
  canCreateQuizOrCourse: boolean
  
  // Cache and performance info
  cacheStatus: 'fresh' | 'stale' | 'empty' | 'error'
  shouldRefresh: boolean
  
  // Actions
  refreshSubscription: (force?: boolean) => void
  markStale: () => void
  
  // Loading states
  isLoading: boolean
  isFetching: boolean
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

interface SubscriptionProviderProps {
  children: React.ReactNode
  autoRefresh?: boolean
  refreshOnMount?: boolean
  refreshOnFocus?: boolean
}

/**
 * SubscriptionProvider - A performance-optimized provider that:
 * - Only fetches subscription data when needed
 * - Implements smart caching based on subscription status
 * - Prevents unnecessary API calls
 * - Provides subscription-aware context to child components
 */
export function SubscriptionProvider({
  children,
  autoRefresh = true,
  refreshOnMount = true,
  refreshOnFocus = true,
}: SubscriptionProviderProps) {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAuth()
  
  // Get subscription state using optimized selectors
  const subscriptionData = useAppSelector(selectSubscriptionData)
  const shouldRefresh = useAppSelector(selectShouldRefreshSubscription)
  const cacheStatus = useAppSelector(selectSubscriptionCacheStatus)
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription)
  const hasCredits = useAppSelector(selectHasCredits)
  const canCreateQuizOrCourse = useAppSelector(selectCanCreateQuizOrCourse)
  
  // Memoized subscription object
  const subscription = useMemo(() => subscriptionData, [subscriptionData])
  
  // Smart refresh function
  const refreshSubscription = useCallback((force = false) => {
    if (isAuthenticated && (force || shouldRefresh)) {
      dispatch(fetchSubscription({ forceRefresh: force }))
    }
  }, [dispatch, isAuthenticated, shouldRefresh])
  
  // Mark subscription as stale
  const markStale = useCallback(() => {
    dispatch(markSubscriptionStale())
  }, [dispatch])
  
  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return
    
    // Initial fetch on mount
    if (refreshOnMount && !subscriptionData) {
      refreshSubscription()
      return
    }
    
    // Refresh when data becomes stale
    if (shouldRefresh) {
      refreshSubscription()
    }
  }, [autoRefresh, isAuthenticated, refreshOnMount, subscriptionData, shouldRefresh, refreshSubscription])
  
  // Refresh on window focus (useful for keeping data fresh)
  useEffect(() => {
    if (!refreshOnFocus || !isAuthenticated) return
    
    const handleFocus = () => {
      if (shouldRefresh) {
        refreshSubscription()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshOnFocus, isAuthenticated, shouldRefresh, refreshSubscription])
  
  // Context value
  const contextValue = useMemo<SubscriptionContextValue>(() => ({
    subscription,
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    cacheStatus,
    shouldRefresh,
    refreshSubscription,
    markStale,
    isLoading: false, // TODO: Add loading state from store
    isFetching: false, // TODO: Add fetching state from store
  }), [
    subscription,
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    cacheStatus,
    shouldRefresh,
    refreshSubscription,
    markStale,
  ])
  
  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

/**
 * Hook to use subscription context
 * Must be used within SubscriptionProvider
 */
export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
  }
  return context
}

/**
 * Hook for components that need subscription data but don't need the full context
 * This hook will automatically fetch data if needed
 */
export function useSubscriptionData() {
  const { subscription, hasActiveSubscription, hasCredits, canCreateQuizOrCourse } = useSubscriptionContext()
  
  return {
    subscription,
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
  }
}

/**
 * Hook for components that need to trigger subscription refreshes
 * Useful for forms or actions that modify subscription state
 */
export function useSubscriptionActions() {
  const { refreshSubscription, markStale } = useSubscriptionContext()
  
  return {
    refreshSubscription,
    markStale,
  }
}