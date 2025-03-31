"use client"

import { useState, useEffect } from "react"

export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null)
  const [tokensUsed, setTokensUsed] = useState<number>(0)
  const [tokensReceived, setTokensReceived] = useState<number>(0)
  const [tokensRemaining, setTokensRemaining] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTokenUsage = async () => {
    try {
      const response = await fetch("/api/tokens/usage")
      const data = await response.json()

      // Ensure we're returning numbers, not objects
      return {
        used: typeof data.used === "number" ? data.used : 0,
        received: typeof data.received === "number" ? data.received : 0,
        remaining: typeof data.remaining === "number" ? data.remaining : 0,
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
      }
    } catch (error) {
      console.error("Error fetching token usage:", error)
      return { used: 0, received: 0, remaining: 0, transactions: [] }
    }
  }

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true)

      // Fetch subscription status
      const subscriptionResponse = await fetch("/api/subscriptions")
      if (!subscriptionResponse.ok) {
        throw new Error("Failed to fetch subscription data")
      }
      const subscriptionData = await subscriptionResponse.json()

      // Fetch token usage data
      const tokenData = await fetchTokenUsage()

      setSubscription({
        plan: subscriptionData.plan || "FREE",
        status: subscriptionData.status || "INACTIVE",
        endDate: subscriptionData.endDate ? new Date(subscriptionData.endDate) : null,
      })

      setTokensUsed(tokenData.used || 0)
      setTokensReceived(tokenData.received || 0)
      setTokensRemaining(tokenData.remaining || 0)

      setError(null)
    } catch (err: any) {
      console.error("Error fetching subscription data:", err)
      setError(err.message || "Failed to load subscription data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  return {
    subscription,
    tokensUsed,
    tokensReceived,
    tokensRemaining,
    isLoading,
    error,
    refreshSubscription: fetchSubscriptionData,
  }
}

