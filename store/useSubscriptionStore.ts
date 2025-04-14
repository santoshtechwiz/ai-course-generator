"use client"

import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export interface SubscriptionStatus {
  credits: number
  tokensUsed?: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
  expirationDate?: string
  isActive?: boolean
  lastFetched?: number
}

interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  error: string | null
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void
  setIsLoading: (loading: boolean) => void
  canDownloadPDF: () => boolean
  refreshSubscription: (force?: boolean) => Promise<void>
  shouldRefresh: () => boolean
  clearCache: () => void
}

// React Query configuration
const SUBSCRIPTION_QUERY_KEY = ["subscription-status"]

// Replace the entire fetchSubscriptionStatus function with this improved version
// that includes better error handling and data normalization
const fetchSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const response = await fetch("/api/subscriptions/status", {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized")
      }
      throw new Error(`Failed to fetch subscription status: ${response.statusText}`)
    }

    const data = await response.json()

    const isActive = data.status === "active" || data.isActive === true || data.active === true
    const isSubscribed = isActive && data.subscriptionPlan !== "FREE" && data.plan !== "FREE"
    const credits = typeof data.credits === "number" ? data.credits : 0

    return {
      credits: credits,
      tokensUsed: data.tokensUsed || 0,
      isSubscribed: isSubscribed,
      subscriptionPlan: ((data.subscriptionPlan || data.plan) as SubscriptionPlanType) || "FREE",
      expirationDate: data.expirationDate || data.expiresAt,
      isActive: isActive,
      lastFetched: Date.now(),
    }
  } catch (error) {
    console.warn("Error fetching subscription:", error)
    throw error
  }
}

// Replace the useSubscriptionQuery function with this optimized version
export const useSubscriptionQuery = () => {
  return useQuery<SubscriptionStatus, Error>({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchSubscriptionStatus,
    staleTime: 15000, // Reduced to 15 seconds for more real-time credit data
    refetchInterval: 30000, // Reduced to 30 seconds for credit-sensitive data
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always fetch on mount to get fresh credit data
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on 401 unauthorized errors
      if (error.message.includes("Unauthorized")) return false
      return failureCount < 2
    },
    retryDelay: (attempt) => Math.min(attempt * 1000, 5000),
  })
}

const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptionStatus: null,
      isLoading: false,
      error: null,

      setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      canDownloadPDF: () => {
        const { subscriptionStatus } = get()
        return subscriptionStatus !== null && subscriptionStatus.subscriptionPlan !== "FREE"
      },

      clearCache: () => {
        set({
          subscriptionStatus: null,
          isLoading: false,
          error: null,
        })
      },

      shouldRefresh: () => {
        const { subscriptionStatus, isLoading } = get()
        if (isLoading) return false
        if (!subscriptionStatus || !subscriptionStatus.lastFetched) return true
        return Date.now() - subscriptionStatus.lastFetched > 30000
      },

      // Replace the refreshSubscription method in the Zustand store with this optimized version
      refreshSubscription: async (force = false) => {
        const { shouldRefresh, isLoading } = get()
        if (!force && !shouldRefresh()) return
        if (isLoading) return

        set({ isLoading: true, error: null })

        try {
          // Use the same fetchSubscriptionStatus function that React Query uses
          const subscriptionStatus = await fetchSubscriptionStatus()

          set({
            subscriptionStatus,
            isLoading: false,
            error: null,
          })

          return subscriptionStatus
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "An unknown error occurred",
            isLoading: false,
          })
        }
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Don't store credit-sensitive information in persistent storage
        subscriptionStatus: state.subscriptionStatus
          ? {
              ...state.subscriptionStatus,
              credits: 0, // Don't persist credits in storage
              tokensUsed: 0, // Don't persist tokens in storage
              lastFetched: 0, // Force refresh on load
            }
          : null,
      }),
      version: 2, // Increment version to clear old format
    },
  ),
)

// Replace the useSubscription hook with this optimized version
export const useSubscription = () => {
  const queryClient = useQueryClient()
  const store = useSubscriptionStore()
  const query = useSubscriptionQuery()

  // Always use the query data for credits when available
  const combinedStatus = query.data || store.subscriptionStatus

  // Sync other non-credit data when we have fresh data
  if (query.data && !query.isStale && !store.isLoading) {
    // Only update the store if we're not just updating credits
    if (
      !store.subscriptionStatus ||
      query.data.subscriptionPlan !== store.subscriptionStatus.subscriptionPlan ||
      query.data.isSubscribed !== store.subscriptionStatus.isSubscribed ||
      query.data.isActive !== store.subscriptionStatus.isActive
    ) {
      store.setSubscriptionStatus(query.data)
    }
  }

  const refreshSubscription = async (force = false) => {
    if (force || !query.data) {
      // Force immediate refetch for credit-sensitive operations
      await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY })
      return query.refetch()
    } else if (queryClient.getQueryState(SUBSCRIPTION_QUERY_KEY)?.isStale) {
      return query.refetch()
    }
  }

  const clearCache = () => {
    store.clearCache()
    queryClient.removeQueries({ queryKey: SUBSCRIPTION_QUERY_KEY })
  }

  return {
    ...store,
    ...query,
    // Always prioritize fresh data from the query
    isLoading: query.isLoading || store.isLoading,
    isError: query.isError || !!store.error,
    error: query.error || store.error,
    subscriptionStatus: combinedStatus,
    // Maintain all original methods
    refreshSubscription,
    clearCache,
    canDownloadPDF: store.canDownloadPDF,
  }
}

export default useSubscriptionStore
