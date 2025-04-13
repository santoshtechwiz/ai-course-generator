"use client"

import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
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

      // Primary attempt: Fetch from subscription status API
      const response = await fetch("/api/subscriptions/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        next: { revalidate: 0 }, // Ensure fresh data
        credentials: "include", // Important for auth cookies
      })

      if (response.ok) {
        const data = await response.json()

        // Transform the data to match our SubscriptionStatus interface if needed
        const subscriptionStatus: SubscriptionStatus = {
          credits: data.credits || 0,
          isSubscribed: data.active || false,
          subscriptionPlan: (data.plan as SubscriptionPlanType) || "FREE",
          expirationDate: data.expiresAt || undefined,
          isActive: data.active || false,
        }

        set({
          subscriptionStatus,
          isLoading: false,
        })

        return
      }

      // Fallback 1: Try to get data from user profile
      try {
        const profileResponse = await fetch("/api/profile", {
          credentials: "include",
          cache: "no-store",
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()

          if (profileData.user) {
            const subscriptionStatus: SubscriptionStatus = {
              credits: profileData.user.credits || 0,
              isSubscribed: !!profileData.user.subscriptionPlan && profileData.user.subscriptionPlan !== "FREE",
              subscriptionPlan: (profileData.user.subscriptionPlan as SubscriptionPlanType) || "FREE",
              expirationDate: profileData.user.subscriptionExpirationDate,
              isActive: profileData.user.subscriptionStatus === "active",
            }

            set({
              subscriptionStatus,
              isLoading: false,
            })

            return
          }
        }
      } catch (profileError) {
        console.warn("Error fetching profile:", profileError)
        // Continue to next fallback
      }

      // Fallback 2: Try to get data from session
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        })

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()

          if (sessionData.user) {
            const subscriptionStatus: SubscriptionStatus = {
              credits: sessionData.user.credits || 0,
              isSubscribed: !!sessionData.user.subscriptionPlan && sessionData.user.subscriptionPlan !== "FREE",
              subscriptionPlan: (sessionData.user.subscriptionPlan as SubscriptionPlanType) || "FREE",
              expirationDate: sessionData.user.subscriptionExpirationDate,
              isActive: sessionData.user.subscriptionStatus === "active",
            }

            set({
              subscriptionStatus,
              isLoading: false,
            })

            return
          }
        }
      } catch (sessionError) {
        console.warn("Error fetching session:", sessionError)
      }

      // If we get here, all attempts failed
      throw new Error("Failed to fetch subscription status from any source")
    } catch (error) {
      console.warn("Error refreshing subscription:", error)
      set({
        error: error instanceof Error ? error.message : "An unknown error occurred",
        isLoading: false,
      })
    }
  },
}))

export default useSubscriptionStore
