import { useSession } from "next-auth/react"
import { useSubscription } from "@/hooks/useSubscription"
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans"


export function usePlanAware() {
  const { data: session, status } = useSession()
  const { subscriptionStatus, isLoading: isSubscriptionLoading } = useSubscription()

  const currentPlan = SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionStatus?.plan) || SUBSCRIPTION_PLANS[0]

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading" || isSubscriptionLoading

  return {
    isAuthenticated,
    isLoading,
    currentPlan,
    subscriptionStatus,
  }
}

