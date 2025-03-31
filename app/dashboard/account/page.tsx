import { Suspense } from "react"
import { getAuthSession } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { syncUserCredits } from "@/lib/db"

import { AlertTriangle } from "lucide-react"

import { ManageSubscription } from "./ManageSubscription"
import { BillingHistory } from "./component/BillingHistory"
import SubscriptionDetails from "./component/SubscriptionDetails"

export default async function SubscriptionAccountPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
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

      const { plan, status, endDate } = await SubscriptionService.getSubscriptionStatus(userId)
      const tokenData = await SubscriptionService.getTokensUsed(userId)
      const billingHistory = (await SubscriptionService.getBillingHistory(userId)) || []
      const paymentMethods = (await SubscriptionService.getPaymentMethods(userId)) || []

      return {
        currentPlan: plan,
        subscriptionStatus: status,
        endDate: endDate ? new Date(endDate) : null,
        tokensUsed: tokenData.used,
     
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
        error: "Failed to fetch subscription data",
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
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
    <div className="space-y-8">
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

