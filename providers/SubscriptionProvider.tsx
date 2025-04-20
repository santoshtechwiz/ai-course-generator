"use client"

import type React from "react"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSubscriptionStore } from "@/app/store/subscriptionStore"

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const fetchSubscriptionStatus = useSubscriptionStore((state) => state.fetchSubscriptionStatus)

  useEffect(() => {
    // When authentication status changes, update subscription data
    if (status === "authenticated" && session?.user) {
      // Fetch subscription data from API
      fetchSubscriptionStatus(true)
    } else if (status === "unauthenticated") {
      // Reset subscription data for unauthenticated users
      useSubscriptionStore.setState({
        data: {
          credits: 0,
          tokensUsed: 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
        },
        status: "succeeded",
        isLoading: false,
        isError: false,
        error: null,
      })
    }
  }, [session, status, fetchSubscriptionStatus])

  return <>{children}</>
}
