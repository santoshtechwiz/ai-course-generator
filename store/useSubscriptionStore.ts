"use client"

import { create } from "zustand"

import type { SubscriptionPlanType } from "@/config/subscriptionPlans"

export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
}

interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void
  setIsLoading: (loading: boolean) => void
}

const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscriptionStatus: null,
  isLoading: true,
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}))

export default useSubscriptionStore
