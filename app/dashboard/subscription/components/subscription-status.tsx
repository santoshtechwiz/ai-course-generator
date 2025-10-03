"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useSubscription } from "@/modules/auth"

export default function SubscriptionStatus() {
  const { subscription, isLoading } = useSubscription()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription</span>
            <Badge variant="outline"></Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  // BUG FIX: Check isSubscribed flag which now considers tokens/credits
  const hasSubscriptionOrCredits = subscription?.isSubscribed || false
  const remainingCredits = Math.max(0, (subscription?.credits || 0) - (subscription?.tokensUsed || 0))

  if (!hasSubscriptionOrCredits || subscription?.plan === "FREE") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription</span>
            <Badge variant={remainingCredits > 0 ? "secondary" : "destructive"}>
              {remainingCredits > 0 ? "Credits Available" : "Inactive"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {remainingCredits > 0 ? (
            <p className="text-sm text-muted-foreground">
              You have {remainingCredits} tokens remaining
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription found</p>
          )}
          <Button asChild className="w-full">
            <Link href="/dashboard/subscription">
              {remainingCredits > 0 ? "Upgrade Plan" : "Subscribe Now"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isActive = subscription.status === "ACTIVE"
  const expiryDate = subscription.expirationDate
  const timeUntilExpiry = expiryDate
    ? formatDistanceToNow(new Date(expiryDate), { addSuffix: true })
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
