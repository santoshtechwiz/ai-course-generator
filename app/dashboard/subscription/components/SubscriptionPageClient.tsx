/**
 * Client Component: SubscriptionPageClient
 *
 * This component handles the client-side logic for the subscription page,
 * including fetching subscription data and rendering the appropriate UI.
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
import useSWR from "swr"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SUBSCRIPTION_EVENTS, subscribeToEvent } from "@/app/dashboard/subscription/utils/events"
import { CancellationDialog } from "./cancellation-dialog"
import { useSubscription } from "../hooks/use-subscription"


// Lazy load the PricingPage component
const PricingPage = lazy(() => import("./PricingPage").then((mod) => ({ default: mod.PricingPage })))
const StripeSecureCheckout = lazy(() =>
  import("./StripeSecureCheckout").then((mod) => ({ default: mod.StripeSecureCheckout })),
)

// Replace the fetchSubscriptionData and related state with SWR
export default function SubscriptionPageClient({ refCode }: { refCode: string | null }) {
  // Ensure userId is properly set and passed to PricingPage
  const [userId, setUserId] = useState<string | null>(null)
  const [showReferralBanner, setShowReferralBanner] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingSubscriptionData, setPendingSubscriptionData] = useState<any>(null)
  const [referralCode, setReferralCode] = useState<string | null>(refCode)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)

  const isProd = process.env.NODE_ENV === "production"
  const { data: session, status: sessionStatus } = useSession()
  const id = session?.user?.id ?? null
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Use SWR for subscription data
  const {
    data: subscriptionData,
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR(
    id ? "/api/subscriptions/status" : null,
    async (url) => {
      const response = await fetch(url, {
        headers: { "x-force-refresh": "true" },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch subscription data: ${response.statusText}`)
      }
      return response.json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      onSuccess: (data) => {
        if (id) setUserId(id)
      },
      onError: (error) => {
        console.error("Error fetching subscription data:", error)
      },
    },
  )

  // Transform the SWR data to match the expected format
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
  const isDataFetched = !!subscriptionData || !!fetchError

  // Handle subscription cancellation
  const { cancelSubscription } = useSubscription()

  const handleCancelSubscription = async (reason: string) => {
    const result = await cancelSubscription(reason)
    if (result.success) {
      mutate() // Refresh the data after cancellation
    }
    return result.success
  }

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

  // Subscribe to subscription events
  useEffect(() => {
    const unsubscribe = subscribeToEvent(SUBSCRIPTION_EVENTS.CHANGED, () => {
      mutate() // Refresh data when subscription changes
    })

    return unsubscribe
  }, [mutate])

  // In the useEffect or wherever userId is set, make sure it's properly updated
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id)
    }
  }, [session])

  const handleRetry = useCallback(() => {
    mutate()
  }, [mutate])

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
        {fetchError && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-5 duration-300">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error loading subscription data</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{fetchError?.message}</p>
              <Button variant="outline" size="sm" onClick={handleRetry} className="w-fit mt-2">
                Retry
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
      />
    </div>
  )
}
