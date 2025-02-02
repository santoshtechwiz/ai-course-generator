"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { SubscriptionPlanType } from "@/config/subscriptionPlans"

export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
  // New fields (optional)
  expirationDate?: string
  lastUpdated?: string
  usageStats?: {
    coursesCreated: number
    questionsAsked: number
    pdfDownloads: number
  }
}

interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void
  setIsLoading: (loading: boolean) => void
  canDownloadPDF: () => boolean
  // New functions
  signOut: () => void
  updateUsageStats: (stats: Partial<NonNullable<SubscriptionStatus["usageStats"]>>) => void
}

const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptionStatus: null,
      isLoading: true,
      setSubscriptionStatus: (status) =>
        set({
          subscriptionStatus: status
            ? {
                ...status,
                lastUpdated: new Date().toISOString(),
              }
            : null,
        }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      canDownloadPDF: () => {
        const { subscriptionStatus } = get()
        return (
          subscriptionStatus !== null &&
          subscriptionStatus.subscriptionPlan !== "FREE" &&
          subscriptionStatus.subscriptionPlan !== "BASIC"
        )
      },
      // New functions
      signOut: () => {
        set({ subscriptionStatus: null })
        sessionStorage.removeItem("subscription-storage")
      },
      updateUsageStats: (stats) =>
        set((state) => ({
          subscriptionStatus: state.subscriptionStatus
            ? {
                ...state.subscriptionStatus,
                usageStats: {
                  ...state.subscriptionStatus.usageStats,
                  ...stats,
                },
                lastUpdated: new Date().toISOString(),
              }
            : null,
        })),
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

export default useSubscriptionStore

