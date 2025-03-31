import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs"
import { ManageSubscription } from "../ManageSubscription"
import { BillingHistory } from "./BillingHistory"

 export default  async function SubscriptionDetails({
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
  