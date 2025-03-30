"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionData {
  isSubscribed: boolean
  subscriptionPlan: string
  expirationDate: string | null
  credits: number
  error?: string
}

export function useSubscription(userId: string | null) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Update the fetchSubscriptionData function to handle errors better
  const fetchSubscriptionData = useCallback(async () => {
    if (!userId) {
      setSubscriptionData(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/account/subscription", {
        headers: {
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription data: ${response.status}`)
      }

      const data = await response.json()

      // Ensure tokens/credits are properly set even if they're 0
      if (data.credits === undefined || data.credits === null) {
        data.credits = 0
      }

      setSubscriptionData(data)
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      setSubscriptionData({
        isSubscribed: false,
        subscriptionPlan: "FREE",
        expirationDate: null,
        credits: 0,
        error: error instanceof Error ? error.message : "Failed to load subscription data",
      })

      // Only show toast for network errors, not for aborted requests
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast({
          title: "Error",
          description: "Failed to load subscription data. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId, toast])

  useEffect(() => {
    if (!userId) return

    let isMounted = true
    const controller = new AbortController()

    const fetchData = async () => {
      try {
        await fetchSubscriptionData()
      } catch (error) {
        if (isMounted) {
          console.error("Error in subscription hook:", error)
        }
      }
    }

    fetchData()

    // Cleanup function
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [userId, fetchSubscriptionData])

  // Add an event listener for subscription changes
  useEffect(() => {
    const handleSubscriptionChange = () => {
      fetchSubscriptionData()
    }

    // Listen for the subscription-changed event
    window.addEventListener("subscription-changed", handleSubscriptionChange)

    // Cleanup function
    return () => {
      window.removeEventListener("subscription-changed", handleSubscriptionChange)
    }
  }, [fetchSubscriptionData])

  return {
    subscriptionData,
    isLoading,
    refreshSubscription: fetchSubscriptionData,
  }
}

