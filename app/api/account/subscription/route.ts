import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from '@/services/subscription-services'
import { SubscriptionPlanType } from '@/types/subscription-plans'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Fetch subscription data
    const status = await SubscriptionService.getSubscriptionStatus(userId)

    if (!status) {
      return NextResponse.json({
        credits: 0,
        isSubscribed: false,
        subscriptionPlan: SubscriptionPlanType.FREE,
        expirationDate: null,
      })
    }

    return NextResponse.json({
      credits: status.credits || 0,
      tokensUsed: status.tokensUsed || 0,
      isSubscribed: status.isSubscribed,
      subscriptionPlan: status.subscriptionPlan || SubscriptionPlanType.FREE,
      expirationDate: status.expirationDate,
      status: status.status,
      cancelAtPeriodEnd: status.cancelAtPeriodEnd
    })
  } catch (error) {
    console.error("Error fetching subscription data:", error)
    return NextResponse.json({ error: "Failed to fetch subscription data" }, { status: 500 })
  }
}
