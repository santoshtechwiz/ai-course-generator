"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
import { useIdleTimer } from "@/hooks/use-idle-timer"
import { useVisibilityChange } from "@/hooks/use-visibility-change"

// Define subscription status interface
export interface SubscriptionStatus {
  credits: number
  tokensUsed?: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
  expirationDate?: string
  isActive?: boolean
  cancelAtPeriodEnd?: boolean
  status?: string
}

// Query keys for better cache management
const QUERY_KEYS = {
  subscriptionStatus: ["subscription", "status"],
  subscriptionDetails: ["subscription", "details"],
}

// Fetch critical subscription data (status, plan, etc.)
const fetchSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await fetch("/api/subscriptions/status", {
    credentials: "include",
    headers: {
      "x-data-type": "critical",
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized")
    }
    throw new Error(`Failed to fetch subscription status: ${response.statusText}`)
  }

  const data = await response.json()

  const isActive = data.status === "ACTIVE" || data.isActive === true || data.active === true
  const isSubscribed = isActive && data.subscriptionPlan !== "FREE" && data.plan !== "FREE"

  return {
    credits: typeof data.credits === "number" ? data.credits : 0,
    isSubscribed,
    subscriptionPlan: ((data.subscriptionPlan || data.plan) as SubscriptionPlanType) || "FREE",
    expirationDate: data.expirationDate || data.expiresAt,
    isActive,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
    status: data.status,
  }
}

// Fetch detailed subscription data (usage, history, etc.)
const fetchSubscriptionDetails = async (): Promise<any> => {
  const response = await fetch("/api/subscriptions", {
    credentials: "include",
    headers: {
      "x-data-type": "details",
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized")
    }
    throw new Error(`Failed to fetch subscription details: ${response.statusText}`)
  }

  return response.json()
}

export function useSubscriptionStore(options: { criticalOnly?: boolean } = {}) {
  const { criticalOnly = false } = options
  const queryClient = useQueryClient()
  const isVisible = useVisibilityChange()
  const { isIdle } = useIdleTimer({ idleTime: 5 * 60 * 1000 }) // 5 minutes

  // Query for critical subscription data (status, plan)
  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus,
    queryFn: fetchSubscriptionStatus,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: isVisible && !isIdle ? 2 * 60 * 1000 : false, // 2 minutes when visible and active
    refetchOnWindowFocus: isVisible && !isIdle,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error.message.includes("Unauthorized")) return false
      return failureCount < 3
    },
  })

  // Query for detailed subscription data (only if needed and not critical-only mode)
  const detailsQuery = useQuery({
    queryKey: QUERY_KEYS.subscriptionDetails,
    queryFn: fetchSubscriptionDetails,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isVisible && !isIdle ? 10 * 60 * 1000 : false, // 10 minutes when visible and active
    refetchOnWindowFocus: false,
    refetchOnMount: !criticalOnly,
    enabled: !criticalOnly && isVisible && !isIdle, // Only fetch details when needed
    retry: (failureCount, error) => {
      if (error.message.includes("Unauthorized")) return false
      return failureCount < 2
    },
  })

  // Refresh subscription data when user becomes active after being idle
  useEffect(() => {
    if (isVisible && !isIdle) {
      const lastFetch = statusQuery.dataUpdatedAt
      const timeSinceLastFetch = Date.now() - lastFetch

      // If it's been more than 5 minutes since the last fetch, refresh
      if (timeSinceLastFetch > 5 * 60 * 1000) {
        statusQuery.refetch()
        if (!criticalOnly) {
          detailsQuery.refetch()
        }
      }
    }
  }, [isVisible, isIdle, statusQuery, detailsQuery, criticalOnly])

  // Combine data from both queries
  const combinedData: SubscriptionStatus = {
    ...statusQuery.data,
    ...(detailsQuery.data?.tokenUsage && {
      tokensUsed: detailsQuery.data.tokenUsage.used,
    }),
  }

  // Helper functions
  const refreshSubscription = async (force = false) => {
    if (force) {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus })
      if (!criticalOnly) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionDetails })
      }
    }

    const results = await Promise.all([
      statusQuery.refetch(),
      !criticalOnly ? detailsQuery.refetch() : Promise.resolve(),
    ])

    return results[0].data
  }

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.subscriptionStatus })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.subscriptionDetails })
  }

  const canDownloadPDF = () => {
    return statusQuery.data?.isSubscribed || statusQuery.data?.subscriptionPlan !== "FREE"
  }

  return {
    subscriptionStatus: statusQuery.data || null,
    subscriptionDetails: detailsQuery.data || null,
    isLoading: statusQuery.isLoading || (!criticalOnly && detailsQuery.isLoading),
    isError: statusQuery.isError || (!criticalOnly && detailsQuery.isError),
    error: statusQuery.error || (!criticalOnly && detailsQuery.error) || null,
    refreshSubscription,
    clearCache,
    canDownloadPDF,
    combinedData,
  }
}
