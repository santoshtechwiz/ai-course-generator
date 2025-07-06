import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }    // Use the unified SubscriptionService to get consistent data
    const subscriptionData = await SubscriptionService.getUserSubscriptionData(session.user.id)

    if (!subscriptionData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const response = {
      credits: subscriptionData.credits,
      tokensUsed: subscriptionData.creditsUsed,
      isSubscribed: subscriptionData.isSubscribed,
      subscriptionPlan: subscriptionData.subscription?.planId || "FREE",
      expirationDate: subscriptionData.subscription?.currentPeriodEnd?.toISOString() || null,
      status: subscriptionData.subscription?.status || "INACTIVE",
      cancelAtPeriodEnd: subscriptionData.subscription?.cancelAtPeriodEnd || false,
      subscriptionId: subscriptionData.subscription?.id || "",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Subscription status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
