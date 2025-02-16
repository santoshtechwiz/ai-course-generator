"use client"

import { create } from "zustand"
import type { SubscriptionPlanType } from "@/config/subscriptionPlans"

export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
  expirationDate?: string
}

interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  fetchSubscriptionStatus: () => Promise<void>
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void
  setIsLoading: (loading: boolean) => void
  canDownloadPDF: () => boolean
  signOut: () => void
}

const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptionStatus: null,
  isLoading: true,
  fetchSubscriptionStatus: async () => {
    set({ isLoading: true })
    try {
      // Replace this with your actual API call if needed
      const response = await fetch("/api/subscription/status")
      if (!response.ok) throw new Error("Failed to fetch subscription status")
      const status: SubscriptionStatus = await response.json()
      set({ subscriptionStatus: status, isLoading: false })
    } catch (error) {
      console.error("Error fetching subscription status:", error)
      set({ isLoading: false })
    }
  },
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  canDownloadPDF: () => {
    const { subscriptionStatus } = get()
    return subscriptionStatus !== null && subscriptionStatus.subscriptionPlan !== "FREE"
  },
  signOut: () => {
    set({ subscriptionStatus: null })
  },
}))

export default useSubscriptionStore

