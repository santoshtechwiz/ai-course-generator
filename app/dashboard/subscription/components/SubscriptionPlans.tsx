"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { motion } from "framer-motion"
import { Check, Lock, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  type SubscriptionPlanType,
  type SubscriptionStatusType,
  SUBSCRIPTION_PLANS,
  FAQ_ITEMS,
} from "@/config/subscriptionPlans"
import { staggerChildren, scaleIn, fadeIn } from "@/lib/animation"
import { Separator } from "@radix-ui/react-separator"


const planColors = {
  FREE: "bg-secondary hover:bg-secondary/90",
  BASIC: "bg-blue-500 hover:bg-blue-600",
  PRO: "bg-green-500 hover:bg-green-600",
  ENTERPRISE: "bg-purple-500 hover:bg-purple-600",
}

interface SubscriptionPlansProps {
  userId: string | null
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  isProd: boolean
}

export default function SubscriptionPlans({ userId, currentPlan, subscriptionStatus, isProd }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<1 | 6>(1)
  const { toast } = useToast()

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
      // Simulated API call
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
        description: error.message || "There was an error processing your subscription. Please try again.",
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

      <Tabs
        defaultValue="monthly"
        className="w-full"
        onValueChange={(value) => setSelectedDuration(value === "monthly" ? 1 : 6)}
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
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
            duration={1}
          />
        </TabsContent>
        <TabsContent value="biannual">
          <PlanCards
            plans={SUBSCRIPTION_PLANS}
            currentPlan={currentPlan}
            subscriptionStatus={subscriptionStatus}
            loading={loading}
            handleSubscribe={handleSubscribe}
            duration={6}
          />
        </TabsContent>
      </Tabs>

      <TokenUsageExplanation />
      <ComparisonTable plans={SUBSCRIPTION_PLANS} />
      <FAQSection />
    </div>
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
  plans: typeof SUBSCRIPTION_PLANS
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: SubscriptionStatusType | null
  loading: SubscriptionPlanType | null
  handleSubscribe: (planName: SubscriptionPlanType, duration: number) => Promise<void>
  duration: 1 | 6
}) {
  const isSubscribed = currentPlan && subscriptionStatus?.toUpperCase() === "ACTIVE"

  return (
    <AnimatePresence>
      <motion.div
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        exit="exit"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
      >
        {plans.map((plan) => (
          <motion.div key={plan.name} variants={scaleIn}>
            <Card className={`flex flex-col h-full ${currentPlan === plan.name ? "border-2 border-primary" : ""}`}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center">
                    <plan.icon className="h-5 w-5 mr-2" />
                    {plan.name}
                  </div>
                  {currentPlan === plan.name && <Badge variant="secondary">Current Plan</Badge>}
                </CardTitle>
                <CardDescription>
                  {plan.options[0].price === 0
                    ? "Free forever"
                    : `$${plan.options.find((o) => o.duration === duration)?.price}/${duration === 1 ? "month" : "6 months"}`}
                <Separator orientation="horizontal" className="my-2" />
                <p className="text-sm text-muted-foreground">{plan.tokens} tokens can be used for quizzes and courses</p>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <p className="text-2xl font-semibold">{plan.tokens} tokens</p>
                  <Progress value={(plan.tokens / 500) * 100} className="h-2 mt-2" />
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Max {plan.limits.maxQuestionsPerQuiz} questions per quiz</span>
                  </li>
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.available ? (
                        <Check className="h-5 w-5 text-primary mr-2" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground mr-2" />
                      )}
                      <span className={feature.available ? "" : "text-muted-foreground"}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          onClick={() => handleSubscribe(plan.name as SubscriptionPlanType, duration)}
                          disabled={(isSubscribed && currentPlan === plan.name) || plan.name === currentPlan}
                          className={`w-full text-primary-foreground ${planColors[plan.name as SubscriptionPlanType]}`}
                        >
                          {loading === plan.name ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : currentPlan === plan.name ? (
                            "Current Plan"
                          ) : plan.name === "FREE" ? (
                            "Start for Free"
                          ) : (
                            "Subscribe"
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
                          : "Click to subscribe to this plan"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}

function TokenUsageExplanation() {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
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

function ComparisonTable({ plans }: { plans: typeof SUBSCRIPTION_PLANS }) {
  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
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
            <TableRow>
              <TableCell className="font-medium">AI Accuracy</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className="text-center">
                  {plan.features
                    .find((f) => f.name.includes("AI accuracy"))
                    ?.name.split("AI accuracy")[0]
                    .trim()}
                </TableCell>
              ))}
            </TableRow>
            {["PDF downloads", "Video transcripts", "Video Quiz", "Code Quiz", "Priority support"].map((feature) => (
              <TableRow key={feature}>
                <TableCell className="font-medium">{feature}</TableCell>
                {plans.map((plan) => (
                  <TableCell key={plan.name} className="text-center">
                    {plan.features.find((f) => f.name === feature)?.available ? <Check className="mx-auto" /> : "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

function FAQSection() {
  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="mt-12">
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

export { SUBSCRIPTION_PLANS, FAQ_ITEMS }
export type { SubscriptionPlanType, SubscriptionStatusType }

