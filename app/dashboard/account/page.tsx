import { Suspense } from "react"
import { getAuthSession } from "@/lib/auth"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { syncUserCredits } from "@/lib/db"

import { AlertTriangle } from "lucide-react"
import SubscriptionDetails from "./component/SubscriptionDetails"
import { AccountOverview } from "./component/AccountOverview"
import { SubscriptionService } from "../subscription/services/subscription-service"

export default async function SubscriptionAccountPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to access your account details.</AlertDescription>
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

      // Use Promise.all instead of Promise.allSettled for better performance
      // and add a timeout to prevent long-running requests
      const fetchWithTimeout = async (promise: Promise<any>, timeoutMs = 5000) => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
        })
        return Promise.race([promise, timeoutPromise])
      }

      const [subscriptionStatus, tokenData, billingHistory, paymentMethods] = await Promise.all([
        fetchWithTimeout(SubscriptionService.getSubscriptionStatus(userId)),
        fetchWithTimeout(SubscriptionService.getTokensUsed(userId)),
        fetchWithTimeout(SubscriptionService.getBillingHistory(userId)),
        fetchWithTimeout(SubscriptionService.getPaymentMethods(userId)),
      ]).catch((error) => {
        console.error("Error fetching subscription data:", error)
        return [{ subscriptionPlan: "FREE", isSubscribed: false }, { used: 0, total: 0 }, [], []]
      })

      return {
        currentPlan: subscriptionStatus.subscriptionPlan,
        subscriptionStatus: subscriptionStatus.isSubscribed ? "ACTIVE" : "INACTIVE",
        endDate:
          "expirationDate" in subscriptionStatus && subscriptionStatus.expirationDate
            ? new Date(subscriptionStatus.expirationDate)
            : null,
        tokensUsed: "used" in tokenData ? tokenData.used : 0,
        tokensTotal: "total" in tokenData ? tokenData.total : 0,
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Account Management</h1>
        <p className="text-muted-foreground">Manage your account, subscription, and billing information</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8">
          <TabsTrigger value="overview">Account Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in fade-in-50 slide-in-from-left-5">
          <Suspense fallback={<AccountOverviewSkeleton />}>
            <AccountOverview userId={userId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="subscription" className="animate-in fade-in-50 slide-in-from-left-5">
          <Suspense fallback={<SubscriptionDetailsSkeleton />}>
            <SubscriptionDetails userId={userId} getSubscriptionData={getSubscriptionData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="billing" className="animate-in fade-in-50 slide-in-from-right-5">
          <Suspense fallback={<SubscriptionDetailsSkeleton />}>
            <SubscriptionDetails userId={userId} getSubscriptionData={getSubscriptionData} activeTab="billing" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AccountOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[300px] w-full rounded-xl" />
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
