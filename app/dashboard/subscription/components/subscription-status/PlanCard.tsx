"use client"

/**
 * PlanCard Component
 *
 * This component displays a subscription plan card with pricing,
 * features, and subscription button.
 */

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Check, Loader2, Lock, AlertTriangle, Calendar, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import SavingsHighlight from "./SavingsHighlight"
import { Badge } from "@/components/ui/badge"
import { planIcons } from "@/config/plan-icons"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/types/subscription"
import type { SUBSCRIPTION_PLANS } from "../subscription-plans"

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
}: {
  plans: typeof SUBSCRIPTION_PLANS
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
}) {
  const bestPlan = plans.find((plan) => plan.name === "PRO")
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null

  // Check if the user is already on the free plan
  const isOnFreePlan = currentPlan === "FREE" && normalizedStatus === "ACTIVE"

  // Check if user has a paid subscription
  const hasPaidSubscription = isSubscribed && currentPlan !== "FREE"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {plans.map((plan) => {
        const priceOption = plan.options.find((o: { duration: number }) => o.duration === duration) || plan.options[0]
        const isPlanActive = currentPlan === plan.id
        const isBestValue = plan.name === bestPlan?.name
        const isCurrentActivePlan = isSubscribed && currentPlan === plan.id
        const discountedPrice = getDiscountedPrice(priceOption.price)

        // Determine if this specific plan should be disabled
        const isPlanDisabled = loading !== null || !isPlanAvailable(plan.id as SubscriptionPlanType)

        // Get the reason why the plan is unavailable
        const unavailableReason = getPlanUnavailableReason?.(plan.id as SubscriptionPlanType)

        // Determine button text and state
        const buttonText = (() => {
          if (loading === plan.id) return "Processing..."
          if (isCurrentActivePlan) return "Current Plan"
          if (!isPlanAvailable(plan.id as SubscriptionPlanType)) return "Unavailable"
          if (plan.id === "FREE") return "Start for Free"
          return "Subscribe Now"
        })()

        // Determine card highlight style
        const cardHighlightClass = (() => {
          if (isPlanActive && normalizedStatus === "ACTIVE") return "border-2 border-green-500 dark:border-green-400"
          if (isPlanActive && normalizedStatus === "CANCELED") return "border-2 border-amber-500 dark:border-amber-400"
          if (isBestValue) return "shadow-lg ring-1 ring-purple-500"
          return "shadow-sm"
        })()

        return (
          <div key={plan.id} className={`${isBestValue ? "order-first lg:order-none" : ""}`}>
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
                    normalizedStatus === "ACTIVE" ? "bg-green-500" : "bg-amber-500"
                  } text-white text-center py-1.5 text-sm font-medium`}
                >
                  {normalizedStatus === "ACTIVE" ? "Current Plan" : "Canceled Plan"}
                </div>
              )}
              <CardHeader className={`${isBestValue ? "pb-4" : "pb-2"}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-1">
                  <div className="flex items-center">
                    <div>{planIcons[plan.id as SubscriptionPlanType]}</div>
                    <CardTitle className="text-xl ml-2">{plan.name}</CardTitle>
                  </div>
                  {isPlanActive && (
                    <Badge
                      variant={normalizedStatus === "ACTIVE" ? "default" : "destructive"}
                      className="whitespace-nowrap mt-2 sm:mt-0"
                    >
                      {normalizedStatus === "ACTIVE" ? "Active" : "Inactive"}
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
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        plan.id === "FREE"
                          ? "bg-slate-400"
                          : plan.id === "BASIC"
                            ? "bg-blue-500"
                            : plan.id === "PRO"
                              ? "bg-purple-500"
                              : "bg-gradient-to-r from-amber-500 to-orange-500"
                      }`}
                      style={{ width: `${(plan.tokens / 600) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground text-center sm:text-left">
                      Included Features
                    </h4>
                    <ul className="space-y-2">
                      {plan.features
                        .filter((feature) => feature.available)
                        .map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature.name}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground text-center sm:text-left">
                      Not Included
                    </h4>
                    <ul className="space-y-2">
                      {plan.features
                        .filter((feature) => !feature.available)
                        .map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Lock className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature.name}</span>
                            {feature.comingSoon && (
                              <Badge variant="outline" className="ml-2 text-xs whitespace-nowrap">
                                Coming Soon
                              </Badge>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
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
                                  : plan.id === "PRO"
                                    ? "bg-purple-500 hover:bg-purple-600"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            } shadow-md transition-all duration-300 ${
                              isCurrentActivePlan ? "!bg-transparent !text-foreground border-2" : ""
                            }`}
                          >
                            {loading === plan.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              buttonText
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!isPlanAvailable(plan.id as SubscriptionPlanType) && unavailableReason && (
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="flex items-start gap-2 p-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{unavailableReason}</p>
                              {expirationDate && (
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
              {isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                    <Info className="h-4 w-4" />
                    <p>You are currently subscribed to this plan</p>
                  </div>
                </div>
              )}

              {/* Add a note for unavailable plans */}
              {!isPlanAvailable(plan.id as SubscriptionPlanType) && !isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-2">
                    <Calendar className="h-4 w-4" />
                    <p>Available after current plan {normalizedStatus === "CANCELED" ? "expires" : "ends"}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )
      })}
    </div>
  )
}

