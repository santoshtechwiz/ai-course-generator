"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAppDispatch } from "@/store"
import useSubscription from "@/app/dashboard/subscription/hooks/use-subscription"
import { SubscriptionState, fetchSubscriptionStatus } from "./slices/subscription-slice"


// Create context with safe default values
interface SubscriptionContextType {
  subscription: SubscriptionState | null
  isLoading: boolean
  error: string | null
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: false,
  error: null,
  refreshSubscription: async () => {},
})

export const useSubscriptionContext = () => useContext(SubscriptionContext)

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const { subscription, isLoading, error, fetchStatus } = useSubscription()
  const [initialized, setInitialized] = useState(false)

  // Initialize subscription data from Redux
  useEffect(() => {
    const initSubscription = async () => {
      try {
        await dispatch(fetchSubscriptionStatus())
        setInitialized(true)
      } catch (error) {
        console.error("Failed to initialize subscription:", error)
      }
    }

    if (!initialized) {
      initSubscription()
    }
  }, [dispatch, initialized])

  // Safe refresh function that won't throw errors
  const refreshSubscription = async () => {
    try {
      await fetchStatus(true)
    } catch (error) {
      console.error("Error refreshing subscription:", error)
    }
  }

  return (
    <SubscriptionContext.Provider
      value={{
        subscription: subscription || null,
        isLoading,
        error,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export default SubscriptionProvider
