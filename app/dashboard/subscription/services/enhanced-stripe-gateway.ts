/**
 * Enhanced Stripe Payment Gateway Implementation
 *
 * This file contains an improved implementation of the Stripe payment gateway
 * with better error handling, security, caching, and extensibility.
 */

import Stripe from "stripe"
import { prisma } from "@/lib/db"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"
import type { 
  PaymentGateway, 
  PaymentGatewayConfig,
  PaymentOptions, 
  CheckoutResult, 
  PaymentStatusResult,
  PaymentMethodInfo,
  BillingHistoryItem,
  SubscriptionDetails
} from "./payment-gateway-interface"
import { PaymentProvider, PaymentStatus, Currency } from "./payment-gateway-interface"
import { logger } from "@/lib/logger"

// Cache for customer IDs and other frequently accessed data
const customerCache = new Map<string, { customerId: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Enhanced Stripe Payment Gateway implementation
 */
export class EnhancedStripeGateway implements PaymentGateway {
  private stripe: Stripe | null = null
  private config: PaymentGatewayConfig | null = null
  private isInitialized = false

  /**
   * Get the provider name
   */
  getProvider(): PaymentProvider {
    return PaymentProvider.STRIPE
  }

  /**
   * Initialize the gateway with configuration
   */
  async initialize(config: PaymentGatewayConfig): Promise<void> {
    try {
      this.config = config
        this.stripe = new Stripe(config.apiKey, {
        apiVersion: "2025-02-24.acacia",
        timeout: config.timeout || 30000,
        maxNetworkRetries: config.retries || 3,
      })

      this.isInitialized = true
      logger.info("Enhanced Stripe gateway initialized successfully")
    } catch (error) {
      logger.error("Failed to initialize Stripe gateway:", error)
      throw new Error(`Stripe initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Health check for the payment gateway
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized || !this.stripe) {
      return false
    }

    try {
      // Try to retrieve account information as a health check
      await this.stripe.accounts.retrieve()
      return true
    } catch (error) {
      logger.error("Stripe health check failed:", error)
      return false
    }
  }

  /**
   * Create a checkout session for subscription or one-time payment
   */
  async createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    options?: PaymentOptions,
  ): Promise<CheckoutResult> {
    this.ensureInitialized()

    try {
      logger.info(`Creating checkout session for user ${userId}, plan ${planName}, duration ${duration}`)

      // Input validation
      this.validateInput({ userId, planName, duration })

      // Find the plan in our configuration
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planName)
      if (!plan) {
        throw new Error(`Invalid plan name: ${planName}`)
      }

      // Get the user from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      // Check if user already has an active subscription
      if (user.subscription?.planId !== "FREE" && user.subscription?.status === "ACTIVE") {
        throw new Error("User already has an active subscription")
      }      // Find the price option for the selected duration
      const priceOption = plan.options?.find((p: any) => p.duration === duration)
      if (!priceOption) {
        throw new Error(`Invalid duration ${duration} for plan ${planName}`)
      }

      // Get or create Stripe customer
      const customerId = await this.getOrCreateCustomer(user, options)      // Calculate final price with discounts (convert to cents for Stripe)
      const finalPrice = this.calculateFinalPrice(priceOption.price * 100, options)

      // Create the checkout session
      const sessionData: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: options?.currency || Currency.USD,
              product_data: {
                name: plan.name,
                description: `${plan.name} subscription for ${duration} months`,
              },
              unit_amount: finalPrice,
              recurring: {
                interval: "month",
                interval_count: duration,
              },
            },
            quantity: 1,
          },
        ],
        success_url: options?.successUrl || `${process.env.NEXTAUTH_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: options?.cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard/subscription/canceled`,
        metadata: {
          userId,
          planName,
          duration: duration.toString(),
          ...(options?.referralCode && { referralCode: options.referralCode }),
          ...(options?.promoCode && { promoCode: options.promoCode }),
          ...options?.metadata,
        },
        billing_address_collection: options?.collectBilling ? "required" : "auto",
        shipping_address_collection: options?.collectShipping ? { allowed_countries: ["US", "CA", "GB", "AU"] } : undefined,
        ...(options?.trialPeriodDays && {
          subscription_data: {
            trial_period_days: options.trialPeriodDays,
          },
        }),
      }

      // Apply discount if provided
      if (options?.promoDiscount && options.promoDiscount > 0) {
        sessionData.discounts = [
          {
            coupon: await this.createCoupon(options.promoDiscount),
          },
        ]
      }

      const session = await this.stripe!.checkout.sessions.create(sessionData)

      return {
        sessionId: session.id,
        url: session.url!,
        customerId,
        provider: PaymentProvider.STRIPE,
        expiresAt: new Date(session.expires_at * 1000),
        amount: finalPrice,        currency: (options?.currency || Currency.USD) as Currency,
        metadata: session.metadata || {},
      }
    } catch (error) {
      logger.error(`Error creating checkout session:`, error)
      this.handleStripeError(error, "createCheckoutSession")
    }
  }

  /**
   * Cancel a user's subscription
   */
  async cancelSubscription(userId: string, immediate = false): Promise<boolean> {
    this.ensureInitialized()

    try {
      logger.info(`Canceling subscription for user ${userId}, immediate: ${immediate}`)

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user?.subscription?.stripeSubscriptionId) {
        throw new Error("No active subscription found")
      }

      if (immediate) {
        await this.stripe!.subscriptions.cancel(user.subscription.stripeSubscriptionId)
      } else {
        await this.stripe!.subscriptions.update(user.subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })
      }

      // Update database
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: !immediate,
          status: immediate ? "CANCELED" : "ACTIVE",
        },
      })

      return true
    } catch (error) {
      logger.error(`Error canceling subscription:`, error)
      return false
    }
  }

  /**
   * Resume a previously canceled subscription
   */
  async resumeSubscription(userId: string): Promise<boolean> {
    this.ensureInitialized()

    try {
      logger.info(`Resuming subscription for user ${userId}`)

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user?.subscription?.stripeSubscriptionId) {
        throw new Error("No subscription found")
      }

      await this.stripe!.subscriptions.update(user.subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      })

      // Update database
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: false,
          status: "ACTIVE",
        },
      })

      return true
    } catch (error) {
      logger.error(`Error resuming subscription:`, error)
      return false
    }
  }

  /**
   * Verify the status of a payment
   */
  async verifyPaymentStatus(sessionId: string): Promise<PaymentStatusResult> {
    this.ensureInitialized()

    if (!sessionId) {
      throw new Error("Session ID is required")
    }

    try {
      const session = await this.stripe!.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "payment_intent", "customer"],
      })

      const paymentStatus = this.mapStripeStatusToPaymentStatus(session.payment_status)

      return {
        status: paymentStatus,
        subscription: session.subscription,
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        amountPaid: session.amount_total || 0,
        currency: session.currency as Currency,
        transactionId: session.id,        timestamp: new Date(session.created * 1000),
        metadata: session.metadata || {},
      }
    } catch (error) {
      logger.error(`Error verifying payment status:`, error)
      throw error
    }
  }

  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethodInfo[]> {
    this.ensureInitialized()

    try {
      const customerId = await this.getCustomerId(userId)
      if (!customerId) {
        return []
      }

      const paymentMethods = await this.stripe!.paymentMethods.list({
        customer: customerId,
        type: "card",
      })

      return paymentMethods.data.map(pm => this.mapStripePaymentMethod(pm))
    } catch (error) {
      logger.error(`Error getting payment methods:`, error)
      return []
    }
  }

  /**
   * Update a subscription plan
   */
  async updateSubscription(
    userId: string, 
    planName: string, 
    prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
  ): Promise<boolean> {
    this.ensureInitialized()

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user?.subscription?.stripeSubscriptionId) {
        throw new Error("No active subscription found")
      }

      const subscription = await this.stripe!.subscriptions.retrieve(user.subscription.stripeSubscriptionId)
      const newPriceId = await this.getPriceIdForPlan(planName)

      if (!newPriceId) {
        throw new Error(`Price ID not found for plan: ${planName}`)
      }

      await this.stripe!.subscriptions.update(user.subscription.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: prorationBehavior,
      })

      return true
    } catch (error) {
      logger.error(`Error updating subscription:`, error)
      return false
    }
  }

  /**
   * Get detailed payment status
   */
  async getPaymentStatus(sessionId: string): Promise<PaymentStatusResult> {
    return this.verifyPaymentStatus(sessionId)
  }

  /**
   * Get customer details
   */
  async getCustomerDetails(userId: string): Promise<any> {
    this.ensureInitialized()

    try {
      const customerId = await this.getCustomerId(userId)
      if (!customerId) {
        return null
      }

      return await this.stripe!.customers.retrieve(customerId)
    } catch (error) {
      logger.error(`Error getting customer details:`, error)
      return null
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(userId: string): Promise<SubscriptionDetails | null> {
    this.ensureInitialized()

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user?.subscription?.stripeSubscriptionId) {
        return null
      }

      const subscription = await this.stripe!.subscriptions.retrieve(user.subscription.stripeSubscriptionId)

      return {
        id: subscription.id,
        status: subscription.status,
        planId: user.subscription.planId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
        metadata: subscription.metadata,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      }
    } catch (error) {
      logger.error(`Error getting subscription details:`, error)
      return null
    }
  }

  /**
   * Get checkout session details
   */
  async getCheckoutSessionDetails(sessionId: string): Promise<any> {
    this.ensureInitialized()

    try {
      return await this.stripe!.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "payment_intent", "customer"],
      })
    } catch (error) {
      logger.error(`Error getting checkout session details:`, error)
      return null
    }
  }

  /**
   * Get billing history for a user
   */
  async getBillingHistory(userId: string, limit = 50): Promise<BillingHistoryItem[]> {
    this.ensureInitialized()

    try {
      const customerId = await this.getCustomerId(userId)
      if (!customerId) {
        return []
      }

      const invoices = await this.stripe!.invoices.list({
        customer: customerId,
        limit,
      })

      return invoices.data.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_paid,
        currency: invoice.currency as Currency,
        status: this.mapInvoiceStatusToPaymentStatus(invoice.status),
        description: invoice.description || `Invoice for ${invoice.period_start} - ${invoice.period_end}`,        invoiceUrl: invoice.hosted_invoice_url || undefined,
        metadata: invoice.metadata || {},
      }))
    } catch (error) {
      logger.error(`Error getting billing history:`, error)
      return []
    }
  }

  /**
   * Private helper methods
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.stripe) {
      throw new Error("Stripe gateway not initialized")
    }
  }

  private validateInput(input: { userId: string; planName: string; duration: number }): void {
    if (!input.userId) throw new Error("User ID is required")
    if (!input.planName) throw new Error("Plan name is required")
    if (!input.duration || input.duration <= 0) throw new Error("Valid duration is required")
  }

  private async getOrCreateCustomer(user: any, options?: PaymentOptions): Promise<string> {
    // Check cache first
    const cacheKey = user.id
    const cached = customerCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.customerId
    }

    // Check if user already has a Stripe customer ID
    if (user.subscription?.stripeCustomerId) {
      customerCache.set(cacheKey, { customerId: user.subscription.stripeCustomerId, timestamp: Date.now() })
      return user.subscription.stripeCustomerId
    }

    // Create a new Stripe customer
    try {
      const customer = await this.stripe!.customers.create({
        email: options?.customerEmail || user.email,
        name: options?.customerName || user.name,
        metadata: {
          userId: user.id,
          ...options?.metadata,
        },
      })

      // Cache the customer ID
      customerCache.set(cacheKey, { customerId: customer.id, timestamp: Date.now() })

      return customer.id
    } catch (error) {
      logger.error("Error creating Stripe customer:", error)
      throw error
    }
  }

  private calculateFinalPrice(basePrice: number, options?: PaymentOptions): number {
    let finalPrice = basePrice

    if (options?.promoDiscount && options.promoDiscount > 0) {
      finalPrice = Math.round(basePrice * (1 - options.promoDiscount / 100))
    }

    if (options?.taxPercentage && options.taxPercentage > 0) {
      finalPrice = Math.round(finalPrice * (1 + options.taxPercentage / 100))
    }

    return finalPrice
  }

  private async createCoupon(discountPercent: number): Promise<string> {
    const coupon = await this.stripe!.coupons.create({
      percent_off: discountPercent,
      duration: "once",
    })
    return coupon.id
  }

  private async getCustomerId(userId: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      return user?.subscription?.stripeCustomerId || null
    } catch (error) {
      logger.error(`Error getting customer ID:`, error)
      return null
    }
  }

  private async getPriceIdForPlan(planName: string): Promise<string | null> {
    // In a real implementation, this would look up the price ID from a database or configuration
    // For now, we'll return a placeholder
    return `price_${planName.toLowerCase()}_monthly`
  }

  private mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case "paid":
        return PaymentStatus.SUCCEEDED
      case "unpaid":
        return PaymentStatus.PENDING
      case "no_payment_required":
        return PaymentStatus.SUCCEEDED
      default:
        return PaymentStatus.FAILED
    }
  }

  private mapInvoiceStatusToPaymentStatus(invoiceStatus: string | null): PaymentStatus {
    switch (invoiceStatus) {
      case "paid":
        return PaymentStatus.SUCCEEDED
      case "open":
        return PaymentStatus.PENDING
      case "void":
        return PaymentStatus.CANCELED
      default:
        return PaymentStatus.FAILED
    }
  }

  private mapStripePaymentMethod(pm: Stripe.PaymentMethod): PaymentMethodInfo {
    return {
      id: pm.id,
      type: pm.type,
      last4: pm.card?.last4,
      brand: pm.card?.brand,      expiryMonth: pm.card?.exp_month,
      expiryYear: pm.card?.exp_year,
      country: pm.card?.country || undefined,
    }
  }

  private handleStripeError(error: any, operation: string): never {
    if (error.type === "StripeCardError") {
      throw new Error(`Card error: ${error.message}`)
    } else if (error.type === "StripeInvalidRequestError") {
      throw new Error(`Invalid request: ${error.message}`)
    } else if (error.type === "StripeAPIError") {
      throw new Error(`Stripe API error: ${error.message}`)
    } else if (error.type === "StripeConnectionError") {
      throw new Error(`Network error: ${error.message}`)
    } else if (error.type === "StripeAuthenticationError") {
      throw new Error(`Authentication error: ${error.message}`)
    } else {
      throw new Error(`${operation} failed: ${error.message || String(error)}`)
    }
  }
}

export default EnhancedStripeGateway
