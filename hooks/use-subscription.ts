"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  fetchSubscription,
  selectSubscription,
  selectSubscriptionLoading,
  selectSubscriptionError,
} from "@/store/slices/subscription-slice"

export function useSubscription() {
  const dispatch = useAppDispatch()
  const subscription = useAppSelector(selectSubscription)
  const isLoading = useAppSelector(selectSubscriptionLoading)
  const error = useAppSelector(selectSubscriptionError)
  const lastFetched = useAppSelector((state) => state.subscription.lastFetched)

  useEffect(() => {
    // Fetch if not already fetched or if data is stale (older than 5 minutes)
    if (!lastFetched || Date.now() - lastFetched > 5 * 60 * 1000) {
      dispatch(fetchSubscription())
    }
  }, [dispatch, lastFetched])

  const refetch = () => {
    return dispatch(fetchSubscription())
  }

  return {
    subscription,
    isLoading,
    error,
    refetch,
  }
}

// Helper function to check if user can download PDF
export function useCanDownloadPDF() {
  const subscription = useAppSelector(selectSubscription)
  return subscription?.subscriptionPlan !== "FREE"
}
