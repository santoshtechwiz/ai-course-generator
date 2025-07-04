"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription } from "@/store/slices/subscription-slice"
import { syncSubscriptionData } from "@/store/slices/auth-slice"
import { logger } from "@/lib/logger"

const REFRESH_INTERVAL = 180000
const MIN_REFRESH_INTERVAL = 30000
const MAX_RETRY_COUNT = 3
const RETRY_DELAY_BASE = 5000

export function SubscriptionRefresher() {  const dispatch = useAppDispatch()
  const lastFetched = useAppSelector((state) => state.subscription.lastFetched)
  const isLoading = useAppSelector((state) => state.subscription.isLoading)
  const error = useAppSelector((state) => state.subscription.error)
  const isAuthenticated = useAppSelector((state) => state.auth.status === "authenticated")
  const userId = useAppSelector((state) => state.auth.user?.id)

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialRefreshDoneRef = useRef(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const lastAttemptRef = useRef(0)

  const [showNetworkError, setShowNetworkError] = useState(false)

  const checkNetworkConnectivity = useCallback(() => {
    return navigator.onLine
  }, [])
  const debouncedFetchWithRetry = useCallback(
    async (force = false) => {
      // Skip if user is not authenticated
      if (!isAuthenticated || !userId) {
        logger.debug("Subscription fetch skipped - user not authenticated")
        return
      }
      
      if (!checkNetworkConnectivity()) {
        logger.warn("Network appears to be offline, skipping subscription fetch")
        return
      }

      if (isLoading) {
        logger.debug("Subscription fetch skipped - already loading")
        return
      }

      const now = Date.now()

      if (!force && lastFetched && now - lastFetched < MIN_REFRESH_INTERVAL) {
        logger.debug(`Subscription fetch skipped - fetched too recently (${(now - lastFetched) / 1000}s ago)`)
        return
      }

      if (!force && lastAttemptRef.current && now - lastAttemptRef.current < MIN_REFRESH_INTERVAL) {
        logger.debug(
          `Subscription fetch retry skipped - attempted too recently (${(now - lastAttemptRef.current) / 1000}s ago)`,
        )
        return
      }      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
      
      lastAttemptRef.current = now
      
      try {
        logger.info("Fetching subscription data...")
        const subscriptionData = await dispatch(fetchSubscription()).unwrap()
        // Sync with auth state to ensure consistency across the app
        dispatch(syncSubscriptionData(subscriptionData))
        retryCountRef.current = 0
        setShowNetworkError(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error(`Subscription fetch failed: ${errorMessage}`)

        const isNetworkError =
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("Network connectivity") ||
          errorMessage.includes("timeout") ||
          !navigator.onLine

        if (retryCountRef.current >= 2) {
          setShowNetworkError(true)
        }

        if (retryCountRef.current < MAX_RETRY_COUNT) {
          const baseDelay = isNetworkError ? RETRY_DELAY_BASE * 2 : RETRY_DELAY_BASE
          const retryDelay = baseDelay * Math.pow(2, retryCountRef.current)
          retryCountRef.current++

          logger.info(`Scheduling retry ${retryCountRef.current}/${MAX_RETRY_COUNT} in ${retryDelay / 1000}s`)

          fetchTimeoutRef.current = setTimeout(() => {
            debouncedFetchWithRetry(true)
          }, retryDelay)
        } else {
          logger.warn(`Maximum retry attempts (${MAX_RETRY_COUNT}) reached. Will try again on next regular interval.`)
          retryCountRef.current = 0
        }
      }
    },    [dispatch, isLoading, lastFetched, isAuthenticated, userId, checkNetworkConnectivity],
  )
  useEffect(() => {
    // Only attempt to fetch if the user is authenticated
    if (!initialRefreshDoneRef.current && isAuthenticated && userId) {
      logger.info("Initial subscription data fetch")
      debouncedFetchWithRetry(true)
      initialRefreshDoneRef.current = true
    }    // Only set up refresh interval if user is authenticated
    if (isAuthenticated && userId) {
      refreshIntervalRef.current = setInterval(() => {
        debouncedFetchWithRetry()
      }, REFRESH_INTERVAL)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }

      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
    }
  }, [debouncedFetchWithRetry])

  useEffect(() => {
    if (error && !isLoading && retryCountRef.current === 0) {
      const retryDelay = RETRY_DELAY_BASE
      logger.info(`Error detected, scheduling retry in ${retryDelay / 1000}s`)

      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }

      fetchTimeoutRef.current = setTimeout(() => {
        retryCountRef.current = 1
        debouncedFetchWithRetry(true)
      }, retryDelay)
    }
  }, [error, isLoading, debouncedFetchWithRetry])

  useEffect(() => {
    const handleOnline = () => {
      logger.info("Network connection restored - attempting to fetch subscription data")
      debouncedFetchWithRetry(true)
    }

    const handleOffline = () => {
      logger.warn("Network connection lost - will retry when back online")
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [debouncedFetchWithRetry])

  // Reset and refetch when auth state changes
  useEffect(() => {
    // If the user becomes authenticated, fetch subscription data
    if (isAuthenticated && userId) {
      // Small delay to ensure auth is fully established
      const timer = setTimeout(() => {
        logger.info("Auth state changed, refreshing subscription data")
        initialRefreshDoneRef.current = false // Reset initial fetch flag
        debouncedFetchWithRetry(true) // Force fetch
      }, 500)
      
      return () => clearTimeout(timer)
    } else if (!isAuthenticated) {
      // Clear the interval when user logs out
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      
      // Reset the retry state
      retryCountRef.current = 0
      initialRefreshDoneRef.current = false
    }
  }, [isAuthenticated, userId, debouncedFetchWithRetry])

  if (!showNetworkError) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 p-3 rounded-lg shadow-md text-sm text-red-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Network connectivity issue - attempting to reconnect...</span>
      <button
        className="ml-2 p-1 hover:bg-red-100 rounded-full"
        onClick={() => {
          setShowNetworkError(false)
          debouncedFetchWithRetry(true)
        }}
        aria-label="Retry connection"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  )
}

export default SubscriptionRefresher
