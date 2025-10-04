import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/db"

/**
 * Handle successful payments
 */
async function handlePaymentSucceeded(data: any) {
  try {
    logger.info('Payment succeeded webhook received:', data)
    // Add payment success logic here if needed
  } catch (error) {
    logger.error('Error handling payment success:', error)
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(data: any) {
  try {
    logger.info('Subscription updated webhook received:', data)
    // Add subscription update logic here if needed
  } catch (error) {
    logger.error('Error handling subscription update:', error)
  }
}

/**
 * Enhanced Webhook Handler for Subscription Management
 * 
 * Handles trial flow, upgrade flow, and failure tracking using existing schema
 */
export async function POST(req: NextRequest) {
  try {
    // Dynamic imports to avoid circular dependency issues
    const { PaymentWebhookHandler, PaymentProvider } = await import("@/app/dashboard/subscription/services")
    
    // Get the request body and headers
    const body = await req.text()
    
    // Convert headers to a plain object for easier access
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Determine the payment provider based on headers or other indicators
    const provider = determinePaymentProvider(headers, PaymentProvider)
    
    if (!provider) {
      logger.error("Could not determine payment provider from webhook request", {
        userAgent: headers['user-agent'],
        availableHeaders: Object.keys(headers)
      })
      return NextResponse.json(
        { message: "Invalid webhook request - unknown provider" }, 
        { status: 400 }
      )
    }

    // Extract the appropriate signature for the provider
    const signature = headers["stripe-signature"] || 
                     headers["webhook-signature"] || 
                     headers["x-stripe-signature"] ||
                     headers["authorization"] || 
                     ""

    if (!signature && provider === PaymentProvider.STRIPE) {
      logger.warn("No Stripe signature found in webhook headers", {
        availableHeaders: Object.keys(headers)
      })
    }

    logger.info(`Processing webhook from ${provider}`, {
      hasSignature: !!signature,
      bodyLength: body.length
    })

    // Process the webhook using the unified handler with enhanced logging
    const result = await PaymentWebhookHandler.processWebhook(
      provider,
      body,
      signature,
      headers
    )

    // Enhanced webhook processing with subscription state management
    if (result.success) {
      await handleSuccessfulWebhook(result)
      
      logger.info(`Webhook processed successfully: ${result.eventId} (${result.eventType})`)
      return NextResponse.json({ 
        received: true,
        eventId: result.eventId,
        eventType: result.eventType,
        message: result.message
      })
    } else {
      await handleFailedWebhook(result)
      
      logger.error(`Webhook processing failed: ${result.error}`)
      
      // Return appropriate status code based on whether retry is recommended
      const statusCode = result.shouldRetry ? 500 : 400
      
      return NextResponse.json(
        { 
          message: "Webhook processing failed",
          error: result.error,
          eventId: result.eventId,
          shouldRetry: result.shouldRetry
        }, 
        { status: statusCode }
      )
    }
  } catch (error) {
    logger.error("Webhook handler error:", error)
    
    return NextResponse.json(
      { 
        message: "Webhook handler failed", 
        error: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

/**
 * Handle successful webhook events with proper subscription updates
 */
async function handleSuccessfulWebhook(result: any) {
  try {
    if (result.eventType === 'checkout.session.completed') {
      await handleCheckoutCompleted(result.data)
    } else if (result.eventType === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(result.data)
    } else if (result.eventType === 'invoice.payment_succeeded') {
      await handlePaymentSucceeded(result.data)
    }
  } catch (error) {
    logger.error('Error in successful webhook handler:', error)
  }
}

/**
 * Handle failed webhook events and log for billing history
 */
async function handleFailedWebhook(result: any) {
  try {
    // Log failed webhook to TokenTransaction for audit trail
    if (result.userId) {
      await prisma.tokenTransaction.create({
        data: {
          userId: result.userId,
          amount: 0,
          credits: 0,
          type: 'WEBHOOK_FAILURE',
          description: `Webhook failed: ${result.error} (Event: ${result.eventType})`
        }
      })
    }
  } catch (error) {
    logger.error('Error logging failed webhook:', error)
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(data: any) {
  try {
    const customerId = data.customer
    const subscriptionId = data.subscription
    const userId = data.metadata?.userId
    
    logger.info(`Processing checkout completion - Customer: ${customerId}, Subscription: ${subscriptionId}, User: ${userId}`)
    
    if (!customerId) {
      logger.error('No customer ID in checkout data')
      throw new Error('Missing customer ID')
    }
    
    // Find user by Stripe customer ID
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: customerId },
      include: { user: true }
    })
    
    if (!userSubscription) {
      logger.error(`No user subscription found for customer ${customerId}`)
      throw new Error(`No user found for customer ${customerId}`)
    }

    // Use the subscription service to properly activate the paid plan with credits
    const { SubscriptionService } = await import('@/services/subscription-services')
    
    const result = await SubscriptionService.activatePaidPlan(
      userSubscription.userId, 
      userSubscription.planId as any, 
      subscriptionId || `checkout_${data.id}`
    )
    
    if (!result.success) {
      const errorMessage = (result as any)?.message || 'Unknown error'
      logger.error(`Failed to activate plan for user ${userSubscription.userId}: ${errorMessage}`)
      throw new Error(`Plan activation failed: ${errorMessage}`)
    }
    
    // Log subscription event for audit trail
    await prisma.subscriptionEvent.create({
      data: {
        userId: userSubscription.userId,
        userSubscriptionId: userSubscription.id,
        previousStatus: 'PENDING',
        newStatus: 'ACTIVE',
        reason: 'Payment successful - subscription activated with credits',
        source: 'STRIPE'
      }
    })
    
    logger.info(`Successfully activated ${userSubscription.planId} plan for user ${userSubscription.userId} with credits`)
  } catch (error) {
    logger.error('Error handling checkout completion:', error)
    // Re-throw to ensure webhook returns 500 and Stripe retries
    throw error
  }
}

/**
 * Determine the payment provider based on webhook headers
 */
function determinePaymentProvider(headers: Record<string, string>, PaymentProvider: any): any {
  // Stripe webhook detection (multiple header variations)
  if (headers["stripe-signature"] || headers["x-stripe-signature"]) {
    return PaymentProvider.STRIPE
  }

  // PayPal webhook detection
  if (headers["paypal-transmission-id"] || headers["paypal-auth-algo"]) {
    return PaymentProvider.PAYPAL
  }

  // Square webhook detection
  if (headers["square-signature"]) {
    return PaymentProvider.SQUARE
  }

  // Razorpay webhook detection
  if (headers["x-razorpay-signature"]) {
    return PaymentProvider.RAZORPAY
  }

  // Check user-agent for additional clues
  const userAgent = headers["user-agent"]?.toLowerCase() || ""
  
  if (userAgent.includes("stripe")) {
    return PaymentProvider.STRIPE
  }
  
  if (userAgent.includes("paypal")) {
    return PaymentProvider.PAYPAL
  }

  // Check content-type and other indicators
  const contentType = headers["content-type"]?.toLowerCase() || ""
  
  // Stripe typically sends application/json
  if (contentType.includes("application/json")) {
    // Default to Stripe for JSON webhooks if no other indicators
    return PaymentProvider.STRIPE
  }

  // If we still can't determine, log available headers for debugging
  logger.warn("Could not determine payment provider", {
    availableHeaders: Object.keys(headers),
    userAgent: userAgent,
    contentType: contentType
  })

  return null // Don't assume a provider
}

/**
 * Health check endpoint for webhook monitoring
 */
export async function GET() {
  try {
    const { PaymentWebhookHandler } = await import("@/app/dashboard/subscription/services")
    const stats = PaymentWebhookHandler.getProcessingStats()
    const diagnostics = PaymentWebhookHandler.getDiagnosticInfo()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      processing: stats,
      diagnostics: diagnostics,
      version: '1.0.0'
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}
