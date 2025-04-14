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
  CreditCard,
  ArrowRight,
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


import PlanCards from "./subscription-status/PlanCard"
import ComparisonTable from "./subscription-status/ComparisonTable"
import DevModeBanner from "./subscription-status/DevModeBanner"
import FAQSection from "./subscription-status/FaqSection"
import TokenUsageExplanation from "./subscription-status/TokenUsageExplanation"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/dashboard/subscription/types/subscription"

import { SUBSCRIPTION_PLANS } from "./subscription-plans"

import { calculateSavings } from "../utils/subscription-utils"
import { useSubscription } from "../hooks/use-subscription"


interface PricingPageProps {
  userId: string | null
  currentPlan?: SubscriptionPlanType | null
  subscriptionStatus?: SubscriptionStatusType | null
  isProd?: boolean
  tokensUsed?: number
  credits?: number
  expirationDate?: string | null
  referralCode?: string | null
  onUnauthenticatedSubscribe?: (
    planName: SubscriptionPlanType,
    duration: number,
    promoCode?: string,
    promoDiscount?: number,
  ) => void
}

export function PricingPage({
  userId,
  currentPlan = "FREE",
  subscriptionStatus = null,
  isProd = false,
  tokensUsed = 0,
  credits = 0,
  expirationDate = null,
  referralCode = null,
  onUnauthenticatedSubscribe,
}: PricingPageProps) {
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
  const normalizedStatus = subscriptionStatus?.toUpperCase() as "ACTIVE" | "CANCELED" | null
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
    
    canSubscribeToPlan,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
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

  // Check if user is subscribed to any paid plan
  const hasAnyPaidPlan = useMemo(() => {
    return isSubscribedToAnyPaidPlan(currentPlan, normalizedStatus)
  }, [currentPlan, normalizedStatus, isSubscribedToAnyPaidPlan])

  // Check if user is subscribed to all plans
  const hasAllPlans = useMemo(() => {
    return isSubscribedToAllPlans(currentPlan, normalizedStatus)
  }, [currentPlan, normalizedStatus, isSubscribedToAllPlans])

  // Enhanced subscription handler with authentication check
  const handleSubscribe = async (planName: SubscriptionPlanType, duration: number) => {
    // Set loading state for the specific plan
    setLoading(planName)

    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        // If we have an onUnauthenticatedSubscribe handler, use it
        if (onUnauthenticatedSubscribe) {
          onUnauthenticatedSubscribe(
            planName,
            duration,
            isPromoValid ? promoCode : undefined,
            isPromoValid ? promoDiscount : undefined,
          )
        } else {
          // Otherwise, show a toast and redirect
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
                promoDiscount: promoDiscount,
                referralCode: referralCode || null,
              }),
            )
          }

          // Redirect to login page
          window.location.href = "/api/auth/signin"
        }
        setLoading(null)
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
        setLoading(null)
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
        referralCode ?? undefined, // Pass referral code if available
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
    window.location.href = "/account"
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
    if (typeof window !== "undefined" && isAuthenticated) {
      const pendingSubscriptionData = localStorage.getItem("pendingSubscription")

      if (pendingSubscriptionData) {
        try {
          const { planName, duration, promoCode } = JSON.parse(pendingSubscriptionData)

          // Apply promo code if it was saved
          if (promoCode) {
            setPromoCode(promoCode)
            validatePromoCode(promoCode)
          }

          // Don't automatically proceed with subscription after login
          // This prevents immediate resumption of subscriptions after redirection
          // Instead, we'll just show a notification that there's a pending subscription

          // Clear the pending subscription after a delay
          setTimeout(() => {
            localStorage.removeItem("pendingSubscription")
          }, 5000)
        } catch (error) {
          console.error("Error processing pending subscription:", error)
        }
      }
    }
  }, [isAuthenticated, validatePromoCode])

  return (
    <div className="container max-w-6xl space-y-8 px-4 sm:px-6 animate-in fade-in duration-500">
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

      {/* Active Subscription Alert - Only show when authenticated and subscribed */}
      {isAuthenticated && isSubscribed && currentPlan !== "FREE" && (
        <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-5 duration-300">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">
            You have an active subscription
          </AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            <p>
              You currently have an active {currentPlan} plan that will{" "}
              {normalizedStatus === "CANCELED" ? "expire" : normalizedStatus === "ACTIVE" ? "renew" : "update"} on{" "}
              {formattedExpirationDate}. You can manage your subscription details in your account page.
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                onClick={handleManageSubscription}
              >
                Manage Subscription
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Promotional Banner - Redesigned */}
      {showPromotion && (
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-top-5 duration-500 delay-300">
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

      {/* Section Header - Always show immediately */}
      <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200">
        <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the perfect plan to unlock your learning potential and take your skills to the next level.
        </p>
      </div>

      {/* Billing Toggle - Always show immediately */}
      <div className="flex items-center justify-center space-x-4 pt-4 mb-8 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-300">
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

      {/* Compare Plans Button - Always show immediately */}
      <div className="text-center mb-8 mt-4 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-400">
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

      {/* Plan Cards - ALWAYS SHOW IMMEDIATELY, regardless of authentication status */}
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
          // If not authenticated, all plans should be available
          if (!isAuthenticated) return true

          // If this is the FREE plan and user has a paid plan, disable it
          if (planName === "FREE" && hasAnyPaidPlan) {
            return false
          }

          // If user has all plans, disable all subscription buttons
          if (hasAllPlans) {
            return false
          }

          const { canSubscribe } = canSubscribeToPlan(currentPlan, planName, normalizedStatus)
          return canSubscribe
        }}
        getPlanUnavailableReason={(planName) => {
          // If not authenticated, no reason to show
          if (!isAuthenticated) return undefined

          // If this is the FREE plan and user has a paid plan
          if (planName === "FREE" && hasAnyPaidPlan) {
            return "You already have a paid subscription"
          }

          // If user has all plans
          if (hasAllPlans) {
            return "You already have access to all features"
          }

          const { canSubscribe, reason } = canSubscribeToPlan(currentPlan, planName, normalizedStatus)
          return canSubscribe ? undefined : reason
        }}
        expirationDate={formattedExpirationDate}
        isAuthenticated={isAuthenticated}
        hasAnyPaidPlan={hasAnyPaidPlan}
        hasAllPlans={hasAllPlans}
      />

      {/* Why Upgrade Section - Always show immediately */}
      <div className="text-center mt-12 mb-8 bg-muted/30 p-8 rounded-xl border animate-in fade-in slide-in-from-bottom-5 duration-500 delay-500">
        <h3 className="text-2xl font-bold mb-4">Why Upgrade?</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Upgrade to a higher-tier plan to unlock more tokens, advanced features, and priority support. Take your
          learning experience to the next level.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
          <div className="bg-card p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2">More Tokens</h4>
            <p className="text-sm text-muted-foreground">
              Get access to more tokens for generating content and completing tasks.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Advanced Features</h4>
            <p className="text-sm text-muted-foreground">
              Unlock premium features like priority processing and advanced customization.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
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

      {/* Token Usage Explanation - Always show immediately */}
      <TokenUsageExplanation />

      {/* Tabs for Plan Information - Always show immediately */}
      <Tabs defaultValue="comparison" className="mt-12" id="plan-comparison-tabs">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="comparison" data-tab-comparison>
            Plan Comparison
          </TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="animate-in fade-in-50 duration-300">
          <ComparisonTable plans={SUBSCRIPTION_PLANS} />
        </TabsContent>

        <TabsContent value="faq" className="animate-in fade-in-50 duration-300">
          <FAQSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PricingPage
