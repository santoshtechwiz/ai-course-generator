"use client"

/**
 * Subscription Error Handler Utility
 *
 * This file provides standardized error handling for subscription-related operations.
 */

export type SubscriptionErrorType =
  | "AUTHENTICATION_REQUIRED"
  | "PAYMENT_FAILED"
  | "ALREADY_SUBSCRIBED"
  | "PLAN_CHANGE_RESTRICTED"
  | "SERVER_ERROR"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "STRIPE_ERROR"

interface ErrorOptions {
  notify?: boolean
  log?: boolean
  redirect?: string
  details?: string
}

/**
 * Handles subscription-related errors with consistent logging, notifications, and redirects
 */
export const handleSubscriptionError = (
  error: any,
  errorType: SubscriptionErrorType = "SERVER_ERROR",
  options: ErrorOptions = { notify: true, log: true },
): { success: false; error: SubscriptionErrorType; message: string; details?: string } => {
  const message = error instanceof Error ? error.message : String(error)
  const toast = useToast()
  if (options.log) {
    console.error(`Subscription error (${errorType}):`, error)
  }

  if (options.notify) {
    toast({
      title: getErrorTitle(errorType),
      description: options.details || message,
      variant: "destructive",
    })
  }

  if (options.redirect && typeof window !== "undefined") {
    window.location.href = options.redirect
  }

  return {
    success: false,
    error: errorType,
    message,
    details: options.details,
  }
}

/**
 * Maps error types to user-friendly titles
 */
const getErrorTitle = (errorType: SubscriptionErrorType): string => {
  switch (errorType) {
    case "AUTHENTICATION_REQUIRED":
      return "Authentication Required"
    case "PAYMENT_FAILED":
      return "Payment Failed"
    case "ALREADY_SUBSCRIBED":
      return "Already Subscribed"
    case "PLAN_CHANGE_RESTRICTED":
      return "Plan Change Restricted"
    case "VALIDATION_ERROR":
      return "Validation Error"
    case "NETWORK_ERROR":
      return "Network Error"
    case "STRIPE_ERROR":
      return "Payment Processing Error"
    case "SERVER_ERROR":
    default:
      return "Subscription Error"
  }
}

/**
 * Creates a standardized success response
 */
export const createSuccessResponse = (message: string, data?: any) => {
  return {
    success: true,
    message,
    ...data,
  }
}
