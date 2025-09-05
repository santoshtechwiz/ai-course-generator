"use client"

/**
 * PlanCard Component
 *
 * This component displays a subscription plan card with pricing,
 * features, and subscription button.
 */

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Check, Loader2, AlertTriangle, Calendar, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import SavingsHighlight from "./SavingsHighlight"
import { Badge } from "@/components/ui/badge"
import { FeatureCategoryList } from "../FeatureComparison"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/types/subscription"
import type { SUBSCRIPTION_PLANS as SubscriptionPlansType } from "../subscription-plans"
import { motion } from "framer-motion"

// Redesigned PlanCards component with reduced animations
export default function PlanCards({
  plans,
  currentPlan,
  subscriptionStatus,
  loading,
  handleSubscribe,
  duration,
  isSubscribed,
  promoCode,
  isPromoValid,
  promoDiscount,
  getDiscountedPrice,
  isPlanAvailable,
  getPlanUnavailableReason,
  expirationDate,
  isAuthenticated = true,
  hasAnyPaidPlan = false,
  hasAllPlans = false,
  cancelAtPeriodEnd = false,
  userId = null,
  hadPreviousPaidPlan = false,
}: {
  plans: typeof SubscriptionPlansType
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  loading: SubscriptionPlanType | null
  handleSubscribe: (planId: SubscriptionPlanType, duration: number) => Promise<void>
  duration: 1 | 6
  isSubscribed: boolean
  promoCode: string
  isPromoValid: boolean
  promoDiscount: number
  getDiscountedPrice: (originalPrice: number) => number
  isPlanAvailable: (planName: SubscriptionPlanType) => boolean
  getPlanUnavailableReason?: (planName: SubscriptionPlanType) => string | undefined
  expirationDate?: string | null
  isAuthenticated?: boolean
  hasAnyPaidPlan?: boolean
  hasAllPlans?: boolean
  cancelAtPeriodEnd?: boolean
  userId?: string | null
  hadPreviousPaidPlan?: boolean
}) {
  const bestPlan = plans.find((plan) => plan.name === "PREMIUM")
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {plans.map((plan, index) => {
        const priceOption = plan.options.find((o) => o.duration === duration) || plan.options[0]
        const isPlanActive = currentPlan === plan.id
        const isBestValue = plan.name === bestPlan?.name
        const isCurrentActivePlan = isSubscribed && currentPlan === plan.id
        const discountedPrice = getDiscountedPrice(priceOption.price)

        // Determine if this specific plan should be disabled
        // If not authenticated, only disable during loading
        const isPlanDisabled =
          loading !== null || (isAuthenticated && !isPlanAvailable(plan.id as SubscriptionPlanType))

        // Get the reason why the plan is unavailable
        const unavailableReason = isAuthenticated
          ? getPlanUnavailableReason?.(plan.id as SubscriptionPlanType)
          : undefined

        // Determine button text and state
        const buttonText = (() => {
          if (loading === plan.id) return "Processing..."
          if (isAuthenticated) {
            if (isCurrentActivePlan) {
              return cancelAtPeriodEnd ? "Cancels Soon" : "Current Plan"
            }
            if (hasAllPlans) return "All Plans Active"
            if (plan.id === "FREE" && hasAnyPaidPlan) return "Paid Plan Active"
            
            // Special messaging for expired/canceled users
            if (normalizedStatus === "EXPIRED" || normalizedStatus === "CANCELED") {
              if (plan.id === "FREE") return "Downgraded to Free"
              return hadPreviousPaidPlan ? "Reactivate Plan" : "Subscribe Now"
            }
            
            if (!isPlanAvailable(plan.id as SubscriptionPlanType)) return "Unavailable"
          }
          if (plan.id === "FREE") return "Start for Free"
          return "Subscribe Now"
        })()

        // Determine card highlight style
        const cardHighlightClass = (() => {
          if (isAuthenticated && isPlanActive && normalizedStatus === "ACTIVE") {
            return cancelAtPeriodEnd
              ? "border-2 border-amber-500 dark:border-amber-400"
              : "border-2 border-green-500 dark:border-green-400"
          }
          if (isAuthenticated && isPlanActive && normalizedStatus === "CANCELED") {
            return "border-2 border-amber-500 dark:border-amber-400"
          }
          if (isBestValue) return "shadow-lg ring-1 ring-purple-500"
          return "shadow-sm"
        })()

        // Get the icon component for the plan
        const PlanIcon = plan.icon

        return (
          <motion.div
            key={plan.id}
            className={`${isBestValue ? "order-first lg:order-none" : ""}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
          >
            <Card
              className={`flex flex-col h-full transition-all duration-300 hover:shadow-md ${
                cardHighlightClass
              } ${isPlanDisabled ? "opacity-75" : ""}`}
            >
              {isBestValue && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-1.5 text-sm font-medium">
                  Most Popular
                </div>
              )}
              {isCurrentActivePlan && (
                <div
                  className={`${
                    cancelAtPeriodEnd ? "bg-amber-500" : "bg-green-500"
                  } text-white text-center py-1.5 text-sm font-medium`}
                >
                  {cancelAtPeriodEnd ? "Cancels at Period End" : "Current Plan"}
                </div>
              )}
              <CardHeader className={`${isBestValue ? "pb-4" : "pb-2"}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-1">
                  <div className="flex items-center">
                    {PlanIcon && <PlanIcon className="h-5 w-5 mr-2" />}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  {isPlanActive && isAuthenticated && (
                    <Badge
                      variant={normalizedStatus === "ACTIVE" ? "default" : "destructive"}
                      className="whitespace-nowrap mt-2 sm:mt-0"
                    >
                      {cancelAtPeriodEnd ? "Cancelling" : normalizedStatus === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                <CardDescription className="min-h-[40px] text-center sm:text-left">{plan.description}</CardDescription>
                <div className="mt-4 text-center sm:text-left">
                  <div className="flex items-baseline justify-center sm:justify-start">
                    {isPromoValid && promoDiscount > 0 ? (
                      <>
                        <span className="text-2xl font-bold line-through text-muted-foreground">
                          ${priceOption.price}
                        </span>
                        <span className="text-3xl font-bold ml-2 text-green-600 dark:text-green-400">
                          ${discountedPrice}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold">${priceOption.price}</span>
                    )}
                    <span className="text-sm ml-1 text-muted-foreground">/{duration === 1 ? "month" : "6 months"}</span>
                  </div>
                  <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />
                  <p className="text-sm text-muted-foreground">{plan.tokens} tokens included</p>
                  <SavingsHighlight plan={plan} duration={duration} />
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-center sm:text-left">{plan.tokens} tokens</p>
                  <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                    <motion.div
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        plan.id === "FREE"
                          ? "bg-slate-400"
                          : plan.id === "BASIC"
                            ? "bg-blue-500"
                            : plan.id === "PREMIUM"
                              ? "bg-purple-500"
                              : "bg-gradient-to-r from-amber-500 to-orange-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(plan.tokens / 600) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 * index }}
                    />
                  </div>
                  <div className="mt-2 text-center sm:text-left">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Up to {plan.limits.maxQuestionsPerQuiz} questions per quiz
                    </span>
                  </div>
                </div>

                {/* Replace the old feature list with our new FeatureCategoryList component */}
                <FeatureCategoryList planId={plan.id as SubscriptionPlanType} />
              </CardContent>
              <CardFooter className="pt-4">
                <div className="w-full">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            onClick={() => handleSubscribe(plan.id as SubscriptionPlanType, duration)}
                            disabled={isPlanDisabled}
                            variant={isCurrentActivePlan ? "outline" : "default"}
                            className={`w-full text-primary-foreground ${
                              plan.id === "FREE"
                                ? "bg-slate-500 hover:bg-slate-600"
                                : plan.id === "BASIC"
                                  ? "bg-blue-500 hover:bg-blue-600"
                                  : plan.id === "PREMIUM"
                                    ? "bg-purple-500 hover:bg-purple-600"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            } shadow-md transition-all duration-300 ${
                              isCurrentActivePlan ? "!bg-transparent !text-foreground border-2" : ""
                            }`}
                          >
                            {loading === plan.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4" />
                                Processing...
                              </>
                            ) : (
                              buttonText
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {isAuthenticated && !isPlanAvailable(plan.id as SubscriptionPlanType) && unavailableReason && (
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="flex items-start gap-2 p-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{unavailableReason}</p>
                              {expirationDate && normalizedStatus !== "ACTIVE" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Your current plan {normalizedStatus === "CANCELED" ? "expires" : "renews"} on{" "}
                                  {expirationDate}
                                </p>
                              )}
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardFooter>

              {/* Add a note for current active plan */}
              {isAuthenticated && isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                    <Info className="h-4 w-4" />
                    <p>
                      {cancelAtPeriodEnd
                        ? "Your subscription will cancel at the end of the billing period"
                        : "You are currently subscribed to this plan"}
                    </p>
                  </div>
                </div>
              )}

              {/* Add a note for unavailable plans */}
              {isAuthenticated && !isPlanAvailable(plan.id as SubscriptionPlanType) && !isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-2">
                    {hasAllPlans ? (
                      <>
                        <Check className="h-4 w-4" />
                        <p>All features already available</p>
                      </>
                    ) : plan.id === "FREE" && hasAnyPaidPlan ? (
                      <>
                        <Info className="h-4 w-4" />
                        <p>You have a paid subscription</p>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        <p>
                          {normalizedStatus === "EXPIRED" 
                            ? "Reactivate your subscription" 
                            : normalizedStatus === "CANCELED"
                            ? "Subscription ended - Subscribe again"
                            : `Available after current plan ${normalizedStatus === "CANCELED" ? "expires" : "ends"}`
                          }
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}              {/* Removed sign in to subscribe message */}
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
