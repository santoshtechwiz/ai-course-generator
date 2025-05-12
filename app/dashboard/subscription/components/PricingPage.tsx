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
import { useAppSelector, useAppDispatch } from "@/store"
import { selectSubscription, fetchSubscription } from "@/store/slices/subscription-slice"

import PlanCards from "./subscription-status/PlanCard"
import DevModeBanner from "./subscription-status/DevModeBanner"
import FAQSection from "./subscription-status/FaqSection"
import TokenUsageExplanation from "./subscription-status/TokenUsageExplanation"
import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"

import { SUBSCRIPTION_PLANS } from "./subscription-plans"

import { calculateSavings } from "../utils/subscription-utils"
import { useSubscription } from "../hooks/use-subscription"
import { useMediaQuery } from "@/hooks/use-media-query"
import { FeatureComparison } from "./subscription-status/FeatureComparison"
import { CancellationDialog } from "./subscription-status/CancellationDialog"

interface PricingPageProps {
  userId: string | null
  isProd?: boolean
  onUnauthenticatedSubscribe?: (
    planName: SubscriptionPlanType,
    duration: number,
    promoCode?: string,
    promoDiscount?: number,
  ) => void
  onManageSubscription?: () => void
  isMobile?: boolean
}

export function PricingPage({
  userId,
  isProd = false,
  onUnauthenticatedSubscribe,
  onManageSubscription,
  isMobile: propIsMobile,
}: PricingPageProps) {
  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<1 | 6>(1)
  const [showPromotion, setShowPromotion] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  // Get subscription data from Redux
  const subscriptionData = useAppSelector(selectSubscription)
  const isAuthenticated = !!userId

  // Extract subscription info
  const currentPlan = subscriptionData?.subscriptionPlan || "FREE"
  const subscriptionStatus = subscriptionData?.status || null
  const expirationDate = subscriptionData?.expirationDate || null
  const cancelAtPeriodEnd = subscriptionData?.cancelAtPeriodEnd || false
  const tokensUsed = subscriptionData?.tokensUsed || 0
  const credits = subscriptionData?.credits || 0

  // Add state for promo code
  const [promoCode, setPromoCode] = useState<string>("")
  const [isPromoValid, setIsPromoValid] = useState<boolean>(false)
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false)
  const [hasShownPromoToast, setHasShownPromoToast] = useState<boolean>(false)

  // Add these state variables inside the component
  const [promoInputFocused, setPromoInputFocused] = useState(false)
  const [showPromoHint, setShowPromoHint] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const isMobile = propIsMobile || useMediaQuery("(max-width: 768px)")

  // Normalize subscription status for case-insensitive comparison
  const normalizedStatus = subscriptionStatus?.toUpperCase() as "ACTIVE" | "CANCELED" | null
  const isSubscribed = currentPlan !== "FREE" && normalizedStatus === "ACTIVE"

  // Format expiration date for display
  const formattedExpirationDate = expirationDate
    ? new Date(expirationDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  // Calculate days until expiration
  const daysUntilExpiration = expirationDate
    ? Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Get user plan details
  const userPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlan) || SUBSCRIPTION_PLANS[0]
  const tokenUsagePercentage = credits ? (tokensUsed / credits) * 100 : 0

  // Replace the validatePromoCode function with this improved version
  const validatePromoCode = useCallback(
    async (code: string) => {
      if (!code) {
        toast({
          title: "Promo Code Required",
          description: "Please enter a promo code to apply",
          variant: "destructive",
        })
        return false
      }

      if (isPromoValid) {
        toast({
          title: "Promo Code Already Applied",
          description: `Your ${promoDiscount}% discount is already active`,
          variant: "default",
        })
        return true
      }

      setIsApplyingPromo(true)
      try {
        // For the AILAUNCH20 code, we'll apply it directly
        if (code.toUpperCase() === "AILAUNCH20") {
          setPromoDiscount(20)
          setIsPromoValid(true)

          // Only show toast if we haven't shown it yet
          if (!hasShownPromoToast) {
            toast({
              title: "Promo Code Applied!",
              description: "20% discount will be applied to your subscription.",
              variant: "default",
            })
            setHasShownPromoToast(true)
          }

          return true
        }

        // In a real implementation, we would call an API endpoint here
        // For now, we'll simulate an API call with a timeout
        await new Promise((resolve) => setTimeout(resolve, 500))

        // For now, only AILAUNCH20 is valid
        setIsPromoValid(false)
        setPromoDiscount(0)
        setHasShownPromoToast(false)

        toast({
          title: "Invalid Promo Code",
          description: "The promo code you entered is invalid or expired.",
          variant: "destructive",
        })

        return false
      } catch (error) {
        console.error("Error validating promo code:", error)

        // handleSubscriptionError(error, "VALIDATION_ERROR", {
        //   notify: true,
        //   log: true,
        //   details: "Failed to validate promo code. Please try again.",
        // })

        setIsPromoValid(false)
        setPromoDiscount(0)

        toast({
          title: "Validation Error",
          description: "Failed to validate promo code. Please try again.",
          variant: "destructive",
        })

        return false
      } finally {
        setIsApplyingPromo(false)
      }
    },
    [toast, isPromoValid, promoDiscount, hasShownPromoToast],
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
    setSubscriptionError(null)

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
                // referralCode: referralCode || null,
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
        try {
          const result = await hookHandleSubscribe(planName, duration)

          if (!result.success) {
            setSubscriptionError(result.message || "Failed to activate free plan")
            toast({
              title: "Activation Error",
              description: result.message || "Failed to activate free plan",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Free Plan Activated",
              description: result.message || "Free plan activated successfully",
              variant: "default",
            })

            // Refresh the page after a short delay to show updated subscription
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          }
        } catch (freeActivationError) {
          console.error("Error activating free plan:", freeActivationError)
          setSubscriptionError(
            freeActivationError instanceof Error ? freeActivationError.message : "Failed to activate free plan",
          )
          toast({
            title: "Activation Error",
            description:
              freeActivationError instanceof Error ? freeActivationError.message : "Failed to activate free plan",
            variant: "destructive",
          })
        }
        return
      }

      // For paid plans, use the subscription hook
      try {
        const result = await hookHandleSubscribe(
          planName,
          duration,
          isPromoValid ? promoCode : undefined,
          isPromoValid ? promoDiscount : undefined,
          // referralCode ?? undefined, // Pass referral code if available
        )

        if (!result.success) {
          setSubscriptionError(result.message || "Failed to subscribe to plan")
          toast({
            title: "Subscription Failed",
            description: result.message || "Failed to subscribe to plan",
            variant: "destructive",
          })
        } else if (!result.redirectUrl) {
          // For successful subscription without redirect (like free plan)
          toast({
            title: "Success!",
            description: result.message || "Your subscription has been updated.",
            variant: "default",
          })

          // Refresh the page after a short delay to show updated subscription
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
        // If there's a redirectUrl, the hook will handle the redirect
      } catch (subscriptionError) {
        console.error("Error subscribing to plan:", subscriptionError)
        setSubscriptionError(
          subscriptionError instanceof Error ? subscriptionError.message : "Failed to subscribe to plan",
        )
        toast({
          title: "Subscription Failed",
          description: subscriptionError instanceof Error ? subscriptionError.message : "Failed to subscribe to plan",
          variant: "destructive",
        })
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
  const handleManageSubscription = useCallback(() => {
    // if (cancelAtPeriodEnd) {
    //   // If subscription is already cancelled, show resume option
    //   toast({
    //     title: "Resume Subscription?",
    //     description: "Your subscription is currently set to cancel at the end of the billing period.",
    //     action: (
    //       <Button
    //         variant="outline"
    //         size="sm"
    //         onClick={async () => {
    //           try {
    //             await resumeSubscription()
    //             toast({
    //               title: "Subscription Resumed",
    //               description: "Your subscription will now continue automatically.",
    //             })
    //           } catch (error) {
    //             toast({
    //               title: "Error",
    //               description: "Failed to resume subscription. Please try again.",
    //               variant: "destructive",
    //             })
    //           }
    //         }}
    //       >
    //         Resume
    //       </Button>
    //     ),
    //   })
    // } else
    if (normalizedStatus === "ACTIVE") {
      // Show cancellation dialog for active subscriptions
      setShowCancellationDialog(true)
    } else {
      // Otherwise redirect to account page
      window.location.href = "/dashboard/account"
    }
  }, [cancelAtPeriodEnd, normalizedStatus, toast])

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
        // Toast is now handled in validatePromoCode
      }
    } catch (error) {
      console.error("Error applying promo code:", error)
      toast({
        title: "Application Error",
        description: "Failed to apply promo code. Please try again.",
        variant: "destructive",
      })
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

  const isPlanAvailable = useCallback(
    (planName: SubscriptionPlanType) => {
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
    },
    [isAuthenticated, hasAnyPaidPlan, hasAllPlans, canSubscribeToPlan, currentPlan, normalizedStatus],
  )

  const getPlanUnavailableReason = useCallback(
    (planName: SubscriptionPlanType) => {
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
    },
    [isAuthenticated, hasAnyPaidPlan, hasAllPlans, canSubscribeToPlan, currentPlan, normalizedStatus],
  )

  // Add a refresh function to update subscription data
  const refreshSubscription = useCallback(() => {
    dispatch(fetchSubscription())
  }, [dispatch])

  // Update the component when subscription data changes
  useEffect(() => {
    if (isAuthenticated && !subscriptionData) {
      dispatch(fetchSubscription())
    }
  }, [isAuthenticated, subscriptionData, dispatch])

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
              {cancelAtPeriodEnd ? "expire" : normalizedStatus === "ACTIVE" ? "renew" : "update"} on{" "}
              {formattedExpirationDate}. You can manage your subscription details in your account page.
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                onClick={handleManageSubscription}
              >
                {cancelAtPeriodEnd ? "Resume Subscription" : "Manage Subscription"}
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
                {/* Replace the promo code input with this enhanced version */}
                <div className="relative flex-1">
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 
                    dark:from-blue-900/30 dark:to-purple-900/30 rounded-md transition-opacity duration-300
                    ${promoInputFocused || promoCode ? "opacity-100" : "opacity-0"}
                  `}
                  />

                  <div className="relative">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.trim())}
                      onFocus={() => {
                        setPromoInputFocused(true)
                        setShowPromoHint(true)
                      }}
                      onBlur={() => {
                        setPromoInputFocused(false)
                        setTimeout(() => setShowPromoHint(false), 200)
                      }}
                      className={`
                        pr-24 transition-all duration-300 bg-transparent
                        ${isPromoValid ? "border-green-500 focus-visible:ring-green-500" : ""}
                      `}
                    />

                    {isPromoValid && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 
                                    border-green-200 dark:border-green-800 animate-in fade-in duration-300"
                        >
                          <Check className="h-3 w-3 mr-1" /> {promoDiscount}% off
                        </Badge>
                      </div>
                    )}
                  </div>

                  {showPromoHint && !isPromoValid && (
                    <div className="absolute mt-1 p-2 bg-card rounded-md shadow-md border text-sm z-10 animate-in fade-in slide-in-from-top-5 duration-200">
                      <p>
                        Try code <span className="font-mono font-bold">AILAUNCH20</span> for 20% off!
                      </p>
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

      {/* Add conditional rendering for mobile vs desktop in the Plan Cards section */}
      {isMobile ? (
        // Mobile-optimized layout
        <div className="space-y-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const priceOption = plan.options.find((o) => o.duration === selectedDuration)
            const price = priceOption?.price || 0
            const discountedPrice = isPromoValid ? getDiscountedPrice(price) : price
            const isPlanDisabled =
              loading !== null || (isAuthenticated && !isPlanAvailable(plan.id as SubscriptionPlanType))
            const buttonText = (() => {
              if (loading === plan.id) return "Processing..."
              if (isAuthenticated) {
                if (isSubscribed && currentPlan === plan.id) {
                  return cancelAtPeriodEnd ? "Cancels Soon" : "Current Plan"
                }
                if (hasAllPlans) return "All Plans Active"
                if (plan.id === "FREE" && hasAnyPaidPlan) return "Paid Plan Active"
                if (!isPlanAvailable(plan.id as SubscriptionPlanType)) return "Unavailable"
              }
              if (plan.id === "FREE") return "Start for Free"
              return "Subscribe Now"
            })()

            return (
              <div
                key={plan.id}
                className={`
                  border rounded-lg p-4 transition-all duration-300
                  ${plan.popular ? "border-blue-300 dark:border-blue-700 shadow-md" : ""}
                `}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}

                <h3 className="text-lg font-bold">{plan.name}</h3>

                <div className="mt-2">
                  {isPromoValid && (
                    <div className="text-sm line-through text-muted-foreground">${price.toFixed(2)}</div>
                  )}
                  <div className="text-2xl font-bold">
                    ${discountedPrice.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{selectedDuration === 1 ? "month" : "6 months"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.tokens} tokens</span>
                  </div>
                  {plan.features.slice(0, 2).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature.name}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full mt-4"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id as SubscriptionPlanType, selectedDuration)}
                  disabled={isPlanDisabled}
                >
                  {loading === plan.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : buttonText}
                </Button>

                {/* Add sign-in message for mobile view with correct authentication check */}
                {!userId && plan.id !== "FREE" && (
                  <div className="mt-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <Info className="h-4 w-4" />
                      <p>Sign in to subscribe</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Desktop layout (existing code)
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
          isPlanAvailable={isPlanAvailable}
          getPlanUnavailableReason={getPlanUnavailableReason}
          expirationDate={formattedExpirationDate}
          isAuthenticated={isAuthenticated}
          hasAnyPaidPlan={hasAnyPaidPlan}
          hasAllPlans={hasAllPlans}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          userId={userId}
        />
      )}

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
          {/* Replace this line */}
          <FeatureComparison />
          {/* Instead of <ComparisonTable plans={SUBSCRIPTION_PLANS} /> */}
        </TabsContent>

        <TabsContent value="faq" className="animate-in fade-in-50 duration-300">
          <FAQSection />
        </TabsContent>
      </Tabs>

      {/* Add the CancellationDialog component at the end of the return statement */}
      {showCancellationDialog && (
        <CancellationDialog
          isOpen={showCancellationDialog}
          onClose={() => setShowCancellationDialog(false)}
          onConfirm={async (reason) => {
            // try {
            //   await cancelSubscription()
            //   toast({
            //     title: "Subscription Cancelled",
            //     description: "Your subscription has been cancelled and will end at the current billing period.",
            //   })
            //   // Dispatch an event to notify other components
            //   dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.CANCELED, { reason })
            //   // Close the dialog
            //   setShowCancellationDialog(false)
            // } catch (error) {
            //   toast({
            //     title: "Error",
            //     description: "Failed to cancel subscription. Please try again.",
            //     variant: "destructive",
            //   })
            // }
          }}
          expirationDate={formattedExpirationDate}
          planName={currentPlan || ""}
        />
      )}
    </div>
  )
}

export default PricingPage
