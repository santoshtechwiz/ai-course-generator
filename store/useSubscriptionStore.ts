"use client"

import { SubscriptionPlanType } from "@/app/dashboard/subscription/components/subscription.config"
import { create } from "zustand"


export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
  expirationDate?: string
}

interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void
  setIsLoading: (loading: boolean) => void
  canDownloadPDF: () => boolean
}

const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptionStatus: null,
  isLoading: true,
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  canDownloadPDF: () => {
    const { subscriptionStatus } = get()
    return subscriptionStatus !== null && subscriptionStatus.subscriptionPlan !== "FREE"
  },
}))

export default useSubscriptionStore