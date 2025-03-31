import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { SubscriptionService } from "@/services/subscriptionService"
import { authOptions } from "@/lib/authOptions"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get only the tokens that have been actually used, not the total tokens
    const tokensUsed = await SubscriptionService.getTokensUsed(userId)

    return NextResponse.json({ used: tokensUsed })
  } catch (error) {
    console.error("Error fetching token usage:", error)
    return NextResponse.json({ error: "Failed to fetch token usage" }, { status: 500 })
  }
}

