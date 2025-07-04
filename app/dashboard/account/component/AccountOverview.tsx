"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "./status-badge"
import { ReferralSystem } from "./ReferralSystem"
import { CreditCard, User, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { PlanBadge } from "../../subscription/components/subscription-status/plan-badge"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription, selectSubscription, selectTokenUsage } from "@/store/slices/subscription-slice"

export function AccountOverview({ userId }: { userId: string }) {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const subscription = useAppSelector(selectSubscription)
  const tokenUsage = useAppSelector(selectTokenUsage)
  const isLoading = useAppSelector((state) => state.subscription.isLoading)
  const error = useAppSelector((state) => state.subscription.error)
  const router = useRouter()

  useEffect(() => {
    if (userId) {
      dispatch(fetchSubscription())
    }
  }, [dispatch, userId])

  const handleManageSubscription = () => {
    router.push("/dashboard/subscription")
  }

  if (isLoading) {
    return <AccountOverviewSkeleton />
  }

  const tokenUsagePercentage = tokenUsage?.percentage || 0

  const formattedExpirationDate = subscription?.expirationDate
    ? new Date(subscription.expirationDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A"

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        {/* Account Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Account Summary</CardTitle>
            <CardDescription>Overview of your account and subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{session?.user?.name || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{session?.user?.email || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Summary */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Subscription</h3>
                <PlanBadge plan={subscription?.subscriptionPlan || "FREE"} />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <StatusBadge status={subscription?.status || "INACTIVE"} />
                    <span className="ml-2">
                      {subscription?.isSubscribed ? "Active Subscription" : "No Active Subscription"}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </div>
            </div>

            {/* Token Usage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Token Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Available Credits</span>
                  <span className="font-medium">
                    {tokenUsage?.tokensUsed || 0} / {tokenUsage?.total || 0}
                  </span>
                </div>
                <Progress value={tokenUsagePercentage} className="h-2" />
                {tokenUsagePercentage > 80 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    You're running low on credits. Consider upgrading your plan.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p>You can view your subscription details in the Subscription tab.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral System */}
      <div className="md:col-span-1">
        <ReferralSystem userId={userId} />
      </div>
    </div>
  )
}

function AccountOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
      <div className="md:col-span-1">
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    </div>
  )
}
