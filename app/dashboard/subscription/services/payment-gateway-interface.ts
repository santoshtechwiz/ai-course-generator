/**
 * Payment Gateway Interface
 *
 * This file defines the interface that all payment gateways must implement.
 * It ensures consistent behavior across different payment providers.
 */

/**
 * Options for payment operations
 */
export interface PaymentOptions {
  /**
   * Optional referral code for tracking referrals
   */
  readonly referralCode?: string

  /**
   * Optional promo code for discounts
   */
  readonly promoCode?: string

  /**
   * Percentage discount to apply (0-100)
   */
  readonly promoDiscount?: number

  /**
   * Additional metadata to include with the payment
   */
  readonly metadata?: Record<string, string>

  /**
   * Customer email address
   */
  readonly customerEmail?: string

  /**
   * Customer name
   */
  readonly customerName?: string
}

/**
 * Result of a checkout session creation
 */
export interface CheckoutResult {
  /**
   * The ID of the created checkout session
   */
  readonly sessionId: string

  /**
   * The URL to redirect the user to for payment
   */
  readonly url: string

  /**
   * Optional customer ID created or used for this checkout
   */
  readonly customerId?: string
}

/**
 * Payment status result
 */
export interface PaymentStatusResult {
  /**
   * The status of the payment
   */
  readonly status: "succeeded" | "pending" | "failed" | "canceled"

  /**
   * The subscription object if available
   */
  readonly subscription?: any

  /**
   * The customer ID if available
   */
  readonly customerId?: string

  /**
   * The amount paid if available
   */
  readonly amountPaid?: number
}

/**
 * Interface that all payment gateways must implement
 */
export interface PaymentGateway {
  /**
   * Create a checkout session for subscription or one-time payment
   *
   * @param userId - The ID of the user making the payment
   * @param planName - The name of the plan being purchased
   * @param duration - The duration of the subscription in months
   * @param options - Additional options for the checkout
   * @returns Promise resolving to checkout session details
   */
  createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    options?: PaymentOptions,
  ): Promise<CheckoutResult>

  /**
   * Cancel a user's subscription
   *
   * @param userId - The ID of the user whose subscription to cancel
   * @returns Promise resolving to boolean indicating success
   */
  cancelSubscription(userId: string): Promise<boolean>

  /**
   * Resume a previously canceled subscription
   *
   * @param userId - The ID of the user whose subscription to resume
   * @returns Promise resolving to boolean indicating success
   */
  resumeSubscription(userId: string): Promise<boolean>

  /**
   * Verify the status of a payment
   *
   * @param sessionId - The ID of the checkout session to verify
   * @returns Promise resolving to payment status details
   */
  verifyPaymentStatus(sessionId: string): Promise<PaymentStatusResult>

  /**
   * Get payment methods for a user
   *
   * @param userId - The ID of the user
   * @returns Promise resolving to array of payment methods
   */
  getPaymentMethods?(userId: string): Promise<any[]>

  /**
   * Update a subscription
   *
   * @param userId - The ID of the user
   * @param planName - The new plan name
   * @returns Promise resolving to boolean indicating success
   */
  updateSubscription?(userId: string, planName: string): Promise<boolean>



  getPaymentStatus?(sessionId: string): Promise<PaymentStatusResult>

  getCustomerDetails?(userId: string): Promise<any>
  getSubscriptionDetails?(userId: string): Promise<any>
  getCheckoutSessionDetails?(sessionId: string): Promise<any>

  getBillingHistory ?(userId: string): Promise<any[]>
}
