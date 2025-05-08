"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, CheckCircle2, Calendar, CreditCardIcon, AlertTriangle, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"

import { useSession } from "next-auth/react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs"
import { PlanBadge } from "../../subscription/components/subscription-status/plan-badge"
import { PaymentMethodForm } from "./PaymentMethod"
import { StatusBadge } from "./status-badge"
import { useSubscriptionStore } from "@/app/store/subscription-provider"

interface ManageSubscriptionProps {
  userId: string
  subscriptionData: {
    currentPlan: string
    subscriptionStatus: string
    endDate: Date | null
    tokensUsed: number
    billingHistory: any[]
    paymentMethods: any[]
    totalTokens: number
  }
}

// Optimize the component by memoizing expensive calculations
export function ManageSubscription({ userId, subscriptionData }: ManageSubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const session = useSession()
  const { currentPlan, subscriptionStatus, endDate, tokensUsed, paymentMethods = [], totalTokens } = subscriptionData

  // Use the subscription store for actions
  const cancelSubscription = useSubscriptionStore((state) => state.cancelSubscription)
  const resumeSubscription = useSubscriptionStore((state) => state.resumeSubscription)

  // Memoize plan details to avoid recalculation on every render
  const planDetails = useMemo(() => {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlan) || SUBSCRIPTION_PLANS[0]
  }, [currentPlan])

  // Memoize derived state values
  const { tokenUsagePercentage, isActive, isCancelled, isPastDue, isInactive, isFree, hasExceededLimit } =
    useMemo(() => {
      // Fix token usage percentage calculation to handle edge cases
      const maxTokens = totalTokens || 1 // Prevent division by zero
      const tokenUsagePercentage = Math.min(
        (tokensUsed / maxTokens) * 100,
        100, // Cap at 100% to prevent overflow
      )

      const isActive = subscriptionStatus === "ACTIVE"
      const isCancelled = subscriptionStatus === "CANCELED"
      const isPastDue = subscriptionStatus === "PAST_DUE"
      const isInactive = subscriptionStatus === "INACTIVE"
      const isFree = currentPlan === "FREE"

      // Only show the warning if tokens have actually been used AND they exceed the limit
      // This is the key fix - we're checking if tokens have actually been used
      const hasExceededLimit = tokensUsed > 0 && tokensUsed > totalTokens

      return { tokenUsagePercentage, isActive, isCancelled, isPastDue, isInactive, isFree, hasExceededLimit }
    }, [subscriptionStatus, currentPlan, tokensUsed, totalTokens])

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleResumeSubscription = useCallback(async () => {
    setIsLoading(true)
    try {
      await resumeSubscription()

      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed successfully.",
        variant: "default",
      })

      // Use router.refresh() to update the page data
      router.refresh()

      // Dispatch an event to notify other components
      const event = new CustomEvent("subscription-changed")
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error resuming subscription:", error)
      toast({
        title: "Error",
        description: "Failed to resume your subscription. Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, router, resumeSubscription])

  const handleUpgradeSubscription = useCallback(() => {
    // Use router.push to navigate to the subscription page
    router.push("/dashboard/subscription")
  }, [router])

  // Update the handleManageSubscription function to redirect to the subscription page
  const handleManageSubscription = useCallback(() => {
    toast({
      title: "Manage Subscription",
      description: "Redirecting to manage your subscription...",
      variant: "default",
    })

    // Use router.push instead of router.refresh to navigate to the subscription page
    router.push("/dashboard/subscription")
  }, [toast, router])

  // Memoize the formatted date to avoid recalculation on every render
  const formattedEndDate = useMemo(() => {
    if (!endDate) return "N/A"
    return new Date(endDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [endDate])

  return (
    <Card className="w-full border border-slate-200 dark:border-slate-700 shadow-md">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-2xl">Subscription Details</CardTitle>
        <CardDescription>Manage your subscription plan and payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">Current Plan</h3>
                  <p className="text-muted-foreground">Your active subscription details</p>
                </div>
                <PlanBadge plan={currentPlan} className="text-sm px-3 py-1" />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Token Usage</span>
                    <span className="font-medium">
                      {tokensUsed} / {session?.data?.user.credits}
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out ${
                        hasExceededLimit
                          ? "bg-gradient-to-r from-amber-500 to-red-500"
                          : "bg-gradient-to-r from-blue-500 to-purple-500"
                      }`}
                      style={{ width: `${Math.min(tokenUsagePercentage, 100)}%` }}
                    />
                  </div>
                  {hasExceededLimit && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      You've exceeded your available tokens. Consider upgrading your plan.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div className="font-medium flex items-center gap-2">
                      <StatusBadge status={subscriptionStatus} />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-muted-foreground mb-1">Current Period Ends</div>
                    <div className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formattedEndDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                {!isFree && isActive && (
                  <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    To cancel your subscription, please contact our support team.
                  </div>
                )}
                {!isFree && isCancelled && (
                  <Button
                    onClick={handleResumeSubscription}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Resume Subscription"
                    )}
                  </Button>
                )}
                {(isFree || isPastDue || isInactive) && (
                  <Button
                    onClick={handleUpgradeSubscription}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    Upgrade Plan
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  className="border-slate-300 dark:border-slate-600"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Plan Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                    Included Features
                  </h4>
                  <ul className="space-y-3">
                    {planDetails.features
                      .filter((f) => f.available)
                      .map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-3 mt-0.5">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span>{feature.name}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Usage Limits</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-0.5">
                        <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium">Questions per Quiz</div>
                        <div className="text-sm text-muted-foreground">
                          Up to {planDetails.limits.maxQuestionsPerQuiz} questions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-0.5">
                        <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium">Courses per Month</div>
                        <div className="text-sm text-muted-foreground">
                          Up to {planDetails.limits.maxCoursesPerMonth} courses
                        </div>
                      </div>
                    </div>
                    {planDetails.limits.apiCallsPerDay && (
                      <div className="flex items-start">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-0.5">
                          <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">API Calls per Day</div>
                          <div className="text-sm text-muted-foreground">
                            Up to {planDetails.limits.apiCallsPerDay} calls
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={handleUpgradeSubscription}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Upgrade to Get More Features
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Payment Methods</h3>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
                  <CreditCardIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <div className="text-lg font-medium mb-2">No payment methods found</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Add a payment method to manage your subscription
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-slate-300 dark:border-slate-600">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border border-slate-200 dark:border-slate-700">
                      <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>Add a new payment method to your account.</DialogDescription>
                      </DialogHeader>
                      <PaymentMethodForm
                        onSuccess={() => {
                          toast({
                            title: "Payment Method Added",
                            description: "Your payment method has been added successfully.",
                            variant: "default",
                          })
                          router.refresh()
                        }}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => document.getElementById("dialog-close")?.click()}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                    >
                      <div className="flex items-center">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700 mr-4">
                          <CreditCard className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                          >
                            Default
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-slate-300 dark:border-slate-600">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Update Payment Method
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border border-slate-200 dark:border-slate-700">
                        <DialogHeader>
                          <DialogTitle>Update Payment Method</DialogTitle>
                          <DialogDescription>Add a new payment method or update your existing one.</DialogDescription>
                        </DialogHeader>
                        <PaymentMethodForm
                          onSuccess={() => {
                            toast({
                              title: "Payment Method Updated",
                              description: "Your payment method has been updated successfully.",
                              variant: "default",
                            })
                            router.refresh()
                          }}
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => document.getElementById("dialog-close")?.click()}>
                            Cancel
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>

            {isPastDue && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-start">
                  <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full mr-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-1">Payment Past Due</h4>
                    <p className="text-red-600 dark:text-red-400 mb-4">
                      Your payment is past due. Please update your payment method to continue using your subscription.
                    </p>
                    <Button className="bg-red-500 hover:bg-red-600">Update Payment Now</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
