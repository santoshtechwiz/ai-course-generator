"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, RefreshCcw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useEffect, useState, memo } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import { selectSubscription, fetchSubscription, selectSubscriptionData, forceRefreshSubscription } from "@/store/slices/subscription-slice"
import { logger } from "@/lib/logger"

const SubscriptionStatus = memo(function SubscriptionStatus() {
  const subscription = useAppSelector(selectSubscription)
  const rawData = useAppSelector(selectSubscriptionData)
  const dispatch = useAppDispatch()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Force refresh on component mount
  useEffect(() => {
    dispatch(forceRefreshSubscription())
      .catch(err => {
        logger.error("Failed to refresh subscription on mount:", err)
        setError("Failed to load subscription data")
      })
  }, [dispatch])

  // Debug subscription data
  useEffect(() => {
    logger.debug(`Raw subscription data: ${JSON.stringify(rawData)}`)
    logger.debug(`Processed subscription state: ${JSON.stringify(subscription)}`)
  }, [subscription, rawData])

  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    setError(null)
    try {
      await dispatch(forceRefreshSubscription()).unwrap()
    } catch (err) {
      logger.error("Failed to refresh subscription:", err)
      setError("Failed to refresh subscription data")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!subscription || subscription.subscriptionPlan === "FREE") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription</span>
            <Badge variant="destructive">Inactive</Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              aria-label="Refresh subscription data"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error ? error : "No active subscription found"}
          </p>
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            aria-label="Refresh subscription data"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
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
})

export default SubscriptionStatus
