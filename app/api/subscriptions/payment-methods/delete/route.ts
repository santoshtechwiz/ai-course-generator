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
 * Delete payment method API endpoint
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
      // Verify the payment method belongs to this customer before deletion
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
      
      if (paymentMethod.customer !== user.subscription.stripeCustomerId) {
        return NextResponse.json({ 
          error: "Payment method does not belong to this customer" 
        }, { status: 403 })
      }
      
      // Check if this is the default payment method
      const customer = await stripe.customers.retrieve(user.subscription.stripeCustomerId)
      
      if (
        typeof customer !== 'string' && 
        'invoice_settings' in customer && 
        customer.invoice_settings?.default_payment_method === paymentMethodId
      ) {
        return NextResponse.json({ 
          error: "Cannot delete the default payment method" 
        }, { status: 400 })
      }
      
      // Detach the payment method
      await stripe.paymentMethods.detach(paymentMethodId)

      return NextResponse.json({
        success: true,
        message: "Payment method deleted successfully",
      })
    } catch (stripeError: any) {
      logger.error("Stripe error deleting payment method:", stripeError)
      
      return NextResponse.json({
        success: false,
        error: stripeError.message || "Error deleting payment method",
      }, { status: 400 })
    }
  } catch (error) {
    logger.error("Delete payment method API error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}