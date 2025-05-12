"use client"

import type React from "react"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription } from "@/store/slices/subscription-slice"

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const lastFetched = useAppSelector((state) => state.subscription.lastFetched)
  const isLoading = useAppSelector((state) => state.subscription.isLoading)

  useEffect(() => {
    // Only fetch if not already loading and data is stale or doesn't exist
    if (!isLoading && (!lastFetched || Date.now() - lastFetched > 2 * 60 * 1000)) {
      dispatch(fetchSubscription())
    }
  }, [dispatch, lastFetched, isLoading])

  return <>{children}</>
}

export default SubscriptionProvider
