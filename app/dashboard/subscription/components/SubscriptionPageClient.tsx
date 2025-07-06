"use client"

import { useEffect, useState, useCallback, Suspense, lazy } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Info, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReferralBanner } from "@/components/ReferralBanner"
import { useSubscription } from "@/modules/auth"

import { SubscriptionSkeleton } from "@/components/ui/SkeletonLoader"

import { LoginModal } from "@/app/auth/signin/components/LoginModal"

import { CancellationDialog } from "./cancellation-dialog"
import { useMediaQuery } from "@/hooks"
import TrialModal from "@/components/features/subscription/TrialModal"
import { SubscriptionPlanType } from "@/app/types/subscription"


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

  // Use the unified subscription hook
  const { subscription, isLoading, error, isAuthenticated, user } = useSubscription()
  
  const isProd = process.env.NODE_ENV === "production"
  const userId = user?.id ?? null
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Derived subscription state
  const isSubscribed = subscription?.isSubscribed || false
  const isCancelled = subscription?.cancelAtPeriodEnd || false
  const subscriptionPlan = subscription?.plan || 'FREE'

  // Extract referral code from URL parameters
  useEffect(() => {
    const refCode = searchParams?.get("ref")
    if (refCode) {
      setReferralCode(refCode)
      if (typeof window !== "undefined") {
        localStorage.setItem("referralCode", refCode)
      }
    } else if (typeof window !== "undefined") {
      const storedRefCode = localStorage.getItem("referralCode")
      if (storedRefCode) {
        setReferralCode(storedRefCode)
      }
    }
  }, [searchParams])
  // Check for pending subscription data in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const pendingData = localStorage.getItem("pendingSubscription")
        if (pendingData) {
          const parsedData = JSON.parse(pendingData)
          setPendingSubscriptionData(parsedData)
        }
      } catch (error) {
        console.error("Error parsing pending subscription data:", error)
      }
    }
  }, [])

  // Note: Subscription data is now automatically synced via GlobalSubscriptionSynchronizer
  // No need for manual fetchSubscription calls
  // Handle subscription button click for unauthenticated users
  const handleUnauthenticatedSubscribe = useCallback(
    (planName: SubscriptionPlanType, duration: number, promoCode?: string, promoDiscount?: number) => {
      // Only show login modal if user is definitely not authenticated
      if (!isLoading && !isAuthenticated) {
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
    },
    [referralCode, isLoading, isAuthenticated],
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

  const renderContent = () => {
    // Show skeleton during initial loading
    if (isLoading && !subscription) {
      return <SubscriptionSkeleton />
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

        {pendingSubscriptionData && userId && (
          <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-5 duration-300">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle>Pending Subscription</AlertTitle>
            <AlertDescription>
              You have a pending subscription to the {pendingSubscriptionData.planName} plan. It will be processed
              automatically.
            </AlertDescription>
          </Alert>
        )}

        {userId && (
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

        <Suspense fallback={<SubscriptionSkeleton />}>
          <PricingPage
            userId={userId}
            isProd={isProd}
            onUnauthenticatedSubscribe={handleUnauthenticatedSubscribe}
            onManageSubscription={handleManageSubscription}
            isMobile={isMobile}
          />
        </Suspense>

        <div className="max-w-md mx-auto">
          <Suspense fallback={<div className="h-20 w-full animate-pulse bg-muted rounded-md" />}>
            <StripeSecureCheckout />
          </Suspense>
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto px-4 py-8">      {/* Debug: Force Sync Button - Development Only */}
      {process.env.NODE_ENV === "development" && userId && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Debug: Subscription State
          </h3>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
            Current: Plan {subscription?.plan || 'UNKNOWN'}, Status {subscription?.status || 'UNKNOWN'}          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Sync Status: Session-driven (automatic)
          </p>
        </div>
      )}

      {!isLoading && subscription && (
        <Suspense fallback={null}>
          <TrialModal />
        </Suspense>
      )}      {/* Only show login modal if user is definitely unauthenticated */}
      {!isAuthenticated && !isLoading && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          callbackUrl="/dashboard/subscription"
          subscriptionData={pendingSubscriptionData}
        />
      )}

      {renderContent()}

      {isLoading && isAuthenticated && userId && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-full shadow-lg p-2 flex items-center animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm">Loading your data...</span>
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
        expirationDate={subscription?.currentPeriodEnd || null}
        planName={subscription?.plan || ""}
      />
    </div>
  )
}
