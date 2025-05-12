"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useAppSelector } from "@/store"
import { selectSubscription } from "@/store/slices/subscription-slice"

export default function SubscriptionStatus() {
  const subscription = useAppSelector(selectSubscription)

  if (!subscription || subscription.subscriptionPlan === "FREE") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription</span>
            <Badge variant="destructive">Inactive</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">No active subscription found</p>
          <Button asChild className="w-full">
            <Link href="/dashboard/subscription">Subscribe Now</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isActive = subscription.status === "ACTIVE"
  const timeUntilExpiry = subscription.expirationDate
    ? formatDistanceToNow(new Date(subscription.expirationDate), { addSuffix: true })
    : "Unknown"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription</span>
          <Badge variant={isActive ? "default" : "destructive"}>{subscription.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Renews {timeUntilExpiry}
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard/subscription">{isActive ? "Manage Subscription" : "Renew Subscription"}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
