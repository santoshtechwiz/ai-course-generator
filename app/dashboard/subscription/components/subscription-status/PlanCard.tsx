"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

import { CreditCard, Zap, Lock, Rocket, Crown, Check, Loader2 } from "lucide-react"

import type { SUBSCRIPTION_PLANS, SubscriptionPlanType, SubscriptionStatusType } from "../subscription.config"
import SavingsHighlight from "./SavingsHighlight"
import { Badge } from "@/components/ui/badge"

// Redesigned PlanCards component
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
}) {
  const bestPlan = plans.find((plan) => plan.name === "PRO")
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null

  // Check if the user is already on the free plan
  const isOnFreePlan = currentPlan === "FREE" && normalizedStatus === "ACTIVE"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {plans.map((plan) => {
        const priceOption = plan.options.find((o) => o.duration === duration) || plan.options[0]
        const isPlanActive = currentPlan === plan.id
        const isBestValue = plan.name === bestPlan?.name
        const isCurrentActivePlan = isSubscribed && currentPlan === plan.id
        const discountedPrice = getDiscountedPrice(priceOption.price)

        // Determine if this specific plan should be disabled
        const isPlanDisabled =
          !isPlanAvailable(plan.id as SubscriptionPlanType) || loading !== null || (plan.id === "FREE" && isOnFreePlan)

        return (
          <div
            key={plan.id}
            className={`${isBestValue ? "order-first lg:order-none" : ""} transition-transform duration-300 ${
              isBestValue ? "hover:scale-105" : "hover:scale-102"
            }`}
          >
            <Card
              className={`flex flex-col h-full transition-all duration-300 hover:shadow-xl ${
                isPlanActive
                  ? "border-2 border-blue-500 dark:border-blue-400"
                  : "border-slate-200 dark:border-slate-700"
              } ${isBestValue ? "transform lg:scale-105 shadow-lg ring-2 ring-purple-500" : "shadow-sm"}`}
            >
              {isBestValue && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-1.5 text-sm font-medium animate-pulse">
                  Most Popular
                </div>
              )}
              {isCurrentActivePlan && (
                <div className="bg-green-500 text-white text-center py-1.5 text-sm font-medium">Current Plan</div>
              )}
              <CardHeader className={`${isBestValue ? "pb-4" : "pb-2"}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-1">
                  <div className="flex items-center">
                    {plan.id === "FREE" && <CreditCard className="h-5 w-5 mr-2 text-slate-500" />}
                    {plan.id === "BASIC" && <Zap className="h-5 w-5 mr-2 text-blue-500" />}
                    {plan.id === "PRO" && <Rocket className="h-5 w-5 mr-2 text-purple-500" />}
                    {plan.id === "ULTIMATE" && <Crown className="h-5 w-5 mr-2 text-amber-500" />}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
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
                        <span className="text-3xl font-bold ml-2">${discountedPrice}</span>
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
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out ${
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
                  <Button
                    onClick={() => handleSubscribe(plan.id as SubscriptionPlanType, duration)}
                    disabled={isPlanDisabled}
                    className={`w-full text-primary-foreground ${
                      plan.id === "FREE"
                        ? "bg-slate-500 hover:bg-slate-600"
                        : plan.id === "BASIC"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : plan.id === "PRO"
                            ? "bg-purple-500 hover:bg-purple-600"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    } ${
                      plan.name === bestPlan?.name && !isPlanDisabled ? "animate-pulse" : ""
                    } shadow-md hover:shadow-lg transition-all duration-300`}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentActivePlan ? (
                      "Current Plan"
                    ) : !isPlanAvailable(plan.id as SubscriptionPlanType) ? (
                      "Unavailable"
                    ) : plan.id === "FREE" && isOnFreePlan ? (
                      "Current Plan"
                    ) : plan.id === "FREE" ? (
                      "Start for Free"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </div>
              </CardFooter>

              {/* Add a note for current active plan */}
              {isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-muted-foreground italic">You are currently subscribed to this plan</p>
                </div>
              )}

              {/* Add a note for free plan when already subscribed */}
              {plan.id === "FREE" && isOnFreePlan && !isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-muted-foreground italic">You are currently on the free plan</p>
                </div>
              )}

              {!isPlanAvailable(plan.id as SubscriptionPlanType) && !isCurrentActivePlan && plan.id !== "FREE" && (
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-muted-foreground italic">
                    You need to cancel your current subscription before subscribing to this plan
                  </p>
                </div>
              )}
            </Card>
          </div>
        )
      })}
    </div>
  )
}

