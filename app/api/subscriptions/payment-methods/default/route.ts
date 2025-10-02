import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { prisma } from "@/lib/db"
import Stripe from "stripe"
import { logger } from "@/lib/logger"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
})

/**
 * Set default payment method API endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse request body
    const { paymentMethodId } = await req.json()
    
    if (!paymentMethodId) {
      return NextResponse.json({ 
        error: "Payment method ID is required" 
      }, { status: 400 })
    }

    // Get the user's subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    })

    if (!user?.subscription?.stripeCustomerId) {
      return NextResponse.json({ 
        error: "No subscription found" 
      }, { status: 404 })
    }

    try {
      // Update customer's default payment method
      await stripe.customers.update(user.subscription.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })

      // Verify the payment method belongs to this customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
      
      if (paymentMethod.customer !== user.subscription.stripeCustomerId) {
        return NextResponse.json({ 
          error: "Payment method does not belong to this customer" 
        }, { status: 403 })
      }

      return NextResponse.json({
        success: true,
        message: "Default payment method updated successfully",
      })
    } catch (stripeError: any) {
      logger.error("Stripe error setting default payment method:", stripeError)
      
      return NextResponse.json({
        success: false,
        error: stripeError.message || "Error setting default payment method",
      }, { status: 400 })
    }
  } catch (error) {
    logger.error("Default payment method API error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}