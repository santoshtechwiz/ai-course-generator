"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription.config"
import { PaymentMethodForm } from "./payment-method-form"


interface ManageSubscriptionProps {
  userId: string
  subscriptionData: {
    currentPlan: string
    subscriptionStatus: string
    endDate: Date | null
    tokensUsed: number
    billingHistory: any[]
    paymentMethods: any[]
  }
}

export function ManageSubscription({ userId, subscriptionData }: ManageSubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const { currentPlan, subscriptionStatus, endDate, tokensUsed, paymentMethods = [] } = subscriptionData

  const planDetails = SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlan) || SUBSCRIPTION_PLANS[0]
  const tokenUsagePercentage = planDetails ? (tokensUsed / planDetails.tokens) * 100 : 0
  const isActive = subscriptionStatus === "ACTIVE"
  const isCancelled = subscriptionStatus === "CANCELED"
  const isPastDue = subscriptionStatus === "PAST_DUE"
  const isInactive = subscriptionStatus === "INACTIVE"
  const isFree = currentPlan === "FREE"

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || "Failed to cancel subscription")
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled and will end at the end of your billing period.",
        variant: "default",
      })

      setCancelDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel your subscription. Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || "Failed to resume subscription")
      }

      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed successfully.",
        variant: "default",
      })

      router.refresh()
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
  }

  const handleUpgradeSubscription = () => {
    router.push("/dashboard/subscription")
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscription Details</CardTitle>
        <CardDescription>Manage your subscription plan and payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Current Plan</span>
                <Badge variant={isFree ? "outline" : "default"}>{currentPlan}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Token Usage</span>
                  <span className="font-medium">
                    {tokensUsed} / {planDetails.tokens}
                  </span>
                </div>
                <Progress value={tokenUsagePercentage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <StatusBadge status={subscriptionStatus} />
                </div>
                {endDate && (
                  <div className="flex justify-between text-sm">
                    <span>Current Period Ends</span>
                    <span>{formatDate(endDate)}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {!isFree && isActive && (
                <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your subscription will remain active until the end of your current billing period. After that,
                        you will be downgraded to the FREE plan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelSubscription} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Cancellation"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {!isFree && isCancelled && (
                <Button onClick={handleResumeSubscription} disabled={isLoading}>
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
              {(isFree || isPastDue || isInactive) && <Button onClick={handleUpgradeSubscription}>Upgrade Plan</Button>}
              <Button variant="outline" onClick={handleUpgradeSubscription} className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Plan Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {planDetails.features
                  .filter((f) => f.available)
                  .map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{feature.name}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-2">
                  <div className="text-sm text-muted-foreground">No payment methods found</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <div>
                          <p className="text-sm font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    {paymentMethods.length === 0 ? "Add Payment Method" : "Update Payment Method"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return <Badge variant="outline">N/A</Badge>

  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="default" className="bg-green-500">
          Active
        </Badge>
      )
    case "CANCELED":
      return (
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          Cancelled
        </Badge>
      )
    case "PAST_DUE":
      return <Badge variant="destructive">Past Due</Badge>
    case "INACTIVE":
      return <Badge variant="outline">Inactive</Badge>
    case "PENDING":
      return (
        <Badge variant="outline" className="text-blue-500 border-blue-500">
          Pending
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

