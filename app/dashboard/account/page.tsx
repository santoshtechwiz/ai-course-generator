import { Suspense } from "react"
import { getAuthSession } from "@/lib/auth"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { syncUserCredits } from "@/lib/db"

import { AlertTriangle } from "lucide-react"
import SubscriptionDetails from "./component/SubscriptionDetails"
import { AccountOverview } from "./component/AccountOverview"
import { SubscriptionService } from "../../../services/subscription/subscription-service"
import { BillingHistory } from "./component/BillingHistory"
import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"

export default async function SubscriptionAccountPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return (
      <PageWrapper>
    <PageHeader title="Account" description="Manage your account access">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>Please sign in to access your account details.</AlertDescription>
          </Alert>
        </PageHeader>
      </PageWrapper>
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

  // Fetch subscription data server-side (was previously inside async client component)
  let subscriptionData: any
  try {
    if (!userId) throw new Error("User ID missing")

    async function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000, fallback: T): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
      ])
    }

    const [subscriptionStatus, tokenData, billingHistory, paymentMethods] = await Promise.all([
      withTimeout(SubscriptionService.getSubscriptionStatus(userId), 8000, { subscriptionPlan: "FREE", isSubscribed: false } as any),
      withTimeout(SubscriptionService.getTokensUsed(userId), 8000, { used: 0, total: 0 } as any),
      withTimeout(SubscriptionService.getBillingHistory(userId), 8000, [] as any),
      withTimeout(SubscriptionService.getPaymentMethods(userId), 8000, [] as any),
    ]).catch((error) => {
      console.error("Error fetching subscription data:", error)
      return [{ subscriptionPlan: "FREE", isSubscribed: false }, { used: 0, total: 0 }, [], []]
    })

    subscriptionData = {
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
    subscriptionData = {
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

  return (
    <PageWrapper>
  <PageHeader title="Account Management" description="Manage your account, subscription, and billing information">
  {/* Description now passed via PageHeader prop */}
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
              <SubscriptionDetails userId={userId} subscriptionData={subscriptionData} />
            </Suspense>
          </TabsContent>

          <TabsContent value="billing" className="animate-in fade-in-50 slide-in-from-right-5">
            <Suspense fallback={<SubscriptionDetailsSkeleton />}>
              <BillingHistory userId={userId} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </PageHeader>
    </PageWrapper>
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
