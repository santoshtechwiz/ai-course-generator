'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from '@/hooks/use-toast'
import { SUBSCRIPTION_PLANS, FAQ_ITEMS, SubscriptionPlanType } from '@/config/subscriptionPlans'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SubscriptionPlansProps {
  userId?: string
  currentPlan: SubscriptionPlanType | null
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | null
  isProd: boolean
}

export default function SubscriptionPlans({ userId, currentPlan, subscriptionStatus, isProd }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const router = useRouter()
  const isSubscribed = currentPlan && subscriptionStatus?.toUpperCase() === 'ACTIVE';

  const handleSubscribe = async (planName: SubscriptionPlanType) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      })
      return
    }

    if (isSubscribed) {
      toast({
        title: "Already Subscribed",
        description: "You are already subscribed to a plan.",
        variant: "default",
      })
      return
    }

    setLoading(planName)
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, planName }),
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
      console.error('Error:', error)
      toast({
        title: "Subscription Error",
        description: "There was an error processing your subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const DevModeBanner = () => (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
      <p className="font-bold">Development Mode</p>
      <p>You are currently in development mode. Stripe payments are in test mode.</p>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {!isProd && <DevModeBanner />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-2">Choose Your Plan</h1>
        <p className="text-center text-muted-foreground mb-8">
          Select the perfect plan to unlock your learning potential.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {SUBSCRIPTION_PLANS.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={`flex flex-col h-full ${currentPlan === plan.name ? 'border-primary' : ''}`}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {plan.options[0].price === 0 ? 'Free forever' : 
                   `$${plan.options[0].price}/${plan.options[0].duration === 1 ? 'month' : '6 months'}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-2xl font-semibold mb-4">{plan.tokens} tokens</p>
                <ul className="space-y-2">
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
                        onClick={() => handleSubscribe(plan.name as SubscriptionPlanType)}
                        disabled={isSubscribed || loading === plan.name}
                        className="w-full"
                      >
                        {loading === plan.name ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : currentPlan === plan.name && isSubscribed ? (
                          'Current Plan'
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isSubscribed
                        ? "You already have an active subscription. Contact support to change plans."
                        : currentPlan === plan.name && isSubscribed
                        ? "This is your current plan"
                        : "Click to subscribe to this plan"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-4">Compare Plans</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Feature</TableHead>
              {SUBSCRIPTION_PLANS.map(plan => (
                <TableHead key={plan.name}>{plan.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Credits</TableCell>
              {SUBSCRIPTION_PLANS.map(plan => (
                <TableCell key={plan.name}>{plan.tokens}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Price</TableCell>
              {SUBSCRIPTION_PLANS.map(plan => (
                <TableCell key={plan.name}>
                  {plan.options[0].price === 0 ? 'Free' : `$${plan.options[0].price}/${plan.options[0].duration === 1 ? 'month' : '6 months'}`}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Validity</TableCell>
              {SUBSCRIPTION_PLANS.map(plan => (
                <TableCell key={plan.name}>{plan.options[0].duration === 1 ? '1 month' : '6 months'}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Support</TableCell>
              {SUBSCRIPTION_PLANS.map(plan => (
                <TableCell key={plan.name}>{plan.features.find(f => f.toLowerCase().includes('support'))?.split(',')[0] || 'N/A'}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </motion.div>

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
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  )
}

async function getStripe() {
  const { loadStripe } = await import('@stripe/stripe-js')
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

