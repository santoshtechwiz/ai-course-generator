"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Sparkles, Gift, Loader2, AlertTriangle, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { SUBSCRIPTION_PLANS, FAQ_ITEMS } from "./subscription.config"
import type { SubscriptionPlanType, SubscriptionStatusType } from "./subscription.config"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TokenPurchase } from "./token-purchase"
import { ReferralSystem } from "./referral-system"


interface PricingPageProps {
  userId: string | null
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  isProd: boolean
  tokensUsed?: number
}

const planColors: Record<SubscriptionPlanType, string> = {
  FREE: "bg-secondary hover:bg-secondary/90",
  BASIC: "bg-blue-500 hover:bg-blue-600",
  PRO: "bg-green-500 hover:bg-green-600",
  ULTIMATE: "bg-red-500 hover:bg-red-600",
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
  const { toast } = useToast()
  const router = useRouter()
  const isAuthenticated = !!userId

  // Update the handleSubscribe function to properly handle FREE plan and PRO plan redirections
  const handleSubscribe = async (planName: SubscriptionPlanType, duration: number) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "default",
      })
      router.push(`/auth/signin?callbackUrl=/dashboard/subscription&plan=${planName}&duration=${duration}`)
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
      const referralCode = searchParams.get("ref")

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
          toast({
            title: "Subscription Conflict",
            description: "You already have an active subscription.",
            variant: "default",
          })
        } else {
          toast({
            title: "Subscription Error",
            description: data.details || "There was an error processing your subscription. Please try again.",
            variant: "default",
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
      toast({
        title: "Subscription Error",
        description:
          "We encountered an issue while processing your request. Please try again later or contact support.",
        variant: "default",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!userId || !currentPlan || subscriptionStatus !== "ACTIVE") {
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

  const isSubscribed = currentPlan && subscriptionStatus === "ACTIVE"
  const userPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlan) || SUBSCRIPTION_PLANS[0]
  const tokenUsagePercentage = userPlan ? (tokensUsed / userPlan.tokens) * 100 : 0

  return (
    <div className="container max-w-6xl space-y-10">
      {!isProd && <DevModeBanner />}
      {isAuthenticated && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Subscription</span>
              <Badge variant={currentPlan === "FREE" ? "outline" : "default"}>{currentPlan}</Badge>
            </CardTitle>
            <CardDescription>Manage your subscription and token usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Token Usage</span>
                <span className="font-medium">
                  {tokensUsed} / {userPlan.tokens}
                </span>
              </div>
              <Progress value={tokenUsagePercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col p-3 border rounded-md">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{userPlan.name}</span>
              </div>
              <div className="flex flex-col p-3 border rounded-md">
                <span className="text-muted-foreground">Questions per Quiz</span>
                <span className="font-medium">Up to {userPlan.limits.maxQuestionsPerQuiz}</span>
              </div>
              <div className="flex flex-col p-3 border rounded-md">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{subscriptionStatus || "N/A"}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            {/* <Button onClick={handleManageSubscription} variant="outline">
              Manage Subscription
            </Button>
            {subscriptionStatus === "ACTIVE" && currentPlan !== "FREE" && (
              <Button onClick={handleCancelSubscription} variant="destructive">
                Cancel Subscription
              </Button>
            )} */}
          </CardFooter>
        </Card>
      )}
      {/* Add the ReferralSystem component here */}
      <div className="mt-8">
        <ReferralSystem userId={userId} />
      </div>
      {isAuthenticated && currentPlan && subscriptionStatus === "ACTIVE" && (
        <div className="mt-8">
          <TokenPurchase
            currentTokens={userPlan.tokens - tokensUsed}
            onPurchase={(amount) => {
              toast({
                title: "Tokens Purchased",
                description: `${amount} tokens have been added to your account.`,
                variant: "default",
              })
            }}
          />
        </div>
      )}
      {showPromotion && (
        <div className="relative overflow-hidden rounded-lg border bg-background p-4 shadow-md">
          <div className="absolute top-2 right-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPromotion(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">Limited Time Offer!</h3>
              <p className="text-sm text-muted-foreground">
                Get 20% off any plan with code <span className="font-mono font-bold">AILAUNCH20</span>
              </p>
            </div>
            <Button size="sm" className="shrink-0">
              <Gift className="mr-2 h-4 w-4" />
              Claim Offer
            </Button>
          </div>
        </div>
      )}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground mb-8">Select the perfect plan to unlock your learning potential.</p>
      </div>
      <div className="flex items-center justify-center space-x-2 pt-4">
        <Label htmlFor="billing-toggle" className={selectedDuration === 1 ? "font-medium" : ""}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={selectedDuration === 6}
          onCheckedChange={(checked) => setSelectedDuration(checked ? 6 : 1)}
        />
        <Label htmlFor="billing-toggle" className={selectedDuration === 6 ? "font-medium" : ""}>
          6 Months
          <Badge variant="outline" className="ml-2 bg-primary/10 hover:bg-primary/20">
            Save up to{" "}
            {calculateSavings(SUBSCRIPTION_PLANS[2].options[0].price, SUBSCRIPTION_PLANS[2].options[1].price)}%
          </Badge>
        </Label>
      </div>
      <div className="text-center mb-8">
        <Button
          variant="outline"
          onClick={() => document.getElementById("comparison-table")?.scrollIntoView({ behavior: "smooth" })}
        >
          Compare All Plans
        </Button>
      </div>
      <PlanCards
        plans={SUBSCRIPTION_PLANS}
        currentPlan={currentPlan}
        subscriptionStatus={subscriptionStatus}
        loading={loading}
        handleSubscribe={handleSubscribe}
        duration={selectedDuration}
      />
      <div className="text-center mt-8">
        <h3 className="text-xl font-semibold mb-4">Why Upgrade?</h3>
        <p className="text-muted-foreground mb-4">
          Upgrade to a higher-tier plan to unlock more tokens, advanced features, and priority support.
        </p>
        <Button
          variant="outline"
          onClick={() => document.getElementById("comparison-table")?.scrollIntoView({ behavior: "smooth" })}
        >
          Compare Plans
        </Button>
      </div>
      <TokenUsageExplanation />
      <ComparisonTable plans={SUBSCRIPTION_PLANS} />
      <div className="bg-muted/50 rounded-lg p-6 border mt-10">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-bold mb-2">Refer a Friend, Get Rewards</h2>
            <p className="text-muted-foreground mb-4">
              Invite your friends to join our platform and earn 10 free tokens for each successful referral. Your
              friends will also receive 5 bonus tokens when they sign up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button>Get Referral Link</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-background rounded-lg p-6 border w-full max-w-md">
              <h3 className="font-semibold mb-2">Your Referral Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Referrals</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tokens Earned</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pending Invites</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FAQSection />
    
    </div>
  )
}

function calculateSavings(monthlyPrice: number, biAnnualPrice: number): number {
  const annualCostMonthly = monthlyPrice * 12
  const annualCostBiAnnual = biAnnualPrice * 2
  return Math.round((1 - annualCostBiAnnual / annualCostMonthly) * 100)
}

function PlanCards({
  plans,
  currentPlan,
  subscriptionStatus,
  loading,
  handleSubscribe,
  duration,
}: {
  plans: typeof SUBSCRIPTION_PLANS
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  loading: SubscriptionPlanType | null
  handleSubscribe: (planId: SubscriptionPlanType, duration: number) => Promise<void>
  duration: 1 | 6
}) {
  const isSubscribed = currentPlan && subscriptionStatus === "ACTIVE"
  const bestPlan = plans.find((plan) => plan.name === "PRO")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {plans.map((plan) => {
        const priceOption = plan.options.find((o) => o.duration === duration) || plan.options[0]

        return (
          <div key={plan.name}>
            <Card
              className={`flex flex-col h-full ${currentPlan === plan.name ? "border-2 border-primary" : ""} ${plan.name === bestPlan?.name ? "transform scale-105 shadow-lg" : ""}`}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center">
                    <plan.icon className="h-5 w-5 mr-2" />
                    <span className="text-2xl font-bold">
                      {plan.name.charAt(0).toUpperCase() + plan.name.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {currentPlan === plan.name && (
                    <Badge variant={subscriptionStatus === "ACTIVE" ? "default" : "destructive"}>
                      {subscriptionStatus === "ACTIVE" ? "Active Plan" : "Inactive Plan"}
                    </Badge>
                  )}
                  {plan.name === bestPlan?.name && (
                    <Badge variant="secondary" className="ml-2">
                      Best Value
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {plan.options[0].price === 0
                    ? "Free forever"
                    : `$${priceOption.price}/${duration === 1 ? "month" : "6 months"}`}
                  <div className="my-2 h-px bg-border" />
                  <p className="text-sm text-muted-foreground">{plan.tokens} tokens included</p>
                  <SavingsHighlight plan={plan} duration={duration} />
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <p className="text-2xl font-semibold">{plan.tokens} tokens</p>
                  <Progress value={(plan.tokens / 500) * 100} className="h-2 mt-2" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Included Features</h4>
                    <ul className="space-y-2">
                      {plan.features
                        .filter((feature) => feature.available)
                        .map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-sm">{feature.name}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Not Included</h4>
                    <ul className="space-y-2">
                      {plan.features
                        .filter((feature) => !feature.available)
                        .map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Lock className="h-5 w-5 text-muted-foreground mr-2" />
                            <span className="text-sm text-muted-foreground">{feature.name}</span>
                            {feature.comingSoon && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          onClick={() => handleSubscribe(plan.id as SubscriptionPlanType, duration)}
                          disabled={(isSubscribed && currentPlan === plan.name) || loading !== null}
                          className={`w-full text-primary-foreground ${planColors[plan.id as SubscriptionPlanType]} ${plan.name === bestPlan?.name ? "animate-pulse" : ""}`}
                        >
                          {loading === plan.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : currentPlan === plan.name ? (
                            "Current Plan"
                          ) : plan.name === "FREE" ? (
                            "Start for Free"
                          ) : (
                            "Subscribe Now"
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {currentPlan === plan.name
                        ? isSubscribed
                          ? "This is your current active plan"
                          : "This is your current plan, but it's not active"
                        : plan.name === "FREE"
                          ? "Start using the free plan"
                          : `Click to subscribe to the ${plan.name} plan`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

function SavingsHighlight({ plan, duration }: { plan: (typeof SUBSCRIPTION_PLANS)[0]; duration: 1 | 6 }) {
  const monthlyPrice = plan.options.find((o) => o.duration === 1)?.price || 0
  const biAnnualPrice = plan.options.find((o) => o.duration === 6)?.price || 0
  const savings = calculateSavings(monthlyPrice, biAnnualPrice)

  if (duration === 1 || plan.name === "FREE") return null

  return (
    <div className="mt-2 p-2 bg-green-100 rounded-md">
      <div className="text-sm text-green-700 font-semibold">Save {savings}% with bi-annual plan!</div>
      <div className="text-xs text-green-600">
        That's ${(monthlyPrice * 12 - biAnnualPrice * 2).toFixed(2)} in savings per year!
      </div>
    </div>
  )
}

function TokenUsageExplanation() {
  return (
    <div className="bg-secondary p-6 rounded-lg mb-8">
      <h3 className="text-xl font-semibold mb-4">How to Use Your Tokens</h3>
      <p className="mb-4">Tokens are a flexible currency you can use across different features:</p>
      <ul className="list-disc list-inside space-y-2">
        <li>1 token = 1 course creation</li>
        <li>1 token = 1 quiz generation (number of questions limited by your plan)</li>
      </ul>
      <p className="mt-4">Use your tokens flexibly to create courses or generate quizzes, up to your plan's limits.</p>
    </div>
  )
}

function ComparisonTable({ plans }: { plans: typeof SUBSCRIPTION_PLANS }) {
  return (
    <div id="comparison-table">
      <h2 className="text-2xl font-bold mb-4 text-center">Compare Plans</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Feature</TableHead>
              {plans.map((plan) => (
                <TableHead key={plan.name} className="text-center">
                  {plan.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Price</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  ${plan.options[0].price}/mo
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tokens</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.tokens}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
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
            ].map((feature) => (
              <TableRow key={feature}>
                <TableCell className="font-medium">{feature}</TableCell>
                {plans.map((plan) => {
                  const featureInfo = plan.features.find((f) => f.name === feature)
                  return (
                    <TableCell key={plan.name} className="text-center">
                      {featureInfo?.available ? (
                        <Check className="mx-auto h-5 w-5 text-green-500" />
                      ) : featureInfo?.comingSoon ? (
                        <Badge variant="outline" className="mx-auto">
                          Soon
                        </Badge>
                      ) : (
                        <X className="mx-auto h-5 w-5 text-muted-foreground" />
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

function FAQSection() {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <input
        type="text"
        placeholder="Search FAQs..."
        className="w-full p-2 mb-4 border rounded"
        onChange={(e) => {
         
        }}
      />
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-base font-medium">{item.question}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
 
      </Accordion>
      <div className="mt-6">
        <Button variant="outline" onClick={() => (window.location.href = "/contact")}>
          Contact Support
        </Button>
      </div>
    </div>
  )
}

function DevModeBanner() {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded-md" role="alert">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p className="font-bold">Development Mode</p>
      </div>
      <p>You are currently in development mode. Stripe payments are in test mode.</p>
    </div>
  )
}

async function getStripe() {
  const { loadStripe } = await import("@stripe/stripe-js")
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

