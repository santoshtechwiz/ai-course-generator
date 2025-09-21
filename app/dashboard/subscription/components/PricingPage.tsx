"use client"

import { useState, useEffect, useCallback } from "react"
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
import { useSubscription, useSubscriptionPermissions } from "@/modules/auth"
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
import { calculateSavings } from "../utils/subscription-utils"
import { CancellationDialog } from "./cancellation-dialog"
import FeatureComparison from "./FeatureComparison"
import { SUBSCRIPTION_PLANS } from "./subscription-plans"
import DevModeBanner from "./subscription-status/DevModeBanner"
import FAQSection from "./subscription-status/FaqSection"
import PlanCards from "./subscription-status/PlanCard"
import TokenUsageExplanation from "./subscription-status/TokenUsageExplanation"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import { selectSubscriptionData, fetchSubscription, selectHadPreviousPaidPlan } from "@/store/slices/subscription-slice"

export function PricingPage({
  userId,
  isProd = false,
  onUnauthenticatedSubscribe,
  onManageSubscription,
  isMobile: propIsMobile,
}: PricingPageProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const isMobile = propIsMobile || useMediaQuery("(max-width: 768px)")
  const isAuthenticated = !!userId

  const [loading, setLoading] = useState<SubscriptionPlanType | null>(null)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<1 | 6>(1)
  const [promoCode, setPromoCode] = useState<string>("")
  const [isPromoValid, setIsPromoValid] = useState<boolean>(false)
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false)
  const [showPromotion, setShowPromotion] = useState(true)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const router = useRouter();
  
  const { subscription, hasActiveSubscription, isExpired } = useSubscription();
  const { 
    canUsePremiumFeatures,
    needsSubscriptionUpgrade,
    hasAvailableCredits,
  } = useSubscriptionPermissions();

  const subscriptionData = subscription;
  const currentPlan = subscriptionData?.plan || "FREE"
  const normalizedStatus = subscriptionData?.status?.toUpperCase() as SubscriptionStatusType || "INACTIVE"
  const isSubscribed = currentPlan !== "FREE" && normalizedStatus === "ACTIVE"
  const expirationDate = subscriptionData?.currentPeriodEnd
    ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()
    : null
  const cancelAtPeriodEnd = subscriptionData?.cancelAtPeriodEnd ?? false
  const tokensUsed = subscriptionData?.tokensUsed ?? 0
  const credits = subscriptionData?.credits ?? 0

  const hasAnyPaidPlan = !subscriptionData?.isFree
  const hasAllPlans = false // This seems unused, setting to false

  const handleSubscribe = async (planName: SubscriptionPlanType, duration: number) => {
    setLoading(planName)
    setSubscriptionError(null)
    
    try {
      const promoArgs = isPromoValid ? { promoCode, promoDiscount } : {}
      
      if (!isAuthenticated) {
        onUnauthenticatedSubscribe?.(planName, duration, promoArgs.promoCode, promoArgs.promoDiscount)
        migratedStorage.setItem("pendingSubscription", { planName, duration, ...promoArgs }, { secure: true })
          // Removed sign in message toast
        
        window.location.href = "/api/auth/signin"
        return
      }

      // Simple subscription validation - user can subscribe if they don't have active subscription
      const canSubscribe = !hasActiveSubscription || currentPlan === "FREE"
      const reason = canSubscribe ? '' : 'You already have an active subscription'
      
      if (!canSubscribe) {
        toast({
          title: "Plan Not Available",
          description: reason || "You cannot subscribe to this plan right now.",
          variant: "destructive",
        })
        return
      }

      // Call subscription API directly
      const response = await fetch('/api/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, duration, ...promoArgs })
      });
      const result = await response.json();
      
      // Handle redirects directly if not handled by callback
      if (result?.redirectUrl) {
        router.push(result.redirectUrl);
        return;
      }
      
      if (result?.success) {
        toast({
          title: "You're Subscribed!",
          description: result.message || "Plan updated successfully.",
          variant: "default",
        });
        return;
      }      if (!result.success) {
        // Show user-friendly error messages based on error type
        let errorTitle = "Subscription Failed"
        let errorDescription = result.message

        if (result.error === "SUBSCRIPTION_IN_PROGRESS") {
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

  useEffect(() => {
    // Removed: subscription fetching is now handled globally by AuthProvider
    // if (isAuthenticated && !subscriptionData) {
    //   dispatch(fetchSubscription())
    // }
  }, [isAuthenticated, subscriptionData, dispatch]);
    
  const daysUntilExpiration = expirationDate
    ? Math.ceil((new Date(subscriptionData!.currentPeriodEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

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
          {SUBSCRIPTION_PLANS.map((plan) => {
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
            if (isExpired || normalizedStatus === "CANCELLED" || currentPlan === "FREE") {
              return true;
            }
            
            // Use the enhanced logic for other cases
            return !hasActiveSubscription;
          }}
          getPlanUnavailableReason={(p) => {
            if (isExpired) {
              return undefined; // No restriction for expired users
            }
            if (normalizedStatus === "CANCELLED") {
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
      <FAQSection />      <CancellationDialog
        isOpen={showCancellationDialog}
        onClose={() => setShowCancellationDialog(false)}
        onConfirm={async (reason: string) => {
          // Handle cancellation logic here
          try {
            // Call your cancellation API
            console.log('Cancelling subscription with reason:', reason)
            dispatch(fetchSubscription())
            setShowCancellationDialog(false)
          } catch (error) {
            console.error('Failed to cancel subscription:', error)
          }
        }}
        expirationDate={subscriptionData?.currentPeriodEnd || null}
        planName={subscriptionData?.plan || 'FREE'}
      />
    </div>
  )
}

PricingPage.displayName = "PricingPage"