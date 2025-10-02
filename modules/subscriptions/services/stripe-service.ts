import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { SecurityService } from '@/services/security-service'

/**
 * Centralized Stripe Service
 * Handles all Stripe-related operations with proper error handling
 */
export class StripeService {
  private static stripe: Stripe | null = null

  /**
   * Get Stripe instance (singleton)
   */
  private static getStripeInstance(): Stripe {
    if (!this.stripe) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is not set')
      }
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia', // Use latest stable API version
      })
    }
    return this.stripe
  }

  /**
   * Create or retrieve a Stripe customer for a user
   */
  static async getOrCreateCustomer(userId: string, email?: string): Promise<string> {
    try {
      // Check if user already has a customer ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      // Return existing customer ID if available
      if (user?.subscription?.stripeCustomerId) {
        return user.subscription.stripeCustomerId
      }

      // Create new customer in Stripe
      const stripe = this.getStripeInstance()
      const customer = await stripe.customers.create({
        email: email || user?.email || undefined,
        metadata: { userId },
      })

      logger.info(`Created new Stripe customer for user ${SecurityService.maskSensitiveString(userId)}`)
      return customer.id
    } catch (error) {
      logger.error(
        `Error creating Stripe customer for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string, 
    planId: string,
    duration: number = 1,
    customerEmail?: string,
    metadata: Record<string, any> = {}
  ): Promise<{ url: string }> {
    try {
      // Get plan details from the database
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      })

      if (!plan) {
        throw new Error(`Plan not found: ${planId}`)
      }

      // Create or retrieve Stripe customer
      const customerId = await this.getOrCreateCustomer(userId, customerEmail)

      // Get the correct price ID based on plan and duration
      const priceId = this.getPriceIdForPlan(planId, duration)
      
      if (!priceId) {
        throw new Error(`No price configured for plan ${planId} with duration ${duration}`)
      }

      const stripe = this.getStripeInstance()
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription?canceled=true`,
        metadata: {
          userId,
          planId,
          duration: duration.toString(),
          ...metadata,
        },
      })

      if (!session.url) {
        throw new Error('Failed to create checkout session URL')
      }

      return { url: session.url }
    } catch (error) {
      logger.error(
        `Error creating checkout session for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Get the Stripe Price ID for a plan and duration
   */
  private static getPriceIdForPlan(planId: string, duration: number = 1): string | null {
    // Map plan IDs to price IDs based on duration
    const priceMap: Record<string, Record<number, string>> = {
      'BASIC': {
        1: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
        12: process.env.STRIPE_PRICE_BASIC_YEARLY || '',
      },
      'PREMIUM': {
        1: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
        12: process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
      },
      'ULTIMATE': {
        1: process.env.STRIPE_PRICE_ULTIMATE_MONTHLY || '',
        12: process.env.STRIPE_PRICE_ULTIMATE_YEARLY || '',
      },
    }

    return priceMap[planId]?.[duration] || null
  }

  /**
   * Handle webhook events from Stripe
   */
  static async handleWebhookEvent(rawBody: string, signature: string): Promise<{success: boolean, message: string}> {
    try {
      const stripe = this.getStripeInstance()
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      )

      // Process different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          break
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
          
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break
          
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break
      }

      return { 
        success: true, 
        message: `Successfully processed ${event.type} event` 
      }
    } catch (error) {
      logger.error('Webhook error:', SecurityService.sanitizeError(error))
      throw error
    }
  }

  /**
   * Handle checkout.session.completed event
   */
  private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (!session.metadata?.userId || !session.metadata?.planId) {
      logger.warn('Checkout session completed without user or plan metadata', {
        sessionId: session.id,
        metadata: session.metadata,
      })
      return
    }

            const userId = session.metadata?.userId
            const planId = session.metadata?.planId
    const duration = parseInt(session.metadata.duration || '1', 10)

    try {
      // Handle subscription creation
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user) {
        logger.error(`User not found for checkout session: ${SecurityService.maskSensitiveString(session.id)}`)
        return
      }

      const tokenAmount = this.getTokenAmountForPlan(planId)
      
      // Update in a transaction
      await prisma.$transaction(async (tx) => {
        // Check if subscription exists
        const existingSubscription = user.subscription
        
        // Calculate subscription dates
        const now = new Date()
        const endDate = new Date(now)
        endDate.setDate(now.getDate() + (duration * 30)) // Approximate month length
        
        if (existingSubscription) {
          // Update existing subscription
          await tx.userSubscription.update({
            where: { id: existingSubscription.id },
            data: {
              planId,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: endDate,
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              cancelAtPeriodEnd: false,
              stripePriceId: session.metadata.price_id,
            },
          })
        } else {
          // Create new subscription
          await tx.userSubscription.create({
            data: {
              userId,
              planId,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: endDate,
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              cancelAtPeriodEnd: false,
              stripePriceId: session.metadata.price_id,
            },
          })
        }

        // Update user records
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: planId,
            isActive: true,
            credits: tokenAmount,
            currentPlanId: planId,
          },
        })

        // Create token transaction record
        await tx.tokenTransaction.create({
          data: {
            userId,
            amount: tokenAmount,
            credits: tokenAmount,
            type: 'SUBSCRIPTION_RENEWAL',
            description: `${tokenAmount} tokens granted for ${planId} subscription activation`,
          },
        })

        // Create subscription event
        await tx.subscriptionEvent.create({
          data: {
            userId,
            userSubscriptionId: existingSubscription?.id,
            previousStatus: existingSubscription?.status || null,
            newStatus: 'ACTIVE',
            reason: 'Subscription checkout completed',
            source: 'STRIPE',
            metadata: {
              planId,
              sessionId: session.id,
              subscriptionId: session.subscription,
              activatedAt: now.toISOString(),
            },
          },
        })
      })

      logger.info(`Subscription activated for user ${SecurityService.maskSensitiveString(userId)}`)
    } catch (error) {
      logger.error(
        `Error handling checkout session for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Handle customer.subscription.updated event
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Find the user associated with this subscription
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
        include: { user: true },
      })

      if (!userSubscription) {
        logger.warn(`No user subscription found for Stripe subscription: ${subscription.id}`)
        return
      }

      const status = this.mapStripeStatusToAppStatus(subscription.status)
      
      // Update in a transaction
      await prisma.$transaction(async (tx) => {
        // Update subscription status
        await tx.userSubscription.update({
          where: { id: userSubscription.id },
          data: {
            status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeStatus: subscription.status,
            lastStripeEvent: 'customer.subscription.updated',
          },
        })

        // Create subscription event
        await tx.subscriptionEvent.create({
          data: {
            userId: userSubscription.userId,
            userSubscriptionId: userSubscription.id,
            previousStatus: userSubscription.status,
            newStatus: status,
            reason: 'Subscription updated',
            source: 'STRIPE',
            metadata: {
              stripeSubscriptionId: subscription.id,
              stripeStatus: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: new Date().toISOString(),
            },
          },
        })
      })

      logger.info(`Updated subscription status for user ${SecurityService.maskSensitiveString(userSubscription.userId)}`)
    } catch (error) {
      logger.error(
        `Error handling subscription update for ID ${subscription.id}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Handle customer.subscription.deleted event
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Find the user associated with this subscription
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
        include: { user: true },
      })

      if (!userSubscription) {
        logger.warn(`No user subscription found for Stripe subscription: ${subscription.id}`)
        return
      }

      // Update in a transaction
      await prisma.$transaction(async (tx) => {
        // Mark subscription as inactive
        await tx.userSubscription.update({
          where: { id: userSubscription.id },
          data: {
            status: 'INACTIVE',
            stripeStatus: 'canceled',
            lastStripeEvent: 'customer.subscription.deleted',
            canceledAt: new Date(),
          },
        })

        // Create subscription event
        await tx.subscriptionEvent.create({
          data: {
            userId: userSubscription.userId,
            userSubscriptionId: userSubscription.id,
            previousStatus: userSubscription.status,
            newStatus: 'INACTIVE',
            reason: 'Subscription deleted',
            source: 'STRIPE',
            metadata: {
              stripeSubscriptionId: subscription.id,
              canceledAt: new Date().toISOString(),
            },
          },
        })
      })

      logger.info(`Marked subscription as inactive for user ${SecurityService.maskSensitiveString(userSubscription.userId)}`)
    } catch (error) {
      logger.error(
        `Error handling subscription deletion for ID ${subscription.id}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Handle invoice.payment_succeeded event
   */
  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription || !invoice.customer) {
      logger.warn('Invoice payment succeeded without subscription or customer', {
        invoiceId: invoice.id,
      })
      return
    }

    try {
      // Find the user associated with this subscription
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeSubscriptionId: invoice.subscription as string },
        include: { user: true },
      })

      if (!userSubscription) {
        logger.warn(`No user subscription found for invoice: ${invoice.id}`)
        return
      }

      const tokenAmount = this.getTokenAmountForPlan(userSubscription.planId)

      // Only grant tokens for renewal invoices (not first payment, which is handled by checkout.session.completed)
      const isRenewal = invoice.billing_reason === 'subscription_cycle'

      if (isRenewal) {
        // Update in a transaction
        await prisma.$transaction(async (tx) => {
          // Update subscription status
          await tx.userSubscription.update({
            where: { id: userSubscription.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(invoice.period_end * 1000),
            },
          })

          // Reset tokens on renewal
          await tx.user.update({
            where: { id: userSubscription.userId },
            data: {
              credits: tokenAmount,
              creditsUsed: 0,
            },
          })

          // Create token transaction record
          await tx.tokenTransaction.create({
            data: {
              userId: userSubscription.userId,
              amount: tokenAmount,
              credits: tokenAmount,
              type: 'SUBSCRIPTION_RENEWAL',
              description: `${tokenAmount} tokens granted for ${userSubscription.planId} subscription renewal`,
            },
          })

          // Create subscription event
          await tx.subscriptionEvent.create({
            data: {
              userId: userSubscription.userId,
              userSubscriptionId: userSubscription.id,
              previousStatus: userSubscription.status,
              newStatus: 'ACTIVE',
              reason: 'Payment succeeded',
              source: 'STRIPE',
              metadata: {
                invoiceId: invoice.id,
                renewedAt: new Date().toISOString(),
                tokensAdded: tokenAmount,
              },
            },
          })
        })

        logger.info(`Renewed subscription with ${tokenAmount} tokens for user ${SecurityService.maskSensitiveString(userSubscription.userId)}`)
      }
    } catch (error) {
      logger.error(
        `Error handling invoice payment for ID ${invoice.id}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Handle invoice.payment_failed event
   */
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription || !invoice.customer) {
      logger.warn('Invoice payment failed without subscription or customer', {
        invoiceId: invoice.id,
      })
      return
    }

    try {
      // Find the user associated with this subscription
      const userSubscription = await prisma.userSubscription.findFirst({
        where: { stripeSubscriptionId: invoice.subscription as string },
        include: { user: true },
      })

      if (!userSubscription) {
        logger.warn(`No user subscription found for invoice: ${invoice.id}`)
        return
      }

      // Mark subscription as past due
      await prisma.userSubscription.update({
        where: { id: userSubscription.id },
        data: {
          status: 'PAST_DUE',
          stripeStatus: 'past_due',
          lastStripeEvent: 'invoice.payment_failed',
        },
      })

      // Create subscription event
      await prisma.subscriptionEvent.create({
        data: {
          userId: userSubscription.userId,
          userSubscriptionId: userSubscription.id,
          previousStatus: userSubscription.status,
          newStatus: 'PAST_DUE',
          reason: 'Payment failed',
          source: 'STRIPE',
          metadata: {
            invoiceId: invoice.id,
            failedAt: new Date().toISOString(),
          },
        },
      })

      logger.info(`Marked subscription as past due for user ${SecurityService.maskSensitiveString(userSubscription.userId)}`)
    } catch (error) {
      logger.error(
        `Error handling failed invoice payment for ID ${invoice.id}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Get token amount for a plan
   */
  private static getTokenAmountForPlan(planId: string): number {
    const tokenMap: Record<string, number> = {
      'FREE': 5,
      'BASIC': 25,
      'PREMIUM': 100,
      'ULTIMATE': 250,
    }

    return tokenMap[planId] || 5
  }

  /**
   * Map Stripe subscription status to application status
   */
  private static mapStripeStatusToAppStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'active': 'ACTIVE',
      'past_due': 'PAST_DUE',
      'unpaid': 'PAST_DUE',
      'canceled': 'INACTIVE',
      'incomplete': 'INACTIVE',
      'incomplete_expired': 'INACTIVE',
      'trialing': 'TRIAL',
      'paused': 'INACTIVE',
    }

    return statusMap[stripeStatus] || 'INACTIVE'
  }

  /**
   * Get billing history for a customer
   */
  static async getBillingHistory(stripeCustomerId: string): Promise<any[]> {
    try {
      const stripe = this.getStripeInstance()
      
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 20,
      })

      return invoices.data.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        description: invoice.description || `Invoice #${invoice.number}`,
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      }))
    } catch (error) {
      logger.error(
        `Error fetching billing history for customer ${SecurityService.maskSensitiveString(stripeCustomerId)}:`,
        SecurityService.sanitizeError(error)
      )
      return []
    }
  }

  /**
   * Get payment methods for a customer
   */
  static async getPaymentMethods(stripeCustomerId: string): Promise<any[]> {
    try {
      const stripe = this.getStripeInstance()
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
      })

      const customer = await stripe.customers.retrieve(stripeCustomerId)
      const defaultPaymentMethodId = typeof customer !== 'string' && customer.invoice_settings?.default_payment_method

      return paymentMethods.data.map(method => ({
        id: method.id,
        type: method.type,
        brand: method.card?.brand || 'unknown',
        last4: method.card?.last4 || '****',
        expMonth: method.card?.exp_month || 0,
        expYear: method.card?.exp_year || 0,
        isDefault: method.id === defaultPaymentMethodId,
      }))
    } catch (error) {
      logger.error(
        `Error fetching payment methods for customer ${SecurityService.maskSensitiveString(stripeCustomerId)}:`,
        SecurityService.sanitizeError(error)
      )
      return []
    }
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(stripeCustomerId: string, paymentMethodId: string): Promise<boolean> {
    try {
      const stripe = this.getStripeInstance()
      
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })

      return true
    } catch (error) {
      logger.error(
        `Error setting default payment method for customer ${SecurityService.maskSensitiveString(stripeCustomerId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }

  /**
   * Delete payment method
   */
  static async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const stripe = this.getStripeInstance()
      
      await stripe.paymentMethods.detach(paymentMethodId)

      return true
    } catch (error) {
      logger.error(
        `Error deleting payment method ${SecurityService.maskSensitiveString(paymentMethodId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }
}