/**
 * PricingPage Component
 *
 * This component displays subscription plans and handles user interactions
 * for subscribing to plans.
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Check,
  X,
  Sparkles,
  Gift,
  Loader2,
  AlertTriangle,
  Info,
  Calendar,
  CreditCard,
  ArrowRight,
  HelpCircle,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

import { calculateSavings } from "@/lib/subscription-utils"
import PlanCards from "./subscription-status/PlanCard"
import ComparisonTable from "./subscription-status/ComparisonTable"
import DevModeBanner from "./subscription-status/DevModeBanner"
import FAQSection from "./subscription-status/FaqSection"
import TokenUsageExplanation from "./subscription-status/TokenUsageExplanation"
import { planIcons } from "@/config/plan-icons"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/types/subscription"
import { useSubscription } from "@/hooks/use-subscription"
import { ReferralSystem } from "../../account/component/ReferralSystem"
import { StatusBadge } from "../../account/component/status-badge"
import { SUBSCRIPTION_PLANS } from "./subscription-plans"

export function PricingPage({
  userId,
  currentPlan = "FREE",
  subscriptionStatus = null,
  isProd = false,
  tokensUsed = 0,
  credits = 0,
  expirationDate = null,
}: {
  userId: string | null
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  isProd: boolean
  tokensUsed?: number
  credits?: number
  expirationDate?: string | null
}) {
  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<1 | 6>(1)
  const [showPromotion, setShowPromotion] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState<string>("")
  const { toast } = useToast()
  const isAuthenticated = !!userId

  // Add state for promo code
  const [promoCode, setPromoCode] = useState<string>("")
  const [isPromoValid, setIsPromoValid] = useState<boolean>(false)
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false)

  // Normalize subscription status for case-insensitive comparison
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null
  const isSubscribed = currentPlan && normalizedStatus === "ACTIVE"

  // Format expiration date for display
  const formattedExpirationDate = useMemo(() => {
    if (!expirationDate) return null
    return new Date(expirationDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [expirationDate])

  // Calculate days until expiration
  const daysUntilExpiration = useMemo(() => {
    if (!expirationDate) return null
    const expDate = new Date(expirationDate)
    const today = new Date()
    const diffTime = expDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [expirationDate])

  // Get user plan details
  const userPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlan) || SUBSCRIPTION_PLANS[0]
  const tokenUsagePercentage = tokensUsed && credits ? (tokensUsed / credits) * 100 : 0

  // Add this function after the useState declarations
  const validatePromoCode = useCallback(
    async (code: string) => {
      if (!code) return false

      setIsApplyingPromo(true)
      try {
        // For the AILAUNCH20 code, we'll apply it directly
        if (code.toUpperCase() === "AILAUNCH20") {
          setPromoDiscount(20)
          setIsPromoValid(true)

          toast({
            title: "Promo Code Applied!",
            description: "20% discount will be applied to your subscription.",
            variant: "default",
          })

          return true
        }

        // For now, only AILAUNCH20 is valid
        setIsPromoValid(false)
        setPromoDiscount(0)

        toast({
          title: "Invalid Promo Code",
          description: "The promo code you entered is invalid or expired.",
          variant: "destructive",
        })

        return false
      } catch (error) {
        console.error("Error validating promo code:", error)
        setIsPromoValid(false)
        setPromoDiscount(0)
        return false
      } finally {
        setIsApplyingPromo(false)
      }
    },
    [toast],
  )

  // Use the subscription hook with options
  const {
    handleSubscribe: hookHandleSubscribe,
    cancelSubscription,
    resumeSubscription,
    canSubscribeToPlan,
    isLoading: subscriptionLoading,
  } = useSubscription({
    allowPlanChanges: false,
    allowDowngrades: false,
    onSubscriptionSuccess: (result) => {
      if (result.redirectUrl) {
        // Redirect will happen automatically
        return
      }

      // For non-redirect success (like free plan activation)
      toast({
        title: "Success!",
        description: result.message || "Your subscription has been updated.",
        variant: "default",
      })

      // Reload the page after a short delay to show updated subscription
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    },
    onSubscriptionError: (error) => {
      setSubscriptionError(error.message)
    },
  })

  // Enhanced subscription handler with authentication check
  const handleSubscribe = async (planName: SubscriptionPlanType, duration: number) => {
    // Set loading state for the specific plan
    setLoading(planName)

    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe to this plan",
          variant: "destructive",
        })

        // Store pending subscription in localStorage to resume after login
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "pendingSubscription",
            JSON.stringify({
              planName,
              duration,
              promoCode: isPromoValid ? promoCode : undefined,
            }),
          )
        }

        // Redirect to login page
        window.location.href = "/api/auth/signin"
        return
      }

      // Check if the plan is available for subscription
      const { canSubscribe, reason } = canSubscribeToPlan(currentPlan, planName, normalizedStatus)

      if (!canSubscribe) {
        toast({
          title: "Subscription Change Restricted",
          description: reason || "You cannot change your subscription at this time.",
          variant: "destructive",
        })
        return
      }

      // For free plan, handle activation directly
      if (planName === "FREE") {
        const result = await hookHandleSubscribe(planName, duration)

        if (!result.success) {
          setSubscriptionError(result.message || "Failed to activate free plan")
        }
        return
      }

      // For paid plans, use the subscription hook
      const result = await hookHandleSubscribe(
        planName,
        duration,
        isPromoValid ? promoCode : undefined,
        isPromoValid ? promoDiscount : undefined,
      )

      if (!result.success) {
        setSubscriptionError(result.message || "Failed to subscribe to plan")
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error)
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Failed to subscribe to plan",
        variant: "destructive",
      })
      setSubscriptionError(error instanceof Error ? error.message : "Failed to subscribe to plan")
    } finally {
      setLoading(null)
    }
  }

  // Add this function to calculate discounted price
  const getDiscountedPrice = (originalPrice: number): number => {
    if (!isPromoValid || promoDiscount <= 0) return originalPrice
    const discountAmount = (originalPrice * promoDiscount) / 100
    return Math.round((originalPrice - discountAmount) * 100) / 100 // Round to 2 decimal places
  }

  // Handle subscription management
  const handleManageSubscription = () => {
    toast({
      title: "Manage Subscription",
      description: "Redirecting to manage your subscription...",
      variant: "default",
    })
    // Replace with actual logic to manage subscription
  }

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    setShowCancelDialog(false)
    setLoading(currentPlan as SubscriptionPlanType)

    try {
      toast({
        title: "Cancelling Subscription",
        description: "Please wait while we process your request...",
        variant: "default",
      })

      const result = await cancelSubscription()

      if (result.success) {
        toast({
          title: "Subscription Cancelled",
          description:
            "Your subscription has been cancelled successfully. You'll still have access until the end of your billing period.",
          variant: "default",
        })

        // Reload the page after a short delay to show updated subscription
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        throw new Error(result.message || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  // Enhanced promo code validation with better feedback
  const handleApplyPromoCode = useCallback(async () => {
    if (!promoCode) {
      toast({
        title: "Promo Code Required",
        description: "Please enter a promo code to apply",
        variant: "destructive",
      })
      return
    }

    if (isPromoValid) {
      toast({
        title: "Promo Code Already Applied",
        description: `Your ${promoDiscount}% discount is already active`,
        variant: "default",
      })
      return
    }

    setIsApplyingPromo(true)
    try {
      const result = await validatePromoCode(promoCode)

      if (result) {
        toast({
          title: "Promo Code Applied!",
          description: `${promoDiscount}% discount will be applied to your subscription.`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error applying promo code:", error)
    } finally {
      setIsApplyingPromo(false)
    }
  }, [promoCode, isPromoValid, promoDiscount, validatePromoCode, toast])

  // Update useEffect to handle pending subscriptions with promo code
  useEffect(() => {
    // Check if there's a pending subscription after login
    if (typeof window !== "undefined") {
      const pendingSubscriptionData = localStorage.getItem("pendingSubscription")

      if (pendingSubscriptionData && userId) {
        try {
          const { planName, duration, promoCode } = JSON.parse(pendingSubscriptionData)
          // Clear the pending subscription
          localStorage.removeItem("pendingSubscription")

          // Apply promo code if it was saved
          if (promoCode) {
            setPromoCode(promoCode)
            validatePromoCode(promoCode)
          }

          // Proceed with subscription after a short delay to ensure everything is loaded
          setTimeout(() => {
            handleSubscribe(planName, duration)
          }, 500)
        } catch (error) {
          console.error("Error processing pending subscription:", error)
        }
      }
    }
  }, [userId, validatePromoCode])

  return (
    <div className="container max-w-6xl space-y-8 px-4 sm:px-6">
      {!isProd && <DevModeBanner />}

      {/* Display subscription error if any */}
      {subscriptionError && (
        <Alert variant="destructive" className="mb-4 animate-in fade-in slide-in-from-top-5 duration-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Error</AlertTitle>
          <AlertDescription>{subscriptionError}</AlertDescription>
          <Button variant="destructive" size="sm" className="mt-2 ml-auto" onClick={() => setSubscriptionError(null)}>
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Current Subscription Card - Redesigned with better UX */}
      {isAuthenticated && (
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  Your Subscription
                  {isSubscribed && normalizedStatus === "ACTIVE" && (
                    <Badge variant="success" className="ml-2">
                      Active
                    </Badge>
                  )}
                  {normalizedStatus === "CANCELED" && (
                    <Badge variant="warning" className="ml-2">
                      Canceled
                    </Badge>
                  )}
                </h2>
                <p className="text-muted-foreground">Manage your plan and token usage</p>
              </div>
              <Badge
                variant={currentPlan === "FREE" ? "outline" : "default"}
                className={`text-sm px-3 py-1 ${
                  currentPlan !== "FREE" ? "bg-primary hover:bg-primary" : ""
                } transition-all duration-300`}
              >
                {currentPlan} PLAN
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Token usage with improved visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Token Usage</span>
                  <span className="font-medium">
                    {tokensUsed} / {credits}
                  </span>
                </div>
                <Progress
                  value={tokenUsagePercentage}
                  className="h-2 w-full"
                  indicatorClassName={`${
                    tokenUsagePercentage > 90 ? "bg-red-500" : tokenUsagePercentage > 70 ? "bg-amber-500" : "bg-primary"
                  }`}
                />
                {tokenUsagePercentage > 90 && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    You're almost out of tokens. Consider upgrading your plan.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 shadow-sm transition-all duration-300 hover:bg-muted/70">
                  <div className="text-sm text-muted-foreground mb-1">Plan Features</div>
                  <div className="font-medium flex items-center">
                    {planIcons[currentPlan as SubscriptionPlanType]}
                    <span className="ml-2">{userPlan.name}</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 shadow-sm transition-all duration-300 hover:bg-muted/70">
                  <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
                  <div className="font-medium">{credits}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 shadow-sm transition-all duration-300 hover:bg-muted/70">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="text-sm text-muted-foreground mb-1 flex items-center">
                            Status <HelpCircle className="h-3 w-3 ml-1" />
                          </div>
                          <div className="font-medium flex items-center gap-2">
                            <StatusBadge status={subscriptionStatus || "INACTIVE"} />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {subscriptionStatus === "ACTIVE"
                            ? "Your subscription is active and will renew automatically."
                            : subscriptionStatus === "CANCELED"
                              ? "Your subscription has been canceled but remains active until the end of the billing period."
                              : "You don't have an active subscription."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Subscription expiration info */}
              {isSubscribed && expirationDate && (
                <div className="bg-muted/30 rounded-lg p-4 border border-muted">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Subscription Period</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your {currentPlan} plan {normalizedStatus === "CANCELED" ? "expires" : "renews"} on{" "}
                        <span className="font-medium">{formattedExpirationDate}</span>
                        {daysUntilExpiration !== null && (
                          <span className="ml-1">
                            ({daysUntilExpiration} {daysUntilExpiration === 1 ? "day" : "days"} from now)
                          </span>
                        )}
                      </p>

                      {normalizedStatus === "CANCELED" && (
                        <div className="mt-2 flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Your subscription has been canceled but you'll still have access to all features until the
                            end of your billing period.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              {isSubscribed && currentPlan !== "FREE" && normalizedStatus !== "CANCELED" && (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Your Subscription</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel your {currentPlan} subscription? You'll still have access to all
                        features until the end of your current billing period.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="cancel-reason">Help us improve (optional)</Label>
                        <Input
                          id="cancel-reason"
                          placeholder="Why are you canceling?"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                        />
                      </div>

                      <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          After cancellation, you won't be able to resubscribe to a different plan until your current
                          subscription expires on {formattedExpirationDate}.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Subscription
                      </Button>
                      <Button variant="destructive" onClick={handleCancelSubscription} disabled={subscriptionLoading}>
                        {subscriptionLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Confirm Cancellation"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {normalizedStatus === "CANCELED" && (
                <Button variant="default" onClick={resumeSubscription} disabled={subscriptionLoading}>
                  {subscriptionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Resume Subscription"
                  )}
                </Button>
              )}

              <Button
                variant={normalizedStatus === "CANCELED" ? "outline" : "default"}
                onClick={handleManageSubscription}
                disabled={loading !== null || subscriptionLoading}
              >
                {loading === currentPlan || subscriptionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Payment Method
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Promotional Banner - Enhanced with better UX */}
      {showPromotion && (
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-muted"
              onClick={() => setShowPromotion(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold mb-1">Limited Time Offer!</h3>
              <p className="text-muted-foreground mb-3">
                Get 20% off any plan with code{" "}
                <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded-md">AILAUNCH20</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.trim())}
                    className={`pr-24 transition-all duration-300 ${isPromoValid ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                  />
                  {isPromoValid && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 animate-in fade-in duration-300"
                      >
                        <Check className="h-3 w-3 mr-1" /> Valid
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  variant={isPromoValid ? "outline" : "default"}
                  onClick={handleApplyPromoCode}
                  disabled={isApplyingPromo || !promoCode || isPromoValid}
                  className={
                    isPromoValid ? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" : ""
                  }
                >
                  {isApplyingPromo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isPromoValid ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Gift className="h-4 w-4 mr-2" />
                  )}
                  {isPromoValid ? "Applied" : "Apply Code"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Header - Enhanced with better typography */}
      <div className="text-center py-8">
        <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the perfect plan to unlock your learning potential and take your skills to the next level.
        </p>
      </div>

      {/* Billing Toggle - Enhanced with better visual feedback */}
      <div className="flex items-center justify-center space-x-4 pt-4 mb-8">
        <Label
          htmlFor="billing-toggle"
          className={`text-lg transition-colors duration-300 ${selectedDuration === 1 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
        >
          Monthly
        </Label>
        <div className="relative">
          <Switch
            id="billing-toggle"
            checked={selectedDuration === 6}
            onCheckedChange={(checked) => setSelectedDuration(checked ? 6 : 1)}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
        <Label
          htmlFor="billing-toggle"
          className={`text-lg transition-colors duration-300 ${selectedDuration === 6 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
        >
          6 Months
          <Badge
            variant="outline"
            className="ml-2 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
          >
            Save up to{" "}
            {calculateSavings(SUBSCRIPTION_PLANS[2].options[0].price, SUBSCRIPTION_PLANS[2].options[1].price, 12)}%
          </Badge>
        </Label>
      </div>

      {/* Active Subscription Alert - Enhanced with better information */}
      {isSubscribed && currentPlan !== "FREE" && (
        <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-5 duration-300">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">
            You have an active subscription
          </AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            <p>
              You currently have an active {currentPlan} plan that will{" "}
              {normalizedStatus === "CANCELED" ? "expire" : "renew"} on {formattedExpirationDate}. You need to wait
              until your subscription expires or cancel it before subscribing to a new plan.
            </p>

            {normalizedStatus !== "CANCELED" && (
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
                <span className="text-sm">to switch plans after expiration</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Compare Plans Button - Enhanced with icon */}
      <div className="text-center mb-8 mt-4">
        <Button
          variant="outline"
          onClick={() => {
            const tabsElement = document.getElementById("plan-comparison-tabs")
            if (tabsElement) {
              tabsElement.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }}
          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
        >
          <ChevronDown className="mr-2 h-4 w-4" />
          Compare All Plans
        </Button>
      </div>

      {/* Plan Cards - Using the enhanced PlanCards component */}
      <PlanCards
        plans={SUBSCRIPTION_PLANS}
        currentPlan={currentPlan}
        subscriptionStatus={subscriptionStatus}
        loading={loading}
        handleSubscribe={handleSubscribe}
        duration={selectedDuration}
        isSubscribed={isSubscribed ?? false}
        promoCode={promoCode}
        isPromoValid={isPromoValid}
        promoDiscount={promoDiscount}
        getDiscountedPrice={getDiscountedPrice}
        isPlanAvailable={(planName) => {
          const { canSubscribe } = canSubscribeToPlan(currentPlan, planName, normalizedStatus)
          return canSubscribe
        }}
        getPlanUnavailableReason={(planName) => {
          const { canSubscribe, reason } = canSubscribeToPlan(currentPlan, planName, normalizedStatus)
          return canSubscribe ? undefined : reason
        }}
        expirationDate={formattedExpirationDate}
      />

      {/* Why Upgrade Section - Enhanced with better visuals */}
      <div className="text-center mt-12 mb-8 bg-muted/30 p-8 rounded-xl border">
        <h3 className="text-2xl font-bold mb-4">Why Upgrade?</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Upgrade to a higher-tier plan to unlock more tokens, advanced features, and priority support. Take your
          learning experience to the next level.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
          <div className="bg-card p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2">More Tokens</h4>
            <p className="text-sm text-muted-foreground">
              Get access to more tokens for generating content and completing tasks.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Advanced Features</h4>
            <p className="text-sm text-muted-foreground">
              Unlock premium features like priority processing and advanced customization.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Priority Support</h4>
            <p className="text-sm text-muted-foreground">
              Get faster responses and dedicated support for your questions and issues.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const tabsElement = document.getElementById("plan-comparison-tabs")
            if (tabsElement) {
              tabsElement.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }}
          className="mt-8 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronDown className="mr-2 h-4 w-4" />
          Compare Plans
        </Button>
      </div>

      {/* Token Usage Explanation */}
      <TokenUsageExplanation />

      {/* Tabs for Plan Information */}
      <Tabs defaultValue="comparison" className="mt-12" id="plan-comparison-tabs">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="comparison" data-tab-comparison>
            Plan Comparison
          </TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <ComparisonTable plans={SUBSCRIPTION_PLANS} />
        </TabsContent>

        <TabsContent value="faq">
          <FAQSection />
        </TabsContent>
      </Tabs>

      {/* Referral System */}
      <div className="mt-12">
        <ReferralSystem userId={userId} />
      </div>
    </div>
  )
}

