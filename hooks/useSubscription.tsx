"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { SubscriptionPlanType } from "@/config/subscriptionPlans"

export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType | "FREE"
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const credits = session.user.credits ?? 0
      const subscriptionPlan = (session.user.subscriptionPlan as SubscriptionPlanType) || "FREE"

      setSubscriptionStatus({
        credits,
        isSubscribed: subscriptionPlan !== "FREE",
        subscriptionPlan,
      })
      setIsLoading(false)
    } else if (status === "unauthenticated") {
      setSubscriptionStatus({
        credits: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
      })
      setIsLoading(false)
    } else {
      setSubscriptionStatus(null)
      setIsLoading(true)
    }
  }, [session, status])

  return (
    <SubscriptionContext.Provider value={{ subscriptionStatus, isLoading }}>{children}</SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

