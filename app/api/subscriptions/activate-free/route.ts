import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Check current subscription status
    const currentSubscription = await SubscriptionService.getSubscriptionStatus(userId)
    
    // 3. Validate eligibility for free plan
    const paidPlans = ["BASIC", "PRO", "PREMIUM","ULTIMATE"]
    const activeStatuses = ["ACTIVE", "PAST_DUE", "PENDING", "CANCELED"]
    
    if (
      paidPlans.includes(currentSubscription.plan ?? "") && 
      activeStatuses.includes(currentSubscription.status ?? "")
    ) {
      return NextResponse.json(
        {
          error: "Subscription conflict",
          details: "You cannot downgrade from a paid plan to the free plan. Please contact support if you need assistance.",
        },
        { status: 409 }
      )
    }

    // 4. Activate the free plan
    const result = await SubscriptionService.activateFreePlan(userId)
    
    // 5. Return success response
    return NextResponse.json({ 
      success: true, 
      plan: result.plan,
      message: "Free plan activated successfully" 
    })
    
  } catch (error: any) {
    console.error("Error activating free plan:", error)
    
    // Handle specific error cases
    if (error.message?.includes("subscription") || error.message?.includes("downgrade")) {
      return NextResponse.json(
        {
          error: "Subscription conflict",
          details: error.message,
        },
        { status: 409 }
      )
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: "Failed to activate free plan", 
        details: error.message || "Unknown error occurred" 
      }, 
      { status: 500 }
    )
  }
}