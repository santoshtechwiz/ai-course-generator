"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { toast } from "@/hooks/use-toast"
import {
  SUBSCRIPTION_PLANS,
  FAQ_ITEMS,
  type SubscriptionPlanType,
  type SubscriptionStatusType,
} from "@/config/subscriptionPlans"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SubscriptionPlansProps {
  userId: string | null
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  isProd: boolean
}

export default function SubscriptionPlans({ userId, currentPlan, subscriptionStatus, isProd }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const router = useRouter()

  const handleSubscribe = async (planName: SubscriptionPlanType, duration: number) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      })
      return
    }

    setLoading(planName)
    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, planName, duration }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      const stripe = await getStripe()
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "Subscription Error",
        description: "There was an error processing your subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-12">
      {!isProd && <DevModeBanner />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground mb-8">Select the perfect plan to unlock your learning potential.</p>
      </motion.div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="biannual">Bi-Annual</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <PlanCards
            plans={SUBSCRIPTION_PLANS}
            currentPlan={currentPlan}
            subscriptionStatus={subscriptionStatus}
            loading={loading}
            handleSubscribe={handleSubscribe}
            duration="monthly"
          />
        </TabsContent>
        <TabsContent value="biannual">
          <PlanCards
            plans={SUBSCRIPTION_PLANS}
            currentPlan={currentPlan}
            subscriptionStatus={subscriptionStatus}
            loading={loading}
            handleSubscribe={handleSubscribe}
            duration="biannual"
          />
        </TabsContent>
      </Tabs>

      <TokenUsageExplanation />
      <ComparisonTable plans={SUBSCRIPTION_PLANS} />
      <FAQSection />
    </div>
  )
}

function TokenUsageExplanation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-secondary p-6 rounded-lg mb-8"
    >
      <h3 className="text-xl font-semibold mb-4">How to Use Your Tokens</h3>
      <p className="mb-4">Tokens are a flexible currency you can use across different features:</p>
      <ul className="list-disc list-inside space-y-2">
        <li>1 token = 1 course creation</li>
        <li>1 token = 1 quiz generation (number of questions limited by your plan)</li>
      </ul>
      <p className="mt-4">Use your tokens flexibly to create courses or generate quizzes, up to your plan's limits.</p>
    </motion.div>
  )
}

function PlanCards({
  plans,
  currentPlan,
  subscriptionStatus,
  loading,
  handleSubscribe,
  duration,
}: {
  plans: typeof SUBSCRIPTION_PLANS;
  currentPlan: SubscriptionPlanType | null;
  subscriptionStatus: SubscriptionStatusType | null;
  loading: SubscriptionPlanType | null;
  handleSubscribe: (planName: SubscriptionPlanType, duration: number) => Promise<void>;
  duration: "monthly" | "biannual";
}) {
  const isSubscribed = currentPlan && subscriptionStatus?.toUpperCase() === "ACTIVE"
  const durationValue = duration === "monthly" ? 1 : 6

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {plans.map((plan) => (
        <Card key={plan.name} className={`flex flex-col h-full ${currentPlan === plan.name ? "border-primary" : ""}`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center">
                <plan.icon className="h-5 w-5 mr-2" />
                {plan.name}
              </div>
              {currentPlan === plan.name && <Badge>Current Plan</Badge>}
            </CardTitle>
            <CardDescription>
              {plan.options[0].price === 0
                ? "Free forever"
                : `$${plan.options.find((o) => o.duration === durationValue)?.price}/${duration}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-2xl font-semibold mb-4">{plan.tokens} tokens</p>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Up to {plan.limits.totalQuestions} total questions</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Max {plan.limits.maxQuestionsPerQuiz} questions per quiz</span>
              </li>
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleSubscribe(plan.name, durationValue)}
                    disabled={isSubscribed || loading === plan.name || plan.name === "FREE"}
                    className="w-full"
                  >
                    {loading === plan.name ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : currentPlan === plan.name && isSubscribed ? (
                      "Current Plan"
                    ) : plan.name === "FREE" ? (
                      "Start for Free"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSubscribed
                    ? "You already have an active subscription. Contact support to change plans."
                    : currentPlan === plan.name && isSubscribed
                    ? "This is your current plan"
                    : plan.name === "FREE"
                    ? "Start using the free plan"
                    : "Click to subscribe to this plan"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function ComparisonTable({ plans }: { plans: typeof SUBSCRIPTION_PLANS }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Compare Plans</h2>
      <div className="overflow-x-auto">
        <Table className="min-w-full border border-gray-200">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-48 font-semibold text-left">Feature</TableHead>
              {plans.map((plan) => (
                <TableHead key={plan.name} className="text-center">
                  {plan.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Tokens</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.tokens}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Total Questions</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.limits.totalQuestions}
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
            <TableRow>
              <TableCell className="font-medium">AI Accuracy</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.features
                    .find((f) => f.includes("AI accuracy"))
                    ?.split("AI accuracy")[0]
                    .trim()}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Video Quiz</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.features.includes("Video Quiz") ? <Check className="mx-auto" /> : "-"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Coding Quiz</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.features.includes("Coding quizzes") ? <Check className="mx-auto" /> : "-"}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

function FAQSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-12"
    >
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-base font-medium">{item.question}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
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

