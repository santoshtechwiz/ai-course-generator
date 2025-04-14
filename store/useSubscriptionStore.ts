"use client"

import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

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
  refreshSubscription: () => Promise<void>
  shouldRefresh: () => boolean
  clearCache: () => void
}

// Define a cache TTL (time to live) in milliseconds
const CACHE_TTL = 30000 // 30 seconds - reduced to ensure credits update more frequently

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

      // Clear the cache to force a refresh
      clearCache: () => {
        set({
          subscriptionStatus: null,
          isLoading: false,
          error: null,
        })
      },

      // Check if we should refresh the data based on cache time
      shouldRefresh: () => {
        const { subscriptionStatus, isLoading } = get()

        // If already loading, don't trigger another refresh
        if (isLoading) return false

        // If no data or no lastFetched timestamp, we should refresh
        if (!subscriptionStatus || !subscriptionStatus.lastFetched) return true

        // Check if the cache has expired
        const now = Date.now()
        return now - subscriptionStatus.lastFetched > CACHE_TTL
      },

      refreshSubscription: async () => {
        // Check if we should actually refresh
        if (!get().shouldRefresh()) {
          return
        }

        try {
          set({ isLoading: true, error: null })

          // Add a cache-busting parameter to prevent browser caching
          const cacheBuster = `nocache=${Date.now()}`
          const response = await fetch(`/api/subscriptions/status?${cacheBuster}`, {
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              "x-force-refresh": "true",
            },
            next: { revalidate: 0 }, // Ensure Next.js doesn't cache this request
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch subscription status: ${response.statusText}`)
          }

          const data = await response.json()

          // Debug the API response
            if (process.env.NODE_ENV === "development") {
            console.log("API Response:", JSON.stringify(data, null, 2))
            }

          // Determine subscription status correctly
          const isActive = data.status === "active" || data.isActive === true || data.active === true
          const isSubscribed = isActive && data.subscriptionPlan !== "FREE" && data.plan !== "FREE"

          // Ensure credits is properly extracted and defaulted
          const credits = typeof data.credits === "number" ? data.credits : 0

          // Add lastFetched timestamp to the data
          const subscriptionStatus: SubscriptionStatus = {
            credits: credits,
            tokensUsed: data.tokensUsed || 0,
            isSubscribed: isSubscribed,
            subscriptionPlan: ((data.subscriptionPlan || data.plan) as SubscriptionPlanType) || "FREE",
            expirationDate: data.expirationDate || data.expiresAt,
            isActive: isActive,
            lastFetched: Date.now(),
          }

          // Debug the transformed data
          console.log("Transformed subscription data:", JSON.stringify(subscriptionStatus, null, 2))

          set({
            subscriptionStatus,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.warn("Error refreshing subscription:", error)
          set({
            error: error instanceof Error ? error.message : "An unknown error occurred",
            isLoading: false,
          })
        }
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage instead of localStorage
      partialize: (state) => ({
        subscriptionStatus: state.subscriptionStatus,
      }),
      // Add version control to handle schema changes
      version: 1,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Force refresh on page load to ensure data is fresh
            setTimeout(() => {
              state.refreshSubscription()
            }, 100)
          }
        }
      },
    },
  ),
)

export default useSubscriptionStore
