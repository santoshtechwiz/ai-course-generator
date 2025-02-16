"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { SubscriptionPlanType } from "@/config/subscriptionPlans"

export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
  expirationDate?: string
  lastUpdated?: string
  usageStats?: {
    coursesCreated?: number
    questionsAsked?: number
    pdfDownloads?: number
  }
}

interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void
  setIsLoading: (loading: boolean) => void
  canDownloadPDF: () => boolean
  signOut: () => void
  updateUsageStats: (stats: Partial<NonNullable<SubscriptionStatus["usageStats"]>>) => void
}

const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptionStatus: null,
      isLoading: true,
      setSubscriptionStatus: (status) =>
        set((state) => ({
          subscriptionStatus: status
            ? {
                ...status,
                lastUpdated: new Date().toISOString(),
              }
            : null,
        })),
      setIsLoading: (loading) => set({ isLoading: loading }),
      canDownloadPDF: () => {
        const { subscriptionStatus } = get()
        // Ensure that the subscriptionStatus is not null and the plan is not "FREE" or "BASIC"
        return subscriptionStatus !== null && subscriptionStatus.subscriptionPlan
         !== "FREE"
      },
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
      partialize: (state) => ({ subscriptionStatus: state.subscriptionStatus }),
    },
  ),
)

export default useSubscriptionStore