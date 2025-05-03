"use client"

import type React from "react"
import { useSubscriptionContext } from "./subscription-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, CheckCircle2, XCircle } from "lucide-react"
import { SubscriptionPlanType, SubscriptionStatus } from "@/store/slices/subscription-slice"

export const SubscriptionStatusCard: React.FC = () => {
  const { subscription, isLoading, error } = useSubscriptionContext()

  if (isLoading) {
    return <SubscriptionStatusSkeleton />
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-500">Error Loading Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We encountered a problem loading your subscription details. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  // Safe access to subscription data with fallbacks
  const plan = subscription?.plan || SubscriptionPlanType.FREE
  const isActive = subscription?.status === SubscriptionStatus.ACTIVE || false
  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false
  const credits = subscription?.credits || 0
  const tokensUsed = subscription?.tokensUsed || 0
  const tokenPercentage = credits > 0 ? Math.min(Math.round((tokensUsed / credits) * 100), 100) : 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Subscription Status</CardTitle>
          <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-green-500" : "bg-gray-300"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardDescription>
          {plan} Plan {cancelAtPeriodEnd && "(Cancels at period end)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expiresAt && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Expires: {expiresAt.toLocaleDateString()} ({Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)} days
              left)
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Credits Usage</span>
              <span className="text-sm text-muted-foreground">
                {tokensUsed} / {credits}
              </span>
            </div>
            <Progress value={tokenPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              {isActive ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Quiz Generation</span>
            </div>
            <div className="flex items-center gap-2">
              {plan !== SubscriptionPlanType.FREE ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Advanced Features</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const SubscriptionStatusSkeleton: React.FC = () => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-24 mt-1" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-2 w-full mb-4" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </CardContent>
  </Card>
)

export default SubscriptionStatusCard
