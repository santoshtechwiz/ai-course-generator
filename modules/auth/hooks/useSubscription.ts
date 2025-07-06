"use client"

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectSubscription, fetchSubscription } from '@/store/slices/subscription-slice'
import { useAuth } from '../providers/AuthProvider'

/**
 * Enhanced subscription hook that combines session and Redux data
 * 
 * This hook provides a unified interface for subscription data that:
 * - Uses session data as the primary source of truth for basic info
 * - Uses Redux for detailed subscription data (tokens used, billing info)
 * - Only fetches data when needed to avoid excessive API calls
 * - Maintains efficient caching via Redux
 */
export function useSubscription() {
  const dispatch = useAppDispatch()
  
  // Get session-based subscription data (always up-to-date)
  const { subscription: sessionSubscription, user, isAuthenticated } = useAuth()
  
  // Get Redux subscription data (detailed, cached)
  const reduxSubscription = useAppSelector(selectSubscription)
  
  // Only fetch subscription data once when authenticated and no data exists
  useEffect(() => {
    if (isAuthenticated && !reduxSubscription.data && !reduxSubscription.isLoading) {
      dispatch(fetchSubscription())
    }
  }, [isAuthenticated, reduxSubscription.data, reduxSubscription.isLoading, dispatch])
    // Determine the most accurate subscription state
  const subscription = {
    // Primary data from session (real-time)
    plan: sessionSubscription?.plan || 'FREE',
    status: sessionSubscription?.status || 'INACTIVE',
    isActive: sessionSubscription?.isActive || false,
    credits: sessionSubscription?.credits || 0,
    
    // Enhanced data - prefer session data for tokensUsed, fallback to Redux cache
    tokensUsed: user?.creditsUsed || reduxSubscription.data?.tokensUsed || 0,
    subscriptionId: reduxSubscription.data?.subscriptionId || '',
    cancelAtPeriodEnd: reduxSubscription.data?.cancelAtPeriodEnd || false,
    currentPeriodEnd: reduxSubscription.data?.currentPeriodEnd || null,
    
    // Calculated properties
    isSubscribed: sessionSubscription?.isActive || false,
    isFree: (sessionSubscription?.plan || 'FREE') === 'FREE',
    isPro: (sessionSubscription?.plan || 'FREE') === 'PRO',
    isEnterprise: (sessionSubscription?.plan || 'FREE') === 'ENTERPRISE',
  }
  
  return {
    subscription,
    isLoading: reduxSubscription.isLoading,
    error: reduxSubscription.error,
    isAuthenticated,
    user,
  }
}
