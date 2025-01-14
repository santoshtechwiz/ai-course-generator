'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Subscription } from "@/app/types"


export default function SubscriptionStatus({ subscription }: { subscription: Subscription | null }) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription</span>
            <Badge variant="destructive">Inactive</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No active subscription found
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/subscription">Subscribe Now</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isActive = subscription.status === 'ACTIVE'
  const timeUntilExpiry = formatDistanceToNow(new Date(subscription.currentPeriodEnd), {
    addSuffix: true,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription</span>
          <Badge variant={isActive ? "default" : "destructive"}>
            {subscription.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Renews {timeUntilExpiry}
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard/subscription">
            {isActive ? 'Manage Subscription' : 'Renew Subscription'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

