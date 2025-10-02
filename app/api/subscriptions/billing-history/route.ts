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
 * Billing History API endpoint
 * Returns the user's billing and payment history from Stripe
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

    // If no subscription or no stripe customer ID, return empty history
    if (!user.subscription?.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        history: [],
      })
    }

    try {
      // Fetch invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: user.subscription.stripeCustomerId,
        limit: 20, // Most recent 20 invoices
      })

      // Transform to our billing history format
      const billingHistory = invoices.data.map((invoice) => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        description: invoice.description || getInvoiceDescription(invoice),
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
        periodStart: invoice.period_start 
          ? new Date(invoice.period_start * 1000).toISOString() 
          : null,
        periodEnd: invoice.period_end 
          ? new Date(invoice.period_end * 1000).toISOString() 
          : null,
        // Include subscription plan info if available
        plan: invoice.lines.data[0]?.plan?.nickname || 
              user.subscription?.planId || 
              "Unknown Plan",
      }))

      return NextResponse.json({
        success: true,
        history: billingHistory,
      })
    } catch (stripeError: any) {
      logger.error("Stripe error fetching billing history:", stripeError)
      
      // Return empty history but log the error
      return NextResponse.json({
        success: false,
        error: "Error fetching billing history from Stripe",
        history: [],
      })
    }
  } catch (error) {
    logger.error("Billing history API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Generate a meaningful description for the invoice
 */
function getInvoiceDescription(invoice: Stripe.Invoice): string {
  const plan = invoice.lines.data[0]?.plan?.nickname
  
  if (plan) {
    return `Subscription: ${plan}`
  }
  
  if (invoice.description) {
    return invoice.description
  }
  
  // Default description based on the invoice status
  switch(invoice.status) {
    case 'paid':
      return 'Payment successful'
    case 'open':
      return 'Payment pending'
    case 'void':
      return 'Payment voided'
    case 'draft':
      return 'Draft invoice'
    default:
      return `Invoice #${invoice.number || invoice.id}`
  }
}