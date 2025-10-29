/**
 * Payment Webhook Handler
 *
 * This file provides utilities for handling payment webhooks from various providers
 * with proper validation, processing, and error handling.
 */

import type { PaymentGateway } from "./payment-gateway-interface"
import { PaymentProvider, PaymentStatus } from "./payment-gateway-interface"
import { getPaymentGateway } from "./payment-gateway-factory"
import { PaymentSecurityUtils } from "./payment-config-manager"
import { SubscriptionService } from '@/services/subscription-services'
import { logger } from "@/lib/logger"

/**
 * Webhook event types
 */
enum WebhookEventType {
  PAYMENT_SUCCEEDED = "payment_succeeded",
  PAYMENT_FAILED = "payment_failed",
  SUBSCRIPTION_CREATED = "subscription_created",
  SUBSCRIPTION_UPDATED = "subscription_updated",
  SUBSCRIPTION_CANCELED = "subscription_canceled",
  INVOICE_PAID = "invoice_paid",
  INVOICE_FAILED = "invoice_failed",
  CUSTOMER_UPDATED = "customer_updated",
}

/**
 * Webhook event data
 */
interface WebhookEvent {
  readonly id: string
  readonly type: WebhookEventType
  readonly provider: PaymentProvider
  readonly data: any
  readonly timestamp: Date
  readonly signature?: string
}

/**
 * Webhook processing result
 */
interface WebhookProcessingResult {
  readonly success: boolean
  readonly eventId: string
  readonly eventType: WebhookEventType
  readonly message?: string
  readonly error?: string
  readonly shouldRetry?: boolean
}

/**
 * Webhook handler for processing payment events
 */
export class PaymentWebhookHandler {
  private static processingCache = new Map<string, Date>()
  private static readonly PROCESSING_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Process a webhook event
   */
  static async processWebhook(
    provider: PaymentProvider,
    payload: string,
    signature: string,
    headers: Record<string, string>
  ): Promise<WebhookProcessingResult> {
    try {
      logger.info(`Processing webhook from ${provider}`)

      // Get the appropriate payment gateway
      const gateway = await getPaymentGateway(provider)

      // Validate the webhook signature
      const isValid = await this.validateWebhookSignature(gateway, payload, signature)
      if (!isValid) {
        return {
          success: false,
          eventId: 'unknown',
          eventType: WebhookEventType.PAYMENT_FAILED,
          error: 'Invalid webhook signature',
          shouldRetry: false,
        }
      }

      // Parse the webhook event
      const event = await this.parseWebhookEvent(provider, payload, headers)
      if (!event) {
        return {
          success: false,
          eventId: 'unknown',
          eventType: WebhookEventType.PAYMENT_FAILED,
          error: 'Failed to parse webhook event',
          shouldRetry: false,
        }
      }

      // Check for duplicate processing
      if (this.isDuplicateEvent(event.id)) {
        logger.info(`Skipping duplicate event: ${event.id}`)
        return {
          success: true,
          eventId: event.id,
          eventType: event.type,
          message: 'Event already processed',
        }
      }

      // Mark event as being processed
      this.markEventAsProcessing(event.id)

      // Process the event based on its type
      const result = await this.processEventByType(event, gateway)

      // Clean up processing cache
      this.processingCache.delete(event.id)

      return result
    } catch (error) {
      logger.error(`Error processing webhook:`, error)
      return {
        success: false,
        eventId: 'unknown',
        eventType: WebhookEventType.PAYMENT_FAILED,
        error: error instanceof Error ? error.message : String(error),
        shouldRetry: true,
      }
    }
  }

