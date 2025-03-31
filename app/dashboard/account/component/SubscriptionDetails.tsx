import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ManageSubscription } from "../ManageSubscription"
import { BillingHistory } from "./BillingHistory"

export default async function SubscriptionDetails({
  userId,
  getSubscriptionData,
}: {
  userId: string
  getSubscriptionData: () => Promise<any>
}) {
  const subscriptionData = await getSubscriptionData()

  if (subscriptionData.error) {
    return (
      <Alert variant="destructive" className="animate-in fade-in-50">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{subscriptionData.error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs defaultValue="subscription" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
        <TabsTrigger value="subscription">Subscription Details</TabsTrigger>
        <TabsTrigger value="billing">Billing History</TabsTrigger>
      </TabsList>
      <TabsContent value="subscription" className="animate-in fade-in-50 slide-in-from-left-5">
        <ManageSubscription userId={userId} subscriptionData={subscriptionData} />
      </TabsContent>
      <TabsContent value="billing" className="animate-in fade-in-50 slide-in-from-right-5">
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

