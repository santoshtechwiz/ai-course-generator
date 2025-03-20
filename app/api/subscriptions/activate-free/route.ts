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
    const result = await SubscriptionService.activateFreePlan(userId)

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error("Error activating free plan:", error)
    return NextResponse.json({ error: "Failed to activate free plan", details: error.message }, { status: 500 })
  }
}

