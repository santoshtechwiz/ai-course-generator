/**
 * API Route: POST /api/subscriptions/resume
 *
 * Resumes a canceled subscription for the authenticated user.
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscription-service"

export async function POST(req: Request) {
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

