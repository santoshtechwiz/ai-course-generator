"use client"

import { useEffect, useState, useCallback, Suspense, lazy } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReferralBanner } from "@/components/ReferralBanner"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { useAuth } from "@/modules/auth"
import { progressApi } from "@/components/loaders/progress-api"
import { migratedStorage } from "@/lib/storage"

import { LoginModal } from "@/app/auth/signin/components/LoginModal"
import type { SubscriptionPlanType } from '@/types/subscription'

import { CancellationDialog } from "./cancellation-dialog"
import { useMediaQuery } from "@/hooks"
import SubscriptionSkeleton from "./SubscriptionSkeleton"


// Lazy load components
const PricingPage = lazy(() => import("./PricingPage").then((mod) => ({ default: 
  mod.PricingPage })))
const StripeSecureCheckout = lazy(() =>
  import("./StripeSecureCheckout").then((mod) => ({ default: mod.StripeSecureCheckout })),
)

export default function SubscriptionPageClient({ refCode }: { refCode: string | null }) {
  const [showReferralBanner, setShowReferralBanner] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingSubscriptionData, setPendingSubscriptionData] = useState<any>(null)
  const [referralCode, setReferralCode] = useState<string | null>(refCode)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  // Fallback for infinite loading
  const [timedOut, setTimedOut] = useState(false)

  // Use the unified subscription hook
  const subscriptionState = useUnifiedSubscription()
  const subscription = subscriptionState.subscription
  const { forceRefresh, isLoading } = subscriptionState
  
  // Get authentication state from auth module
  const { user, isAuthenticated: authIsAuthenticated } = useAuth()
  const userId = user?.id
  const isAuthenticated = authIsAuthenticated && !!user
  
  // ✅ No manual refresh needed - single source of truth!
  // Session is already loaded by SessionProvider
  // SubscriptionProvider automatically syncs session → Redux
  // Components just consume the data via useAuth()
  
  const error = undefined

  // Silent error handling - errors handled by unified subscription hook
  useEffect(() => {
    // Error state monitored internally, no console logging needed
  }, [error])

  const isProd = process.env.NODE_ENV === "production"
  // userId removed (unified hook does not expose it); keep variable for existing logic
  // const userId = null
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Derived subscription state
  const isSubscribed = subscription?.isSubscribed || false
  const isCancelled = subscription?.cancelAtPeriodEnd || false
  const subscriptionPlan = subscriptionState.plan || 'FREE'
  
  // Check if subscription is expired
  const isExpired = subscriptionState.isExpired
  
  // Check if user had a paid plan before
  const hadPaidPlan = subscription?.subscriptionPlan !== 'FREE' && (isExpired || isCancelled)

  // Scroll to plans section for resubscription
  const handleResubscribe = useCallback(() => {
    const plansSection = document.getElementById('subscription-plans')
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Extract referral code from URL parameters
  useEffect(() => {
    const refCode = searchParams?.get("ref")
    if (refCode) {
      setReferralCode(refCode)
      migratedStorage.setItem("referralCode", refCode)
    } else {
      const storedRefCode = migratedStorage.getItem<string>("referralCode")
      if (storedRefCode && typeof storedRefCode === "string") {
        setReferralCode(storedRefCode)
      }
    }
  }, [searchParams])
  
  // Check for pending subscription data in storage
  useEffect(() => {
    try {
      const pendingData = migratedStorage.getItem("pendingSubscription", { secure: true })
      if (pendingData && typeof pendingData === "object") {
        setPendingSubscriptionData(pendingData)
      }
    } catch (error) {
      // Silent failure - invalid pending subscription data will be ignored
    }
  }, [])

  // Note: Subscription data is now automatically synced via GlobalSubscriptionSynchronizer
  // No need for manual fetchSubscription calls
  // Handle subscription button click for unauthenticated users
  const handleUnauthenticatedSubscribe = useCallback(
    (planName: SubscriptionPlanType, duration: number, promoCode?: string, promoDiscount?: number) => {
      // Only show login modal if user is definitely not authenticated
      if (!isAuthenticated && !isLoading) {
        const subscriptionData = {
          planName,
          duration,
          promoCode,
          promoDiscount,
          referralCode,
        }
        setPendingSubscriptionData(subscriptionData)
        setShowLoginModal(true)
      }
      // Silent handling for authenticated users - no action needed
    },
    [referralCode, isLoading, isAuthenticated, userId],
  )

  const handleManageSubscription = useCallback(() => {
    if (isCancelled) {
      // If subscription is already cancelled, redirect to account page
      router.push("/dashboard/account")
    } else {
      // Otherwise show cancellation dialog
      setShowCancellationDialog(true)
    }
  }, [isCancelled, router])

  // Timeout fallback: if loading takes too long, show error
  useEffect(() => {
    if (isLoading && !timedOut) {
      const timeout = setTimeout(() => {
        setTimedOut(true)
      }, 10000) // 10 seconds
      return () => clearTimeout(timeout)
    }
    if (!isLoading && timedOut) {
      setTimedOut(false)
    }
  }, [isLoading, timedOut])

  const renderContent = () => {
    // Show skeleton during initial loading
  if ((isLoading && !subscription) && !timedOut) {
      return <SubscriptionSkeleton />
    }
    // Show error if loading timed out
    if (timedOut) {
      return (
        <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-5 duration-300">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Subscription service unavailable</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>We couldn't load your subscription data. Please try again later or contact support.</p>
            <p className="text-sm text-muted-foreground">
              This may be a temporary issue. If the problem persists, please refresh the page.
            </p>
          </AlertDescription>
        </Alert>
      )
    }
    // Show error if subscription fetch failed
    if (error) {
      return (
        <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-5 duration-300">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error loading subscription data</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{typeof error === 'string' ? error : 'Failed to load subscription data.'}</p>
            <p className="text-sm text-muted-foreground">
              Please try again or contact support if this persists.
            </p>
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-8">        {error && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-5 duration-300">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error loading subscription data</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{error}</p>
              <p className="text-sm text-muted-foreground">
                Subscription data will sync automatically when available.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {referralCode && showReferralBanner && (
          <ReferralBanner referralCode={referralCode} onDismiss={() => setShowReferralBanner(false)} />
        )}

  {pendingSubscriptionData && (
          <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-5 duration-300">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle>Pending Subscription</AlertTitle>
            <AlertDescription>
              You have a pending subscription to the {pendingSubscriptionData.planName} plan. It will be processed
              automatically.
            </AlertDescription>
          </Alert>
        )}

  {isAuthenticated && (
          <Alert className="mb-6 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-5 duration-300">
            <Info className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <AlertTitle>Manage Your Subscription</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <p>You can view and manage your current subscription details in your account page.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/account")}
                className="sm:ml-auto"
              >
                Go to Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

  <Suspense fallback={<div className="text-sm text-muted-foreground">Loading subscription plans...</div>}>
          <div id="subscription-plans">
            <PricingPage
              userId={userId}
              isProd={isProd}
              onUnauthenticatedSubscribe={handleUnauthenticatedSubscribe}
              onManageSubscription={handleManageSubscription}
              isMobile={isMobile}
            />
          </div>
        </Suspense>

        <div className="max-w-md mx-auto">
          <Suspense fallback={<div className="text-sm text-muted-foreground">Preparing checkout...</div>}>
            <StripeSecureCheckout />
          </Suspense>
        </div>
      </div>
    )
  }
  return (
    <>

      {/* Only show login modal if user is definitely unauthenticated */}
  {!isAuthenticated && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          callbackUrl="/dashboard/subscription"
          subscriptionData={pendingSubscriptionData}
        />
      )}

      {renderContent()}

  {!subscription && isAuthenticated && userId && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-full shadow-lg px-3 py-2 text-xs text-muted-foreground">
          Loading your data...
        </div>
      )}

      <CancellationDialog
        isOpen={showCancellationDialog}
        onClose={() => setShowCancellationDialog(false)}
        onConfirm={async (reason) => {
          // Handle cancellation logic
          setShowCancellationDialog(false)
          return Promise.resolve()
        }}
  expirationDate={subscription?.expirationDate || null}
        planName={subscription?.subscriptionPlan || ""}
      />
   </>
  )
}
