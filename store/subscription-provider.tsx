"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { SubscriptionData, SubscriptionDetails } from "@/app/types/types"

// Import existing subscription types


interface SubscriptionContextType {
  subscription: SubscriptionData | null
  details: SubscriptionDetails | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<any>
}

// Create context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  details: null,
  isLoading: false,
  error: null,
  refetch: async () => {},
})

// Custom hook to use subscription data
export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

// Fetch subscription data from API
async function fetchSubscription(userId: string | undefined): Promise<{
  subscription: SubscriptionData | null
  details: SubscriptionDetails | null
}> {
  if (!userId) return { subscription: null, details: null }

  try {
    const response = await fetch(`/api/subscriptions`)
    if (!response.ok) {
      throw new Error("Failed to fetch subscription data")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return { subscription: null, details: null }
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const userId = session?.user?.id

  // Use React Query to manage subscription data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: () => fetchSubscription(userId),
    enabled: !!userId, // Only run query if userId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Provide subscription data to children
  const value = {
    subscription: data?.subscription || null,
    details: data?.details || null,
    isLoading: !!userId && isLoading, // Only consider loading if we have a userId
    error: error as Error | null,
    refetch,
  }

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
