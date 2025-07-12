import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

/**
 * Webhook Handler
 * 
 * This endpoint handles webhooks from all supported payment providers
 * using the unified webhook handler system.
 */
export async function POST(req: NextRequest) {
  try {
    // Dynamic imports to avoid circular dependency issues
    const { PaymentWebhookHandler, PaymentProvider } = await import("@/app/dashboard/subscription/services")
    
    // Get the request body and headers
    const body = await req.text()
    const signature = req.headers.get("stripe-signature") || req.headers.get("webhook-signature") || ""
    
    // Convert headers to a plain object
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })    // Determine the payment provider based on headers or other indicators
    const provider = determinePaymentProvider(headers, PaymentProvider)
    
    if (!provider) {
      logger.error("Could not determine payment provider from webhook request")
      return NextResponse.json(
        { message: "Invalid webhook request - unknown provider" }, 
        { status: 400 }
      )
    }

    logger.info(`Processing webhook from ${provider}`)

    // Process the webhook using the unified handler
    const result = await PaymentWebhookHandler.processWebhook(
      provider,
      body,
      signature,
      headers
    )

    if (result.success) {
      logger.info(`Webhook processed successfully: ${result.eventId} (${result.eventType})`)
      return NextResponse.json({ 
        received: true,
        eventId: result.eventId,
        eventType: result.eventType,
        message: result.message
      })
    } else {
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
 * Determine the payment provider based on webhook headers
 */
function determinePaymentProvider(headers: Record<string, string>, PaymentProvider: any): any {
  // Stripe webhook detection
  if (headers["stripe-signature"]) {
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

  // Default to Stripe if we can't determine (for backward compatibility)
  return PaymentProvider.STRIPE
}

/**
 * Health check endpoint for webhook monitoring
 */
export async function GET() {
  try {
    const { PaymentWebhookHandler } = await import("@/app/dashboard/subscription/services")
    const stats = PaymentWebhookHandler.getProcessingStats()
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      processingStats: stats,
      message: "Webhook handler is operational"
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
