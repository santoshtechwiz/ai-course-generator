"use client"

import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/dashboard/subscription/types/subscription"

interface UseSubscriptionOptions {
  allowPlanChanges?: boolean
  allowDowngrades?: boolean
  onSubscriptionSuccess?: (result: { success: boolean; message?: string; redirectUrl?: string }) => void
  onSubscriptionError?: (error: { message: string; details?: string }) => void
}

interface SubscriptionResult {
  success: boolean
  message?: string
  redirectUrl?: string
  sessionId?: string
  error?: string
  details?: string
}

export function useSubscription(options: UseSubscriptionOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const { allowPlanChanges = false, allowDowngrades = false, onSubscriptionSuccess, onSubscriptionError } = options

  // Clear last error when component unmounts or options change
  useEffect(() => {
    return () => {
      setLastError(null)
    }
  }, [allowPlanChanges, allowDowngrades])

  // Function to check if a user can subscribe to a specific plan
  const canSubscribeToPlan = useCallback(
    (
      currentPlan: SubscriptionPlanType | null,
      targetPlan: SubscriptionPlanType,
      currentStatus: SubscriptionStatusType | null,
    ): { canSubscribe: boolean; reason?: string } => {
      // Always allow subscribing to FREE plan if not already on it
      if (targetPlan === "FREE") {
        // If already on FREE plan and it's active, can't subscribe again
        if (currentPlan === "FREE" && currentStatus === "ACTIVE") {
          return {
            canSubscribe: false,
            reason: "You are already on the free plan",
          }
        }
        return { canSubscribe: true }
      }

      // If no current plan, can subscribe to any plan
      if (!currentPlan) {
        return { canSubscribe: true }
      }

      // If current plan is the same as target plan and active, can't subscribe again
      if (currentPlan === targetPlan && currentStatus === "ACTIVE") {
        return {
          canSubscribe: false,
          reason: "You are already subscribed to this plan",
        }
      }

      // If current plan is not FREE and active, and plan changes are not allowed
      if (currentPlan !== "FREE" && currentStatus === "ACTIVE" && !allowPlanChanges) {
        return {
          canSubscribe: false,
          reason:
            "You need to wait until your current subscription expires or cancel it before subscribing to a new plan",
        }
      }

      // If downgrading and downgrades are not allowed
      const planRank = {
        FREE: 0,
        BASIC: 1,
        PRO: 2,
        ULTIMATE: 3,
      }

      if (planRank[targetPlan] < planRank[currentPlan] && !allowDowngrades && currentStatus === "ACTIVE") {
        return {
          canSubscribe: false,
          reason: "Downgrading to a lower tier plan is not allowed while your current plan is active",
        }
      }

      // Otherwise, can subscribe
      return { canSubscribe: true }
    },
    [allowPlanChanges, allowDowngrades],
  )

  // Check if user is subscribed to any paid plan
  const isSubscribedToAnyPaidPlan = useCallback(
    (currentPlan: SubscriptionPlanType | null, currentStatus: SubscriptionStatusType | null): boolean => {
      return !!currentPlan && currentPlan !== "FREE" && (currentStatus === "ACTIVE" || currentStatus === "CANCELED")
    },
    [],
  )

  // Check if user is subscribed to all available plans
  const isSubscribedToAllPlans = useCallback(
    (currentPlan: SubscriptionPlanType | null, currentStatus: SubscriptionStatusType | null): boolean => {
      // If the user has the ULTIMATE plan (highest tier) and it's active, they effectively have all plans
      return currentPlan === "ULTIMATE" && currentStatus === "ACTIVE"
    },
    [],
  )

  // Handle subscription creation with improved error handling and retry logic
  const handleSubscribe = useCallback(
    async (
      planName: SubscriptionPlanType,
      duration: number,
      promoCode?: string,
      promoDiscount?: number,
      referralCode?: string,
    ): Promise<SubscriptionResult> => {
      setIsLoading(true)
      setLastError(null)

      try {
        // For free plan, use the activate-free endpoint
        if (planName === "FREE") {
          const response = await fetch("/api/subscriptions/activate-free", {
            method: "POST",
            body: JSON.stringify({ confirmed: true }),
            headers: {
              "Content-Type": "application/json",
            },
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.details || data.message || "Failed to activate free plan")
          }

          // Dispatch an event to notify other components about the subscription change
          window.dispatchEvent(new Event("subscription-changed"))

          const result = {
            success: true,
            message: data.message || "Free plan activated successfully",
          }

          if (onSubscriptionSuccess) {
            onSubscriptionSuccess(result)
          }

          // Show success toast
          toast({
            title: "Free Plan Activated",
            description: result.message,
            variant: "default",
          })

          return result
        }

        // For paid plans, create a checkout session
        const response = await fetch("/api/subscriptions/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planName,
            duration,
            referralCode,
            promoCode,
            promoDiscount,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.details || data.message || "There was an error processing your subscription. Please try again.",
          )
        }

        if (data.error) {
          throw new Error(data.details || data.message || "An unexpected error occurred")
        }

        // For successful checkout session creation
        const result = {
          success: true,
          redirectUrl: data.url,
          sessionId: data.sessionId,
          message: "Redirecting to checkout...",
        }

        if (onSubscriptionSuccess) {
          onSubscriptionSuccess(result)
        }

        // Show redirecting toast
        toast({
          title: "Redirecting to Checkout",
          description: "You'll be redirected to complete your payment.",
          variant: "default",
        })

        // Redirect to the checkout URL
        if (data.url) {
          window.location.href = data.url
        }

        return result
      } catch (error) {
        console.error("Subscription error:", error)

        const errorMessage = error instanceof Error ? error.message : "Failed to process subscription"
        setLastError(errorMessage)

        const errorResult = {
          success: false,
          error: "Subscription failed",
          message: errorMessage,
          details: error instanceof Error ? error.message : undefined,
        }

        if (onSubscriptionError) {
          onSubscriptionError({
            message: errorMessage,
            details: error instanceof Error ? error.message : undefined,
          })
        }

        toast({
          title: "Subscription Error",
          description: errorMessage,
          variant: "destructive",
        })

        return errorResult
      } finally {
        setIsLoading(false)
      }
    },
    [toast, onSubscriptionSuccess, onSubscriptionError],
  )

  // Handle subscription cancellation with improved error handling
  const cancelSubscription = useCallback(async (): Promise<SubscriptionResult> => {
    setIsLoading(true)
    setLastError(null)

    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.message || "Failed to cancel subscription")
      }

      // Dispatch an event to notify other components about the subscription change
      window.dispatchEvent(new Event("subscription-changed"))

      toast({
        title: "Subscription Cancelled",
        description: data.message || "Your subscription has been cancelled and will end at the current billing period.",
      })

      router.refresh()

      return {
        success: true,
        message: data.message || "Subscription cancelled successfully",
      }
    } catch (error) {
      console.error("Cancellation error:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to cancel subscription"
      setLastError(errorMessage)

      toast({
        title: "Cancellation Error",
        description: errorMessage,
        variant: "destructive",
      })

      return {
        success: false,
        error: "Cancellation failed",
        message: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, router])

  // Handle subscription resumption with improved error handling
  const resumeSubscription = useCallback(async (): Promise<SubscriptionResult> => {
    setIsLoading(true)
    setLastError(null)

    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.message || "Failed to resume subscription")
      }

      // Dispatch an event to notify other components about the subscription change
      window.dispatchEvent(new Event("subscription-changed"))

      toast({
        title: "Subscription Resumed",
        description: data.message || "Your subscription has been resumed successfully.",
      })

      router.refresh()

      return {
        success: true,
        message: data.message || "Subscription resumed successfully",
      }
    } catch (error) {
      console.error("Resume error:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to resume subscription"
      setLastError(errorMessage)

      toast({
        title: "Resume Error",
        description: errorMessage,
        variant: "destructive",
      })

      return {
        success: false,
        error: "Resume failed",
        message: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, router])

  return {
    isLoading,
    lastError,
    handleSubscribe,
    cancelSubscription,
    resumeSubscription,
    canSubscribeToPlan,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
  }
}
