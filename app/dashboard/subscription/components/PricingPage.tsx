/**
 * PricingPage Component
 *
 * This component displays subscription plans and handles user interactions
 * for subscribing to plans.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, X, Sparkles, Gift, Loader2, AlertTriangle, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

import { calculateSavings } from "@/lib/subscription-utils"
import PlanCards from "./subscription-status/PlanCard"
import ComparisonTable from "./subscription-status/ComparisonTable"
import DevModeBanner from "./subscription-status/DevModeBanner"
import FAQSection from "./subscription-status/FaqSection"
import TokenUsageExplanation from "./subscription-status/TokenUsageExplanation"
import { isPlanAvailable } from "@/lib/subscription-utils"
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
}: {
  userId: string | null
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  isProd: boolean
  tokensUsed?: number
  credits?: number
}) {
  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<1 | 6>(1)
  const [showPromotion, setShowPromotion] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
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

  // Get user plan details
  const userPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlan) || SUBSCRIPTION_PLANS[0]
  const tokenUsagePercentage = tokensUsed ? (tokensUsed / userPlan.tokens) * 100 : 0

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

  // Use the subscription hook
  const { handleSubscribe: hookHandleSubscribe, cancelSubscription, resumeSubscription } = useSubscription()

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

      // Check if user is already on the free plan and trying to subscribe to it again
      if (planName === "FREE" && isSubscribed && currentPlan === "FREE") {
        toast({
          title: "Already Subscribed",
          description: "You are already on the free plan.",
          variant: "default",
        })
        return
      }

      // Check if user has a paid subscription and is trying to subscribe to FREE plan
      if (planName === "FREE" && isSubscribed && currentPlan !== "FREE") {
        toast({
          title: "Action Not Allowed",
          description:
            "You already have a paid subscription. Please cancel it first before switching to the free plan.",
          variant: "destructive",
        })
        return
      }

      // For free plan, handle activation directly
      if (planName === "FREE") {
        try {
          const response = await fetch("/api/subscriptions/activate-free", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ confirmed: true }), // Add this line to include the confirmed field
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to activate free plan" }))
            throw new Error(errorData.message || "Failed to activate free plan")
          }

          const result = await response.json()

          if (result.success) {
            toast({
              title: "Free Plan Activated",
              description: "You now have access to the free plan features and 5 tokens",
              variant: "default",
            })

            // Trigger subscription changed event
            window.dispatchEvent(new Event("subscription-changed"))

            // Reload the page after a short delay to show updated subscription
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          } else {
            throw new Error(result.message || "Failed to activate free plan")
          }
        } catch (error) {
          console.error("Error activating free plan:", error)
          toast({
            title: "Activation Failed",
            description: error instanceof Error ? error.message : "Failed to activate free plan",
            variant: "destructive",
          })
          setSubscriptionError(error instanceof Error ? error.message : "Failed to activate free plan")
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

      if (result) {
        // Reload the page after a short delay to show updated subscription
        setTimeout(() => {
          window.location.reload()
        }, 1500)
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
    setLoading(currentPlan as SubscriptionPlanType)
    try {
      toast({
        title: "Cancelling Subscription",
        description: "Please wait while we process your request...",
        variant: "default",
      })

      const result = await cancelSubscription()

      if (result) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled successfully",
          variant: "default",
        })

        // Reload the page after a short delay to show updated subscription
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        throw new Error("Failed to cancel subscription")
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
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Error</AlertTitle>
          <AlertDescription>{subscriptionError}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Card - Redesigned */}
      {isAuthenticated && (
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your Subscription</h2>
                <p className="text-muted-foreground">Manage your plan and token usage</p>
              </div>
              <Badge
                variant={currentPlan === "FREE" ? "outline" : "default"}
                className={`text-sm px-3 py-1 ${currentPlan !== "FREE" ? "bg-primary hover:bg-primary" : ""}`}
              >
                {currentPlan} PLAN
              </Badge>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Token Usage</span>
                  <span className="font-medium">
                    {tokensUsed} / {credits}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    style={{ width: `${credits > 0 ? (tokensUsed / credits) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">Plan Features</div>
                  <div className="font-medium flex items-center">
                    {planIcons[currentPlan as SubscriptionPlanType]}
                    <span className="ml-2">{userPlan.name}</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
                  <div className="font-medium">{credits}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <div className="font-medium flex items-center gap-2">
                    <StatusBadge status={subscriptionStatus || "INACTIVE"} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={handleManageSubscription} disabled={loading !== null}>
                {loading === currentPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Manage Subscription"
                )}
              </Button>
              {isSubscribed && currentPlan !== "FREE" && (
                <Button variant="destructive" onClick={handleCancelSubscription} disabled={loading !== null}>
                  {loading === currentPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promotional Banner - Simplified */}
      {showPromotion && (
        <div className="relative overflow-hidden rounded-xl border bg-muted/50 p-6 shadow-sm">
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-sm">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
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
                    className="pr-24"
                  />
                  {isPromoValid && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
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

      {/* Section Header - Simplified */}
      <div className="text-center py-8">
        <h2 className="text-4xl font-bold mb-3">Choose Your Plan</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the perfect plan to unlock your learning potential and take your skills to the next level.
        </p>
      </div>

      {/* Billing Toggle - Simplified */}
      <div className="flex items-center justify-center space-x-4 pt-4 mb-8">
        <Label
          htmlFor="billing-toggle"
          className={`text-lg ${selectedDuration === 1 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
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
          className={`text-lg ${selectedDuration === 6 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
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

      {/* Active Subscription Alert - Simplified */}
      {isSubscribed && (
        <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">
            You have an active subscription
          </AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            You currently have an active {currentPlan} plan. You need to wait until your subscription expires or cancel
            it before subscribing to a new plan.
          </AlertDescription>
        </Alert>
      )}

      {/* Compare Plans Button - Simplified */}
      <div className="text-center mb-8 mt-4">
        <Button
          variant="outline"
          onClick={() => {
            const tabsElement = document.getElementById("plan-comparison-tabs")
            if (tabsElement) {
              tabsElement.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }}
          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Compare All Plans
        </Button>
      </div>

      {/* Plan Cards - Redesigned */}
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
        isPlanAvailable={(planName) => isPlanAvailable(planName, currentPlan, subscriptionStatus)}
      />

      {/* Why Upgrade Section - Simplified */}
      <div className="text-center mt-12 mb-8">
        <h3 className="text-2xl font-bold mb-4">Why Upgrade?</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Upgrade to a higher-tier plan to unlock more tokens, advanced features, and priority support. Take your
          learning experience to the next level.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const tabsElement = document.getElementById("plan-comparison-tabs")
            if (tabsElement) {
              tabsElement.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }}
          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
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

