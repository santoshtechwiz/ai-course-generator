import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user already has an active subscription
    try {
      const currentSubscription = await SubscriptionService.getSubscriptionStatus(userId)

      // Prevent users with paid plans from downgrading to FREE
      if (
        currentSubscription.plan &&
        currentSubscription.plan !== "FREE" &&
        ["ACTIVE", "PAST_DUE", "PENDING", "CANCELED"].includes(currentSubscription.status || "")
      ) {
        return NextResponse.json(
          {
            error: "Subscription conflict",
            details:
              "You cannot downgrade from a paid plan to the free plan. Please contact support if you need assistance.",
          },
          { status: 409 },
        )
      }

      const result = await SubscriptionService.activateFreePlan(userId)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      if (
        error.message === "User already has an active paid subscription" ||
        error.message === "Cannot downgrade from a paid plan to the FREE plan"
      ) {
        return NextResponse.json(
          {
            error: "Subscription conflict",
            details: error.message,
          },
          { status: 409 },
        )
      }
      throw error // Re-throw other errors to be caught by the outer catch block
    }
  } catch (error: any) {
    console.error("Error activating free plan:", error)
    return NextResponse.json({ error: "Failed to activate free plan", details: error.message }, { status: 500 })
  }
}

