/**
 * SubscriptionRefresher Component
 *
 * This component handles background refreshing of subscription data.
 * It doesn't render anything visible but ensures subscription data
 * stays up-to-date.
 */

"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription } from "@/store/slices/subscription-slice"
import { logger } from "@/lib/logger"

// Configuration for refresh behavior
const REFRESH_INTERVAL = 180000 // 3 minutes (increased from 2 minutes)
const MIN_REFRESH_INTERVAL = 30000 // 30 seconds minimum between refreshes
const MAX_RETRY_COUNT = 3 // Maximum number of retry attempts
const RETRY_DELAY_BASE = 5000 // Base delay for exponential backoff (5 seconds)

export function SubscriptionRefresher() {
  const dispatch = useAppDispatch()
  const lastFetched = useAppSelector((state) => state.subscription.lastFetched)
  const isLoading = useAppSelector((state) => state.subscription.isLoading)
  const error = useAppSelector((state) => state.subscription.error)
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialRefreshDoneRef = useRef(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const lastAttemptRef = useRef(0)
  
  // Debounced fetch with retry mechanism  // Check for network connectivity
  const checkNetworkConnectivity = useCallback(() => {
    return navigator.onLine
  }, [])

  // Add visible error toast notification for persistent failures
  const [showNetworkError, setShowNetworkError] = useState(false)
  
  const debouncedFetchWithRetry = useCallback(async (force = false) => {
    // Check for network connectivity first
    if (!checkNetworkConnectivity()) {
      logger.warn("Network appears to be offline, skipping subscription fetch")
      // Don't keep retrying if we're offline - wait for online event
      return
    }
  
    // Don't refresh if already loading
    if (isLoading) {
      logger.debug("Subscription fetch skipped - already loading")
      return
    }
    
    const now = Date.now()
    
    // Don't refresh if fetched recently (unless forced)
    if (!force && lastFetched && (now - lastFetched < MIN_REFRESH_INTERVAL)) {
      logger.debug(`Subscription fetch skipped - fetched too recently (${(now - lastFetched) / 1000}s ago)`)
      return
    }
    
    // Don't retry too quickly
    if (!force && lastAttemptRef.current && (now - lastAttemptRef.current < MIN_REFRESH_INTERVAL)) {
      logger.debug(`Subscription fetch retry skipped - attempted too recently (${(now - lastAttemptRef.current) / 1000}s ago)`)
      return
    }
    
    // Clear any pending timeouts
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }
    
    // Update last attempt timestamp
    lastAttemptRef.current = now
    
    try {
      logger.info("Fetching subscription data...")
      await dispatch(fetchSubscription()).unwrap()
      // Reset retry count and error state on success
      retryCountRef.current = 0
      setShowNetworkError(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error(`Subscription fetch failed: ${errorMessage}`)
      
      // Check if this is a network connectivity issue
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('Network connectivity') ||
                             errorMessage.includes('timeout') ||
                             !navigator.onLine
      
      // Show error after multiple consecutive failures
      if (retryCountRef.current >= 2) {
        setShowNetworkError(true)
      }
      
      // Implement exponential backoff for retries with longer delays for network issues
      if (retryCountRef.current < MAX_RETRY_COUNT) {
        // Use longer delays for network issues
        const baseDelay = isNetworkError ? RETRY_DELAY_BASE * 2 : RETRY_DELAY_BASE
        const retryDelay = baseDelay * Math.pow(2, retryCountRef.current)
        retryCountRef.current++
        
        logger.info(`Scheduling retry ${retryCountRef.current}/${MAX_RETRY_COUNT} in ${retryDelay/1000}s`)
        
        fetchTimeoutRef.current = setTimeout(() => {
          debouncedFetchWithRetry(true)
        }, retryDelay)
      } else {
        logger.warn(`Maximum retry attempts (${MAX_RETRY_COUNT}) reached. Will try again on next regular interval.`)
        retryCountRef.current = 0 // Reset for next cycle
      }
    }
  }, [dispatch, isLoading, lastFetched])

  // Initial fetch on mount
  useEffect(() => {
    // Only fetch once on initial mount
    if (!initialRefreshDoneRef.current) {
      logger.info("Initial subscription data fetch")
      debouncedFetchWithRetry(true)
      initialRefreshDoneRef.current = true
    }

    // Set up an interval for regular refreshes
    refreshIntervalRef.current = setInterval(() => {
      debouncedFetchWithRetry()
    }, REFRESH_INTERVAL)

    // Cleanup function
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

  // Watch for errors and retry
  useEffect(() => {
    if (error && !isLoading && retryCountRef.current === 0) {
      const retryDelay = RETRY_DELAY_BASE
      logger.info(`Error detected, scheduling retry in ${retryDelay/1000}s`)
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        retryCountRef.current = 1 // First retry
        debouncedFetchWithRetry(true)
      }, retryDelay)
    }
  }, [error, isLoading, debouncedFetchWithRetry])

  // Add listeners for online/offline events to react to network changes
  useEffect(() => {
    const handleOnline = () => {
      logger.info("Network connection restored - attempting to fetch subscription data")
      // When we come back online, force a fresh fetch
      debouncedFetchWithRetry(true)
    }
    
    const handleOffline = () => {
      logger.warn("Network connection lost - will retry when back online")
      // Clear any pending retries when we go offline
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
    }
    
    // Add event listeners for network status
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [debouncedFetchWithRetry])
  // Return null when everything is working fine, but show a minimal error notification
  // when we've had multiple failed attempts
  if (!showNetworkError) {
    return null
  }
  
  // Simple inline error component that shows only after multiple failed attempts
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 p-3 rounded-lg shadow-md text-sm text-red-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  )
}

export default SubscriptionRefresher
