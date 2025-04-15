/**
 * Client Component: SubscriptionPageClient
 *
 * This component handles the client-side logic for the subscription page,
 * including fetching subscription data and rendering the appropriate UI.
 */

"use client"

import { useEffect, useState, useCallback, Suspense, lazy } from "react"
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

// Lazy load the PricingPage component
const PricingPage = lazy(() => import("./PricingPage").then((mod) => ({ default: mod.PricingPage })))
const StripeSecureCheckout = lazy(() =>
  import("./StripeSecureCheckout").then((mod) => ({ default: mod.StripeSecureCheckout })),
)

export default function SubscriptionPageClient({ refCode }: { refCode: string | null }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<{
    currentPlan: SubscriptionPlanType | null
    subscriptionStatus: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | null
    tokensUsed: number
    credits: number
    expirationDate?: string
    error?: string
  }>({
    currentPlan: null,
    subscriptionStatus: null,
    tokensUsed: 0,
    credits: 0,
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDataFetched, setIsDataFetched] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [referralCode, setReferralCode] = useState<string | null>(refCode)
  const [showReferralBanner, setShowReferralBanner] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingSubscriptionData, setPendingSubscriptionData] = useState<any>(null)

  const isProd = process.env.NODE_ENV === "production"
  const { data: session, status: sessionStatus } = useSession()
  const id = session?.user?.id ?? null
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const fetchSubscriptionData = useCallback(async () => {
    if (!id) {
      // Only set loading to false if we're definitely not authenticated
      if (sessionStatus === "unauthenticated") {
        setIsLoading(false)
        setIsDataFetched(true)
      }
      return
    }

    setIsLoading(true)
    setFetchError(null)

    try {
      setUserId(id)
      const response = await fetch("/api/subscriptions/status")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch subscription data: ${response.statusText}`)
      }

      const subscriptionResult = await response.json()

      if (subscriptionResult.error) {
        throw new Error(subscriptionResult.details || "Failed to fetch subscription data")
      }

      setSubscriptionData({
        currentPlan: subscriptionResult.subscriptionPlan as SubscriptionPlanType,
        subscriptionStatus: subscriptionResult.status || (subscriptionResult.isSubscribed ? "ACTIVE" : "INACTIVE"),
        tokensUsed: subscriptionResult.tokensUsed || 0,
        credits: subscriptionResult.credits || 0,
        expirationDate: subscriptionResult.expirationDate,
      })
      setIsSubscribed(subscriptionResult.isSubscribed)
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      setFetchError(error instanceof Error ? error.message : "Failed to fetch subscription data")
      setSubscriptionData({
        currentPlan: "FREE",
        subscriptionStatus: null,
        tokensUsed: 0,
        credits: 0,
      })
    } finally {
      setIsLoading(false)
      setIsDataFetched(true)
    }
  }, [id, sessionStatus])

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  useEffect(() => {
    // Only fetch data when we have a confirmed session state
    if (sessionStatus !== "loading") {
      fetchSubscriptionData()
    }
  }, [id, sessionStatus, fetchSubscriptionData, retryCount])

  useEffect(() => {
    const handleSubscriptionChange = () => {
      fetchSubscriptionData()
    }

    window.addEventListener("subscription-changed", handleSubscriptionChange)
    return () => {
      window.removeEventListener("subscription-changed", handleSubscriptionChange)
    }
  }, [fetchSubscriptionData])

  const handleUnauthenticatedSubscribe = useCallback(
    (planName: SubscriptionPlanType, duration: number, promoCode?: string, promoDiscount?: number) => {
      // Only show login modal if user is definitely not authenticated
      if (sessionStatus === "unauthenticated") {
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
              <p>{fetchError}</p>
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
          <PricingPage
            userId={userId}
            currentPlan={subscriptionData.currentPlan}
            subscriptionStatus={subscriptionData.subscriptionStatus}
            tokensUsed={subscriptionData.tokensUsed}
            credits={subscriptionData.credits}
            isProd={isProd}
            expirationDate={subscriptionData.expirationDate}
            referralCode={referralCode}
            onUnauthenticatedSubscribe={handleUnauthenticatedSubscribe}
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
          <TrialModal isSubscribed={isSubscribed} currentPlan={subscriptionData.currentPlan} />
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
    </div>
  )
}