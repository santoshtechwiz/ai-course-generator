"use client"

import { useState, useEffect, useCallback } from "react"
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useAuth } from '@/modules/auth'
import {
  X,
  Sparkles,
  Gift,
  Loader2,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { migratedStorage } from "@/lib/storage"
import { useMediaQuery, useToast } from "@/hooks"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  SubscriptionPlanType,
} from "@/types/subscription-plans"
import {
  SubscriptionStatusType,
} from "@/types/subscription"

interface PricingPageProps {
  userId?: string
  isProd?: boolean
  onUnauthenticatedSubscribe?: (planName: SubscriptionPlanType, duration: number, promoCode?: string, promoDiscount?: number) => void
  onManageSubscription?: () => void
  isMobile?: boolean
}

import FeatureComparison from "./FeatureComparison"
import { SubscriptionPlanType as UNIFIED_SubscriptionPlanType, getPlanConfig, PRICING } from "@/types/subscription-plans"
import DevModeBanner from "./subscription-status/DevModeBanner"
import { buildFeatureList } from "@/utils/subscription-ui-helpers"
import PlanCards from "./subscription-status/PlanCard"
import { useRouter } from "next/navigation"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Check, Zap } from "lucide-react"
import { motion } from "framer-motion"

export function PricingPage({
  userId,
  isProd = false,
  onUnauthenticatedSubscribe,
  onManageSubscription,
  isMobile: propIsMobile,
}: PricingPageProps) {
  const { toast } = useToast()
  const isMobile = propIsMobile || useMediaQuery("(max-width: 768px)")
  
  // Get authentication state from auth module
  const { user, isAuthenticated: authIsAuthenticated } = useAuth()
  const isAuthenticated = authIsAuthenticated && !!user
  const currentUserId = userId || user?.id

  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<1 | 6>(1)
  const [promoCode, setPromoCode] = useState<string>("")
  const [isPromoValid, setIsPromoValid] = useState<boolean>(false)
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false)
  const [showPromotion, setShowPromotion] = useState(true)
  // Removed internal cancellation dialog usage; cancellation handled at higher-level page component
  const router = useRouter();
  
  const { 
    subscription,
    plan,
    hasActiveSubscription, 
    isExpired,
    canUseFeatures,
    needsUpgrade,
    hasCredits
  } = useUnifiedSubscription();
  
  // Inline permissions logic
  const canUsePremiumFeatures = canUseFeatures;
  const needsSubscriptionUpgrade = needsUpgrade;
  const hasAvailableCredits = hasCredits;

  const subscriptionData = subscription;
  // Use plan directly from unified hook (session-authoritative)
  const currentPlan = (plan || "FREE") as SubscriptionPlanType
  const normalizedStatus = (subscriptionData?.status?.toUpperCase() || "INACTIVE").replace("CANCELLED","CANCELED") as SubscriptionStatusType
  
  // Use isSubscribed flag from unified hook
  const isSubscribed = subscriptionData?.isSubscribed || false
  const remainingCredits = Math.max(0, (subscriptionData?.credits || 0) - (subscriptionData?.tokensUsed || 0))
  const hasCreditsAvailable = remainingCredits > 0
  
  // (Debug log removed after verification phase)
  
  const expirationDate = subscriptionData?.expirationDate
    ? new Date(subscriptionData.expirationDate).toLocaleDateString()
    : null
  const cancelAtPeriodEnd = subscriptionData?.cancelAtPeriodEnd ?? false

  const hasAnyPaidPlan = currentPlan !== 'FREE'
  const hasAllPlans = false // Placeholder for potential multi-plan support

  const handleSubscribe = async (planName: SubscriptionPlanType, duration: number) => {
    setLoading(planName)
    setSubscriptionError(null)
    
    try {
      const promoArgs = isPromoValid ? { promoCode, promoDiscount } : {}
      
      // Check authentication status before proceeding
      if (!isAuthenticated || !user) {
        onUnauthenticatedSubscribe?.(planName, duration, promoArgs.promoCode, promoArgs.promoDiscount)
        migratedStorage.setItem("pendingSubscription", { planName, duration, ...promoArgs }, { secure: true })
        // Auth flow handled by parent (login modal) – no forced redirect here
        return
      }

      // Enhanced upgrade flow validation with better UX messaging
      const hadPaidPlanBefore = hasAnyPaidPlan
      const isCurrentPlan = planName === currentPlan
      
      // Improved messaging for current plan subscribers
      if (isCurrentPlan && hasActiveSubscription) {
        const planDisplayNames = {
          'FREE': 'Free Plan',
          'BASIC': 'Basic Plan', 
          'PREMIUM': 'Premium Plan',
          'ENTERPRISE': 'Enterprise Plan'
        }
        
        const currentPlanName = planDisplayNames[currentPlan] || currentPlan
        
        toast({
          title: `You're Already on ${currentPlanName}! 🎉`,
          description: `You already have access to all ${currentPlanName} features. Enjoy your subscription!`,
          duration: 4000,
        })
        return
      }
      
      // Block downgrades with specific messages
      if (planName === 'FREE' && hadPaidPlanBefore) {
        toast({
          title: 'Downgrade Blocked 🚫',
          description: 'You can switch to the free plan only after your current subscription expires. Contact support if you need assistance.',
          variant: 'destructive',
          duration: 6000
        })
        return
      }

      // Block trial if user already used it (handled by backend)
      // Note: 'free_trial' is handled as a special case, not a regular plan type
      
      // Improved plan change restrictions with better UX
      if (hasActiveSubscription && currentPlan !== planName && 
          currentPlan !== 'FREE') {
        const currentPlanName = currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()
        const targetPlanName = planName.charAt(0) + planName.slice(1).toLowerCase()
        
        toast({
          title: `Plan Change Currently Restricted 📋`,
          description: `You're currently on the ${currentPlanName} plan. You can upgrade to ${targetPlanName} plan after your current subscription period ends, or contact support for immediate changes.`,
          variant: 'destructive',
          duration: 6000
        })
        return
      }

      if (planName === currentPlan && hasActiveSubscription) {
        toast({
          title: 'Already Active',
          description: 'This plan is already active for your account.',
          variant: 'default'
        })
        return
      }

      // Call subscription API directly
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: planName, duration, ...promoArgs })
      });
      const result = await response.json();
      
      // Handle Stripe checkout redirect for paid plans
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      
      // Handle redirects directly if not handled by callback
      if (result?.redirectUrl) {
        router.push(result.redirectUrl);
        return;
      }
      
      if (result?.success) {
        // Enhanced success messages based on plan type
        let successTitle = "Success!"
        let successDescription = result.message || "Plan updated successfully."
        
        // Handle trial activation (if planName is 'free_trial', it's a special API call)
        if (planName === 'FREE') {
          successTitle = "Free Plan Activated!"
          successDescription = "You're now on the free plan."
        } else {
          successTitle = "Subscription Upgraded!"
          successDescription = `You've successfully upgraded to the ${planName} plan.`
        }
        
        toast({
          title: successTitle,
          description: successDescription,
          variant: "default",
        });
        return;
      }
      if (!result.success) {
        // Enhanced error messages with trial-specific handling
        let errorTitle = "Subscription Failed"
        let errorDescription = result.message

        if (result.error === "TRIAL_ALREADY_USED") {
          errorTitle = "Trial Not Available"
          errorDescription = "You have already used your free trial. Please choose a paid plan to continue."
        } else if (result.error === "TRIAL_ACTIVATION_FAILED") {
          errorTitle = "Trial Activation Failed"
          errorDescription = "Unable to activate your free trial. Please try again or contact support."
        } else if (result.error === "DOWNGRADE_BLOCKED") {
          errorTitle = "Downgrade Not Allowed"
          errorDescription = result.message || "Downgrades are not permitted. Please wait for your current subscription to expire."
        } else if (result.error === "SUBSCRIPTION_IN_PROGRESS") {
          errorTitle = "Subscription In Progress"
          errorDescription = "You already have a subscription request being processed. Please wait a few minutes before trying again."
        } else if (result.error === "PLAN_CHANGE_RESTRICTED") {
          errorTitle = "Plan Change Not Allowed"
          errorDescription = "You cannot change your subscription until your current plan expires."
        } else if (result.error === "ALREADY_SUBSCRIBED") {
          errorTitle = "Already Subscribed"
          errorDescription = "You already have an active subscription. Manage it from your account settings."
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        })
        setSubscriptionError(errorDescription)
      }
    } catch (error: any) {
      const message = error?.message || "Unexpected error."
      setSubscriptionError(message)
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const validatePromoCode = useCallback(async (code: string): Promise<boolean> => {
    if (!code) {
      toast({ title: "Missing Code", description: "Enter a promo code.", variant: "destructive" })
      return false
    }
    
    if (code.toUpperCase() === "AILAUNCH20") {
      setPromoDiscount(20)
      setIsPromoValid(true)
      toast({ title: "Promo Applied", description: "20% discount activated.", variant: "default" })
      return true
    }
    
    toast({ title: "Invalid Code", description: "Promo code is not valid.", variant: "destructive" })
    return false
  }, [toast])

  const handleApplyPromoCode = useCallback(async () => {
    setIsApplyingPromo(true)
    const valid = await validatePromoCode(promoCode)
    if (!valid) {
      setPromoDiscount(0)
      setIsPromoValid(false)
    }
    setIsApplyingPromo(false)
  }, [promoCode, validatePromoCode])

  const getDiscountedPrice = useCallback(
    (price: number) => (isPromoValid ? +(price * (1 - promoDiscount / 100)).toFixed(2) : price),
    [isPromoValid, promoDiscount],
  );

  // Removed legacy per-component subscription fetch; AuthProvider handles sync
  useEffect(() => {}, [])
    
  const daysUntilExpiration = subscriptionData?.expirationDate
    ? Math.ceil((new Date(subscriptionData.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const planOrder: SubscriptionPlanType[] = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  // Convert plans to array format - show ALL plans regardless of current subscription
  const availablePlans = planOrder
    .map(planId => {
      const config = getPlanConfig(planId)
      const yearlyPrice = config.price * 12
      
      // Build features list using helper (replaces 15+ lines of manual building)
      const features = buildFeatureList(config) as string[]
      
      return {
        id: planId,
        name: config.name,
        description: `${config.name} Plan - ${config.popular ? 'Most Popular!' : 'Get started'}`,
        monthlyPrice: config.price,
        yearlyPrice: yearlyPrice,
        features,
        limitations: [],
        tokens: config.monthlyCredits,
        limits: { maxQuestionsPerQuiz: config.maxQuestionsPerQuiz },
        options: [
          { duration: 1, price: config.price },
          { duration: 6, price: yearlyPrice / 2 }
        ]
      }
    });
    // Removed: .filter((_, index) => index >= currentPlanIndex) 
    // This filter was hiding Free Plan from paid users - all plans should be visible

  return (
    <div className="container max-w-6xl space-y-10 px-4 sm:px-6 animate-in fade-in duration-500">
      {!isProd && <DevModeBanner />}
      
      {subscriptionError && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Error</AlertTitle>
          <AlertDescription>{subscriptionError}</AlertDescription>
        </Alert>
      )}

      {showPromotion && (
        <div className="relative bg-card border-6 border-border shadow-neo neo-hover-lift p-6 rounded-none">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-7 w-7"
            onClick={() => setShowPromotion(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-14 w-14 rounded-none bg-primary border-4 border-border flex items-center justify-center shadow-neo">
              <Sparkles className="text-background h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl text-foreground uppercase tracking-wider">Limited Time Offer</h3>
              <p className="text-muted-foreground font-bold">
                Use <span className="bg-muted text-foreground px-2 py-0.5 rounded-none font-mono font-black border-2 border-border shadow-neo">AILAUNCH20</span> for 20% off
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Input
                  value={promoCode}
                  placeholder="Enter promo code"
                  aria-label="Promo code"
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="border-4 border-border shadow-neo rounded-none"
                />
                <Button
                  onClick={handleApplyPromoCode}
                  disabled={isPromoValid || isApplyingPromo || promoCode.trim() === ""}
                  aria-disabled={isPromoValid || isApplyingPromo || promoCode.trim() === ""}
                  aria-label={isPromoValid ? "Promo applied" : "Apply promo code"}
                  className="bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-primary)]/90 hover:scale-105 hover:shadow-lg transition-all duration-200 font-black border-4 shadow-neo neo-hover-lift"
                >
                  {isApplyingPromo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                  {isPromoValid ? "Applied" : "Apply"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Promo codes apply at checkout. Enter code and click Apply — valid codes will show as "Applied" and adjust pricing.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <motion.h2
          className="text-4xl sm:text-5xl font-black text-foreground leading-tight uppercase tracking-wider"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Choose Your Plan
        </motion.h2>
        <motion.p
          className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Unlock unlimited potential with AI-powered educational tools. Get more tokens, advanced features, and priority support.
        </motion.p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Label htmlFor="billing-toggle">Monthly</Label>
        <Switch
          id="billing-toggle"
          checked={selectedDuration === 6}
          onCheckedChange={(v) => setSelectedDuration(v ? 6 : 1)}
        />
        <Label htmlFor="billing-toggle">
          6 Months{" "}
          <Badge variant="outline">
            Save 17%
          </Badge>
        </Label>
      </div>

      {isMobile ? (
        <div className="space-y-6">
          {availablePlans.map((plan) => {
            const option = plan.options.find((o: any) => o.duration === selectedDuration)!
            const price = getDiscountedPrice(option.price)
            const planConfig = getPlanConfig(plan.id as SubscriptionPlanType)
            return (
              <div key={plan.id} className="p-4 border rounded-xl neo-shadow">
                <h3 className="font-semibold text-lg">{planConfig.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="text-2xl font-bold mt-2">${price}</div>
                <ul className="text-xs mt-3 space-y-1">
                  {plan.features.slice(0, 3).map((benefit: string, i: number) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-green-500">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  onClick={() => handleSubscribe(plan.id as SubscriptionPlanType, selectedDuration)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? <Loader2 className="mr-2 h-4 w-4" /> : null}
                  {plan.id === currentPlan ? "Current Plan" : "Subscribe"}
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <PlanCards
          plans={availablePlans}
          currentPlan={currentPlan}
          subscriptionStatus={normalizedStatus}
          loading={loading}
          handleSubscribe={handleSubscribe}
          duration={selectedDuration}
          isSubscribed={isSubscribed}
          promoCode={promoCode}
          isPromoValid={isPromoValid}
          promoDiscount={promoDiscount}
          getDiscountedPrice={getDiscountedPrice}
          isPlanAvailable={(p) => {
            // Always allow subscription for expired, canceled, or free users
            if (isExpired || normalizedStatus === "CANCELED" || currentPlan === "FREE") {
              return true;
            }
            
            // Use the enhanced logic for other cases
            return !hasActiveSubscription;
          }}
          getPlanUnavailableReason={(p) => {
            if (isExpired) {
              return undefined; // No restriction for expired users
            }
            if (normalizedStatus === "CANCELED") {
              return undefined; // No restriction for canceled users
            }
            
            const reason = hasActiveSubscription ? "You already have an active subscription" : "";
            return reason || undefined;
          }}
          expirationDate={expirationDate}
          isAuthenticated={isAuthenticated}
          hasAnyPaidPlan={hasAnyPaidPlan}
          hasAllPlans={hasAllPlans}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          userId={userId}
          hadPreviousPaidPlan={false}
        />
      )}

      <motion.div
        className="mt-12 p-8 bg-card border-6 border-border shadow-neo neo-hover-lift rounded-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="md:w-1/4 flex justify-center">
            <div className="bg-primary p-6 rounded-none border-4 border-border shadow-neo neo-hover-lift transform hover:scale-105 transition-transform duration-300">
              <Zap className="h-12 w-12 text-background" />
            </div>
          </div>
          <div className="md:w-3/4 text-left">
            <h3 className="text-2xl font-black mb-4 text-foreground uppercase tracking-wider">
              Understanding Token Usage
            </h3>
            <p className="text-muted-foreground mb-4 font-bold">
              Tokens are used to generate quizzes and access various features on our platform. Each quiz you generate
              consumes a certain number of tokens based on the complexity and type of questions.
            </p>
            <p className="text-muted-foreground mb-4 font-bold">
              Tokens are used to generate quizzes and access various features on our platform. Each quiz you generate
              consumes a certain number of tokens based on the complexity and type of questions.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-success mr-2 mt-0.5" />
                <span className="font-bold">Generating multiple-choice quizzes consumes fewer tokens</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-success mr-2 mt-0.5" />
                <span className="font-bold">Creating open-ended or code-based quizzes may require more tokens</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-success mr-2 mt-0.5" />
                <span className="font-bold">Downloading quizzes in PDF format also consumes tokens</span>
              </li>
            </ul>
            <p className="text-muted-foreground font-bold">
              You can purchase additional tokens at any time to continue using our services.
            </p>
          </div>
        </div>
      </motion.div>

      <FeatureComparison />

      {/* FAQ Section - Inline */}
      <div className="mt-12">
        <h2 className="text-2xl font-black mb-6 text-center text-foreground uppercase tracking-wider">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-0" className="border-4 border-border shadow-neo neo-hover-lift rounded-none overflow-hidden">
            <AccordionTrigger className="text-left text-base font-bold px-4 py-4 hover:bg-muted transition-all duration-300 uppercase tracking-wider">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground px-4 pb-4 pt-2 bg-muted/50 font-bold">
              We accept all major credit cards (Visa, MasterCard, American Express) and PayPal for your convenience.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-1" className="border-4 border-border shadow-neo neo-hover-lift rounded-none overflow-hidden">
            <AccordionTrigger className="text-left text-base font-bold px-4 py-4 hover:bg-muted transition-all duration-300 uppercase tracking-wider">
              Can I cancel my subscription at any time?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground px-4 pb-4 pt-2 bg-muted/50 font-bold">
              Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-4 border-border shadow-neo neo-hover-lift rounded-none overflow-hidden">
            <AccordionTrigger className="text-left text-base font-bold px-4 py-4 hover:bg-muted transition-all duration-300 uppercase tracking-wider">
              What happens to my data if I cancel?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground px-4 pb-4 pt-2 bg-muted/50 font-bold">
              Your data remains accessible for 30 days after cancellation. After that, it will be permanently deleted.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border-4 border-border shadow-neo neo-hover-lift rounded-none overflow-hidden">
            <AccordionTrigger className="text-left text-base font-bold px-4 py-4 hover:bg-muted transition-all duration-300 uppercase tracking-wider">
              Do you offer refunds?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground px-4 pb-4 pt-2 bg-muted/50 font-bold">
              We offer a 14-day money-back guarantee on all paid plans. Contact support for a full refund within this period.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4" className="border-4 border-border shadow-neo neo-hover-lift rounded-none overflow-hidden">
            <AccordionTrigger className="text-left text-base font-bold px-4 py-4 hover:bg-muted transition-all duration-300 uppercase tracking-wider">
              Can I upgrade or downgrade my plan?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground px-4 pb-4 pt-2 bg-muted/50 font-bold">
              Yes, you can upgrade at any time. Downgrades take effect at the end of your current billing period.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/contact")}
            className="border-4 border-border shadow-neo neo-hover-lift font-black uppercase tracking-wider"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}

PricingPage.displayName = "PricingPage"