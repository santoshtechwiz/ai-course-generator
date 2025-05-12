import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Fetch subscription data
    const status = await SubscriptionService.getSubscriptionStatus(userId)
    const tokensUsed = await SubscriptionService.getTokensUsed(userId)

    return NextResponse.json({
      credits: tokensUsed,
      isSubscribed: status.isActive ? true : false,
      subscriptionPlan: status.subscriptionPlan || "FREE",
      expirationDate: status.expirationDate instanceof Date ? status.expirationDate.toISOString() : undefined,
    })
  } catch (error) {
    console.error("Error fetching subscription data:", error)
    return NextResponse.json({ error: "Failed to fetch subscription data" }, { status: 500 })
  }
}
