/**
 * Client Component: SubscriptionPageClient
 *
 * This component handles the client-side logic for the subscription page,
 * including fetching subscription data and rendering the appropriate UI.
 */

"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import TrialModal from "@/components/TrialModal"
import { PricingPage } from "./PricingPage"
import { StripeSecureCheckout } from "./StripeSecureCheckout"

import { Loader2, AlertTriangle, Info, ArrowRight } from "lucide-react"
import type { SubscriptionPlanType } from "@/app/types/subscription"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

/**
 * Client component for the subscription page with enhanced error handling and performance
 */
export default function SubscriptionPageClient() {
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
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const isProd = process.env.NODE_ENV === "production"
  const { data: session, status: sessionStatus } = useSession()
  const id = session?.user?.id ?? null
  const router = useRouter()

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSubscriptionData = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      setUserId(id)

      if (id) {
        try {
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
        } catch (error) {
          console.error("Error fetching subscription data:", error)
          setFetchError(error instanceof Error ? error.message : "Failed to fetch subscription data")
          setSubscriptionData({
            currentPlan: "FREE",
            subscriptionStatus: null,
            tokensUsed: 0,
            credits: 0,
          })
        }
      } else {
        setSubscriptionData({
          currentPlan: "FREE",
          subscriptionStatus: null,
          tokensUsed: 0,
          credits: 0,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // Handle retry logic
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  // Effect to fetch data when session changes
  useEffect(() => {
    // Only fetch data if session is loaded
    if (sessionStatus !== "loading") {
      fetchSubscriptionData()
    }
  }, [id, sessionStatus, fetchSubscriptionData, retryCount])

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

  // Memoize the pending subscription check to improve performance
  const pendingSubscription = useMemo(() => {
    if (typeof window === "undefined") return null
    const pendingData = localStorage.getItem("pendingSubscription")
    if (pendingData) {
      try {
        return JSON.parse(pendingData)
      } catch (e) {
        return null
      }
    }
    return null
  }, [])

  // Show loading state while session is loading
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span className="ml-2 text-lg">Loading subscription data...</span>
      </div>
    )
  }

  // Update the main component to load plans immediately
  // Fix the return structure to show plans immediately
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Trial Modal - Client Component */}
      {!isLoading && <TrialModal isSubscribed={isSubscribed} currentPlan={subscriptionData.currentPlan} />}

      {/* Show error state with retry button */}
      {fetchError && (
        <Alert variant="destructive" className="mb-6">
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

      {/* Show pending subscription notification if applicable */}
      {pendingSubscription && id && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Pending Subscription</AlertTitle>
          <AlertDescription>
            You have a pending subscription to the {pendingSubscription.planName} plan. It will be processed
            automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Show account management link for authenticated users */}
      {id && (
        <Alert className="mb-6 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <Info className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <AlertTitle>Manage Your Subscription</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p>You can view and manage your current subscription details in your account page.</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/account")} className="sm:ml-auto">
              Go to Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Always render pricing page, with or without user data */}
      <div className="space-y-8">
        <PricingPage
          userId={userId}
          currentPlan={subscriptionData.currentPlan}
          subscriptionStatus={subscriptionData.subscriptionStatus}
          tokensUsed={subscriptionData.tokensUsed}
          credits={subscriptionData.credits}
          isProd={isProd}
          expirationDate={subscriptionData.expirationDate}
        />

        {/* Add the Stripe secure checkout component */}
        <div className="max-w-md mx-auto">
          <StripeSecureCheckout />
        </div>
      </div>

      {/* Show loading indicator for user data only if needed */}
      {isLoading && sessionStatus === "authenticated" && id && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-full shadow-lg p-2 flex items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm">Loading your data...</span>
        </div>
      )}
    </div>
  )
}

/**
 * Enhanced skeleton loader for the pricing page with better visual feedback
 */
function PricingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center mb-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span className="text-lg">Loading subscription plans...</span>
      </div>

      {/* Current subscription skeleton */}
      <Skeleton className="h-[150px] w-full rounded-xl mb-8" />

      {/* Promo code skeleton */}
      <Skeleton className="h-[100px] w-full rounded-xl mb-8" />

      {/* Section header skeleton */}
      <div className="flex flex-col items-center space-y-2 py-8">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-6 w-96 rounded-lg" />
      </div>

      {/* Billing toggle skeleton */}
      <div className="flex justify-center py-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
      </div>

      {/* Plan cards skeleton with animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${i === 2 ? "lg:scale-105" : ""} transition-all duration-300`}>
            <Skeleton className={`h-[450px] w-full rounded-xl ${i === 2 ? "animate-pulse" : ""}`} />
          </div>
        ))}
      </div>

      {/* Additional sections skeleton */}
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </div>
  )
}

