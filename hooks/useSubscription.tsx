"use client"

import { useEffect } from "react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function useSubscription() {
  const { subscriptionStatus, isLoading, setIsLoading } = useSubscriptionStore()

  useEffect(() => {
    setIsLoading(true)
    // Simulating an async operation
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [setIsLoading])

  return { subscriptionStatus, isLoading }
}

