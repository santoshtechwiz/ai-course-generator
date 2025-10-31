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
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Section } from "@/components/layout"


export function AccountOverview({ userId }: { userId: string }) {
  const { data: session, status } = useSession()
  const { subscription, loading: subscriptionLoading } = useUnifiedSubscription()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Remove the excessive auto-refresh - data is already consistent
  // useEffect(() => {
  //   if (userId) {
  //     syncWithBackend().catch(console.error)
  //   }
  // }, [syncWithBackend, userId])

  const handleManageSubscription = () => {
    router.push("/dashboard/subscription")
  }

  if (isLoading || subscriptionLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Skeleton className="h-[500px] w-full neo-card neo-shadow" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-[500px] w-full neo-card neo-shadow" />
        </div>
      </div>
    )
  }  // Use subscription data as single source of truth to prevent sync issues
  const tokenUsage = subscription?.tokensUsed || 0
  const tokenLimit = subscription?.credits || 0
  const tokenRemaining = Math.max(tokenLimit - tokenUsage, 0)
  const tokenUsagePercentage = tokenLimit > 0 ? Math.round((tokenUsage / tokenLimit) * 100) : 0



  const formattedExpirationDate = subscription?.expirationDate
    ? new Date(subscription.expirationDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <div className="neo-card neo-shadow border-4 border-border bg-card p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-wider text-primary">ACCOUNT SUMMARY</h2>
            <p className="text-muted-foreground">Overview of your account and subscription</p>

            {/* User Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase tracking-wider">USER INFORMATION</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Name</p>
                    <p className="font-black text-foreground">
                      {session?.user?.name || user?.name || "Not provided"}
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-gray-400">
                        Debug: session.name={session?.user?.name}, user.name={user?.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Email</p>
                    <p className="font-black text-foreground">
                      {session?.user?.email || user?.email || "Not provided"}
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-gray-400">
                        Debug: session.email={session?.user?.email}, user.email={user?.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Summary */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-wider">SUBSCRIPTION</h3>
                <PlanBadge plan={subscription?.subscriptionPlan || "FREE"} />
              </div>
              <div className="neo-card neo-shadow border-4 border-border bg-muted/50 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <StatusBadge status={subscription?.status || "INACTIVE"} />
                    <span className="ml-2 font-black uppercase tracking-wider">
                      {subscription?.status === 'ACTIVE' ? "Active Subscription" : "No Active Subscription"}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageSubscription} className="neo-button neo-hover-lift">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
                {/* Subscription Details */}
                {subscription?.status === 'ACTIVE' && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium uppercase tracking-wide">Plan:</span>
                      <span className="font-black">{subscription?.subscriptionPlan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium uppercase tracking-wide">Status:</span>
                      <span className="font-black">{subscription?.status}</span>
                    </div>
                    {subscription?.expirationDate && (
                      <div className="flex justify-between">
                        <span className="font-medium uppercase tracking-wide">Next billing:</span>
                        <span className="font-black">{formattedExpirationDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Token Usage */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-wider">TOKEN USAGE</h3>
                <span className="text-sm text-muted-foreground font-medium">
                  {tokenUsage.toLocaleString()} / {tokenLimit.toLocaleString()} used
                </span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div className="text-center p-4 neo-card neo-shadow border-4 border-border bg-card">
                    <div className="text-2xl font-black text-primary">{tokenLimit.toLocaleString()}</div>
                    <div className="text-muted-foreground font-medium uppercase tracking-wide">Total Tokens</div>
                  </div>
                  <div className="text-center p-4 neo-card neo-shadow border-4 border-border bg-card">
                    <div className="text-2xl font-black text-primary">{tokenUsage.toLocaleString()}</div>
                    <div className="text-muted-foreground font-medium uppercase tracking-wide">Used</div>
                  </div>
                  <div className="text-center p-4 neo-card neo-shadow border-4 border-border bg-card">
                    <div className="text-2xl font-black text-primary">{tokenRemaining.toLocaleString()}</div>
                    <div className="text-muted-foreground font-medium uppercase tracking-wide">Remaining</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-black uppercase tracking-wider">Usage Progress</span>
                    <span className="font-black">{tokenUsagePercentage}% consumed</span>
                  </div>
                  <Progress
                    value={tokenUsagePercentage}
                    className="h-3 neo-shadow"
                    indicatorClassName={
                      tokenUsagePercentage > 90 ? "bg-red-500" :
                      tokenUsagePercentage > 80 ? "bg-orange-500" :
                      "bg-green-500"
                    }
                  />
                  <div className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wide">
                    {tokenUsagePercentage === 0 ? "No tokens used yet" :
                     tokenUsagePercentage < 50 ? "Good usage level" :
                     tokenUsagePercentage < 80 ? "Moderate usage" :
                     tokenUsagePercentage < 95 ? "High usage - consider upgrading" :
                     "Almost out of tokens!"}
                  </div>
                </div>
                {tokenUsagePercentage > 80 && (
                  <div className="neo-card neo-shadow border-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider">Running Low on Tokens</p>
                        <p className="text-xs font-medium">
                          You've used {tokenUsagePercentage}% of your tokens.
                          {tokenUsagePercentage > 95 ? " Upgrade now to avoid interruption!" : " Consider upgrading your plan."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {tokenUsagePercentage === 0 && tokenLimit > 0 && (
                  <div className="neo-card neo-shadow border-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <span className="text-lg">🎯</span>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider">Ready to Get Started!</p>
                        <p className="text-xs font-medium">
                          You have {tokenLimit.toLocaleString()} tokens available. Start using our AI features!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-6 text-center text-sm text-muted-foreground">
              <p className="font-medium">You can view your subscription details in the Subscription tab.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="neo-card neo-shadow border-4 border-border bg-card p-6">
          <h3 className="text-lg font-black uppercase tracking-wider text-primary mb-4">REFERRAL</h3>
          <ReferralSystem userId={userId} />
        </div>
      </div>
    </div>
  )
}
