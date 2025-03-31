"use client"

import { useState, useEffect, useCallback } from "react"

type SubscriptionPlanType = "free" | "basic" | "premium" // Define your plan types
type SubscriptionStatusType = "active" | "inactive" | "canceled" // Define your status types

// Update the interface to include totalTokens and tokensUsed with proper naming
interface SubscriptionData {
  plan: SubscriptionPlanType | null
  status: SubscriptionStatusType
  endDate: string | null
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number>(0)
  const [totalTokens, setTotalTokens] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/subscriptions/status")

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data")
      }

      const data = await response.json()

      setSubscription({
        plan: data.plan,
        status: data.status,
        endDate: data.endDate,
      })

      // Update to use the actual credits and creditsUsed from the user table
      setTotalTokens(data.totalTokens || 0)
      setTokensUsed(data.tokensUsed || 0)
    } catch (err: any) {
      console.error("Error fetching subscription:", err)
      setError(err.message || "Failed to load subscription data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  return {
    subscription,
    tokensUsed,
    totalTokens,
    isLoading,
    error,
    refetch: fetchSubscriptionData,
  }
}

