"use client"

import { useSession } from "next-auth/react"
import { useSubscription } from "@/hooks/useSubscription"
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans"
import { useLoading } from "@/app/providers/laderContext"



export function usePlanAware() {
  const { data: session, status } = useSession()
  const { subscriptionStatus, isLoading: isSubscriptionLoading } = useSubscription()
  const { setLoading } = useLoading()

  const currentPlan = SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionStatus?.subscriptionPlan) || SUBSCRIPTION_PLANS[0]

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading" || isSubscriptionLoading

  // Update global loading state
  setLoading(isLoading)

  return {
    isAuthenticated,
    isLoading,
    currentPlan,
    subscriptionStatus,
  }
}

