"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, RefreshCcw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useEffect, useState, memo } from "react"
import { useAuth } from "@/modules/auth"
import { logger } from "@/lib/logger"

const SubscriptionStatus = memo(function SubscriptionStatus() {
  const { subscription, isLoading } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    setError(null)
    try {
      // Session-based auth will automatically refresh on session update
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate refresh
    } catch (err) {
      logger.error("Failed to refresh subscription:", err)
      setError("Failed to refresh subscription data")
    } finally {
      setIsRefreshing(false)
    }
  }
  if (!subscription || subscription.plan === "FREE") {
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

  const isActive = subscription.status === "active"
  const timeUntilExpiry = subscription.currentPeriodEnd
    ? formatDistanceToNow(new Date(subscription.currentPeriodEnd), { addSuffix: true })
    : "Unknown"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription</span>
          <Badge variant={isActive ? "default" : "destructive"}>
            {subscription.status.toUpperCase()}
          </Badge>
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
