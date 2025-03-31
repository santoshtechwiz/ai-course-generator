"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export function useSubscription() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [subscription, setSubscription] = useState<{
    plan: string | null
    status: string | null
    endDate: Date | null
  } | null>(null)

  const [tokensUsed, setTokensUsed] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubscriptionData = useCallback(async () => {
    if (!userId) return

    try {
      // Get subscription status
      const subscriptionRes = await fetch("/api/subscriptions/status")
      const subscriptionData = await subscriptionRes.json()

      setSubscription({
        plan: subscriptionData.plan,
        status: subscriptionData.status,
        endDate: subscriptionData.endDate ? new Date(subscriptionData.endDate) : null,
      })

      // Get token usage - this should be actual usage, not total tokens
      const tokensRes = await fetch("/api/tokens/usage")
      const tokensData = await tokensRes.json()

      // Set the actual tokens used, not the total tokens
      setTokensUsed(tokensData.used || 0)
    } catch (error) {
      console.error("Error fetching subscription data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const refreshSubscription = useCallback(async () => {
    setIsLoading(true)
    await fetchSubscriptionData()
  }, [fetchSubscriptionData])

  useEffect(() => {
    fetchSubscriptionData()

    // Listen for subscription changes
    const handleSubscriptionChange = () => {
      fetchSubscriptionData()
    }

    window.addEventListener("subscription-changed", handleSubscriptionChange)

    return () => {
      window.removeEventListener("subscription-changed", handleSubscriptionChange)
    }
  }, [fetchSubscriptionData])

  return {
    subscription,
    tokensUsed,
    isLoading,
    refreshSubscription,
  }
}

