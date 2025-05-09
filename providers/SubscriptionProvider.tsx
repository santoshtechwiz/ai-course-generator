"use client"

import type React from "react"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { setSubscriptionStatus, setIsLoading } = useSubscriptionStore()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const credits = session.user.credits ?? 0
      const subscriptionPlan = (session.user.subscriptionPlan as SubscriptionPlanType) || "FREE"
      const subscriptionStatus = session.user.subscriptionStatus || null

      setSubscriptionStatus({
        credits,
        isSubscribed: subscriptionPlan !== "FREE",
        subscriptionPlan,
        expirationDate: session.user.subscriptionExpirationDate,
        status: subscriptionStatus,
      })
      setIsLoading(false)
    } else if (status === "unauthenticated") {
      setSubscriptionStatus({
        credits: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
        status: "INACTIVE",
      })
      setIsLoading(false)
    } else {
      setSubscriptionStatus(null)
      setIsLoading(true)
    }
  }, [session, status, setSubscriptionStatus, setIsLoading])

  return <>{children}</>
}
