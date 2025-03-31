import { Suspense } from "react"
import { getAuthSession } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ManageSubscription } from "../components/ManageSubscription"
import { BillingHistory } from "../components/BillingHistory"

import { AlertTriangle } from "lucide-react"


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

  async function getSubscriptionData() {
    try {
      const { plan, status, endDate } = await SubscriptionService.getSubscriptionStatus(userId)
      const tokensUsed = (await SubscriptionService.getTokensUsed(userId)) || 0
      const billingHistory = (await SubscriptionService.getBillingHistory(userId)) || []
      const paymentMethods = (await SubscriptionService.getPaymentMethods(userId)) || []

      return {
        currentPlan: plan,
        subscriptionStatus: status,
        endDate: endDate ? new Date(endDate) : null,
        tokensUsed,
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

      {/* <div className="mt-12">
        <AddOnPackages />
      </div> */}
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

async function SubscriptionDetails({
  userId,
  getSubscriptionData,
}: {
  userId: string
  getSubscriptionData: () => Promise<any>
}) {
  const subscriptionData = await getSubscriptionData()

  if (subscriptionData.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{subscriptionData.error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs defaultValue="subscription" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="subscription">Subscription Details</TabsTrigger>
        <TabsTrigger value="billing">Billing History</TabsTrigger>
      </TabsList>
      <TabsContent value="subscription">
        <ManageSubscription userId={userId} subscriptionData={subscriptionData} />
      </TabsContent>
      <TabsContent value="billing">
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past invoices and payment history</CardDescription>
          </CardHeader>
          <BillingHistory billingHistory={subscriptionData.billingHistory} />
        </Card>
      </TabsContent>
    </Tabs>
  )
}

