import { Suspense } from "react"
import { getAuthSession } from "@/lib/authOptions"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { syncUserCredits } from "@/lib/db"

import { AlertTriangle } from "lucide-react"
import SubscriptionDetails from "./component/SubscriptionDetails"
import { SubscriptionService } from "@/services/subscription-service"

export default async function SubscriptionAccountPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to access your subscription details.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Sync user credits to ensure data consistency
  if (userId) {
    try {
      await syncUserCredits(userId)
    } catch (error) {
      console.error("Error syncing user credits:", error)
    }
  }

  async function getSubscriptionData() {
    try {
      if (!userId) {
        throw new Error("User ID is required but was null.")
      }

      // Use Promise.allSettled to handle potential errors in individual requests
      const [subscriptionStatusResult, tokenDataResult, billingHistoryResult, paymentMethodsResult] =
        await Promise.allSettled([
          SubscriptionService.getSubscriptionStatus(userId),
          SubscriptionService.getTokensUsed(userId),
          SubscriptionService.getBillingHistory(userId),
          SubscriptionService.getPaymentMethods(userId),
        ])

      // Extract values or use defaults for failed promises
      const subscriptionStatus =
        subscriptionStatusResult.status === "fulfilled"
          ? subscriptionStatusResult.value
          : { subscriptionPlan: "FREE", isSubscribed: false }

      const tokenData = tokenDataResult.status === "fulfilled" ? tokenDataResult.value : { used: 0, total: 0 }

      const billingHistory = billingHistoryResult.status === "fulfilled" ? billingHistoryResult.value : []

      const paymentMethods = paymentMethodsResult.status === "fulfilled" ? paymentMethodsResult.value : []

      return {
        currentPlan: subscriptionStatus.subscriptionPlan,
        subscriptionStatus: subscriptionStatus.isSubscribed ? "ACTIVE" : "INACTIVE",
        endDate: subscriptionStatus.expirationDate ? new Date(subscriptionStatus.expirationDate) : null,
        tokensUsed: tokenData.used,
        tokensTotal: tokenData.total,
        billingHistory,
        paymentMethods,
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      return {
        currentPlan: "FREE",
        subscriptionStatus: "INACTIVE",
        endDate: null,
        tokensUsed: 0,
        tokensRemaining: 0,
        tokensReceived: 0,
        billingHistory: [],
        paymentMethods: [],
        error: error instanceof Error ? error.message : "Failed to fetch subscription data",
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">Manage your subscription, billing, and payment methods</p>
      </div>

      <Suspense fallback={<SubscriptionDetailsSkeleton />}>
        <SubscriptionDetails userId={userId} getSubscriptionData={getSubscriptionData} />
      </Suspense>
    </div>
  )
}

function SubscriptionDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </div>
  )
}

