"use client"

import { useSession } from "next-auth/react"

import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans"
import useSubscriptionStore from "@/store/useSubscriptionStore"




export function usePlanAware() {
  const { data: session, status } = useSession()
  const { subscriptionStatus, isLoading: isSubscriptionLoading } = useSubscriptionStore();


  const currentPlan = SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionStatus?.subscriptionPlan) || SUBSCRIPTION_PLANS[0]

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading" || isSubscriptionLoading



  return {
    isAuthenticated,
    isLoading,
    currentPlan,
    subscriptionStatus,
  }
}

