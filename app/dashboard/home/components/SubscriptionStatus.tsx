"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, RefreshCcw, AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useEffect, useState, memo } from "react"
import { useAuth } from "@/modules/auth"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

interface UsageLimit {
  resourceType: string
  current: number
  limit: number
  resetAt?: Date
}

const SubscriptionStatus = memo(function SubscriptionStatus() {
  const { plan, hasActiveSubscription, isLoading, user } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageLimits, setUsageLimits] = useState<UsageLimit[]>([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null)

  // Fetch usage limits
  useEffect(() => {
    const fetchUsageLimits = async () => {
      if (!user?.id) return
      
      setLoadingUsage(true)
      try {
        const response = await fetch('/api/usage/stats')
        if (response.ok) {
          const data = await response.json()
          // Convert to array format
          const limits: UsageLimit[] = []
          if (data.quiz_attempts) {
            limits.push({
              resourceType: 'quiz_attempts',
              current: data.quiz_attempts.current,
              limit: data.quiz_attempts.limit,
              resetAt: data.quiz_attempts.resetAt ? new Date(data.quiz_attempts.resetAt) : undefined
            })
          }
          if (data.flashcard_reviews) {
            limits.push({
              resourceType: 'flashcard_reviews',
              current: data.flashcard_reviews.current,
              limit: data.flashcard_reviews.limit,
              resetAt: data.flashcard_reviews.resetAt ? new Date(data.flashcard_reviews.resetAt) : undefined
            })
          }
          setUsageLimits(limits)
        }
      } catch (err) {
        logger.error("Failed to fetch usage limits:", err)
      } finally {
        setLoadingUsage(false)
      }
    }

    fetchUsageLimits()
  }, [user?.id])

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

  const formatResourceName = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (!hasActiveSubscription || plan === "FREE") {
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
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error ? error : "No active subscription found"}
          </p>

          {/* Usage Limits for Free Users */}
          {usageLimits.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Daily Limits</p>
              {usageLimits.map((usage) => {
                const percentage = (usage.current / usage.limit) * 100
                const isNearLimit = percentage >= 80
                const isAtLimit = usage.current >= usage.limit

                return (
                  <div key={usage.resourceType} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{formatResourceName(usage.resourceType)}</span>
                      <span className={cn(
                        "font-medium",
                        isAtLimit && "text-red-600",
                        isNearLimit && !isAtLimit && "text-yellow-600"
                      )}>
                        {usage.current} / {usage.limit}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={cn(
                        "h-2",
                        isAtLimit && "bg-red-100",
                        isNearLimit && !isAtLimit && "bg-yellow-100"
                      )}
                    />
                    {usage.resetAt && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Resets {formatDistanceToNow(usage.resetAt, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <Button asChild className="w-full">
            <Link href="/dashboard/subscription">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade for Unlimited
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isActive = hasActiveSubscription
  const timeUntilExpiry = subscriptionEnd
    ? formatDistanceToNow(subscriptionEnd, { addSuffix: true })
    : "Unknown"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription</span>
          <Badge variant={isActive ? "default" : "destructive"}>
            {plan.toUpperCase()}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            aria-label="Refresh subscription data"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionEnd && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Renews {timeUntilExpiry}
          </div>
        )}
        <Button asChild className="w-full">
          <Link href="/dashboard/subscription">
            {isActive ? "Manage Subscription" : "Renew Subscription"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
})

export default SubscriptionStatus
