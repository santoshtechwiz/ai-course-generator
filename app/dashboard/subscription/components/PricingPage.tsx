"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  X,
  Sparkles,
  Gift,
  Loader2,
  AlertTriangle,
  Lock,
  Info,
  CreditCard,
  Zap,
  Rocket,
  Crown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { SUBSCRIPTION_PLANS, FAQ_ITEMS } from "./subscription.config"
import type { SubscriptionPlanType, SubscriptionStatusType } from "./subscription.config"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ReferralSystem } from "./ReferralSystem"

interface PricingPageProps {
  userId: string | null
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  isProd: boolean
  tokensUsed?: number
}


const planIcons: Record<SubscriptionPlanType, React.ReactNode> = {
  FREE: <CreditCard className="h-6 w-6" />,
  BASIC: <Zap className="h-6 w-6" />,
  PRO: <Rocket className="h-6 w-6" />,
  ULTIMATE: <Crown className="h-6 w-6" />,
}

export function PricingPage({
  userId,
  currentPlan = "FREE",
  subscriptionStatus = null,
  isProd = false,
  tokensUsed = 0,
}: PricingPageProps) {
  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<1 | 6>(1)
  const [showPromotion, setShowPromotion] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const isAuthenticated = !!userId

  // Normalize subscription status for case-insensitive comparison
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null
  const isSubscribed = currentPlan && normalizedStatus === "ACTIVE"

  // Update the handleSubscribe function to properly handle authentication and redirect to Stripe
  const handleSubscribe = async (planName: SubscriptionPlanType, duration: number) => {
    // Clear any previous errors
    setSubscriptionError(null)

    if (!userId) {
      // Store the plan and duration in localStorage before redirecting to login
      localStorage.setItem("pendingSubscription", JSON.stringify({ planName, duration }))

      // Get referral code from URL if present
      const searchParams = new URLSearchParams(window.location.search)
      const referralCode = searchParams.get("ref")

      // Store referral code if present
      if (referralCode) {
        localStorage.setItem("pendingReferralCode", referralCode)
      }

      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "default",
      })
      router.push(`/auth/signin?callbackUrl=/dashboard/subscription`)
      return
    }

    // If user has any active subscription, prevent new subscriptions
    if (isSubscribed) {
      setSubscriptionError(
        `You already have an active subscription. Please wait until it expires or cancel it before subscribing to a new plan.`,
      )
      toast({
        title: "Subscription Error",
        description: `You already have an active subscription. Please wait until it expires or cancel it before subscribing to a new plan.`,
        variant: "destructive",
      })
      return
    }

    // If it's the FREE plan, activate it immediately without going to Stripe
    if (planName === "FREE") {
      setLoading(planName)
      try {
        const response = await fetch("/api/subscriptions/activate-free", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || "Failed to activate free plan")
        }

        toast({
          title: "Free Plan Activated",
          description: "Your free plan has been activated successfully.",
          variant: "default",
        })

        router.refresh()
      } catch (error) {
        console.error("Free plan activation error:", error)
        setSubscriptionError("Failed to activate the free plan. Please try again.")
        toast({
          title: "Activation Error",
          description: "Failed to activate the free plan. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(null)
      }
      return
    }

    // For paid plans, proceed with Stripe checkout
    setLoading(planName)
    try {
      // Check if there's a referral code in the URL
      const searchParams = new URLSearchParams(window.location.search)
      const referralCode = searchParams.get("ref") || localStorage.getItem("pendingReferralCode")

      // Clear stored referral code after using it
      if (localStorage.getItem("pendingReferralCode")) {
        localStorage.removeItem("pendingReferralCode")
      }

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          planName,
          duration,
          referralCode: referralCode || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setSubscriptionError("You already have an active subscription.")
          toast({
            title: "Subscription Conflict",
            description: "You already have an active subscription.",
            variant: "destructive",
          })
        } else {
          setSubscriptionError(data.details || "There was an error processing your subscription. Please try again.")
          toast({
            title: "Subscription Error",
            description: data.details || "There was an error processing your subscription. Please try again.",
            variant: "destructive",
          })
        }
        return
      }

      if (data.error) {
        throw new Error(data.details || "An unexpected error occurred")
      }

      const stripe = await getStripe()
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }

      toast({
        title: "Subscription Initiated",
        description: `You're being redirected to complete your ${planName} plan subscription.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Subscription error:", error)
      setSubscriptionError(
        "We encountered an issue while processing your request. Please try again later or contact support.",
      )
      toast({
        title: "Subscription Error",
        description:
          "We encountered an issue while processing your request. Please try again later or contact support.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!userId || !currentPlan || normalizedStatus !== "ACTIVE") {
      return
    }

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

      // Refresh the page to update the UI
      router.refresh()
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel your subscription. Please try again or contact support.",
        variant: "destructive",
      })
    }
  }

  const handleManageSubscription = () => {
    router.push("/dashboard/subscription/account")
  }

  const userPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlan) || SUBSCRIPTION_PLANS[0]
  const tokenUsagePercentage = userPlan ? (tokensUsed / userPlan.tokens) * 100 : 0

  // Add useEffect to handle pending subscriptions after login
  useEffect(() => {
    // Check if there's a pending subscription after login
    const pendingSubscriptionData = localStorage.getItem("pendingSubscription")

    if (pendingSubscriptionData && userId) {
      try {
        const { planName, duration } = JSON.parse(pendingSubscriptionData)
        // Clear the pending subscription
        localStorage.removeItem("pendingSubscription")

        // Proceed with subscription after a short delay to ensure everything is loaded
        setTimeout(() => {
          handleSubscribe(planName, duration)
        }, 500)
      } catch (error) {
        console.error("Error processing pending subscription:", error)
      }
    }
  }, [userId])

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
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your Subscription</h2>
                <p className="text-muted-foreground">Manage your plan and token usage</p>
              </div>
              <Badge
                variant={currentPlan === "FREE" ? "outline" : "default"}
                className={`text-sm px-3 py-1 ${currentPlan !== "FREE" ? "bg-gradient-to-r from-blue-500 to-purple-500" : ""}`}
              >
                {currentPlan} PLAN
              </Badge>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Token Usage</span>
                  <span className="font-medium">
                    {tokensUsed} / {userPlan.tokens}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${Math.min(tokenUsagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-muted-foreground mb-1">Plan Features</div>
                  <div className="font-medium flex items-center">
                    {planIcons[currentPlan as SubscriptionPlanType]}
                    <span className="ml-2">{userPlan.name}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-muted-foreground mb-1">Questions per Quiz</div>
                  <div className="font-medium">Up to {userPlan.limits.maxQuestionsPerQuiz}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <div className="font-medium flex items-center gap-2">
                    <StatusBadge status={subscriptionStatus || "INACTIVE"} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="border-slate-300 dark:border-slate-600"
              >
                Manage Subscription
              </Button>
              {isSubscribed && currentPlan !== "FREE" && (
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promotional Banner - Redesigned */}
      {showPromotion && (
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 shadow-md">
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800"
              onClick={() => setShowPromotion(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-md">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold mb-1">Limited Time Offer!</h3>
              <p className="text-muted-foreground">
                Get 20% off any plan with code{" "}
                <span className="font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  AILAUNCH20
                </span>
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md"
            >
              <Gift className="mr-2 h-5 w-5" />
              Claim Offer
            </Button>
          </div>
        </div>
      )}

      {/* Section Header - Redesigned */}
      <div className="text-center py-8">
        <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the perfect plan to unlock your learning potential and take your skills to the next level.
        </p>
      </div>

      {/* Billing Toggle - Redesigned */}
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
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
          />
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
        </div>
        <Label
          htmlFor="billing-toggle"
          className={`text-lg ${selectedDuration === 6 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
        >
          6 Months
          <Badge
            variant="outline"
            className="ml-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
          >
            Save up to{" "}
            {calculateSavings(SUBSCRIPTION_PLANS[2].options[0].price, SUBSCRIPTION_PLANS[2].options[1].price)}%
          </Badge>
        </Label>
      </div>

      {/* Active Subscription Alert - Redesigned */}
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

      {/* Compare Plans Button - Redesigned */}
      <div className="text-center mb-8 mt-4">
        <Button
          variant="outline"
          onClick={() => {
            const tabsElement = document.getElementById("plan-comparison-tabs")
            if (tabsElement) {
              // Scroll to the tabs section
              tabsElement.scrollIntoView({ behavior: "smooth", block: "start" })

              // Click the comparison tab
              setTimeout(() => {
                const comparisonTab = document.querySelector("[data-tab-comparison]")
                if (comparisonTab instanceof HTMLElement) {
                  comparisonTab.click()
                }
              }, 300)
            }
          }}
          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
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
        isSubscribed={isSubscribed}
      />

      {/* Why Upgrade Section - Redesigned */}
      <div className="text-center mt-12 mb-8">
        <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Why Upgrade?
        </h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Upgrade to a higher-tier plan to unlock more tokens, advanced features, and priority support. Take your
          learning experience to the next level.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const tabsElement = document.getElementById("plan-comparison-tabs")
            if (tabsElement) {
              // Scroll to the tabs section
              tabsElement.scrollIntoView({ behavior: "smooth", block: "start" })

              // Click the comparison tab
              setTimeout(() => {
                const comparisonTab = document.querySelector("[data-tab-comparison]")
                if (comparisonTab instanceof HTMLElement) {
                  comparisonTab.click()
                }
              }, 300)
            }
          }}
          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
        >
          Compare Plans
        </Button>
      </div>

      {/* Token Usage Explanation - Redesigned */}
      <TokenUsageExplanation />

      {/* Tabs for Plan Information - New Addition */}
      <Tabs defaultValue="features" className="mt-12" id="plan-comparison-tabs">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="features">Plan Features</TabsTrigger>
          <TabsTrigger value="comparison" data-tab-comparison>
            Detailed Comparison
          </TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center mb-2">
                    {plan.id === "FREE" && <CreditCard className="h-5 w-5 mr-2 text-slate-500" />}
                    {plan.id === "BASIC" && <Zap className="h-5 w-5 mr-2 text-blue-500" />}
                    {plan.id === "PRO" && <Rocket className="h-5 w-5 mr-2 text-purple-500" />}
                    {plan.id === "ULTIMATE" && <Crown className="h-5 w-5 mr-2 text-amber-500" />}
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-center sm:text-left">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features
                      .filter((f) => f.available)
                      .slice(0, 5)
                      .map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature.name}</span>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <ComparisonTable plans={SUBSCRIPTION_PLANS} />
        </TabsContent>

        <TabsContent value="faq">
          <FAQSection />
        </TabsContent>
      </Tabs>

      {/* Standalone comparison table for direct scrolling */}
      <div id="comparison-table-standalone" className="mt-12 scroll-mt-20 hidden">
        <ComparisonTable plans={SUBSCRIPTION_PLANS} />
      </div>

      {/* Referral System - Redesigned */}
      <div className="mt-12">
        <ReferralSystem userId={userId} />
      </div>

      {/* Referral Banner - Redesigned */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-md mt-10">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Refer a Friend, Get Rewards
            </h2>
            <p className="text-muted-foreground mb-4">
              Invite your friends to join our platform and earn 10 free tokens for each successful referral. Your
              friends will also receive 5 bonus tokens when they sign up.
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md">
              <Gift className="mr-2 h-5 w-5" />
              Start Referring
            </Button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md w-full max-w-md">
              <h3 className="font-semibold mb-4 text-lg">Your Referral Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-muted-foreground">Total Referrals</span>
                  <span className="font-medium text-lg">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-muted-foreground">Tokens Earned</span>
                  <span className="font-medium text-lg">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-muted-foreground">Pending Invites</span>
                  <span className="font-medium text-lg">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculateSavings(monthlyPrice: number, biAnnualPrice: number): number {
  const annualCostMonthly = monthlyPrice * 12
  const annualCostBiAnnual = biAnnualPrice * 2
  return Math.round((1 - annualCostBiAnnual / annualCostMonthly) * 100)
}

// Redesigned PlanCards component
function PlanCards({
  plans,
  currentPlan,
  subscriptionStatus,
  loading,
  handleSubscribe,
  duration,
  isSubscribed,
}: {
  plans: typeof SUBSCRIPTION_PLANS
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  loading: SubscriptionPlanType | null
  handleSubscribe: (planId: SubscriptionPlanType, duration: number) => Promise<void>
  duration: 1 | 6
  isSubscribed: boolean
}) {
  const bestPlan = plans.find((plan) => plan.name === "PRO")
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {plans.map((plan) => {
        const priceOption = plan.options.find((o) => o.duration === duration) || plan.options[0]
        const isPlanActive = currentPlan === plan.id
        const isBestValue = plan.name === bestPlan?.name
        const isCurrentActivePlan = isSubscribed && currentPlan === plan.id

        return (
          <div key={plan.id} className={`${isBestValue ? "order-first lg:order-none" : ""}`}>
            <Card
              className={`flex flex-col h-full transition-all duration-300 hover:shadow-xl ${
                isPlanActive
                  ? "border-2 border-blue-500 dark:border-blue-400"
                  : "border-slate-200 dark:border-slate-700"
              } ${isBestValue ? "transform lg:scale-105 shadow-lg" : "shadow-sm"}`}
            >
              {isBestValue && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-1.5 text-sm font-medium">
                  Most Popular
                </div>
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
                    <span className="text-3xl font-bold">${priceOption.price}</span>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          onClick={() => handleSubscribe(plan.id as SubscriptionPlanType, duration)}
                          disabled={isSubscribed || loading !== null}
                          className={`w-full text-primary-foreground ${
                            plan.id === "FREE"
                              ? "bg-slate-500 hover:bg-slate-600"
                              : plan.id === "BASIC"
                                ? "bg-blue-500 hover:bg-blue-600"
                                : plan.id === "PRO"
                                  ? "bg-purple-500 hover:bg-purple-600"
                                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          } ${
                            plan.name === bestPlan?.name && !isCurrentActivePlan ? "animate-pulse" : ""
                          } shadow-md hover:shadow-lg transition-all duration-300`}
                        >
                          {loading === plan.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : isCurrentActivePlan ? (
                            "Current Active Plan"
                          ) : isSubscribed ? (
                            "Subscription Active"
                          ) : plan.id === "FREE" ? (
                            "Start for Free"
                          ) : (
                            "Subscribe Now"
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isCurrentActivePlan
                        ? "This is your current active plan"
                        : isSubscribed
                          ? "You need to wait until your current subscription expires or cancel it before subscribing to a new plan"
                          : plan.id === "FREE"
                            ? "Start using the free plan"
                            : `Subscribe to the ${plan.name} plan`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>

              {/* Add a note for current active plan */}
              {isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-muted-foreground italic">You are currently subscribed to this plan</p>
                </div>
              )}

              {/* Add a note for other plans when user has an active subscription */}
              {isSubscribed && !isCurrentActivePlan && (
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-muted-foreground italic">
                    You need to wait until your current subscription expires or cancel it before subscribing to this
                    plan
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

// Redesigned SavingsHighlight component
function SavingsHighlight({ plan, duration }: { plan: (typeof SUBSCRIPTION_PLANS)[0]; duration: 1 | 6 }) {
  const monthlyPrice = plan.options.find((o) => o.duration === 1)?.price || 0
  const biAnnualPrice = plan.options.find((o) => o.duration === 6)?.price || 0
  const savings = calculateSavings(monthlyPrice, biAnnualPrice)

  if (duration === 1 || plan.name === "FREE" || savings <= 0) return null

  return (
    <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-md border border-green-100 dark:border-green-800">
      <div className="text-sm text-green-700 dark:text-green-400 font-semibold flex items-center">
        <Sparkles className="h-4 w-4 mr-1 text-green-500" />
        Save {savings}% with bi-annual plan!
      </div>
      <div className="text-xs text-green-600 dark:text-green-500">
        That's ${(monthlyPrice * 6 - biAnnualPrice).toFixed(2)} in savings!
      </div>
    </div>
  )
}

// Redesigned StatusBadge component
function StatusBadge({ status }: { status: string }) {
  if (!status) return <Badge variant="outline">N/A</Badge>

  // Normalize status to uppercase for consistent comparison
  const normalizedStatus = status.toUpperCase()

  switch (normalizedStatus) {
    case "ACTIVE":
      return (
        <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
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

// Redesigned ComparisonTable component
function ComparisonTable({ plans }: { plans: typeof SUBSCRIPTION_PLANS }) {
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
        Compare Plans
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48 bg-slate-50 dark:bg-slate-800 font-semibold">Feature</TableHead>
              {plans.map((plan) => (
                <TableHead key={plan.name} className="text-center bg-slate-50 dark:bg-slate-800 font-semibold">
                  <div className="flex flex-col items-center">
                    {plan.id === "FREE" && <CreditCard className="h-5 w-5 mb-1 text-slate-500" />}
                    {plan.id === "BASIC" && <Zap className="h-5 w-5 mb-1 text-blue-500" />}
                    {plan.id === "PRO" && <Rocket className="h-5 w-5 mb-1 text-purple-500" />}
                    {plan.id === "ULTIMATE" && <Crown className="h-5 w-5 mb-1 text-amber-500" />}
                    {plan.name}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableCell className="font-medium">Price</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center font-semibold">
                  ${plan.options[0].price}/mo
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tokens</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  <span className="font-semibold">{plan.tokens}</span>
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableCell className="font-medium">Max Questions Per Quiz</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.limits.maxQuestionsPerQuiz}
                </TableCell>
              ))}
            </TableRow>
            {[
              "MCQ Generator",
              "Fill in the Blanks",
              "Open-ended Questions",
              "Code Quiz",
              "Video Quiz",
              "PDF Downloads",
              "Video Transcripts",
              "AI Accuracy",
              "Priority Support",
            ].map((feature, index) => (
              <TableRow key={feature} className={index % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/50" : ""}>
                <TableCell className="font-medium">{feature}</TableCell>
                {plans.map((plan) => {
                  const featureInfo = plan.features.find((f) => f.name === feature)
                  return (
                    <TableCell key={plan.name} className="text-center">
                      {featureInfo?.available ? (
                        <div className="flex justify-center">
                          <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      ) : featureInfo?.comingSoon ? (
                        <Badge
                          variant="outline"
                          className="mx-auto bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        >
                          Soon
                        </Badge>
                      ) : (
                        <div className="flex justify-center">
                          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                            <X className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Redesigned FAQSection component
function FAQSection() {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
        Frequently Asked Questions
      </h2>
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search FAQs..."
          className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm"
          >
            <AccordionTrigger className="text-left text-base font-medium px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground px-4 pb-4 pt-2 bg-slate-50/50 dark:bg-slate-800/50">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/contact")}
          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
        >
          Contact Support
        </Button>
      </div>
    </div>
  )
}

// Redesigned DevModeBanner component
function DevModeBanner() {
  return (
    <div
      className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400 p-4 mb-8 rounded-xl shadow-sm"
      role="alert"
    >
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p className="font-bold">Development Mode</p>
      </div>
      <p>You are currently in development mode. Stripe payments are in test mode.</p>
    </div>
  )
}

// Stripe loading function
async function getStripe() {
  const { loadStripe } = await import("@stripe/stripe-js")
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// Redesigned TokenUsageExplanation component
function TokenUsageExplanation() {
  return (
    <div className="mt-12 p-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="md:w-1/4 flex justify-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-full">
            <Zap className="h-12 w-12 text-white" />
          </div>
        </div>
        <div className="md:w-3/4 text-left">
          <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Understanding Token Usage
          </h3>
          <p className="text-muted-foreground mb-4">
            Tokens are used to generate quizzes and access various features on our platform. Each quiz you generate
            consumes a certain number of tokens based on the complexity and type of questions.
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Generating multiple-choice quizzes consumes fewer tokens</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Creating open-ended or code-based quizzes may require more tokens</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Downloading quizzes in PDF format also consumes tokens</span>
            </li>
          </ul>
          <p className="text-muted-foreground">
            You can purchase additional tokens at any time to continue using our services.
          </p>
        </div>
      </div>
    </div>
  )
}

