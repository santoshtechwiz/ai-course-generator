"use client"

import { useEffect, useCallback } from "react"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { selectSubscriptionData, fetchSubscription } from "@/store/slices/subscriptionSlice"

// Subscription data hydration hook
export function useSubscriptionHydration() {
  const dispatch = useAppDispatch()
  const subscriptionData = useAppSelector(selectSubscriptionData)
  
  const hydrate = useCallback(async () => {
    if (!subscriptionData) {
      // Background fetch to avoid blocking
      dispatch(fetchSubscription({ 
        forceRefresh: true, 
        isBackground: true 
      }))
    }
  }, [dispatch, subscriptionData])

  // Run hydration on mount
  useEffect(() => {
    hydrate()
  }, [hydrate])

  return {
    isLoading: !subscriptionData,
    data: subscriptionData
  }
}

export default useSubscriptionHydration
