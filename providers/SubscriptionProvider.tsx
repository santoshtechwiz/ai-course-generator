"use client"

import type React from "react"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { SubscriptionPlanType } from "@/app/dashboard/subscription/components/subscription-plans"

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { setSubscriptionStatus, setIsLoading } = useSubscriptionStore()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const credits = session.user.credits ?? 0
      const subscriptionPlan = (session.user.subscriptionPlan as SubscriptionPlanType) || "FREE"

      setSubscriptionStatus({
        credits,
        isSubscribed: subscriptionPlan !== "FREE",
        subscriptionPlan,
        expirationDate: session.user.subscriptionExpirationDate,
      })
      setIsLoading(false)
    } else if (status === "unauthenticated") {
      setSubscriptionStatus({
        credits: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
      })
      setIsLoading(false)
    } else {
      setSubscriptionStatus(null)
      setIsLoading(true)
    }
  }, [session, status, setSubscriptionStatus, setIsLoading])

  return <>{children}</>
}