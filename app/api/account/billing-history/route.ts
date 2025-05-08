import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"



export async function GET() {
  const session = await getServerSession(authOptions)

  // Validate session and user
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized - Please log in" },
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const userId = session.user.id

  try {
    // Get billing history with proper typing
    const billingHistory = await SubscriptionService.getBillingHistory(userId)
    
    // Get current subscription status for complete picture
    const currentSubscription = await SubscriptionService.getSubscriptionStatus(userId)

    // Format dates and sensitive information
    const formattedHistory = billingHistory.map(entry => ({
      ...entry,
      date: entry.date.toISOString(),
      nextBillingDate: entry.nextBillingDate?.toISOString(),
      // Mask sensitive payment information
      paymentMethod: entry.paymentMethod ? `•••• ${entry.paymentMethod.slice(-4)}` : null
    }))

    return NextResponse.json({
      data: {
        billingHistory: formattedHistory,
        currentSubscription,
        currency: "USD", // Default or from user settings
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error) {
    console.error("BILLING_HISTORY_ERROR", {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    const errorMessage = error instanceof Error ? 
      `Failed to retrieve billing history: ${error.message}` : 
      "Failed to retrieve billing history due to an unknown error"

    return NextResponse.json(
      { 
        error: errorMessage,
        code: "BILLING_HISTORY_FETCH_FAILED"
      }, 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}