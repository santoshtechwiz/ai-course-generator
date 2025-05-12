/**
 * Subscription Events Utility
 *
 * This file provides a centralized system for subscription-related events
 * to ensure consistent event handling across the application.
 */

export const SUBSCRIPTION_EVENTS = {
  CHANGED: "subscription-changed",
  CANCELED: "subscription-canceled",
  CREATED: "subscription-created",
  RESUMED: "subscription-resumed",
  PAYMENT_SUCCEEDED: "payment-succeeded",
  PAYMENT_FAILED: "payment-failed",
}

/**
 * Dispatches a subscription-related event with optional detail data
 */
export const dispatchSubscriptionEvent = (eventType: string, detail?: any) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(eventType, { detail }))
    console.log(`Event dispatched: ${eventType}`, detail)
  }
}

/**
 * Registers an event listener for subscription events
 * Returns a cleanup function to remove the listener
 */
export const subscribeToEvent = (eventType: string, callback: (event: CustomEvent) => void): (() => void) => {
  if (typeof window === "undefined") return () => {}

  const typedCallback = (event: Event) => {
    callback(event as CustomEvent)
  }

  window.addEventListener(eventType, typedCallback)
  return () => window.removeEventListener(eventType, typedCallback)
}
