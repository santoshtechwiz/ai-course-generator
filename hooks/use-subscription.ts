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
  allowPlanChanges?: boolean
  allowDowngrades?: boolean
  onSubscriptionSuccess?: (result: SubscriptionActionResult) => void
  onSubscriptionError?: (error: SubscriptionError) => void
}

export interface UseSubscriptionReturn {
  isLoading: boolean
  handleSubscribe: (
    planName: SubscriptionPlanType,
    duration: number,
    promoCode?: string,
    promoDiscount?: number,
    referralCode?: string,
  ) => Promise<SubscriptionActionResult>
  cancelSubscription: () => Promise<SubscriptionActionResult>
  resumeSubscription: () => Promise<SubscriptionActionResult>
  canSubscribeToPlan: (
    currentPlan: SubscriptionPlanType | null,
    targetPlan: SubscriptionPlanType,
    subscriptionStatus: string | null,
  ) => {
    canSubscribe: boolean
    reason?: string
  }
}

export const useSubscription = (options: UseSubscriptionOptions = {}): UseSubscriptionReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const session = useSession()

  const { allowPlanChanges = false, allowDowngrades = false, onSubscriptionSuccess, onSubscriptionError } = options

  const canSubscribeToPlan = (
    currentPlan: SubscriptionPlanType | null,
    targetPlan: SubscriptionPlanType,
    subscriptionStatus: string | null,
  ) => {
    if (!currentPlan || subscriptionStatus !== "ACTIVE") return { canSubscribe: true }
    if (currentPlan === targetPlan) return { canSubscribe: false, reason: "You are already subscribed to this plan" }
    if (currentPlan === "FREE") return { canSubscribe: true }
    if (targetPlan === "FREE") {
      return {
        canSubscribe: false,
        reason: "You need to cancel your current subscription before switching to the free plan",
      }
    }

    const planHierarchy: Record<SubscriptionPlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ULTIMATE: 3,
    }

    const isDowngrade = planHierarchy[targetPlan] < planHierarchy[currentPlan]

    if (isDowngrade && !allowDowngrades) {
      return {
        canSubscribe: false,
        reason: "You cannot downgrade your subscription until your current plan expires",
      }
    }

    if (!allowPlanChanges) {
      return {
        canSubscribe: false,
        reason: "You cannot change your subscription until your current plan expires",
      }
    }

    return { canSubscribe: true }
  }

  const handleSubscribe = async (
    planName: SubscriptionPlanType,
    duration: number,
    promoCode?: string,
    promoDiscount?: number,
    referralCode?: string,
  ): Promise<SubscriptionActionResult> => {
    setIsLoading(true)

    try {
      const userId = session?.data?.user?.id

      if (!userId) {
        const error = new SubscriptionError("You must be logged in to subscribe", "AUTHENTICATION_REQUIRED")

        if (onSubscriptionError) onSubscriptionError(error)

        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe to this plan",
          variant: "destructive",
        })

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "pendingSubscription",
            JSON.stringify({
              planName,
              duration,
              promoCode,
              promoDiscount,
              referralCode,
            }),
          )
        }

        return {
          success: false,
          message: "Authentication required",
        }
      }

      if (planName === "FREE") {
        try {
          const response = await fetch("/api/subscriptions/activate-free", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

            window.dispatchEvent(new Event("subscription-changed"))

            const actionResult = {
              success: true,
              message: "Free plan activated successfully",
            }

            if (onSubscriptionSuccess) onSubscriptionSuccess(actionResult)

            return actionResult
          } else {
            throw new SubscriptionError(result.message || "Failed to activate free plan", "SERVER_ERROR")
          }
        } catch (error) {
          const subscriptionError =
            error instanceof SubscriptionError
              ? error
              : new SubscriptionError(
                  error instanceof Error ? error.message : "Failed to activate free plan",
                  "SERVER_ERROR",
                )

          if (onSubscriptionError) onSubscriptionError(subscriptionError)

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

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planName,
          duration,
          promoCode,
          promoDiscount,
          referralCode, 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new SubscriptionError(
          result.message || "Failed to create subscription",
          result.errorType || "SERVER_ERROR",
        )
      }

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

        if (onSubscriptionSuccess) onSubscriptionSuccess(actionResult)

        window.location.href = result.url
        return actionResult
      } else if (result.sessionId) {
        toast({
          title: "Checkout Ready",
          description: "Your checkout session has been created. Please wait...",
          variant: "default",
        })

        const actionResult = {
          success: true,
          message: "Checkout session created",
        }

        if (onSubscriptionSuccess) onSubscriptionSuccess(actionResult)

        return actionResult
      }

      throw new SubscriptionError("No checkout URL or session ID returned", "SERVER_ERROR")
    } catch (error) {
      const subscriptionError =
        error instanceof SubscriptionError
          ? error
          : new SubscriptionError(
              error instanceof Error ? error.message : "Failed to create subscription",
              "SERVER_ERROR",
            )

      if (onSubscriptionError) onSubscriptionError(subscriptionError)

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

  const cancelSubscription = async (): Promise<SubscriptionActionResult> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const actionResult = { success: true, message: "Subscription cancelled successfully" }

      if (onSubscriptionSuccess) onSubscriptionSuccess(actionResult)

      return actionResult
    } catch (error) {
      const subscriptionError =
        error instanceof SubscriptionError
          ? error
          : new SubscriptionError(
              error instanceof Error ? error.message : "Failed to cancel subscription",
              "SERVER_ERROR",
            )

      if (onSubscriptionError) onSubscriptionError(subscriptionError)

      toast({
        title: "Cancellation Failed",
        description: subscriptionError.message,
        variant: "destructive",
      })

      return { success: false, message: subscriptionError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const resumeSubscription = async (): Promise<SubscriptionActionResult> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const actionResult = { success: true, message: "Subscription resumed successfully" }

      if (onSubscriptionSuccess) onSubscriptionSuccess(actionResult)

      return actionResult
    } catch (error) {
      const subscriptionError =
        error instanceof SubscriptionError
          ? error
          : new SubscriptionError(
              error instanceof Error ? error.message : "Failed to resume subscription",
              "SERVER_ERROR",
            )

      if (onSubscriptionError) onSubscriptionError(subscriptionError)

      toast({
        title: "Resume Failed",
        description: subscriptionError.message,
        variant: "destructive",
      })

      return { success: false, message: subscriptionError.message }
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
