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
 * Payment Methods API endpoint
 * Returns the user's saved payment methods from Stripe
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If no subscription or no stripe customer ID, return empty methods
    if (!user.subscription?.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        methods: [],
      })
    }

    try {
      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.subscription.stripeCustomerId,
        type: "card",
      })

      // Transform to our payment methods format
      const methods = paymentMethods.data.map((method) => {
        if (method.type !== "card" || !method.card) {
          return null
        }

        return {
          id: method.id,
          type: method.type,
          brand: method.card.brand,
          last4: method.card.last4,
          expMonth: method.card.exp_month,
          expYear: method.card.exp_year,
          isDefault: Boolean(method.metadata?.isDefault),
        }
      }).filter(Boolean)

      return NextResponse.json({
        success: true,
        methods,
      })
    } catch (stripeError: any) {
      logger.error("Stripe error fetching payment methods:", stripeError)
      
      // Return empty methods but log the error
      return NextResponse.json({
        success: false,
        error: "Error fetching payment methods from Stripe",
        methods: [],
      })
    }
  } catch (error) {
    logger.error("Payment methods API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse request body
    const { paymentMethodId, setAsDefault } = await req.json()
    
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
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.subscription.stripeCustomerId,
      })
      
      // Set as default if requested
      if (setAsDefault) {
        await stripe.customers.update(user.subscription.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: "Payment method added successfully",
      })
    } catch (stripeError: any) {
      logger.error("Stripe error managing payment method:", stripeError)
      
      return NextResponse.json({
        success: false,
        error: stripeError.message || "Error managing payment method",
      }, { status: 400 })
    }
  } catch (error) {
    logger.error("Payment methods API error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}