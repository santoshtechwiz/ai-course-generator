import { Suspense } from "react"
import { getAuthSession } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import type { SubscriptionPlanType } from "./components/subscription.config"
import { PricingPage } from "./components/PricingPage"
import { StripeSecureCheckout } from "./components/StripeSecureCheckout"

export const metadata: Metadata = generatePageMetadata({
  title: "Subscription Plans | Course AI",
  description:
    "Explore our subscription plans and choose the perfect option to enhance your learning experience with Course AI.",
  path: "/dashboard/subscription",
  keywords: [
    "subscription plans",
    "pricing",
    "premium features",
    "learning subscription",
    "course access",
    "educational plans",
  ],
  ogImage: "/og-image-subscription.jpg",
})

export default async function Page() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? null
  const isProd = process.env.NODE_ENV === "production"

  async function getSubscriptionData(): Promise<{
    currentPlan: SubscriptionPlanType | null
    subscriptionStatus: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | null
    tokensUsed: number
    error?: string
  }> {
    if (!userId) {
      return {
        currentPlan: null,
        subscriptionStatus: null,
        tokensUsed: 0,
      }
    }
    try {
      const { plan, status } = await SubscriptionService.getSubscriptionStatus(userId)

      // Get token usage data
      const tokenData = await SubscriptionService.getTokensUsed(userId)

      // Extract the 'used' property from the token data object
      // Make sure we're handling the case where tokenData might be null or not an object
      const tokensUsed = typeof tokenData === "object" && tokenData !== null ? Number(tokenData.used) || 0 : 0

      return {
        currentPlan: plan as SubscriptionPlanType,
        subscriptionStatus: status as "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | null,
        tokensUsed,
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      return {
        currentPlan: null,
        subscriptionStatus: null,
        tokensUsed: 0,
        error: "Failed to fetch subscription data",
      }
    }
  }

  const subscriptionData = await getSubscriptionData()

  return (
    <div className="container mx-auto px-4 py-8">
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

// Simplify the PricingPageWrapper component to remove unnecessary components
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

