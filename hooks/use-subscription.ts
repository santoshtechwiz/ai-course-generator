"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import type { SubscriptionPlanType } from "@/app/types/subscription"

// Define return types for better type safety
export interface SubscriptionActionResult {
  success: boolean
  message?: string
  redirectUrl?: string
}

// Define subscription error types
export type SubscriptionErrorType =
  | "AUTHENTICATION_REQUIRED"
  | "PLAN_CHANGE_RESTRICTED"
  | "DOWNGRADE_RESTRICTED"
  | "ALREADY_SUBSCRIBED"
  | "SERVER_ERROR"
  | "PAYMENT_FAILED"
  | "NETWORK_ERROR"

// Define subscription error class
export class SubscriptionError extends Error {
  type: SubscriptionErrorType

  constructor(message: string, type: SubscriptionErrorType) {
    super(message)
    this.type = type
    this.name = "SubscriptionError"
  }
}

export interface UseSubscriptionOptions {
  /**
   * Whether to allow plan changes during an active subscription
   * @default false
   */
  allowPlanChanges?: boolean

  /**
   * Whether to allow downgrades during an active subscription
   * @default false
   */
  allowDowngrades?: boolean

  /**
   * Callback to run after a successful subscription
   */
  onSubscriptionSuccess?: (result: SubscriptionActionResult) => void

  /**
   * Callback to run after a failed subscription
   */
  onSubscriptionError?: (error: SubscriptionError) => void
}

export interface UseSubscriptionReturn {
  /**
   * Whether a subscription action is currently loading
   */
  isLoading: boolean

  /**
   * Subscribe to a plan
   * @param planName The plan to subscribe to
   * @param duration The duration of the subscription in months
   * @param promoCode Optional promo code
   * @param promoDiscount Optional promo discount percentage
   */
  handleSubscribe: (
    planName: SubscriptionPlanType,
    duration: number,
    promoCode?: string,
    promoDiscount?: number,
  ) => Promise<SubscriptionActionResult>

  /**
   * Cancel the current subscription
   */
  cancelSubscription: () => Promise<SubscriptionActionResult>

  /**
   * Resume a canceled subscription
   */
  resumeSubscription: () => Promise<SubscriptionActionResult>

  /**
   * Check if a user can subscribe to a specific plan
   * @param currentPlan The user's current plan
   * @param targetPlan The plan the user wants to subscribe to
   * @param subscriptionStatus The current subscription status
   */
  canSubscribeToPlan: (
    currentPlan: SubscriptionPlanType | null,
    targetPlan: SubscriptionPlanType,
    subscriptionStatus: string | null,
  ) => {
    canSubscribe: boolean
    reason?: string
  }
}

/**
 * Hook for managing subscription actions
 */
