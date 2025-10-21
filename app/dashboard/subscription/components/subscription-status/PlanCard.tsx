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

import { Badge } from "@/components/ui/badge"
import { FeatureCategoryList } from "../FeatureComparison"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/types/subscription"
import { getPlanConfig } from "@/types/subscription-plans"
import { motion } from "framer-motion"
import { getPlanButtonConfig, getPlanStatus, getPriceDisplay } from "@/utils/subscription-ui-helpers"

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
  plans: any[]
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
  const bestPlan = plans.find((plan: any) => plan.name === "PREMIUM")
  const normalizedStatus = subscriptionStatus ? subscriptionStatus.toUpperCase().replace('CANCELLED','CANCELED') : null

  // Enhanced animation variants with neobrutalism
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.15 * i,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        stiffness: 120,
        damping: 15
      },
    }),
    hover: {
      y: -8,
      scale: 1.02,
      rotate: 0.5,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {plans.map((plan: any, index: number) => {
        const priceOption = plan.options.find((o: any) => o.duration === duration) || plan.options[0]
        const isPlanActive = currentPlan === plan.id
        const isBestValue = plan.name === bestPlan?.name
        const isCurrentActivePlan = isSubscribed && currentPlan === plan.id
        const discountedPrice = getDiscountedPrice(priceOption.price)

        // Determine if this specific plan should be disabled
        const isPlanDisabled = (() => {
          // Always disable during loading
          if (loading !== null) return true
          
          // For unauthenticated users, only disable during loading
          if (!isAuthenticated) return false
          
          // Disable if plan is not available
          if (!isPlanAvailable(plan.id as SubscriptionPlanType)) return true
          
          // Disable current active plan (user is already subscribed to this plan)
          if (isCurrentActivePlan) return true
          
          // Special case for FREE plan - disable if user is currently on free plan
          if (plan.id === "FREE" && currentPlan === "FREE" && normalizedStatus === "ACTIVE") {
            return true
          }
          // Block free plan if user ever had a paid plan before
          if (plan.id === 'FREE' && hadPreviousPaidPlan) {
            return true
          }
          // Block selecting a different paid plan while active subscription exists
          if (hasAnyPaidPlan && normalizedStatus === 'ACTIVE' && plan.id !== currentPlan) {
            return true
          }
          
          return false
        })()

        // Get the reason why the plan is unavailable
        const unavailableReason = isAuthenticated
          ? getPlanUnavailableReason?.(plan.id as SubscriptionPlanType)
          : undefined

        // Use helpers for button and status configuration
        const buttonConfig = getPlanButtonConfig({
          planId: plan.id as SubscriptionPlanType,
          currentPlan,
          status: subscriptionStatus,
          isAuthenticated,
          isSubscribed,
          hasAnyPaidPlan,
          hasAllPlans,
          cancelAtPeriodEnd,
          hadPreviousPaidPlan,
          isLoading: loading === plan.id,
          isPlanAvailable: isPlanAvailable(plan.id as SubscriptionPlanType)
        })

        const statusConfig = getPlanStatus({
          planId: plan.id as SubscriptionPlanType,
          currentPlan,
          status: subscriptionStatus,
          isSubscribed,
          cancelAtPeriodEnd,
          isBestValue,
          isAuthenticated
        })

        const priceDisplay = getPriceDisplay(
          getPlanConfig(plan.id as SubscriptionPlanType),
          isPromoValid,
          promoDiscount
        )

        // Keep legacy variables for compatibility
        const buttonText = buttonConfig.text
        const cardHighlightClass = statusConfig.cardClass

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
              className={`flex flex-col h-full transition-all duration-500 border-4 hover:shadow-2xl hover:shadow-black/20 relative overflow-hidden group rounded-xl ${
                cardHighlightClass
              } ${isPlanDisabled ? "opacity-75" : ""} ${
                isBestValue ? "shadow-[6px_6px_0px_0px_var(--border)] hover:shadow-[8px_8px_0px_0px_var(--border)]" : "shadow-[4px_4px_0px_0px_var(--border)] hover:shadow-[6px_6px_0px_0px_var(--border)]"
              }`}
            >
              {statusConfig.bannerText && (
                <div className={`${statusConfig.bannerClass} text-white text-center py-1.5 text-sm font-medium`}>
                  {statusConfig.bannerText}
                </div>
              )}
              <CardHeader className={`${isBestValue ? "pb-4" : "pb-2"}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-1">
                  <div className="flex items-center">
                    {PlanIcon && <PlanIcon className="h-5 w-5 mr-2" />}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  {statusConfig.badge && isAuthenticated && (
                    <Badge
                      variant={statusConfig.badge.variant}
                      className="whitespace-nowrap mt-2 sm:mt-0"
                    >
                      {statusConfig.badge.text}
                    </Badge>
                  )}
                </div>
                <CardDescription className="min-h-[32px] sm:min-h-[40px] text-center sm:text-left text-xs sm:text-sm">{plan.description}</CardDescription>
                <div className="mt-4 text-center sm:text-left">
                  <div className="flex items-baseline justify-center sm:justify-start">
                    {priceDisplay.hasDiscount ? (
                      <>
                        <span className="text-2xl font-bold line-through text-muted-foreground">
                          {priceDisplay.originalPrice}
                        </span>
                        <span className="text-3xl font-bold ml-2 text-green-600 dark:text-green-400">
                          {priceDisplay.displayPrice}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold">{priceDisplay.displayPrice}</span>
                    )}
                    <span className="text-sm ml-1 text-muted-foreground">/{duration === 1 ? "month" : "6 months"}</span>
                  </div>
                  <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />
                  <p className="text-sm text-muted-foreground">{plan.tokens} tokens included</p>
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-center sm:text-left">{plan.tokens} tokens</p>
                  <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                    <motion.div
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        plan.id === "FREE"
                          ? "bg-muted"
                          : plan.id === "BASIC"
                            ? "bg-primary"
                            : plan.id === "PREMIUM"
                              ? "bg-gradient-to-r from-primary to-purple-600"
                              : "bg-accent"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(plan.tokens / 600) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 * index }}
                    />
                  </div>
                  <div className="mt-2 text-center sm:text-left">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Up to {(() => {
                        const planConfig = getPlanConfig(plan.id as SubscriptionPlanType)
                        const maxQuestions = planConfig.maxQuestionsPerQuiz
                        return maxQuestions === 'unlimited' ? '∞' : maxQuestions
                      })()} questions per quiz
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
                            className={`w-full text-primary-foreground font-bold transition-all duration-300 ${
                              plan.id === "FREE"
                                ? isCurrentActivePlan
                                  ? "bg-muted text-muted-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] cursor-not-allowed"
                                  : "bg-muted hover:bg-muted/80 text-foreground shadow-[4px_4px_0px_0px_var(--border)] hover:shadow-[6px_6px_0px_0px_var(--border)]"
                                : plan.id === "BASIC"
                                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[4px_4px_0px_0px_var(--border)] hover:shadow-[6px_6px_0px_0px_var(--border)]"
                                  : plan.id === "PREMIUM"
                                    ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-[4px_4px_0px_0px_var(--border)] hover:shadow-[6px_6px_0px_0px_var(--border)]"
                                    : "bg-accent hover:bg-accent/90 text-accent-foreground shadow-[4px_4px_0px_0px_var(--border)] hover:shadow-[6px_6px_0px_0px_var(--border)]"
                            } ${isCurrentActivePlan ? "!bg-transparent !text-foreground border-2 border-border" : ""} ${
                              isPlanDisabled && !isCurrentActivePlan ? "opacity-50 cursor-not-allowed" : ""
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
                      {isAuthenticated && (
                        (!isPlanAvailable(plan.id as SubscriptionPlanType) && unavailableReason) ||
                         (plan.id === "FREE" && isCurrentActivePlan)
                      ) && (
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="flex items-start gap-2 p-1">
                            {plan.id === "FREE" && isCurrentActivePlan ? (
                              <>
                                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">You are currently on the free plan</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Upgrade to a paid plan for more features and higher limits
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardFooter>

              {/* Enhanced note for current active plan */}
              {isAuthenticated && isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                    <Info className="h-4 w-4" />
                    <p>
                      {plan.id === "FREE" 
                        ? "You are currently on the free plan - upgrade for more features"
                        : cancelAtPeriodEnd
                        ? "Your subscription will cancel at the end of the billing period"
                        : "You are currently subscribed to this plan"}
                    </p>
                  </div>
                </div>
              )}

              {/* Enhanced note for unavailable plans */}
              {isAuthenticated && !isPlanAvailable(plan.id as SubscriptionPlanType) && !isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-2">
                    {hasAllPlans ? (
                      <>
                        <Check className="h-4 w-4" />
                        <p>All features already available</p>
                      </>
                    ) : plan.id === "FREE" ? (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        <p>Free plan already used - choose a paid plan</p>
                      </>
                    ) : hasAnyPaidPlan ? (
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
