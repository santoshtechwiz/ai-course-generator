import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { BillingHistory } from "./BillingHistory"
import { ManageSubscription } from "./ManageSubscription"

export default async function SubscriptionDetails({
  userId,
  getSubscriptionData,
  activeTab = "subscription",
}: {
  userId: string
  getSubscriptionData: () => Promise<any>
  activeTab?: string
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

  // If activeTab is "billing", we'll just show the billing history directly
  if (activeTab === "billing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices and payment history</CardDescription>
        </CardHeader>
        <BillingHistory billingHistory={subscriptionData.billingHistory} />
      </Card>
    )
  }

  // Otherwise, show the subscription management interface
  return <ManageSubscription userId={userId} subscriptionData={subscriptionData} />
}
