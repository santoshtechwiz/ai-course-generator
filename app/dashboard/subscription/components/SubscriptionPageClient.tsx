/**
 * Client Component: SubscriptionPageClient
 *
 * This component handles the client-side logic for the subscription page,
 * including fetching subscription data and rendering the appropriate UI.
 * Improved with better error handling, loading states, and performance optimizations.
 */

"use client"

import { useEffect, useState, useCallback, Suspense, lazy, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Info, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ReferralBanner } from "@/components/ReferralBanner"

import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"

import { SubscriptionSkeleton } from "@/components/ui/SkeletonLoader"
import TrialModal from "@/components/TrialModal"
import { LoginModal } from "@/app/auth/signin/components/LoginModal"
import { useMediaQuery } from "@/hooks/use-media-query"
import { CancellationDialog } from "./cancellation-dialog"
import { useSubscription } from "../hooks/use-subscription"

import { SubscriptionRefresher } from "./SubscriptionRefresher"
import { useSubscriptionData } from "../store/hooks"

// Lazy load the PricingPage component for better performance
const PricingPage = lazy(() => import("./PricingPage").then((mod) => ({ default: mod.PricingPage })))
const StripeSecureCheckout = lazy(() =>
  import("./StripeSecureCheckout").then((mod) => ({ default: mod.StripeSecureCheckout })),
)

// Define retry configuration for better UX
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
}

/**
 * Client component for the subscription page with enhanced error handling and performance
 */
