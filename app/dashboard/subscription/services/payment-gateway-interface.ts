/**
 * Enhanced Payment Gateway Interface
 *
 * This file defines the interface that all payment gateways must implement.
 * It ensures consistent behavior across different payment providers with
 * improved type safety, error handling, and extensibility.
 */

/**
 * Supported payment gateway providers
 */
export enum PaymentProvider {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  SQUARE = "square",
  RAZORPAY = "razorpay"
}

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  SUCCEEDED = "succeeded",
  PENDING = "pending",
  FAILED = "failed",
  CANCELED = "canceled",
  REQUIRES_ACTION = "requires_action",
  PROCESSING = "processing"
}

/**
 * Transaction type enumeration
 */
export enum TransactionType {
  SUBSCRIPTION = "subscription",
  ONE_TIME = "one_time",
  UPGRADE = "upgrade",
  DOWNGRADE = "downgrade",
  RENEWAL = "renewal"
}

/**
 * Currency codes supported
 */
export enum Currency {
  USD = "usd",
  EUR = "eur",
  GBP = "gbp",
  INR = "inr",
  CAD = "cad",
  AUD = "aud"
}

/**
 * Enhanced options for payment operations
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

  /**
   * Currency for the transaction
   */
  readonly currency?: Currency

  /**
   * Transaction type
   */
  readonly transactionType?: TransactionType

  /**
   * Success URL for redirect after payment
   */
  readonly successUrl?: string

  /**
   * Cancel URL for redirect if payment is canceled
   */
  readonly cancelUrl?: string

  /**
   * Whether to collect shipping address
   */
  readonly collectShipping?: boolean

  /**
   * Whether to collect billing address
   */
  readonly collectBilling?: boolean

  /**
   * Tax percentage to apply
   */
  readonly taxPercentage?: number

  /**
   * Custom trial period in days
   */
  readonly trialPeriodDays?: number
}

/**
 * Enhanced result of a checkout session creation
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

  /**
   * The payment provider used
   */
  readonly provider: PaymentProvider

  /**
   * Expiration time of the checkout session
   */
  readonly expiresAt?: Date

  /**
   * Amount to be charged (in cents)
   */
  readonly amount: number

  /**
   * Currency of the transaction
   */
  readonly currency: Currency

  /**
   * Additional metadata
   */
  readonly metadata?: Record<string, any>
}

/**
 * Enhanced payment status result
 */
export interface PaymentStatusResult {
  /**
   * The status of the payment
   */
  readonly status: PaymentStatus

  /**
   * The subscription object if available
   */
  readonly subscription?: any

  /**
   * The customer ID if available
   */
  readonly customerId?: string

  /**
   * The amount paid if available (in cents)
   */
  readonly amountPaid?: number

  /**
   * Currency of the payment
   */
  readonly currency?: Currency

  /**
   * Payment method details
   */
  readonly paymentMethod?: PaymentMethodInfo

  /**
   * Error details if payment failed
   */
  readonly error?: PaymentError

  /**
   * Additional metadata
   */
  readonly metadata?: Record<string, any>

  /**
   * Transaction ID from the payment provider
   */
  readonly transactionId?: string

  /**
   * Timestamp of the payment
   */
  readonly timestamp?: Date
}

/**
 * Payment method information
 */
export interface PaymentMethodInfo {
  readonly id: string
  readonly type: string
  readonly last4?: string
  readonly brand?: string
  readonly expiryMonth?: number
  readonly expiryYear?: number
  readonly country?: string
}

/**
 * Payment error details
 */
export interface PaymentError {
  readonly code: string
  readonly message: string
  readonly type: string
  readonly declineCode?: string
  readonly retryable: boolean
}

/**
 * Billing history item
 */
export interface BillingHistoryItem {
  readonly id: string
  readonly date: Date
  readonly amount: number
  readonly currency: Currency
  readonly status: PaymentStatus
  readonly description: string
  readonly invoiceUrl?: string
  readonly paymentMethod?: PaymentMethodInfo
  readonly metadata?: Record<string, any>
}

/**
 * Subscription details
 */
