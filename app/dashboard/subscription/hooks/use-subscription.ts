"use client"

import { useState, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/dashboard/subscription/types/subscription"
import { SUBSCRIPTION_EVENTS, dispatchSubscriptionEvent } from "@/app/dashboard/subscription/utils/events"
import { handleSubscriptionError, createSuccessResponse } from "@/app/dashboard/subscription/utils/error-handler"
import type { SubscriptionErrorType } from "@/app/dashboard/subscription/utils/error-handler"
import { useSubscriptionStore } from "@/app/store/subscriptionStore"


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
  const { toast } = useToast()
  const router = useRouter()
  const requestInProgressRef = useRef(false)

  // Use Zustand store instead of Redux
  const {
    fetchSubscriptionStatus,
    cancelSubscription: cancelSubscriptionAction,
    resumeSubscription: resumeSubscriptionAction,
    activateFreePlan: activateFreePlanAction,
  } = useSubscriptionStore()

  const { allowPlanChanges = false, allowDowngrades = false, onSubscriptionSuccess, onSubscriptionError } = options

  // Function to check if a user can subscribe to a specific plan
  const canSubscribeToPlan = useCallback(
    (
      currentPlan: SubscriptionPlanType | null,
      targetPlan: SubscriptionPlanType,
      currentStatus: SubscriptionStatusType | null,
    ): { canSubscribe: boolean; reason?: string } => {
      // If no current plan or inactive, they can subscribe to any plan
      if (!currentPlan || currentStatus !== "ACTIVE") {
        return { canSubscribe: true }
      }

      // If they're trying to subscribe to the same plan they already have
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

  // Handle subscription creation with debouncing to prevent duplicate requests
  const handleSubscribe = useCallback(
    async (
      planName: SubscriptionPlanType,
      duration: number,
      promoCode?: string,
      promoDiscount?: number,
      referralCode?: string,
    ): Promise<SubscriptionResult> => {
      // Prevent duplicate requests
      if (requestInProgressRef.current) {
        return {
          success: false,
          error: "A subscription request is already in progress",
          message: "Please wait for the current request to complete",
        }
      }

      requestInProgressRef.current = true
      setIsLoading(true)

      // Add a safety timeout to prevent deadlocks
      const safetyTimeout = setTimeout(() => {
        if (requestInProgressRef.current) {
          console.warn("Request timeout - resetting request in progress flag")
          requestInProgressRef.current = false
        }
      }, 30000) // 30 second safety timeout

      try {
        // For free plan, use Zustand action
        if (planName === "FREE") {
          await activateFreePlanAction()

          // Refresh subscription data
          fetchSubscriptionStatus(true)

          const successResult = {
            success: true,
            message: "Free plan activated successfully",
          }

          if (onSubscriptionSuccess) {
            onSubscriptionSuccess(successResult)
          }

          return successResult
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
          const errorType: SubscriptionErrorType = response.status === 401 ? "AUTHENTICATION_REQUIRED" : "SERVER_ERROR"

          return handleSubscriptionError(
            new Error(data.details || "There was an error processing your subscription."),
            errorType,
            {
              notify: true,
              log: true,
              details: data.details || "Please try again later.",
            },
          )
        }

        if (data.error) {
          return handleSubscriptionError(
            new Error(data.details || "An unexpected error occurred"),
            "VALIDATION_ERROR",
            { notify: true, log: true },
          )
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

        // Dispatch an event before redirecting
        dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.CREATED, {
          planId: planName,
          sessionId: data.sessionId,
        })

        // Redirect to the checkout URL
        if (data.url) {
          window.location.href = data.url
        }

        return result
      } catch (error) {
        console.error("Subscription error:", error)

        let errorType: SubscriptionErrorType = "SERVER_ERROR"

        // Determine error type based on the error
        if (error instanceof Error) {
          if (error.message.includes("network") || error.message.includes("fetch")) {
            errorType = "NETWORK_ERROR"
          } else if (error.message.includes("payment") || error.message.includes("card")) {
            errorType = "PAYMENT_FAILED"
          }
        }

        return handleSubscriptionError(error, errorType, {
          notify: true,
          log: true,
        })
      } finally {
        setIsLoading(false)
        clearTimeout(safetyTimeout)

        // Reset the request in progress flag after a short delay
        setTimeout(() => {
          requestInProgressRef.current = false
        }, 1000)
      }
    },
    [toast, onSubscriptionSuccess, onSubscriptionError, fetchSubscriptionStatus, activateFreePlanAction],
  )

  // Handle subscription cancellation with Zustand
  const cancelSubscription = useCallback(
    async (reason?: string): Promise<SubscriptionResult> => {
      // Prevent duplicate requests
      if (requestInProgressRef.current) {
        return {
          success: false,
          error: "A subscription request is already in progress",
          message: "Please wait for the current request to complete",
        }
      }

      requestInProgressRef.current = true
      setIsLoading(true)

      try {
        await cancelSubscriptionAction(reason || "")

        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled and will end at the current billing period.",
        })

        router.refresh()

        return createSuccessResponse("Subscription cancelled successfully")
      } catch (error) {
        console.error("Cancellation error:", error)
        return handleSubscriptionError(error, "SERVER_ERROR", {
          notify: true,
          log: true,
        })
      } finally {
        setIsLoading(false)
        setTimeout(() => {
          requestInProgressRef.current = false
        }, 1000)
      }
    },
    [toast, router, cancelSubscriptionAction],
  )

  // Handle subscription resumption with Zustand
  const resumeSubscription = useCallback(async (): Promise<SubscriptionResult> => {
    // Prevent duplicate requests
    if (requestInProgressRef.current) {
      return {
        success: false,
        error: "A subscription request is already in progress",
        message: "Please wait for the current request to complete",
      }
    }

    requestInProgressRef.current = true
    setIsLoading(true)

    try {
      await resumeSubscriptionAction()

      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed successfully.",
      })

      router.refresh()

      return createSuccessResponse("Subscription resumed successfully")
    } catch (error) {
      console.error("Resume error:", error)
      return handleSubscriptionError(error, "SERVER_ERROR", {
        notify: true,
        log: true,
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        requestInProgressRef.current = false
      }, 1000)
    }
  }, [toast, router, resumeSubscriptionAction])

  return {
    isLoading,
    handleSubscribe,
    cancelSubscription,
    resumeSubscription,
    canSubscribeToPlan,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
  }
}
