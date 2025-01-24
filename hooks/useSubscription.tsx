"use client"

import useSubscriptionStore from "@/store/useSubscriptionStore"

export function useSubscription() {
  const { subscriptionStatus, isLoading } = useSubscriptionStore()

  if (subscriptionStatus === null && !isLoading) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }

  return { subscriptionStatus, isLoading }
}

