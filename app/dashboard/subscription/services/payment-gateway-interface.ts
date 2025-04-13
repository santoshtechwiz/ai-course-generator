/**
 * Payment Gateway Interface
 *
 * This file defines the interface that all payment gateways must implement.
 */

export interface PaymentOptions {
  referralCode?: string
  promoCode?: string
  promoDiscount?: number
  metadata?: Record<string, string>
}

export interface PaymentGateway {
  createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    options?: PaymentOptions,
  ): Promise<{ sessionId: string; url: string }>

  cancelSubscription(userId: string): Promise<boolean>

  resumeSubscription(userId: string): Promise<boolean>

  verifyPaymentStatus(sessionId: string): Promise<{
    status: "succeeded" | "pending" | "failed" | "canceled"
    subscription?: any
  }>
}