export const useSubscription = (options: UseSubscriptionOptions = {}): UseSubscriptionReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const session = useSession()

  const { allowPlanChanges = false, allowDowngrades = false, onSubscriptionSuccess, onSubscriptionError } = options

  /**
   * Check if a user can subscribe to a specific plan
   */
  const canSubscribeToPlan = (
    currentPlan: SubscriptionPlanType | null,
    targetPlan: SubscriptionPlanType,
    subscriptionStatus: string | null,
  ): { canSubscribe: boolean; reason?: string } => {
    // If no current plan or inactive, they can subscribe to any plan
    if (!currentPlan || subscriptionStatus !== "ACTIVE") {
      return { canSubscribe: true }
    }

    // If they're trying to subscribe to the same plan they already have
    if (currentPlan === targetPlan) {
      return {
        canSubscribe: false,
        reason: "You are already subscribed to this plan",
      }
    }

    // If they're on the free plan, they can upgrade to any paid plan
    if (currentPlan === "FREE") {
      return { canSubscribe: true }
    }

    // If they're trying to downgrade to the free plan
    if (targetPlan === "FREE") {
      return {
        canSubscribe: false,
        reason: "You need to cancel your current subscription before switching to the free plan",
      }
    }

    // Plan hierarchy for determining upgrades/downgrades
    const planHierarchy: Record<SubscriptionPlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ULTIMATE: 3,
    }

    // Check if this is a downgrade
    const isDowngrade = planHierarchy[targetPlan] < planHierarchy[currentPlan]

    // If downgrades are not allowed
    if (isDowngrade && !allowDowngrades) {
      return {
        canSubscribe: false,
        reason: "You cannot downgrade your subscription until your current plan expires",
      }
    }

    // If plan changes are not allowed at all
    if (!allowPlanChanges) {
      return {
        canSubscribe: false,
        reason: "You cannot change your subscription until your current plan expires",
      }
    }

    return { canSubscribe: true }
  }

  /**
   * Subscribe to a plan
   */
  const handleSubscribe = async (
    planName: SubscriptionPlanType,
    duration: number,
    promoCode?: string,
    promoDiscount?: number,
  ): Promise<SubscriptionActionResult> => {
    setIsLoading(true)

    try {
      // Get the current user ID
      const userId = session?.data?.user?.id

      if (!userId) {
        const error = new SubscriptionError("You must be logged in to subscribe", "AUTHENTICATION_REQUIRED")

        if (onSubscriptionError) {
          onSubscriptionError(error)
        }

        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe to this plan",
          variant: "destructive",
        })

        // Store pending subscription in localStorage to resume after login
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "pendingSubscription",
            JSON.stringify({
              planName,
              duration,
              promoCode,
              promoDiscount,
            }),
          )
        }

        return {
          success: false,
          message: "Authentication required",
        }
      }

      // For free plan, handle activation directly
      if (planName === "FREE") {
        try {
          const response = await fetch("/api/subscriptions/activate-free", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ confirmed: true }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to activate free plan" }))
            throw new SubscriptionError(errorData.message || "Failed to activate free plan", "SERVER_ERROR")
          }

          const result = await response.json()

          if (result.success) {
            toast({
              title: "Free Plan Activated",
              description: "You now have access to the free plan features and 5 tokens",
              variant: "default",
            })

            // Trigger subscription changed event
            window.dispatchEvent(new Event("subscription-changed"))

            const actionResult = {
              success: true,
              message: "Free plan activated successfully",
            }

            if (onSubscriptionSuccess) {
              onSubscriptionSuccess(actionResult)
            }

            return actionResult
          } else {
            throw new SubscriptionError(result.message || "Failed to activate free plan", "SERVER_ERROR")
          }
        } catch (error) {
          console.error("Error activating free plan:", error)

          const subscriptionError =
            error instanceof SubscriptionError
              ? error
              : new SubscriptionError(
                  error instanceof Error ? error.message : "Failed to activate free plan",
                  "SERVER_ERROR",
                )

          if (onSubscriptionError) {
            onSubscriptionError(subscriptionError)
          }

          toast({
            title: "Activation Failed",
            description: subscriptionError.message,
            variant: "destructive",
          })

          return {
            success: false,
            message: subscriptionError.message,
          }
        }
      }

      // For paid plans, create a checkout session
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          planName,
          duration,
          promoCode,
          promoDiscount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new SubscriptionError(
          result.message || "Failed to create subscription",
          result.errorType || "SERVER_ERROR",
        )
      }

      // Check if we have a checkout URL
      if (result.url) {
        toast({
          title: "Redirecting to Checkout",
          description: "You'll be redirected to complete your subscription payment.",
          variant: "default",
        })

        const actionResult = {
          success: true,
          message: "Redirecting to checkout",
          redirectUrl: result.url,
        }

        if (onSubscriptionSuccess) {
          onSubscriptionSuccess(actionResult)
        }

        // Redirect to the checkout URL
        window.location.href = result.url
        return actionResult
      } else if (result.sessionId) {
        // Fallback if only sessionId is returned
        console.warn("No checkout URL returned, but session ID is available:", result.sessionId)
        toast({
          title: "Checkout Ready",
          description: "Your checkout session has been created. Please wait...",
          variant: "default",
        })

        const actionResult = {
          success: true,
          message: "Checkout session created",
        }

        if (onSubscriptionSuccess) {
          onSubscriptionSuccess(actionResult)
        }

        return actionResult
      }

      throw new SubscriptionError("No checkout URL or session ID returned", "SERVER_ERROR")
    } catch (error) {
      console.error("Error subscribing:", error)

      const subscriptionError =
        error instanceof SubscriptionError
          ? error
          : new SubscriptionError(
              error instanceof Error ? error.message : "Failed to create subscription",
              "SERVER_ERROR",
            )

      if (onSubscriptionError) {
        onSubscriptionError(subscriptionError)
      }

      toast({
        title: "Subscription Failed",
        description: subscriptionError.message,
        variant: "destructive",
      })

      return {
        success: false,
        message: subscriptionError.message,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Cancel the current subscription
   */
  const cancelSubscription = async (): Promise<SubscriptionActionResult> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new SubscriptionError(result.message || "Failed to cancel subscription", "SERVER_ERROR")
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully",
        variant: "default",
      })

      const actionResult = {
        success: true,
        message: "Subscription cancelled successfully",
      }

      if (onSubscriptionSuccess) {
        onSubscriptionSuccess(actionResult)
      }

      return actionResult
    } catch (error) {
      console.error("Error cancelling subscription:", error)

      const subscriptionError =
        error instanceof SubscriptionError
          ? error
          : new SubscriptionError(
              error instanceof Error ? error.message : "Failed to cancel subscription",
              "SERVER_ERROR",
            )

      if (onSubscriptionError) {
        onSubscriptionError(subscriptionError)
      }

      toast({
        title: "Cancellation Failed",
        description: subscriptionError.message,
        variant: "destructive",
      })

      return {
        success: false,
        message: subscriptionError.message,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Resume a canceled subscription
   */
  const resumeSubscription = async (): Promise<SubscriptionActionResult> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new SubscriptionError(result.message || "Failed to resume subscription", "SERVER_ERROR")
      }

      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed successfully",
        variant: "default",
      })

      const actionResult = {
        success: true,
        message: "Subscription resumed successfully",
      }

      if (onSubscriptionSuccess) {
        onSubscriptionSuccess(actionResult)
      }

      return actionResult
    } catch (error) {
      console.error("Error resuming subscription:", error)

      const subscriptionError =
        error instanceof SubscriptionError
          ? error
          : new SubscriptionError(
              error instanceof Error ? error.message : "Failed to resume subscription",
              "SERVER_ERROR",
            )

      if (onSubscriptionError) {
        onSubscriptionError(subscriptionError)
      }

      toast({
        title: "Resume Failed",
        description: subscriptionError.message,
        variant: "destructive",
      })

      return {
        success: false,
        message: subscriptionError.message,
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleSubscribe,
    cancelSubscription,
    resumeSubscription,
    canSubscribeToPlan,
    isLoading,
  }
}

