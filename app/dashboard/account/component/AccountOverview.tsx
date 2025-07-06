"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "./status-badge"
import { ReferralSystem } from "./ReferralSystem"
import { BillingHistory } from "@/components/billing/BillingHistory"
import { CreditCard, User, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { PlanBadge } from "../../subscription/components/subscription-status/plan-badge"
import { useSubscription, useAuth } from "@/modules/auth"

export function AccountOverview({ userId }: { userId: string }) {
  const { data: session, status } = useSession()
  const subscription = useSubscription()
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

  if (isLoading || subscription.isLoading) {
    return <AccountOverviewSkeleton />
  }  // Get token usage from session (most reliable) and fallback to subscription hook
  const sessionTokensUsed = session?.user?.creditsUsed || 0
  const sessionTokenLimit = session?.user?.credits || 0
  
  // Use session data as primary source, fallback to subscription hook
  const tokenUsage = sessionTokensUsed || subscription.subscription?.tokensUsed || 0
  const tokenLimit = sessionTokenLimit || subscription.subscription?.credits || user?.credits || 0
  const tokenRemaining = Math.max(tokenLimit - tokenUsage, 0)
  const tokenUsagePercentage = tokenLimit > 0 ? Math.round((tokenUsage / tokenLimit) * 100) : 0
  
  // Debug info for development
  if (process.env.NODE_ENV === 'development') {
    console.log('AccountOverview Credit Debug:', {
      sessionTokensUsed,
      sessionTokenLimit,
      tokenUsage,
      tokenLimit,
      tokenRemaining,
      tokenUsagePercentage,
      sessionUser: session?.user,
      subscriptionData: subscription.subscription
    })
  }

  const formattedExpirationDate = subscription.subscription?.currentPeriodEnd
    ? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
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
            {/* Debug Section - Development Only */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Debug Info (Dev Only)</h4>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  <p><strong>Session Status:</strong> {status}</p>
                  <div><strong>Session User:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(session?.user, null, 1)}</pre></div>
                  <div><strong>Auth User:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(user, null, 1)}</pre></div>
                </div>
              </div>
            )}
            
            {/* User Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {session?.user?.name || user?.name || "Not provided"}
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-gray-400">
                        Debug: session.name={session?.user?.name}, user.name={user?.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
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
            </div>{/* Subscription Summary */}            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Subscription</h3>
                <PlanBadge plan={subscription.subscription?.plan || "FREE"} />
              </div>                <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <StatusBadge status={subscription.subscription?.status || "INACTIVE"} />
                    <span className="ml-2">
                      {subscription.subscription?.isActive ? "Active Subscription" : "No Active Subscription"}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
                
                {/* Subscription Details */}
                {subscription.subscription?.isActive && (
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">{subscription.subscription.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">{subscription.subscription.status}</span>
                    </div>
                    {subscription.subscription.currentPeriodEnd && (
                      <div className="flex justify-between">
                        <span>Next billing:</span>
                        <span className="font-medium">{formattedExpirationDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>            {/* Token Usage */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Token Usage</h3>
                <span className="text-sm text-muted-foreground">
                  {tokenUsage.toLocaleString()} / {tokenLimit.toLocaleString()} used
                </span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tokenLimit.toLocaleString()}</div>
                    <div className="text-muted-foreground">Total Tokens</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{tokenUsage.toLocaleString()}</div>
                    <div className="text-muted-foreground">Used</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{tokenRemaining.toLocaleString()}</div>
                    <div className="text-muted-foreground">Remaining</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Usage Progress</span>
                    <span className="font-medium">{tokenUsagePercentage}% consumed</span>
                  </div>
                  <Progress 
                    value={tokenUsagePercentage} 
                    className="h-3" 
                    indicatorClassName={
                      tokenUsagePercentage > 90 ? "bg-red-500" :
                      tokenUsagePercentage > 80 ? "bg-orange-500" :
                      "bg-green-500"
                    }
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {tokenUsagePercentage === 0 ? "No tokens used yet" :
                     tokenUsagePercentage < 50 ? "Good usage level" :
                     tokenUsagePercentage < 80 ? "Moderate usage" :
                     tokenUsagePercentage < 95 ? "High usage - consider upgrading" :
                     "Almost out of tokens!"}
                  </div>
                </div>
                
                {tokenUsagePercentage > 80 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-medium">Running Low on Tokens</p>
                        <p className="text-xs">
                          You've used {tokenUsagePercentage}% of your tokens. 
                          {tokenUsagePercentage > 95 ? " Upgrade now to avoid interruption!" : " Consider upgrading your plan."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {tokenUsagePercentage === 0 && tokenLimit > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <span className="text-lg">🎯</span>
                      <div>
                        <p className="text-sm font-medium">Ready to Get Started!</p>
                        <p className="text-xs">
                          You have {tokenLimit.toLocaleString()} tokens available. Start using our AI features!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>{/* Quick Actions */}
            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p>You can view your subscription details in the Subscription tab.</p>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <BillingHistory userId={userId} />
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
