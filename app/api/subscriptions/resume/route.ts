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
    const result = await SubscriptionService.resumeSubscription(userId)

    return NextResponse.json({ success: result })
  } catch (error: any) {
    console.error("Error resuming subscription:", error)
    return NextResponse.json({ error: "Failed to resume subscription", details: error.message }, { status: 500 })
  }
}

