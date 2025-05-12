"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { createLogger } from "@/lib/logger"

// Create a dedicated logger for subscription hooks
const logger = createLogger("subscription-hooks")

// Define types for subscription data
export interface SubscriptionData {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: string
  expirationDate?: string
  status: string
  cancelAtPeriodEnd?: boolean
}

export interface TokenUsage {
  used: number
  total: number
  percentage: number
  hasExceededLimit: boolean
  remaining: number
}

// Cache for subscription data to reduce API calls
const subscriptionCache = new Map<string, { data: any; timestamp: number; error: string | null }>()
const CACHE_TTL = 60 * 1000 // 1 minute cache TTL

/**
 * Custom hook for managing subscription data
 */
export function useSubscription() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<number | null>(null)

  /**
   * Fetch subscription status from API
   */
  const fetchSubscriptionStatus = useCallback(
    async (force = false) => {
      if (status !== "authenticated" || !session?.user?.id) {
        setIsLoading(false)
        return
      }

      const userId = session.user.id
      const cacheKey = `subscription_${userId}`
      const now = Date.now()

      // Check cache first unless force refresh is requested
      if (!force) {
        const cachedData = subscriptionCache.get(cacheKey)
        if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
          logger.debug("Using cached subscription data")
          setData(cachedData.data)
          setError(cachedData.error)
          setIsLoading(false)
          setLastFetched(cachedData.timestamp)
          return
        }
      }

      setIsLoading(true)

      try {
        logger.debug("Fetching subscription data from API")
        const response = await fetch("/api/subscriptions/status", {
          headers: {
            "Cache-Control": force ? "no-cache, no-store" : "default",
            "x-force-refresh": force ? "true" : "false",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch subscription: ${response.status} ${response.statusText}`)
        }

        const subscriptionData = await response.json()

        // Format the data
        const formattedData: SubscriptionData = {
          credits: subscriptionData.credits || 0,
          tokensUsed: subscriptionData.tokensUsed || 0,
          isSubscribed: subscriptionData.isSubscribed || false,
          subscriptionPlan: subscriptionData.subscriptionPlan || "FREE",
          expirationDate: subscriptionData.expirationDate || undefined,
          status: subscriptionData.status || "INACTIVE",
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
        }

        // Update state
        setData(formattedData)
        setError(null)

        // Cache the result
        subscriptionCache.set(cacheKey, {
          data: formattedData,
          timestamp: now,
          error: null,
        })

        setLastFetched(now)
        logger.debug("Successfully fetched subscription data")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error fetching subscription"
        logger.error("Error fetching subscription:", errorMessage)
        setError(errorMessage)

        // Cache the error to prevent repeated failed requests
        subscriptionCache.set(cacheKey, {
          data: null,
          timestamp: now,
          error: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [session, status],
  )

  /**
   * Fetch subscription details (billing history, etc.)
   */
  const fetchSubscriptionDetails = useCallback(
    async (force = false) => {
      if (status !== "authenticated" || !session?.user?.id) {
        return
      }

      const userId = session.user.id
      const cacheKey = `subscription_details_${userId}`
      const now = Date.now()

      // Check cache first unless force refresh is requested
      if (!force) {
        const cachedData = subscriptionCache.get(cacheKey)
        if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
          logger.debug("Using cached subscription details")
          return cachedData.data
        }
      }

      try {
        logger.debug("Fetching subscription details from API")
        const response = await fetch("/api/subscriptions", {
          headers: {
            "Cache-Control": force ? "no-cache, no-store" : "default",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch subscription details: ${response.status} ${response.statusText}`)
        }

        const details = await response.json()

        // Cache the result
        subscriptionCache.set(cacheKey, {
          data: details,
          timestamp: now,
          error: null,
        })

        logger.debug("Successfully fetched subscription details")
        return details
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error fetching subscription details"
        logger.error("Error fetching subscription details:", errorMessage)

        // Don't cache errors for details to allow retries
        return null
      }
    },
    [session, status],
  )

  /**
   * Clear subscription cache
   */
  const clearSubscriptionCache = useCallback(() => {
    if (!session?.user?.id) return

    const userId = session.user.id
    const keysToDelete = [`subscription_${userId}`, `subscription_details_${userId}`, `tokens_${userId}`]

    keysToDelete.forEach((key) => subscriptionCache.delete(key))
    logger.debug("Cleared subscription cache")

    // Force refresh data
    fetchSubscriptionStatus(true)
  }, [session, fetchSubscriptionStatus])

  // Initial fetch on mount or when session changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchSubscriptionStatus()
    } else if (status === "unauthenticated") {
      setData(null)
      setIsLoading(false)
    }
  }, [status, fetchSubscriptionStatus])

  return {
    data,
    isLoading,
    error,
    lastFetched,
    fetchSubscriptionStatus,
    fetchSubscriptionDetails,
    clearSubscriptionCache,
  }
}

/**
 * Hook for accessing subscription plan information
 */
export function useSubscriptionPlan() {
  const { data: subscriptionData } = useSubscription()

  const isSubscribed = subscriptionData?.isSubscribed || false
  const currentPlan = subscriptionData?.subscriptionPlan || "FREE"
  const expirationDate = subscriptionData?.expirationDate
  const cancelAtPeriodEnd = subscriptionData?.cancelAtPeriodEnd || false
  const status = subscriptionData?.status || "NONE"

  return {
    isSubscribed,
    currentPlan,
    expirationDate,
    cancelAtPeriodEnd,
    status,
    isActive: status === "ACTIVE",
    isCancelled: status === "CANCELED" || cancelAtPeriodEnd,
    isPastDue: status === "PAST_DUE",
    isFree: currentPlan === "FREE",
  }
}

/**
 * Hook for accessing token usage information
 */
export function useTokenUsage(): TokenUsage {
  const { data: subscriptionData } = useSubscription()

  const tokensUsed = subscriptionData?.tokensUsed || 0
  const totalTokens = subscriptionData?.credits || 0

  const tokenUsagePercentage = totalTokens > 0 ? Math.min((tokensUsed / totalTokens) * 100, 100) : 0

  const hasExceededLimit = tokensUsed > 0 && tokensUsed > totalTokens

  return {
    used: tokensUsed,
    total: totalTokens,
    percentage: tokenUsagePercentage,
    hasExceededLimit,
    remaining: Math.max(totalTokens - tokensUsed, 0),
  }
}