export interface SubscriptionDetails {
  readonly id: string
  readonly status: string
  readonly planId: string
  readonly currentPeriodStart: Date
  readonly currentPeriodEnd: Date
  readonly cancelAtPeriodEnd: boolean
  readonly customerId: string
  readonly metadata?: Record<string, any>
  readonly trialEnd?: Date
  readonly canceledAt?: Date
}

/**
 * Enhanced interface that all payment gateways must implement
 */
export interface PaymentGateway {
  /**
   * Get the provider name
   */
  getProvider(): PaymentProvider

  /**
   * Initialize the gateway with configuration
   */
  initialize(config: PaymentGatewayConfig): Promise<void>

  /**
   * Health check for the payment gateway
   */
  healthCheck(): Promise<boolean>

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
   * @param immediate - Whether to cancel immediately or at period end
   * @returns Promise resolving to boolean indicating success
   */
  cancelSubscription(userId: string, immediate?: boolean): Promise<boolean>

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
  getPaymentMethods(userId: string): Promise<PaymentMethodInfo[]>

  /**
   * Update a subscription plan
   *
   * @param userId - The ID of the user
   * @param planName - The new plan name
   * @param prorationBehavior - How to handle proration
   * @returns Promise resolving to boolean indicating success
   */
  updateSubscription(
    userId: string, 
    planName: string, 
    prorationBehavior?: 'create_prorations' | 'none'
  ): Promise<boolean>

  /**
   * Get detailed payment status
   *
   * @param sessionId - The session ID
   * @returns Promise resolving to payment status
   */
  getPaymentStatus(sessionId: string): Promise<PaymentStatusResult>

  /**
   * Get customer details
   *
   * @param userId - The user ID
   * @returns Promise resolving to customer details
   */
  getCustomerDetails(userId: string): Promise<any>

  /**
   * Get subscription details
   *
   * @param userId - The user ID
   * @returns Promise resolving to subscription details
   */
  getSubscriptionDetails(userId: string): Promise<SubscriptionDetails | null>

  /**
   * Get checkout session details
   *
   * @param sessionId - The session ID
   * @returns Promise resolving to session details
   */
  getCheckoutSessionDetails(sessionId: string): Promise<any>

  /**
   * Get billing history for a user
   *
   * @param userId - The user ID
   * @param limit - Maximum number of items to return
   * @returns Promise resolving to billing history
   */
  getBillingHistory(userId: string, limit?: number): Promise<BillingHistoryItem[]>

  /**
   * Create a setup intent for saving payment methods
   *
   * @param userId - The user ID
   * @returns Promise resolving to setup intent details
   */
  createSetupIntent?(userId: string): Promise<{ clientSecret: string; setupIntentId: string }>

  /**
   * Detach a payment method
   *
   * @param paymentMethodId - The payment method ID
   * @returns Promise resolving to boolean indicating success
   */
  detachPaymentMethod?(paymentMethodId: string): Promise<boolean>

  /**
   * Process refund
   *
   * @param paymentIntentId - The payment intent ID
   * @param amount - Amount to refund (optional, defaults to full amount)
   * @param reason - Reason for refund
   * @returns Promise resolving to refund details
   */
  processRefund?(
    paymentIntentId: string, 
    amount?: number, 
    reason?: string
  ): Promise<{ id: string; status: string; amount: number }>

  /**
   * Validate webhook signature
   *
   * @param payload - The webhook payload
   * @param signature - The webhook signature
   * @returns Promise resolving to boolean indicating validity
   */
  validateWebhook?(payload: string, signature: string): Promise<boolean>

  /**
   * Process webhook event
   *
   * @param event - The webhook event
   * @returns Promise resolving to processed event result
   */
  processWebhookEvent?(event: any): Promise<{ processed: boolean; message?: string }>
}

/**
 * Payment gateway configuration
 */
export interface PaymentGatewayConfig {
  readonly apiKey: string
  readonly secretKey?: string
  readonly webhookSecret?: string
  readonly environment: 'test' | 'live'
  readonly currency: Currency
  readonly timeout?: number
  readonly retries?: number
  readonly enableLogging?: boolean
}
