"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { SUBSCRIPTION_PLANS } from "./subscription.config"
import { useSubscription } from "../hooks/useSubscription"

export function CurrentPlanCard() {
  const { subscription, tokensUsed, isLoading, refreshSubscription } = useSubscription()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshSubscription()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-muted"></div>
        </CardContent>
      </Card>
    )
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription?.plan) || SUBSCRIPTION_PLANS[0]
  const isFree = plan.id === "FREE"
  const isActive = subscription?.status === "ACTIVE"
  const isCanceled = subscription?.status === "CANCELED"

  // Calculate token usage percentage
  const tokenLimit = plan.tokens
  // Here's the key fix - tokensUsed should be the actual usage, not the total tokens
  const actualTokensUsed = tokensUsed || 0
  const tokenPercentage = Math.min(Math.round((actualTokensUsed / tokenLimit) * 100), 100)
  const hasExceededLimit = actualTokensUsed > tokenLimit

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Current Plan</CardTitle>
        <Badge variant={isFree ? "outline" : "default"}>{plan.name}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>Your active subscription details</div>

        {!isFree && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Token Usage</span>
              <span className="text-sm font-medium">
                {actualTokensUsed} / {tokenLimit}
              </span>
            </div>
            <Progress
              value={tokenPercentage}
              className={hasExceededLimit ? "bg-red-200" : ""}
              indicatorClassName={hasExceededLimit ? "bg-red-500" : ""}
            />
            {hasExceededLimit && (
              <p className="text-sm text-red-500">
                You've exceeded your plan's token limit. Consider upgrading your plan.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium">
              <Badge
                variant={isActive ? "success" : isCanceled ? "destructive" : "outline"}
                className="rounded-sm px-2 py-0.5 text-xs font-medium"
              >
                {isActive ? "Active" : isCanceled ? "Canceled" : subscription?.status || "Inactive"}
              </Badge>
            </div>
          </div>
          {!isFree && subscription?.endDate && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-1 h-4 w-4" />
                Current Period Ends
              </div>
              <div className="font-medium">{formatDate(subscription.endDate)}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

