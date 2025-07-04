"use client"

import type React from "react"

import { useEffect, useRef, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription } from "@/store/slices/subscription-slice"

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const lastFetched = useAppSelector((state) => state.subscription.lastFetched)
  const isLoading = useAppSelector((state) => state.subscription.isLoading)
  const isFetching = useAppSelector((state) => state.subscription.isFetching)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialFetchDoneRef = useRef(false)

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSubscriptionData = useCallback(() => {
    // Only fetch if not already loading/fetching and data is stale or doesn't exist
    if (!isLoading && !isFetching && (!lastFetched || Date.now() - lastFetched > 5 * 60 * 1000)) {
      if (!initialFetchDoneRef.current) {
        // First load - fetch immediately
        dispatch(fetchSubscription())
        initialFetchDoneRef.current = true
      } else {
        // Subsequent loads - debounce to prevent multiple calls
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
        }

        fetchTimeoutRef.current = setTimeout(() => {
          dispatch(fetchSubscription())
        }, 300)
      }
    }
  }, [dispatch, lastFetched, isLoading, isFetching])

  useEffect(() => {
    fetchSubscriptionData()

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [fetchSubscriptionData])

  // Simply render children without any wrapper to avoid unnecessary DOM nesting
  return children
}

export default SubscriptionProvider
