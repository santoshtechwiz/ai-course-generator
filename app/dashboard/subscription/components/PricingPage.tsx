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
  SubscriptionStatusType,
} from "@/types/subscription"

interface PricingPageProps {
  userId?: string
  isProd?: boolean
  onUnauthenticatedSubscribe?: (planName: SubscriptionPlanType, duration: number, promoCode?: string, promoDiscount?: number) => void
  onManageSubscription?: () => void
  isMobile?: boolean
}
import { calculateSavings } from "@/types/subscription/utils"
import FeatureComparison from "./FeatureComparison"
import { SUBSCRIPTION_PLANS } from "./subscription-plans"
import DevModeBanner from "./subscription-status/DevModeBanner"
import FAQSection from "./subscription-status/FaqSection"
import PlanCards from "./subscription-status/PlanCard"
import TokenUsageExplanation from "./subscription-status/TokenUsageExplanation"
import { useRouter } from "next/navigation"

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
    console.log('[PricingPage] handleSubscribe called:', {
      planName,
      duration,
      isAuthenticated,
      userId: currentUserId,
      hasUser: !!user
    })
    
    setLoading(planName)
    setSubscriptionError(null)
    
    try {
      const promoArgs = isPromoValid ? { promoCode, promoDiscount } : {}
      
      // Check authentication status before proceeding
      if (!isAuthenticated || !user) {
        console.log('[PricingPage] User not authenticated, calling onUnauthenticatedSubscribe')
        onUnauthenticatedSubscribe?.(planName, duration, promoArgs.promoCode, promoArgs.promoDiscount)
        migratedStorage.setItem("pendingSubscription", { planName, duration, ...promoArgs }, { secure: true })
        // Auth flow handled by parent (login modal) – no forced redirect here
        return
      }
      
      console.log('[PricingPage] User authenticated, proceeding with subscription')

      // Enhanced upgrade flow validation with better UX messaging
      const hadPaidPlanBefore = hasAnyPaidPlan
      const isCurrentPlan = planName === currentPlan
      
      // Improved messaging for current plan subscribers
      if (isCurrentPlan && hasActiveSubscription) {
        const planDisplayNames = {
          'FREE': 'Free Plan',
          'BASIC': 'Basic Plan', 
          'PREMIUM': 'Premium Plan',
          'ULTIMATE': 'Ultimate Plan',
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

  const planOrder = ["FREE", "BASIC", "PREMIUM", "ULTIMATE"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  const availablePlans = SUBSCRIPTION_PLANS.filter((plan) => {
    const planIndex = planOrder.indexOf(plan.id as SubscriptionPlanType);
    return planIndex >= currentPlanIndex;
  });

  return (
    <div className="container max-w-6xl space-y-10 px-4 sm:px-6 animate-in fade-in duration-500">
      {!isProd && <DevModeBanner />}
      
      {subscriptionError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Error</AlertTitle>
          <AlertDescription>{subscriptionError}</AlertDescription>
        </Alert>
      )}

      {showPromotion && (
        <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-7 w-7"
            onClick={() => setShowPromotion(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center">
              <Sparkles className="text-white h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Limited Time Offer</h3>
              <p className="text-muted-foreground">
                Use <span className="bg-muted px-2 py-0.5 rounded font-mono font-bold">AILAUNCH20</span> for 20% off
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Input
                  value={promoCode}
                  placeholder="Enter promo code"
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button onClick={handleApplyPromoCode} disabled={isPromoValid || isApplyingPromo}>
                  {isApplyingPromo ? <Loader2 className="h-4 w-4 mr-2" /> : <Gift className="mr-2" />}
                  {isPromoValid ? "Applied" : "Apply"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground mt-2">
          Get more tokens, features, and support by upgrading to a paid plan.
        </p>
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
            Save{" "}
            {calculateSavings(
              SUBSCRIPTION_PLANS[2].options[0].price,
              SUBSCRIPTION_PLANS[2].options[1].price,
              12,
            )}
            %
          </Badge>
        </Label>
      </div>

      {isMobile ? (
        <div className="space-y-6">
          {availablePlans.map((plan) => {
            const option = plan.options.find((o: any) => o.duration === selectedDuration)!
            const price = getDiscountedPrice(option.price)
            return (
              <div key={plan.id} className="p-4 border rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="text-2xl font-bold mt-2">${price}</div>
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
          plans={SUBSCRIPTION_PLANS}
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

      <TokenUsageExplanation />
      <FeatureComparison />
      <FAQSection />
    </div>
  )
}

PricingPage.displayName = "PricingPage"