export default function SubscriptionPageClient({ refCode }: { refCode: string | null }) {
  // Ensure userId is properly set and passed to PricingPage
  const [userId, setUserId] = useState<string | null>(null)
  const [showReferralBanner, setShowReferralBanner] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingSubscriptionData, setPendingSubscriptionData] = useState<any>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const isProd = process.env.NODE_ENV === "production"
  const { data: session, status: sessionStatus } = useSession()
  const id = session?.user?.id ?? null
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Use our custom hook for subscription data
  const { subscription, refreshData, isLoading, isError, error } = useSubscriptionData({
    refreshInterval: 120000, // 2 minutes
    initialFetch: !!id, // Only fetch initially if user is logged in
  })

  const subscriptionData = subscription.data
  const isDataFetched = subscription.status === "succeeded" || subscription.status === "failed"

  // Handle subscription cancellation
  const { cancelSubscription } = useSubscription()

  const handleCancelSubscription = async (reason: string) => {
    const result = await cancelSubscription(reason)
    if (result.success) {
      refreshData(true) // Force refresh after cancellation
    }
    return
  }

  // Transform the Redux data to match the expected format
  const transformedData = useMemo(() => {
    if (!subscriptionData) {
      return {
        currentPlan: null,
        subscriptionStatus: null,
        tokensUsed: 0,
        credits: 0,
      }
    }

    return {
      currentPlan: subscriptionData.subscriptionPlan,
      subscriptionStatus: subscriptionData.status || (subscriptionData.isSubscribed ? "ACTIVE" : "INACTIVE"),
      tokensUsed: subscriptionData.tokensUsed || 0,
      credits: subscriptionData.credits || 0,
      expirationDate: subscriptionData.expirationDate,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
    }
  }, [subscriptionData])

  const isSubscribed = subscriptionData?.isSubscribed || false

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

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSubscriptionData = useCallback(async () => {
    if (!id || sessionStatus !== "authenticated") {
      setIsLoading(false)
      setIsDataFetched(true)
      return
    }

    setIsLoading(true)
    setFetchError(null)

    try {
      setUserId(id)

      // Fetch subscription status with improved error handling
      const response = await fetch("/api/subscriptions/status")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch subscription data: ${response.statusText}`)
      }

      const subscriptionResult = await response.json()

      if (subscriptionResult.error) {
        throw new Error(subscriptionResult.details || "Failed to fetch subscription data")
      }

      // Update this part to correctly set the subscription status
      setSubscriptionData({
        currentPlan: subscriptionResult.subscriptionPlan as SubscriptionPlanType,
        // Use the actual status from the API if available, otherwise derive from isSubscribed
        subscriptionStatus: subscriptionResult.status || (subscriptionResult.isSubscribed ? "ACTIVE" : "INACTIVE"),
        tokensUsed: subscriptionResult.tokensUsed || 0,
        credits: subscriptionResult.credits || 0,
        expirationDate: subscriptionResult.expirationDate,
      })
      setIsSubscribed(subscriptionResult.isSubscribed)

      // Reset retry count on successful fetch
      setRetryCount(0)
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      setFetchError(error instanceof Error ? error.message : "Failed to fetch subscription data")

      // Set default values on error
      setSubscriptionData({
        currentPlan: "FREE",
        subscriptionStatus: null,
        tokensUsed: 0,
        credits: 0,
      })

      // Increment retry count for automatic retry
      setRetryCount((prev) => prev + 1)
    } finally {
      setIsLoading(false)
      setIsDataFetched(true)
      setIsRetrying(false)
    }
  }, [session])

  // Automatic retry logic with exponential backoff
  useEffect(() => {
    if (fetchError && retryCount < RETRY_CONFIG.MAX_RETRIES && !isRetrying) {
      setIsRetrying(true)
      const timer = setTimeout(
        () => {
          console.log(`Retrying subscription data fetch (${retryCount + 1}/${RETRY_CONFIG.MAX_RETRIES})...`)
          fetchSubscriptionData()
        },
        RETRY_CONFIG.RETRY_DELAY * Math.pow(2, retryCount - 1),
      )

      return () => clearTimeout(timer)
    }
  }, [fetchError, retryCount, fetchSubscriptionData, isRetrying])

  // Handle manual retry
  const handleRetry = useCallback(() => {
    setRetryCount(0) // Reset retry count for manual retry
    setIsRetrying(true)
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  // Effect to fetch data when session changes
  useEffect(() => {
    // Only fetch data if session is loaded
    if (sessionStatus !== "loading") {
      fetchSubscriptionData()
    }
  }, [id, sessionStatus, fetchSubscriptionData])

  // Add event listener for subscription changes
  useEffect(() => {
    const handleSubscriptionChange = () => {
      // Refresh subscription data when subscription changes
      fetchSubscriptionData()
    }

    window.addEventListener("subscription-changed", handleSubscriptionChange)

    return () => {
      window.removeEventListener("subscription-changed", handleSubscriptionChange)
    }
  }, [fetchSubscriptionData])

  // Handle subscription button click for unauthenticated users
  const handleUnauthenticatedSubscribe = useCallback(
    (planName: SubscriptionPlanType, duration: number, promoCode?: string, promoDiscount?: number) => {
      // Only show login modal if user is definitely not authenticated
      if (sessionStatus != "loading" && sessionStatus === "unauthenticated") {
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
    [referralCode, sessionStatus],
  )

  const handleManageSubscription = useCallback(() => {
    if (transformedData.cancelAtPeriodEnd) {
      // If subscription is already cancelled, offer to resume
      router.push("/dashboard/account")
    } else {
      // Otherwise show cancellation dialog
      setShowCancellationDialog(true)
    }
  }, [transformedData.cancelAtPeriodEnd, router])

  const renderContent = () => {
    // Show skeleton only during initial session loading
    if (sessionStatus === "loading" && !isDataFetched) {
      return <SubscriptionSkeleton />
    }

    return (
      <div className="space-y-8">
        {isError && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-5 duration-300">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error loading subscription data</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{fetchError}</p>
              <Button variant="outline" size="sm" onClick={handleRetry} className="w-fit mt-2" disabled={isRetrying}>
                {isRetrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  "Retry"
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {referralCode && showReferralBanner && (
          <ReferralBanner referralCode={referralCode} onDismiss={() => setShowReferralBanner(false)} />
        )}

        {pendingSubscriptionData && id && (
          <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-5 duration-300">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle>Pending Subscription</AlertTitle>
            <AlertDescription>
              You have a pending subscription to the {pendingSubscriptionData.planName} plan. It will be processed
              automatically.
            </AlertDescription>
          </Alert>
        )}

        {id && (
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
          {/* When rendering the PricingPage component, ensure userId is passed */}
          <PricingPage
            userId={userId}
            currentPlan={transformedData.currentPlan}
            subscriptionStatus={transformedData.subscriptionStatus}
            tokensUsed={transformedData.tokensUsed}
            credits={transformedData.credits}
            isProd={isProd}
            expirationDate={transformedData.expirationDate}
            referralCode={referralCode}
            onUnauthenticatedSubscribe={handleUnauthenticatedSubscribe}
            cancelAtPeriodEnd={transformedData.cancelAtPeriodEnd}
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
    <div className="container mx-auto px-4 py-8">
      {/* Include the SubscriptionRefresher component to handle background refreshes */}
      <SubscriptionRefresher />

      {!isLoading && isDataFetched && (
        <Suspense fallback={null}>
          <TrialModal isSubscribed={isSubscribed} currentPlan={transformedData.currentPlan} />
        </Suspense>
      )}

      {/* Only show login modal if user is definitely unauthenticated */}
      {sessionStatus === "unauthenticated" && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          callbackUrl="/dashboard/subscription"
          subscriptionData={pendingSubscriptionData}
        />
      )}

      {renderContent()}

      {isLoading && sessionStatus === "authenticated" && id && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-full shadow-lg p-2 flex items-center animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm">Loading your data...</span>
        </div>
      )}

      <CancellationDialog
        isOpen={showCancellationDialog}
        onClose={() => setShowCancellationDialog(false)}
        onConfirm={handleCancelSubscription}
        expirationDate={transformedData.expirationDate || null}
        planName={transformedData.currentPlan || ""}
      />
    </div>
  )
}
