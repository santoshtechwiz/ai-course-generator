"use client"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ManageSubscription } from "./ManageSubscription"

interface SubscriptionDetailsProps {
  userId: string
  // Data is now passed in from a parent server component to avoid async client component
  subscriptionData: any
  activeTab?: string
}

export default function SubscriptionDetails({ userId, subscriptionData }: SubscriptionDetailsProps) {
  if (subscriptionData?.error) {
    return (
      <Alert variant="destructive" className="animate-in fade-in-50">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{subscriptionData.error}</AlertDescription>
      </Alert>
    )
  }
  return <ManageSubscription userId={userId} subscriptionData={subscriptionData} />
}