  /**
   * Validate webhook signature
   */
  private static async validateWebhookSignature(
    gateway: PaymentGateway,
    payload: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Check if gateway supports webhook validation
      if (!gateway.validateWebhook) {
        logger.warn('Gateway does not support webhook validation', {
          provider: gateway.getProvider()
        })
        return true // Allow processing but log the warning
      }

      const isValid = await gateway.validateWebhook(payload, signature)
      if (!isValid) {
        logger.error('Webhook signature validation failed', {
          provider: gateway.getProvider(),
          signatureLength: signature?.length || 0
        })
      }
      
      return isValid
    } catch (error) {
      logger.error('Error validating webhook signature:', {
        error: error instanceof Error ? error.message : String(error),
        provider: gateway.getProvider()
      })
      return false
    }
  }

  /**
   * Parse webhook event from different providers
   */
  private static async parseWebhookEvent(
    provider: PaymentProvider,
    payload: string,
    headers: Record<string, string>
  ): Promise<WebhookEvent | null> {
    try {
      logger.info(`Parsing webhook event for provider: ${provider}`, {
        payloadLength: payload.length,
        payloadPreview: payload.substring(0, 200)
      })

      // Guard: empty or malformed payload
      if (!payload || !payload.trim()) {
        logger.error('Webhook payload empty')
        return null
      }

      let parsedPayload: any
      try {
        parsedPayload = JSON.parse(payload)
      } catch (jsonErr) {
        logger.error('Failed to parse webhook JSON payload', { 
          error: jsonErr instanceof Error ? jsonErr.message : jsonErr,
          provider,
          payloadLength: payload.length,
          payloadStart: payload.substring(0, 100)
        })
        return null
      }

      // Validate required fields
      if (!parsedPayload || typeof parsedPayload !== 'object') {
        logger.error('Webhook payload is not a valid object', { provider })
        return null
      }

      if (!parsedPayload.id || !parsedPayload.type) {
        logger.error('Webhook payload missing required id or type fields', { 
          provider, 
          hasId: !!parsedPayload.id, 
          hasType: !!parsedPayload.type,
          actualType: parsedPayload.type,
          keys: Object.keys(parsedPayload)
        })
        return null
      }

      logger.info(`Successfully parsed webhook payload`, {
        provider,
        eventId: parsedPayload.id,
        eventType: parsedPayload.type
      })

      switch (provider) {
        case PaymentProvider.STRIPE:
          return this.parseStripeEvent(parsedPayload)

        case PaymentProvider.PAYPAL:
          return this.parsePayPalEvent(parsedPayload)

        case PaymentProvider.SQUARE:
          return this.parseSquareEvent(parsedPayload)

        case PaymentProvider.RAZORPAY:
          return this.parseRazorpayEvent(parsedPayload)

        default:
          logger.warn(`No webhook parser for provider: ${provider}`)
          return null
      }
    } catch (error) {
      logger.error('Error parsing webhook payload:', {
        error: error instanceof Error ? error.message : String(error),
        provider,
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined
      })
      return null
    }
  }

  /**
   * Parse Stripe webhook event
   */
  private static parseStripeEvent(payload: any): WebhookEvent | null {
    try {
      const eventTypeMap: Record<string, WebhookEventType> = {
        'checkout.session.completed': WebhookEventType.PAYMENT_SUCCEEDED,
        'payment_intent.succeeded': WebhookEventType.PAYMENT_SUCCEEDED,
        'payment_intent.payment_failed': WebhookEventType.PAYMENT_FAILED,
        'customer.subscription.created': WebhookEventType.SUBSCRIPTION_CREATED,
        'customer.subscription.updated': WebhookEventType.SUBSCRIPTION_UPDATED,
        'customer.subscription.deleted': WebhookEventType.SUBSCRIPTION_CANCELED,
        'invoice.paid': WebhookEventType.INVOICE_PAID,
        'invoice.payment_succeeded': WebhookEventType.INVOICE_PAID,
        'invoice_payment.paid': WebhookEventType.INVOICE_PAID, // Alternative format
        'invoice.payment_failed': WebhookEventType.INVOICE_FAILED,
        'invoice.payment_action_required': WebhookEventType.INVOICE_FAILED,
        'customer.updated': WebhookEventType.CUSTOMER_UPDATED,
      }

      const eventType = eventTypeMap[payload.type]
      if (!eventType) {
        logger.info(`Ignoring Stripe event type: ${payload.type}`, {
          eventId: payload.id,
          availableTypes: Object.keys(eventTypeMap)
        })
        return null
      }

      logger.info(`Processing Stripe event: ${payload.type}`, {
        eventId: payload.id,
        mappedTo: eventType
      })

      return {
        id: payload.id,
        type: eventType,
        provider: PaymentProvider.STRIPE,
        data: payload.data,
        timestamp: new Date(payload.created * 1000),
      }
    } catch (error) {
      logger.error('Error parsing Stripe event:', error)
      return null
    }
  }

  /**
   * Parse PayPal webhook event (placeholder)
   */
  private static parsePayPalEvent(payload: any): WebhookEvent | null {
    // Implementation would depend on PayPal's webhook structure
    logger.info('PayPal webhook parsing not yet implemented')
    return null
  }

  /**
   * Parse Square webhook event (placeholder)
   */
  private static parseSquareEvent(payload: any): WebhookEvent | null {
    // Implementation would depend on Square's webhook structure
    logger.info('Square webhook parsing not yet implemented')
    return null
  }

  /**
   * Parse Razorpay webhook event (placeholder)
   */
  private static parseRazorpayEvent(payload: any): WebhookEvent | null {
    // Implementation would depend on Razorpay's webhook structure
    logger.info('Razorpay webhook parsing not yet implemented')
    return null
  }

  /**
   * Check if event is a duplicate
   */
  private static isDuplicateEvent(eventId: string): boolean {
    const processingTime = this.processingCache.get(eventId)
    if (processingTime) {
      const isExpired = Date.now() - processingTime.getTime() > this.PROCESSING_TTL
      if (isExpired) {
        this.processingCache.delete(eventId)
        return false
      }
      return true
    }
    return false
  }

  /**
   * Mark event as being processed
   */
  private static markEventAsProcessing(eventId: string): void {
    this.processingCache.set(eventId, new Date())
  }

  /**
   * Get diagnostic information for webhook debugging
   */
  static getDiagnosticInfo(): {
    environmentCheck: any;
    supportedEvents: string[];
    lastProcessed: string[];
  } {
    const supportedEvents = [
      'checkout.session.completed',
      'payment_intent.succeeded', 
      'payment_intent.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_succeeded',
      'invoice_payment.paid',
      'invoice.payment_failed',
      'customer.updated'
    ]

    return {
      environmentCheck: {
        hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        nodeEnv: process.env.NODE_ENV
      },
      supportedEvents,
      lastProcessed: Array.from(this.processingCache.keys()).slice(-10)
    }
  }

  /**
   * Process event based on its type
   */
  private static async processEventByType(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    try {
      logger.info(`Processing ${event.type} event: ${event.id}`)

      switch (event.type) {
        case WebhookEventType.PAYMENT_SUCCEEDED:
          return await this.handlePaymentSucceeded(event, gateway)

        case WebhookEventType.PAYMENT_FAILED:
          return await this.handlePaymentFailed(event, gateway)

        case WebhookEventType.SUBSCRIPTION_CREATED:
          return await this.handleSubscriptionCreated(event, gateway)

        case WebhookEventType.SUBSCRIPTION_UPDATED:
          return await this.handleSubscriptionUpdated(event, gateway)

        case WebhookEventType.SUBSCRIPTION_CANCELED:
          return await this.handleSubscriptionCanceled(event, gateway)

        case WebhookEventType.INVOICE_PAID:
          return await this.handleInvoicePaid(event, gateway)

        case WebhookEventType.INVOICE_FAILED:
          return await this.handleInvoiceFailed(event, gateway)

        case WebhookEventType.CUSTOMER_UPDATED:
          return await this.handleCustomerUpdated(event, gateway)

        default:
          return {
            success: true,
            eventId: event.id,
            eventType: event.type,
            message: `Event type ${event.type} processed (no action required)`,
          }
      }
    } catch (error) {
      logger.error(`Error processing event ${event.id}:`, error)
      return {
        success: false,
        eventId: event.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error),
        shouldRetry: true,
      }
    }
  }
  /**
   * Handle payment succeeded event
   */
  private static async handlePaymentSucceeded(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    try {
      // Extract user information from event metadata
      const userId = event.data.object?.metadata?.userId
      const sessionId = event.data.object?.id

      if (userId && sessionId) {
        const result = await SubscriptionService.verifyPaymentSuccess(userId, sessionId)
        if (result.success) {
          logger.info(`Payment processed successfully for user ${userId}`)
        } else {
          logger.error(`Failed to process payment for user ${userId}: ${result.message}`)
        }
      }

      // Handle checkout session completed specifically for Stripe
      if (event.provider === PaymentProvider.STRIPE && 
          event.data.object?.object === 'checkout.session') {
        await this.handleStripeCheckoutSessionCompleted(event.data.object)
      }

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message: 'Payment succeeded event processed',
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle payment failed event
   */
  private static async handlePaymentFailed(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    // Log payment failure for monitoring
    logger.warn(`Payment failed: ${JSON.stringify(PaymentSecurityUtils.sanitizeForLogging(event.data))}`)

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      message: 'Payment failed event logged',
    }
  }

  /**
   * Handle subscription created event
   */
  private static async handleSubscriptionCreated(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    logger.info(`Subscription created: ${event.data.object?.id}`)

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      message: 'Subscription created event processed',
    }
  }
  /**
   * Handle subscription updated event
   */
  private static async handleSubscriptionUpdated(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    try {
      if (event.provider === PaymentProvider.STRIPE) {
        await this.handleStripeSubscriptionUpdated(event.data.object)
      }

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message: 'Subscription updated event processed',
      }
    } catch (error) {
      throw error
    }
  }
  /**
   * Handle subscription canceled event
   */
  private static async handleSubscriptionCanceled(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    try {
      if (event.provider === PaymentProvider.STRIPE) {
        await this.handleStripeSubscriptionDeleted(event.data.object)
      }

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message: 'Subscription canceled event processed',
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle invoice paid event
   */
  private static async handleInvoicePaid(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    try {
      if (event.provider === PaymentProvider.STRIPE) {
        await this.handleStripeInvoicePaid(event.data.object)
      }

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message: 'Invoice paid event processed',
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle invoice failed event
   */
  private static async handleInvoiceFailed(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    try {
      if (event.provider === PaymentProvider.STRIPE) {
        await this.handleStripeInvoiceFailed(event.data.object)
      }

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message: 'Invoice failed event processed',
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle customer updated event
   */
  private static async handleCustomerUpdated(
    event: WebhookEvent,
    gateway: PaymentGateway
  ): Promise<WebhookProcessingResult> {
    try {
      if (event.provider === PaymentProvider.STRIPE) {
        await this.handleStripeCustomerUpdated(event.data.object)
      }

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message: 'Customer updated event processed',
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle Stripe invoice paid
   */
  private static async handleStripeInvoicePaid(invoice: any): Promise<void> {
    const { prisma } = await import("@/lib/db")
    const SubscriptionPlanType = (await import("@/types/subscription-plans")).default

    if (!invoice.subscription || !invoice.customer) {
      return
    }

    try {
      // Find the user by Stripe customer ID
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeCustomerId: invoice.customer as string },
      })

      if (!userSubscription) {
        logger.error(`No user found with Stripe customer ID: ${invoice.customer}`)
        return
      }

      // Update subscription status to ACTIVE
      await prisma.userSubscription.update({
        where: { id: userSubscription.id },
        data: { status: "ACTIVE" },
      })

      // For invoice paid events, we might want to add tokens for renewals
      // This logic can be customized based on your business requirements
      logger.info(`Invoice paid for user ${userSubscription.userId}`)
    } catch (error) {
      logger.error("Error processing Stripe invoice paid:", error)
    }  }

  /**
   * Handle Stripe invoice failed
   */
  private static async handleStripeInvoiceFailed(invoice: any): Promise<void> {
    const { prisma } = await import("@/lib/db")

    if (!invoice.subscription || !invoice.customer) {
      return
    }

    try {
      // Find the user by Stripe customer ID
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeCustomerId: invoice.customer as string },
      })

      if (!userSubscription) {
        logger.error(`No user found with Stripe customer ID: ${invoice.customer}`)
        return
      }

      // Update subscription status to PAST_DUE
      await prisma.userSubscription.update({
        where: { id: userSubscription.id },
        data: { status: "PAST_DUE" },
      })

      logger.info(`Updated subscription status to PAST_DUE for user ${userSubscription.userId} due to invoice failure`)
    } catch (error) {
      logger.error("Error processing Stripe invoice failed:", error)
    }
  }

  /**
   * Handle Stripe subscription updated
   */
  private static async handleStripeSubscriptionUpdated(subscription: any): Promise<void> {
    const { prisma } = await import("@/lib/db")

    try {
      // Find the user by Stripe subscription ID
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      })

      if (!userSubscription) {
        logger.error(`No user found with Stripe subscription ID: ${subscription.id}`)
        return
      }

      // Map Stripe status to our status
      let status: string
      switch (subscription.status) {
        case "active":
          status = "ACTIVE"
          break
        case "past_due":
          status = "PAST_DUE"
          break
        case "canceled":
          status = "CANCELED"
          break
        case "unpaid":
          status = "PAST_DUE"
          break
        default:
          status = "INACTIVE"
      }

      // Use consistent subscription service
      const result = await SubscriptionService.updateSubscription(
        userSubscription.userId,
        {
          subscriptionPlan: userSubscription.planId as any,
          status: status as any,
          expirationDate: new Date(subscription.current_period_end * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      )

      if (!result.success) {
        logger.error(`Failed to update subscription status for user ${userSubscription.userId}`)
      } else {
        logger.info(`Successfully updated subscription status for user ${userSubscription.userId} to ${status}`)
      }
    } catch (error) {
      logger.error("Error processing Stripe subscription updated:", error)
    }  }

  /**
   * Handle Stripe subscription deleted
   */
  private static async handleStripeSubscriptionDeleted(subscription: any): Promise<void> {
    const { prisma } = await import("@/lib/db")

    try {
      // Find the user by Stripe subscription ID
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      })

      if (!userSubscription) {
        logger.error(`No user found with Stripe subscription ID: ${subscription.id}`)
        return
      }

      // Use consistent subscription service to cancel
      const result = await SubscriptionService.cancelSubscription(userSubscription.userId)
      
      if (!result) {
        logger.error(`Failed to cancel subscription for user ${userSubscription.userId}`)
      } else {
        logger.info(`Successfully canceled subscription for user ${userSubscription.userId}`)
      }
    } catch (error) {
      logger.error("Error processing Stripe subscription deleted:", error)
    }
  }

  /**
   * Handle Stripe checkout session completed
   */
  private static async handleStripeCheckoutSessionCompleted(session: any): Promise<void> {
    const { prisma } = await import("@/lib/db")

    if (!session.metadata?.userId) {
      logger.error("No user ID in session metadata")
      return
    }

    const userId = session.metadata.userId
    const planId = session.metadata.planName || session.metadata.planId

    try {
      // If this is a subscription checkout
      if (session.mode === "subscription" && session.subscription) {
        logger.info(`Processing subscription checkout for user ${userId}, plan ${planId}`)
        
        // Use activatePaidPlan which handles credits properly
        const result = await SubscriptionService.activatePaidPlan(
          userId,
          planId as any,
          session.subscription
        )

        if (!result.success) {
          logger.error(`Failed to activate paid plan for user ${userId}: ${result.message || 'Unknown error'}`)
          throw new Error(`Plan activation failed: ${result.message || 'Unknown error'}`)
        }

        logger.info(`Successfully activated ${planId} plan for user ${userId} with credits`)

        // Process referral if applicable
        if (session.metadata.referralUseId || session.metadata.referralCode) {
          await this.processStripeReferralBenefits(session)
        }
      } else if (session.mode === "payment") {
        // Handle one-time payments (if applicable)
        logger.info(`Processing one-time payment for user ${userId}`)
        
        // For one-time payments, we might still want to add credits
        const tokensToAdd = Number.parseInt(session.metadata.tokens || "0", 10)
        if (tokensToAdd > 0) {
          await SubscriptionService.addCreditsToUser(userId, tokensToAdd, "One-time payment")
          logger.info(`Added ${tokensToAdd} credits to user ${userId} from one-time payment`)
        }
      }
    } catch (error) {
      logger.error("Error processing Stripe checkout session:", error)
      // Re-throw to trigger webhook retry
      throw error
    }
  }

  /**
   * Process referral benefits for Stripe
   */
  private static async processStripeReferralBenefits(session: any): Promise<void> {
    const { prisma } = await import("@/lib/db")

    try {
      const userId = session.metadata.userId
      const referralUseId = session.metadata.referralUseId
      const referralCode = session.metadata.referralCode

      // Skip if no referral information
      if (!userId || (!referralCode && !referralUseId)) {
        return
      }

      // Check if this referral has already been processed
      const existingReferralUse = await prisma.userReferralUse.findFirst({
        where: {
          referredId: userId,
          status: "COMPLETED",
        },
      })

      if (existingReferralUse) {
        logger.info(`Referral for user ${userId} already processed`)
        return
      }

      // Find referral record either by ID or code
      let referral
      let referrerId

      if (referralUseId) {
        const referralUse = await prisma.userReferralUse.findUnique({
          where: { id: referralUseId },
          include: { referral: true },
        })

        if (referralUse) {
          referral = referralUse.referral
          referrerId = referralUse.referrerId

          // Update the referral use status
          await prisma.userReferralUse.update({
            where: { id: referralUseId },
            data: { status: "COMPLETED" },
          })
        }
      } else if (referralCode) {
        referral = await prisma.userReferral.findUnique({
          where: { referralCode },
        })

        if (referral) {
          referrerId = referral.userId

          // Create a new referral use record
          await prisma.userReferralUse.create({
            data: {
              referrerId: referrerId,
              referredId: userId,
              referralId: referral.id,
              status: "COMPLETED",
              planId: session.metadata.planName || "UNKNOWN",
            },
          })
        }
      }

      if (!referral || !referrerId || referrerId === userId) {
        logger.info(`No valid referral found or self-referral for user ${userId}`)
        return
      }

      const REFERRER_BONUS = 10
      const REFERRED_USER_BONUS = 5

      // Add bonus to referred user (current user)
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: user.credits + REFERRED_USER_BONUS,
          },
        })

        await prisma.tokenTransaction.create({
          data: {
            userId,
            credits: REFERRED_USER_BONUS,
            amount: 0,
            type: "REFERRAL",
            description: `Referral bonus for subscribing using referral code`,
          },
        })
      }

      // Add bonus to referrer
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
      })

      if (referrer) {
        await prisma.user.update({
          where: { id: referrerId },
          data: {
            credits: referrer.credits + REFERRER_BONUS,
          },
        })

        await prisma.tokenTransaction.create({
          data: {
            userId: referrerId,
            credits: REFERRER_BONUS,
            amount: 0,
            type: "REFERRAL",
            description: `Referral bonus for user ${userId} subscribing to ${session.metadata.planName || "subscription"} plan`,
          },
        })
      }

      logger.info(`Successfully applied referral benefits for user ${userId}`)
    } catch (error) {
      logger.error("Error processing referral benefits:", error)
    }
  }

  /**
   * Clean up old processing cache entries
   */
  static cleanupProcessingCache(): void {
    const now = Date.now()
    for (const [eventId, processingTime] of this.processingCache.entries()) {
      if (now - processingTime.getTime() > this.PROCESSING_TTL) {
        this.processingCache.delete(eventId)
      }
    }
  }

  /**
   * Get processing cache statistics
   */
  static getProcessingStats(): {
    cacheSize: number
    oldestEntry: Date | null
    newestEntry: Date | null
  } {
    const entries = Array.from(this.processingCache.values())
    return {
      cacheSize: this.processingCache.size,
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(d => d.getTime()))) : null,
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(d => d.getTime()))) : null,
    }
  }

  /**
   * Handle Stripe customer updated
   */
  private static async handleStripeCustomerUpdated(customer: any): Promise<void> {
    const { prisma } = await import("@/lib/db")

    try {
      // Find the user by Stripe customer ID
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeCustomerId: customer.id },
      })

      if (!userSubscription) {
        logger.info(`No user found with Stripe customer ID: ${customer.id}`)
        return
      }

      // Log customer update for monitoring
      logger.info(`Customer updated for user ${userSubscription.userId}: ${customer.id}`)
      
      // Add any specific customer update logic here if needed
      // For example, updating email, payment methods, etc.
    } catch (error) {
      logger.error("Error processing Stripe customer updated:", error)
    }
  }
}


