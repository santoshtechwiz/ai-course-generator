"use client"

import React from "react"

import { Suspense, useEffect } from "react"
import { getAuthSession } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import TrialModal from "@/components/TrialModal"
import { PricingPage } from "./PricingPage"
import { StripeSecureCheckout } from "./StripeSecureCheckout"
import { SubscriptionPlanType } from "./subscription.config"


export default function SubscriptionPageClient() {
  const [userId, setUserId] = React.useState<string | null>(null)
  const [subscriptionData, setSubscriptionData] = React.useState<{
    currentPlan: SubscriptionPlanType | null
    subscriptionStatus: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | null
    tokensUsed: number
    error?: string
  }>({
    currentPlan: null,
    subscriptionStatus: null,
    tokensUsed: 0,
  })
  const [isSubscribed, setIsSubscribed] = React.useState(false)
  const isProd = process.env.NODE_ENV === "production"

  useEffect(() => {
    const fetchData = async () => {
      const session = await getAuthSession()
      const id = session?.user?.id ?? null
      setUserId(id)

      if (id) {
        try {
          const { plan, status } = await SubscriptionService.getSubscriptionStatus(id)
          const tokenData = await SubscriptionService.getTokensUsed(id)

          setSubscriptionData({
            currentPlan: plan as SubscriptionPlanType,
            subscriptionStatus: status as "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | null,
            tokensUsed: tokenData.used,
          })
          setIsSubscribed(status === "ACTIVE")
        } catch (error) {
          console.error("Error fetching subscription data:", error)
          setSubscriptionData({
            currentPlan: "FREE",
            subscriptionStatus: null,
            tokensUsed: 0,
            error: "Failed to fetch subscription data",
          })
        }
      } else {
        setSubscriptionData({
          currentPlan: "FREE",
          subscriptionStatus: null,
          tokensUsed: 0,
        })
      }
    }

    fetchData()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Trial Modal - Client Component */}
      <TrialModal isSubscribed={isSubscribed} currentPlan={subscriptionData.currentPlan} />

      <Suspense fallback={<PricingPageSkeleton />}>
        <PricingPageWrapper userId={userId} subscriptionData={subscriptionData} isProd={isProd} />
      </Suspense>
    </div>
  )
}

function PricingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full" />
        ))}
      </div>
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

function PricingPageWrapper({
  userId,
  subscriptionData,
  isProd,
}: {
  userId: string | null
  subscriptionData: {
    currentPlan: SubscriptionPlanType | null
    subscriptionStatus: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | null
    tokensUsed: number
    error?: string
  }
  isProd: boolean
}) {
  const { currentPlan, subscriptionStatus, tokensUsed, error } = subscriptionData

  useEffect(() => {
    // No automatic activation, require user to click the button
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <PricingPage
        userId={userId}
        currentPlan={currentPlan}
        subscriptionStatus={subscriptionStatus}
        tokensUsed={tokensUsed}
        isProd={isProd}
      />

      {/* Add the Stripe secure checkout component */}
      <div className="max-w-md mx-auto">
        <StripeSecureCheckout />
      </div>
    </div>
  )
}

