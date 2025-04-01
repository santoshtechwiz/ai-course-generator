"use client"

import type { SubscriptionPlanType } from "@/app/types/subscription"
import { create } from "zustand"

export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
  expirationDate?: string
  isActive?: boolean
}

interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  error: string | null
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void
  setIsLoading: (loading: boolean) => void
  canDownloadPDF: () => boolean
  refreshSubscription: () => Promise<void>
}

const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptionStatus: null,
  isLoading: true,
  error: null,

  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  canDownloadPDF: () => {
    const { subscriptionStatus } = get()
    return subscriptionStatus !== null && subscriptionStatus.subscriptionPlan !== "FREE"
  },

  refreshSubscription: async () => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch("/api/subscriptions/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        next: { revalidate: 0 }, // Ensure fresh data
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch subscription status")
      }

      const data = await response.json()
      set({
        subscriptionStatus: data,
        isLoading: false,
      })

      return data
    } catch (error) {
      console.error("Error refreshing subscription:", error)
      set({
        error: error instanceof Error ? error.message : "An unknown error occurred",
        isLoading: false,
      })
    }
  },
}))

export default useSubscriptionStore

