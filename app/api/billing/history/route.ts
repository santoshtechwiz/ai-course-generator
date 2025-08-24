import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

/**
 * Billing History API endpoint
 * Returns the user's billing and payment history from Stripe via SubscriptionService
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get billing history from SubscriptionService (which uses Stripe)
    const result = await SubscriptionService.getBillingHistory(session.user.id)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to retrieve billing history" 
      }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      history: result.history || [],
    })
  } catch (error) {
    console.error("Billing history API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
