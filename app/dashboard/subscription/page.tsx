import { Suspense } from "react"
import { getAuthSession } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { SubscriptionPlanType } from "./components/subscription.config"
import { PricingPage } from "./components/subscription_plan"


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
      // You would need to  status } = await SubscriptionService.getSubscriptionStatus(userId);
      // You would need to implement a method to get tokens used
      const tokensUsed = (await SubscriptionService.getTokensUsed(userId)) || 0

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
    <PricingPage
      userId={userId}
      currentPlan={currentPlan}
      subscriptionStatus={subscriptionStatus}
      tokensUsed={tokensUsed}
      isProd={isProd}
    />
  )
}

