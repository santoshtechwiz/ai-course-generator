"use client"

import { toast } from "sonner"
import { getErrorMessage } from "@/store/utils/async-state"

/**
 * User-friendly error handling utility
 * Provides consistent error handling with user feedback via toast notifications
 */

interface ErrorOptions {
  /** Custom error message to show to user */
  userMessage?: string
  /** Whether to show error as toast (default: true) */
  showToast?: boolean
  /** Toast duration in milliseconds */
  duration?: number
  /** Additional context for logging */
  context?: string
  /** Whether this is a critical error that should be reported */
  isCritical?: boolean
}

/**
 * Handle an error with user-friendly feedback
 * Logs the error and optionally shows a toast notification
 */
export function handleError(error: unknown, options: ErrorOptions = {}) {
  const {
    userMessage,
    showToast = true,
    duration = 5000,
    context = "",
    isCritical = false
  } = options

  // Get user-friendly error message
  const errorMessage = userMessage || getErrorMessage(error)
  const contextPrefix = context ? `[${context}] ` : ""

  // Log error for debugging (always)
  console.error(`${contextPrefix}Error:`, error)

  // Show user-friendly toast notification
  if (showToast) {
    if (isCritical) {
      toast.error(`${contextPrefix}${errorMessage}`, {
        duration,
        description: "This error has been reported. Please try again or contact support if the issue persists."
      })
    } else {
      toast.error(`${contextPrefix}${errorMessage}`, { duration })
    }
  }

  // Could add error reporting service here for critical errors
  if (isCritical) {
    // TODO: Implement error reporting service
    console.warn(`${contextPrefix}Critical error reported:`, error)
  }
}

/**
 * Handle async operation errors with retry option
 */
function handleAsyncError(
  error: unknown,
  retryFn?: () => void | Promise<void>,
  options: ErrorOptions & { retryLabel?: string } = {}
) {
  const { retryLabel = "Retry", ...errorOptions } = options

  handleError(error, errorOptions)

  // Show retry option if provided
  if (retryFn) {
    toast.error("Would you like to try again?", {
      duration: 10000,
      action: {
        label: retryLabel,
        onClick: () => {
          try {
            const result = retryFn()
            if (result instanceof Promise) {
              result.catch(retryError => handleError(retryError, { context: "Retry failed" }))
            }
          } catch (retryError) {
            handleError(retryError, { context: "Retry failed" })
          }
        }
      }
    })
  }
}

/**
 * Handle success with user feedback
 */
export function handleSuccess(message: string, options: { duration?: number } = {}) {
  const { duration = 3000 } = options
  toast.success(message, { duration })
}

/**
 * Handle loading state with toast
 */
function handleLoading(message: string, options: { id?: string | number } = {}) {
  const { id } = options
  return toast.loading(message, { id })
}

/**
 * Dismiss a specific toast
 */
function dismissToast(id: string | number) {
  toast.dismiss(id)
}