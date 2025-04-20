"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSubscriptionStore, SUBSCRIPTION_UPDATED_EVENT } from "@/store/useSubscriptionStore"

// Create context for subscription synchronization
const SubscriptionSyncContext = createContext<{
  refreshSubscription: () => Promise<any>
  isLoading: boolean
}>({
  refreshSubscription: async () => null,
  isLoading: false,
})

/**
 * Provider component that synchronizes subscription data with user menu and notifications
 */
export function SubscriptionSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { refreshSubscription, isLoading, subscriptionStatus } = useSubscriptionStore()

  // Refresh subscription data when session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      refreshSubscription(false)
    }
  }, [status, session, refreshSubscription])

  // Listen for subscription changes from other components
  useEffect(() => {
    const handleSubscriptionUpdated = () => {
      if (status === "authenticated") {
        refreshSubscription(false)
      }
    }

    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated)

    return () => {
      window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated)
    }
  }, [status, refreshSubscription])

  return (
    <SubscriptionSyncContext.Provider value={{ refreshSubscription, isLoading }}>
      {children}
    </SubscriptionSyncContext.Provider>
  )
}

/**
 * Hook to access subscription synchronization
 */
export function useSubscriptionSync() {
  return useContext(SubscriptionSyncContext)
}
