"use client"

import TrialModal from "@/components/TrialModal"
import { useSubscription } from "@/store/subscription-provider"


export function SubscriptionStatus() {
  const { subscription, isLoading } = useSubscription()

  // Only show trial modal if we have successfully loaded data
  if (isLoading || !subscription) {
    return null
  }

  const isSubscribed = subscription?.isSubscribed || false
  const currentPlan = subscription?.subscriptionPlan || null

  return <TrialModal isSubscribed={isSubscribed} currentPlan={currentPlan} user={null} />
}
