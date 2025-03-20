import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const subscriptionData = await SubscriptionService.getSubscriptionStatus(userId)
    const tokensUsed = await SubscriptionService.getTokensUsed(userId)

    return NextResponse.json({
      ...subscriptionData,
      tokensUsed,
    })
  } catch (error: any) {
    console.error("Error fetching subscription status:", error)
    return NextResponse.json({ error: "Failed to fetch subscription status", details: error.message }, { status: 500 })
  }
}

